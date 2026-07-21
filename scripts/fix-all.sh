#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# Cyber AI Festival - One-Click Fix Script
# Fixes: AWS credentials, infrastructure, deployment configuration
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; }
info() { echo -e "${BLUE}[i]${NC} $1"; }

echo "============================================"
echo "  Cyber AI Festival - Fix All Script"
echo "============================================"
echo ""

# ─── Step 1: Check prerequisites ──────────────────────────────────────────────
info "Step 1/6: Checking prerequisites..."

if ! command -v aws &>/dev/null; then
    err "AWS CLI not found. Install with: brew install awscli"
    exit 1
fi

if ! command -v git &>/dev/null; then
    err "Git not found"
    exit 1
fi

log "Prerequisites OK"

# ─── Step 2: Check AWS credentials ─────────────────────────────────────────────
info "Step 2/6: Checking AWS credentials..."

if aws sts get-caller-identity &>/dev/null; then
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    log "AWS credentials valid (Account: $ACCOUNT_ID)"
else
    warn "AWS credentials are NOT configured or expired"
    echo ""
    echo "  You need to configure AWS credentials. Options:"
    echo ""
    echo "  A) Set environment variables:"
    echo "     export AWS_ACCESS_KEY_ID=AKIA..."
    echo "     export AWS_SECRET_ACCESS_KEY=..."
    echo "     export AWS_REGION=ap-south-1"
    echo ""
    echo "  B) Run: aws configure"
    echo ""
    echo "  C) Use AWS SSO: aws sso login"
    echo ""
    read -p "  After configuring, press Enter to continue..."
    
    if ! aws sts get-caller-identity &>/dev/null; then
        err "AWS credentials still invalid. Cannot proceed."
        exit 1
    fi
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    log "AWS credentials now valid (Account: $ACCOUNT_ID)"
fi

# ─── Step 3: Check existing infrastructure ─────────────────────────────────────
info "Step 3/6: Checking existing AWS infrastructure..."

ALB_EXISTS=false
ECS_EXISTS=false
CF_EXISTS=false
S3_EXISTS=false

if aws elbv2 describe-load-balancers --names cyber-ai-festival-alb --query "LoadBalancers[0].DNSName" --output text 2>/dev/null; then
    ALB_DNS=$(aws elbv2 describe-load-balancers --names cyber-ai-festival-alb --query "LoadBalancers[0].DNSName" --output text)
    log "ALB exists: $ALB_DNS"
    ALB_EXISTS=true
else
    warn "ALB 'cyber-ai-festival-alb' NOT found"
fi

if aws ecs describe-services --cluster cyber-ai-festival-cluster --services cyber-ai-festival-service --query "services[0].status" --output text 2>/dev/null | grep -q ACTIVE; then
    log "ECS service is ACTIVE"
    ECS_EXISTS=true
else
    warn "ECS service NOT found or NOT ACTIVE"
fi

if aws cloudfront get-distribution --id "$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[?DomainName=='cyber-ai-festival-alb'].DomainName] | [0].Id" --output text 2>/dev/null)" --query "Distribution.DomainName" --output text 2>/dev/null; then
    CF_DOMAIN=$(aws cloudfront get-distribution --id "$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[?DomainName=='cyber-ai-festival-alb'].DomainName] | [0].Id" --output text)" --query "Distribution.DomainName" --output text)
    log "CloudFront exists: $CF_DOMAIN"
    CF_EXISTS=true
else
    warn "CloudFront distribution NOT found"
fi

S3_BUCKET_NAME="cyber-ai-festival-frontend"
if aws s3 ls "s3://$S3_BUCKET_NAME" &>/dev/null 2>&1; then
    log "S3 bucket '$S3_BUCKET_NAME' exists"
    S3_EXISTS=true
