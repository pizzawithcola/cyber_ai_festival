#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# Fix CloudFront OPTIONS/CORS Configuration
# Adds OPTIONS method + forwards CORS headers on all API cache behaviors
# Usage: fix-cloudfront-cors.sh <CLOUDFRONT_DISTRIBUTION_ID>
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DIST_ID="${1:-}"
if [ -z "$DIST_ID" ]; then
  echo "Usage: $0 <CLOUDFRONT_DISTRIBUTION_ID>"
  exit 1
fi

echo "🔧 Fixing CloudFront CORS/OPTIONS for: $DIST_ID"

CONFIG_FILE="/tmp/cf-config.json"
UPDATED_FILE="/tmp/cf-config-updated.json"
HAS_CHANGES="/tmp/cf-has-changes"

echo "  → Fetching current config..."
aws cloudfront get-distribution-config --id "$DIST_ID" > /tmp/cf-full.json
python3 -c "import sys,json; d=json.load(sys.stdin); print(d['ETag']); json.dump(d['DistributionConfig'], open('$CONFIG_FILE','w'), indent=2)" < /tmp/cf-full.json > /tmp/cf-etag.txt
ETAG=$(cat /tmp/cf-etag.txt)

echo "  → Analyzing and fixing behaviors..."
python3 -c "
import json

with open('$CONFIG_FILE') as f:
    config = json.load(f)

changes = 0
api_paths = {'/users/*','/scores/*','/rankings/*','/llm/*','/rooms/*','/questions/*','/ws/*','/health'}
cors_hdrs = ['Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers']

def fix_behavior(b, label):
    global changes
    methods = set(b.get('AllowedMethods',{}).get('Items',[]))
    if 'OPTIONS' not in methods:
        b['AllowedMethods']['Items'] = sorted(methods | {'OPTIONS'})
        b['AllowedMethods']['Quantity'] = len(b['AllowedMethods']['Items'])
        changes += 1
        print(f'  ✓ Added OPTIONS to: {label}')
    fwd = b.get('ForwardedValues',{})
    hdrs = fwd.get('Headers',{}).get('Items',[])
    added = [h for h in cors_hdrs if h not in hdrs]
    if added:
        fwd['Headers']['Items'] = hdrs + added
        fwd['Headers']['Quantity'] = len(hdrs) + len(added)
        changes += 1
        print(f'  ✓ Added CORS headers to {label}: {added}')

for b in config.get('CacheBehaviors',{}).get('Items',[]):
    pp = b.get('PathPattern','')
    if pp in api_paths:
        fix_behavior(b, pp)

if 'DefaultCacheBehavior' in config:
    fix_behavior(config['DefaultCacheBehavior'], 'default (*)')

print(f'  → Total changes: {changes}')
with open('$HAS_CHANGES','w') as f:
    f.write(str(changes))
with open('$UPDATED_FILE','w') as f:
    json.dump(config, f, indent=2, default=str)
"

CHANGES=$(cat "$HAS_CHANGES")

if [ "$CHANGES" -gt 0 ]; then
    echo "  → Updating CloudFront distribution (${CHANGES} changes)..."
    aws cloudfront update-distribution \
        --id "$DIST_ID" \
        --distribution-config "file://$UPDATED_FILE" \
        --if-match "$ETAG"
    echo "  ✅ Done! Allow 5-10 min for CloudFront to deploy the changes."
else
    echo "  ✅ CORS/OPTIONS already configured correctly."
fi

rm -f /tmp/cf-config.json /tmp/cf-config-updated.json /tmp/cf-full.json /tmp/cf-etag.txt "$HAS_CHANGES"