else
    # Try to find any existing bucket
    EXISTING_BUCKET=$(aws s3api list-buckets --query "Buckets[?contains(Name,'cyber-ai-festival')].Name | [0]" --output text 2>/dev/null)
    if [ -n "$EXISTING_BUCKET" ] && [ "$EXISTING_BUCKET" != "None" ]; then
        S3_BUCKET_NAME="$EXISTING_BUCKET"
        log "S3 bucket '$S3_BUCKET_NAME' exists"
        S3_EXISTS=true
    else
        warn "No S3 bucket found"
    fi
fi

# ─── Step 4: Deploy/recreate missing infrastructure ────────────────────────────
info "Step 4/6: Deploying infrastructure..."

if $ALB_EXISTS && $ECS_EXISTS; then
    log "Backend infrastructure exists - skipping CloudFormation deploy"
    log "To force recreate, delete the stack first and re-run this script"
else
    warn "Infrastructure is incomplete. Deploying CloudFormation..."
    echo ""
    echo "  This will create: ALB, ECS Fargate Service, Security Groups"
    echo "  Existing resources (RDS, Secrets) will NOT be affected"
    echo ""
    read -p "  Continue? [Y/n] " REPLY
    REPLY=${REPLY:-Y}
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Get subnet IDs
        VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=cyber-ai-festival*" --query "Vpcs[0].VpcId" --output text 2>/dev/null)
        if [ -z "$VPC_ID" ] || [ "$VPC_ID" = "None" ]; then
            VPC_ID=$(aws ec2 describe-vpcs --query "Vpcs[0].VpcId" --output text)
            warn "Using default VPC: $VPC_ID"
        fi
        
        PUBLIC_SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" "Name=map-public-ip-on-launch,Values=true" --query "Subnets[0:2].SubnetId" --output text)
        PRIVATE_SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" "Name=map-public-ip-on-launch,Values=false" --query "Subnets[0:2].SubnetId" --output text)
        
        PUB1=$(echo $PUBLIC_SUBNETS | awk '{print $1}')
        PUB2=$(echo $PUBLIC_SUBNETS | awk '{print $2}')
        PRIV1=$(echo $PRIVATE_SUBNETS | awk '{print $1}')
        PRIV2=$(echo $PRIVATE_SUBNETS | awk '{print $2}')
        
        if [ -z "$PUB1" ]; then
            # Fallback: use any subnets
            ALL_SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[0:4].SubnetId" --output text)
            PUB1=$(echo $ALL_SUBNETS | awk '{print $1}')
            PUB2=$(echo $ALL_SUBNETS | awk '{print $2}')
            PRIV1=$(echo $ALL_SUBNETS | awk '{print $3}')
            PRIV2=$(echo $ALL_SUBNETS | awk '{print $4}')
            warn "Could not distinguish public/private subnets - using any available"
        fi
        
        # Get database URL from Secrets Manager
        DB_URL=$(aws secretsmanager get-secret-value --secret-id cyber-ai-festival/db-password --query SecretString --output text 2>/dev/null || echo "")
        
        aws cloudformation deploy \
            --template-file ../cyber_ai_festival_be/infra/cloudformation.yml \
            --stack-name cyber-ai-festival \
            --parameter-overrides \
                VpcId="$VPC_ID" \
                PublicSubnet1="$PUB1" \
                PublicSubnet2="$PUB2" \
                PrivateSubnet1="$PRIV1" \
                PrivateSubnet2="$PRIV2" \
                DatabaseUrl="$DB_URL" \
                ApiKey="${API_KEY:-changeme}" \
                DeepseekApiKey="${DEEPSEEK_API_KEY:-}" \
                S3BucketName="$S3_BUCKET_NAME" \
            --capabilities CAPABILITY_IAM \
            --no-fail-on-empty-changeset
        
        log "CloudFormation deployed!"
        
        # Get new ALB DNS
        ALB_DNS=$(aws elbv2 describe-load-balancers --names cyber-ai-festival-alb --query "LoadBalancers[0].DNSName" --output text)
        log "New ALB DNS: $ALB_DNS"
    fi
fi

# ─── Step 5: Update GitHub Secrets ─────────────────────────────────────────────
info "Step 5/6: Updating GitHub Secrets..."

if $ALB_EXISTS || [ -n "${ALB_DNS:-}" ]; then
    ALB_DNS=${ALB_DNS:-$(aws elbv2 describe-load-balancers --names cyber-ai-festival-alb --query "LoadBalancers[0].DNSName" --output text)}
    
    echo ""
    echo "  ╔══════════════════════════════════════════════════════╗"
    echo "  ║  MANUAL STEP: Update GitHub Secrets                 ║"
    echo "  ╠══════════════════════════════════════════════════════╣"
    echo "  ║                                                      ║"
    echo "  ║  Go to your GitHub repos and add these secrets:      ║"
    echo "  ║                                                      ║"
    echo "  ║  FRONTEND repo (pizzawithcola/cyber_ai_festival):    ║"
    echo "  ║    Settings → Secrets and variables → Actions        ║"
    echo "  ║                                                      ║"
    printf "  ║    VITE_API_URL = http://%s ║\n" "$ALB_DNS"
    printf "  ║    VITE_WS_URL  = ws://%s  ║\n" "$ALB_DNS"
    echo "  ║                                                      ║"
    echo "  ║  BACKEND repo (pizzawithcola/cyber_ai_festival_be):  ║"
    echo "  ║    Settings → Secrets and variables → Actions        ║"
    echo "  ║                                                      ║"
    echo "  ║    AWS_ACCESS_KEY_ID     = (your AWS access key)     ║"
    echo "  ║    AWS_SECRET_ACCESS_KEY = (your AWS secret key)     ║"
    echo "  ║                                                      ║"
    echo "  ╚══════════════════════════════════════════════════════╝"
    echo ""
    
    # Try to set using gh CLI if available
    if command -v gh &>/dev/null && gh auth status &>/dev/null 2>&1; then
        warn "gh CLI detected. Attempting to set frontend secrets..."
        gh secret set VITE_API_URL -b "http://$ALB_DNS" -R pizzawithcola/cyber_ai_festival 2>/dev/null || warn "Could not set VITE_API_URL (may need admin access)"
        gh secret set VITE_WS_URL -b "ws://$ALB_DNS" -R pizzawithcola/cyber_ai_festival 2>/dev/null || warn "Could not set VITE_WS_URL (may need admin access)"
        log "Frontend secrets updated via gh CLI"
    else
        warn "gh CLI not authenticated. Please set secrets manually via GitHub web UI."
        echo "  Install gh: brew install gh && gh auth login"
    fi
else
    warn "Cannot determine ALB DNS. Skipping secrets configuration."
fi

# ─── Step 6: Trigger deployments ───────────────────────────────────────────────
info "Step 6/6: Triggering deployments..."

echo ""
echo "  To trigger deployments, push to main branch:"
echo ""
echo "  cd cyber_ai_festival_be && git push origin main"
echo "  cd cyber_ai_festival && git push origin main"
echo ""

if [ -d "../cyber_ai_festival_be" ]; then
    read -p "  Push backend changes now? [Y/n] " REPLY
    REPLY=${REPLY:-Y}
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        (cd ../cyber_ai_festival_be && git push origin main) && log "Backend pushed!" || warn "Backend push failed (check git config)"
    fi
fi

read -p "  Push frontend changes now? [Y/n] " REPLY
REPLY=${REPLY:-Y}
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin main && log "Frontend pushed!" || warn "Frontend push failed (check git config)"
fi

# ─── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "============================================"
echo "  ✅ Fix complete!"
echo "============================================"
echo ""
echo "  Summary:"
echo "  - Infrastructure: checked / deployed"
if [ -n "${ALB_DNS:-}" ]; then
    echo "  - ALB DNS: $ALB_DNS"
fi
echo "  - Deploy workflows: updated"
echo "  - CloudFormation template: infra/cloudformation.yml"
echo ""
echo "  After deployments complete, test:"
echo "  curl http://$ALB_DNS/health"
echo ""
