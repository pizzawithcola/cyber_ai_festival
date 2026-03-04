import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  determineDataFlow,
  type TermsConsent,
  type SurveyData,
} from './dataFlowLogic'
import './NetworkDataFlowDiagram.css'

interface NetworkDataFlowDiagramProps {
  termsConsent: TermsConsent
  surveyData: SurveyData
  overridePrivacyScore?: number
}

// Node position and connection definitions
interface NodePosition {
  id: string
  x: number // percentage of container width
  y: number // percentage of container height
  label: string
  shortLabel: string
  description: string
  inboundData?: string // Data flowing IN to this node
  outboundData?: string // Data flowing OUT from this node
  color: string
  category: 'user' | 'app' | 'internal' | 'sdk' | 'broker' | 'profile' | 'adplatform' | 'downstream'
  /**
   * Score impact category determines how node emphasis correlates with user choices:
   * - 'reading': affected by Terms reading progress (AppCloud, AIModeling)
   * - 'consent': affected by privacy toggle states (all downstream nodes)
   * - 'exposure': affected by optional personal data disclosure (DataBrokers→Downstream)
   * - 'none': neutral nodes (User, App)
   */
  scoreImpactCategory?: 'reading' | 'consent' | 'exposure' | 'none'
}

interface Connection {
  from: string
  to: string
  label?: string
  style?: 'solid' | 'dashed'
  // Which privacy setting controls this connection
  controlledBy?: keyof TermsConsent['privacySettings']
  // Which survey fields must be filled for this connection to activate
  // If any field in this array is filled, connection can activate (OR logic)
  requiredSurveyFields?: ('height' | 'weight' | 'occupation' | 'homeAddress')[]
}

// Detailed node positions with new layered branching topology
const NODE_POSITIONS: NodePosition[] = [
  // Layer 1: Entry Point
  {
    id: 'user',
    x: 2,
    y: 50,
    label: 'You (the user)',
    shortLabel: 'You',
    description: `Your profile data: name, fitness goals, body measurements, location, work hours. App behavior: taps, swipes, viewing duration, feature usage. Foundation for all downstream data flows.`,
    color: '#3b82f6',
    category: 'user',
    scoreImpactCategory: 'none',
  },
  
  // Layer 2: Central Collection Hub
  {
    id: 'app',
    x: 18,
    y: 50,
    label: 'FitAI App',
    shortLabel: 'FitAI',
    description: `Central hub that collects, stores, and processes your data. The primary decision point for where your data flows internally (cloud, AI) and externally (SDKs, ads).`,
    color: '#10b981',
    category: 'app',
    scoreImpactCategory: 'none',
  },
  
  // Layer 3: Three Diverging Branches from App
  {
    id: 'cloud',
    x: 28,
    y: 18,
    label: 'Cloud Services / Logs / Analytics',
    shortLabel: 'Cloud',
    description: `Servers storing your data, activity logs, and analytics. Includes crash reports, performance metrics, session duration, and feature usage patterns. Stays within FitAI infrastructure for optimization and debugging.`,
    color: '#93c5fd',
    category: 'internal',
    scoreImpactCategory: 'reading',
  },
  
  {
    id: 'ai',
    x: 28,
    y: 82,
    label: 'AI Profiling & Recommendations',
    shortLabel: 'AI',
    description: `Machine learning models for fitness recommendations and health risk inference.`,
    inboundData: `Fitness data (goals, schedule) + Demographics (Height/Weight, Occupation)`,
    outboundData: `Personalized recommendations + Health risk inferences → Forms basis for downstream targeting`,
    color: '#93c5fd',
    category: 'internal',
    scoreImpactCategory: 'reading',
  },
  
  {
    id: 'sdk',
    x: 42,
    y: 50,
    label: 'Third-Party SDKs (Analytics / Ads)',
    shortLabel: 'SDKs',
    description: `Analytics & ad tracking SDKs embedded in the app.`,
    inboundData: `App data (ad IDs, behavior) + Any survey data (Height/Weight, Occupation, Home Address)`,
    outboundData: `Segmented data profiles to Data Brokers and Ad Platforms → Entry point for external data sharing`,
    color: '#a78bfa',
    category: 'sdk',
    scoreImpactCategory: 'consent',
  },
  
  // Layer 4: Aggregation & Targeting Platforms
  {
    id: 'broker',
    x: 60,
    y: 18,
    label: 'Data Brokers & Aggregators',
    shortLabel: 'Brokers',
    description: `Data aggregation and profiling companies.`,
    inboundData: `Health/fitness data from SDKs (Height/Weight, Occupation, Home Address) + External sources (health searches, purchases, social media)`,
    outboundData: `Comprehensive risk profiles → Insurance/Credit/Hiring companies for underwriting & screening`,
    color: '#fb923c',
    category: 'broker',
    scoreImpactCategory: 'exposure',
  },
  
  {
    id: 'ads',
    x: 60,
    y: 50,
    label: 'Ad Platforms / Audience Targeting',
    shortLabel: 'Ads',
    description: `Ad networks building cross-app targeting profiles.`,
    inboundData: `Location data (Home Address) directly from app + Behavior/advertising IDs from SDKs`,
    outboundData: `Your ad profile across hundreds of apps/sites + Audience segments to advertisers + Behavioral data to Insurance/Credit/Hiring`,
    color: '#ef4444',
    category: 'adplatform',
    scoreImpactCategory: 'exposure',
  },
  
  // Layer 5: Final Impact
  {
    id: 'ins',
    x: 82,
    y: 68,
    label: 'Insurance / Credit / Hiring Profiles',
    shortLabel: 'Downstream',
    description: `Where data determines your real-world outcomes.`,
    inboundData: `From Brokers: Complete profiles (Height/Weight risk, Occupation screening)\nFrom Ads: Behavioral + location targeting data`,
    outboundData: `Insurance premiums set by health data + risk factors\nCredit scores influenced by spending/lifestyle patterns\nJob screening based on fitness level & demographics`,
    color: '#b91c1c',
    category: 'downstream',
    scoreImpactCategory: 'exposure',
  },
]

// Detailed connections with new layered branching topology
const CONNECTIONS: Connection[] = [
  // Layer 1→2: User to App (entry point - always active)
  { from: 'user', to: 'app', label: 'Form & behavior', style: 'solid' },
  
  // Layer 2→3: App branches out to three independent systems
  { from: 'app', to: 'cloud', label: 'Storage & logs', controlledBy: 'analytics', style: 'solid' },
  
  { from: 'app', to: 'ai', label: 'Modeling & inference', controlledBy: 'aiTraining', style: 'solid', requiredSurveyFields: ['height', 'weight', 'occupation'] },
  
  { from: 'app', to: 'sdk', label: 'SDK sharing', controlledBy: 'analytics', style: 'solid', requiredSurveyFields: ['height', 'weight', 'occupation', 'homeAddress'] },
  
  { from: 'app', to: 'ads', label: 'Location/audience', controlledBy: 'thirdParty', style: 'dashed', requiredSurveyFields: ['homeAddress'] },
  
  // Layer 3→4: SDK branches to both Broker and Ads
  { from: 'sdk', to: 'broker', label: 'Re-share/aggregate', controlledBy: 'thirdParty', style: 'dashed', requiredSurveyFields: ['height', 'weight', 'occupation', 'homeAddress'] },
  
  { from: 'sdk', to: 'ads', label: 'Ad identifier', controlledBy: 'thirdParty', style: 'dashed', requiredSurveyFields: ['height', 'weight', 'occupation', 'homeAddress'] },
  
  // Layer 4→5: Both Broker and Ads converge at Insurance/Credit/Hiring
  { from: 'broker', to: 'ins', label: 'Profile usage', controlledBy: 'thirdParty', style: 'dashed', requiredSurveyFields: ['height', 'weight', 'occupation', 'homeAddress'] },
  
  { from: 'ads', to: 'ins', label: 'Influence pricing/screening', controlledBy: 'thirdParty', style: 'dashed', requiredSurveyFields: ['height', 'weight', 'occupation', 'homeAddress'] },
]

/**
 * SCORE IMPACT SEMANTICS
 * 
 * Scoring is decomposed into three independent dimensions:
 * 
 * 1. READING DIMENSION (0-20 points)
 *    - Source: Terms reading progress (0-100%)
 *    - Affects: Cloud, AI (internal processing visibility)
 *    - Semantic: "Did user understand what happens internally?"
 *    - Emphasis: Low reading % → muted internal nodes
 * 
 * 2. CONSENT DIMENSION (0-50 points)
 *    - Source: Privacy toggles unchecked (-10 each, max 5 toggles)
 *    - Affects: All nodes' connection activation
 *    - Semantic: "Did user explicitly opt into data sharing?"
 *    - Emphasis: More toggles disabled → fewer active connections
 * 
 * 3. EXPOSURE DIMENSION (0-30 points)
 *    - Source: Optional personal fields filled (-5 each, max 6 fields)
 *    - Affects: Broker→Downstream chain intensity
 *    - Semantic: "How much personal data did user voluntarily share?"
 *    - Emphasis: All optional fields filled → bright downstream, high-risk warning
 */

/**
 * Calculate node visual emphasis based on score dimensions
 * Returns CSS class name and opacity modifier
 */
function getNodeEmphasis(
  nodeId: string,
  termsReadingProgress: number,
  privacyScore: number,
  optionalFieldsCount: number
): { className: string; opacity: number; indicator?: string } {
  const node = NODE_POSITIONS.find(n => n.id === nodeId)
  if (!node) return { className: '', opacity: 1 }

  const hasHighExposure = optionalFieldsCount >= 3
  const privacyScore_normalized = (privacyScore / 100) * 50

  switch (node.scoreImpactCategory) {
    case 'reading': {
      const readingRatio = termsReadingProgress / 100
      const opacity = 0.5 + readingRatio * 0.5
      const indicator = termsReadingProgress < 50 ? '⚠️ Not fully read' : '✓ Read'
      return {
        className: termsReadingProgress < 50 ? 'node-low-reading' : 'node-high-reading',
        opacity,
        indicator,
      }
    }

    case 'consent': {
      const opacity = 0.5 + (privacyScore_normalized / 50) * 0.5
      return {
        className: privacyScore < 30 ? 'node-low-consent' : 'node-high-consent',
        opacity,
      }
    }

    case 'exposure': {
      const opacity = hasHighExposure ? 1.0 : 0.6
      const indicator = hasHighExposure ? '⚠️ High Exposure' : '✓ Limited'
      return {
        className: hasHighExposure ? 'node-high-exposure' : 'node-low-exposure',
        opacity,
        indicator,
      }
    }

    case 'none':
    default: {
      return { className: '', opacity: 1 }
    }
  }
}

/**
 * Generate score breakdown message for detail panel
 */
function getScoreBreakdown(
  termsReadingProgress: number,
  termsReadingScore: number,
  privacyOptionsScore: number,
  surveyScore: number,
  surveyData: SurveyData
): string[] {
  const lines: string[] = []

  lines.push(`📖 Reading: ${termsReadingProgress}% (${termsReadingScore} pts)`)
  if (termsReadingProgress < 50) lines.push('  → You skipped important privacy details')
  if (termsReadingProgress === 100) lines.push('  → You carefully read all terms')

  lines.push(`🔐 Privacy Toggles: ${privacyOptionsScore} pts`)
  if (privacyOptionsScore === 0) lines.push('  → Maximum data visibility to partners')
  if (privacyOptionsScore > 30) lines.push('  → Strong privacy protection')

  lines.push(`📋 Survey Disclosure: ${surveyScore} pts`)
  
  const heightWeightFilled = !!(surveyData.height && surveyData.weight)
  const heightWeightPts = heightWeightFilled ? 0 : 10
  lines.push(`  - Height/Weight: ${heightWeightPts} pts ${heightWeightFilled ? '✓' : ''}`)
  
  const occupationFilled = !!surveyData.occupation
  const occupationPts = occupationFilled ? 0 : 10
  lines.push(`  - Occupation: ${occupationPts} pts ${occupationFilled ? '✓' : ''}`)
  
  const addressFilled = !!surveyData.homeAddress
  const addressPts = addressFilled ? 0 : 10
  lines.push(`  - Home Address: ${addressPts} pts ${addressFilled ? '✓' : ''}`)

  return lines
}

export const NetworkDataFlowDiagram: React.FC<NetworkDataFlowDiagramProps> = ({
  termsConsent,
  surveyData,
  overridePrivacyScore,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [containerSize, setContainerSize] = useState({ width: 1000, height: 240 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateSize = () => {
      const rect = container.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setContainerSize({ 
          width: rect.width, 
          height: Math.max(rect.height, 220) 
        })
      }
    }

    updateSize()
    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [])

  const flowResult = determineDataFlow(termsConsent, surveyData)
  
  const termsReadingProgress = termsConsent.termsReadingProgress ?? 0
  const termsReadingScore = Math.floor(termsReadingProgress / 25) * 5
  
  const privacySettings = termsConsent.privacySettings
  const uncheckedCount = Object.values(privacySettings).filter(v => !v).length
  const privacyOptionsScore = uncheckedCount * 10
  
  const optionalFieldsCount = [
    !!(surveyData.height && surveyData.weight),
    !!surveyData.occupation,
    !!surveyData.homeAddress,
  ].filter(Boolean).length
  
  const computedScore = (() => {
    const enabledCount = Object.values(termsConsent.privacySettings).filter(Boolean).length
    const hasHeightWeight = !!(surveyData.height && surveyData.weight)
    const hasOccupation = !!surveyData.occupation
    const hasAddress = !!surveyData.homeAddress
    const optFilled = [hasHeightWeight, hasOccupation, hasAddress].filter(Boolean).length
    return Math.min(100, Math.max(0, enabledCount * 20 - optFilled * 5))
  })()
  const privacyScore = overridePrivacyScore !== undefined ? overridePrivacyScore : computedScore

  const nodesWithPixels = useMemo(() => {
    return NODE_POSITIONS.map((node) => ({
      ...node,
      px: (node.x / 100) * containerSize.width,
      py: (node.y / 100) * containerSize.height,
    }))
  }, [containerSize])

  const generateConnectionPath = (from: NodePosition & {px: number, py: number}, to: NodePosition & {px: number, py: number}): string => {
    const dx = to.px - from.px
    const dy = to.py - from.py
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    const controlFactor = Math.max(0.3, Math.min(0.6, distance / 400))
    
    const routingKey = `${from.id}→${to.id}`
    let controlX = from.px + dx * controlFactor
    let controlY = from.py + dy * controlFactor
    
    switch(routingKey) {
      case 'app→cloud':
        controlX = from.px + dx * 0.35
        controlY = from.py + dy * 0.25 - 45
        break
        
      case 'app→ai':
        controlX = from.px + dx * 0.35
        controlY = from.py + dy * 0.25 + 45
        break
        
      case 'app→ads':
        controlX = from.px + dx * 0.4
        controlY = from.py + dy * 0.4 + 80
        break
        
      case 'app→sdk':
        controlX = from.px + dx * 0.5
        controlY = from.py + dy * 0.5
        break
        
      case 'sdk→broker':
        controlX = from.px + dx * 0.4
        controlY = from.py + dy * 0.2 - 30
        break
        
      case 'sdk→ads':
        controlX = from.px + dx * 0.5
        controlY = from.py + dy * 0.5
        break
        
      case 'broker→ins':
        controlX = from.px + dx * 0.5
        controlY = from.py + dy * 0.5 - 20
        break
        
      case 'ads→ins':
        controlX = from.px + dx * 0.5
        controlY = from.py + dy * 0.5 + 20
        break
        
      default:
        controlX = from.px + dx * controlFactor
        controlY = from.py + dy * controlFactor
    }
    
    return `M ${from.px} ${from.py} Q ${controlX} ${controlY} ${to.px} ${to.py}`
  }

  const getPathMidpoint = (from: NodePosition & {px: number, py: number}, to: NodePosition & {px: number, py: number}): [number, number] => {
    const dx = to.px - from.px
    const dy = to.py - from.py
    
    let controlX = from.px + dx * 0.5
    let controlY = from.py + dy * 0.5 - 20
    
    const routingKey = `${from.id}→${to.id}`
    switch(routingKey) {
      case 'app→cloud':
        controlX = from.px + dx * 0.35
        controlY = from.py + dy * 0.25 - 15
        break
      case 'app→ai':
        controlX = from.px + dx * 0.35
        controlY = from.py + dy * 0.25 + 45
        break
      case 'app→ads':
        controlX = from.px + dx * 0.4
        controlY = from.py + dy * 0.4 + 85
        break
      case 'sdk→broker':
        controlX = from.px + dx * 0.4
        controlY = from.py + dy * 0.2 - 30
        break
      case 'broker→ins':
        controlX = from.px + dx * 0.5
        controlY = from.py + dy * 0.5 - 20
        break
      case 'ads→ins':
        controlX = from.px + dx * 0.5
        controlY = from.py + dy * 0.5 + 20
        break
    }
    
    const t = 0.5
    const posX = (1-t)*(1-t)*from.px + 2*(1-t)*t*controlX + t*t*to.px
    const posY = (1-t)*(1-t)*from.py + 2*(1-t)*t*controlY + t*t*to.py
    
    return [posX, posY]
  }

  const isConnectionActive = (conn: Connection): boolean => {
    if (conn.controlledBy && termsConsent.privacySettings[conn.controlledBy] !== true) {
      return false
    }
    
    if (conn.requiredSurveyFields && conn.requiredSurveyFields.length > 0) {
      const hasRequiredField = conn.requiredSurveyFields.some(field => {
        switch(field) {
          case 'height':
            return !!surveyData.height
          case 'weight':
            return !!surveyData.weight
          case 'occupation':
            return !!surveyData.occupation
          case 'homeAddress':
            return !!surveyData.homeAddress
          default:
            return false
        }
      })
      if (!hasRequiredField) {
        return false
      }
    }
    
    return true
  }

  const getConnectionStyle = (conn: Connection): { isActive: boolean; strokeDasharray?: string } => {
    const isActive = isConnectionActive(conn)
    const isDashed = conn.style === 'dashed'
    return {
      isActive,
      strokeDasharray: (isDashed || !isActive) ? '5,5' : undefined,
    }
  }

  const isNodeActive = (nodeId: string): boolean => {
    if (nodeId === 'user' || nodeId === 'app') return true
    
    const incomingConnections = CONNECTIONS.filter(conn => conn.to === nodeId)
    return incomingConnections.some(conn => isConnectionActive(conn))
  }

  const selectedNode = selectedNodeId ? NODE_POSITIONS.find((n) => n.id === selectedNodeId) : null

  const getScoreClass = (score: number) => {
    if (score >= 70) return 'score-high'
    if (score >= 40) return 'score-mid'
    return 'score-low'
  }

  const getNodeFlowData = (nodeId: string) => {
    switch (nodeId) {
      case 'cloud':
        return flowResult.analytics
      case 'ai':
        return flowResult.aiTraining
      case 'sdk':
        return flowResult.analytics
      case 'broker':
      case 'ads':
      case 'ins':
        return flowResult.thirdParty
      default:
        return null
    }
  }

  return (
    <div className="network-data-flow-diagram">
      <div className="data-flow-header">
        <div>
          <h2 className="data-flow-title">Your Data Flow Network</h2>
          <p className="data-flow-subtitle">See where your data flows based on your privacy choices</p>
        </div>
        <div className="privacy-score-block">
          <span className="privacy-score-label">Privacy Score</span>
          <span className={`privacy-score-value ${getScoreClass(privacyScore)}`}>
            {privacyScore}/100
          </span>
        </div>
      </div>

      <div className="network-diagram-container" ref={containerRef}>
        <svg
          className="network-svg"
          width="100%"
          height="100%"
          viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <marker
              id="arrowhead-active"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#00ffff" />
            </marker>
            <marker
              id="arrowhead-inactive"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon points="0 0, 10 3, 0 6" fill="rgba(255,255,255,0.35)" />
            </marker>
            <filter id="node-glow-active">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Render connections first */}
          <g className="connections">
            {CONNECTIONS.map((conn, idx) => {
              const fromNode = nodesWithPixels.find((n) => n.id === conn.from)
              const toNode = nodesWithPixels.find((n) => n.id === conn.to)
              if (!fromNode || !toNode) return null

              const style = getConnectionStyle(conn)
              const pathD = generateConnectionPath(fromNode, toNode)
              const [labelX, labelY] = getPathMidpoint(fromNode, toNode)

              return (
                <g key={`conn-${idx}`}>
                  <path
                    d={pathD}
                    className={style.isActive ? 'connection-line-active' : 'connection-line-inactive'}
                    strokeDasharray={style.strokeDasharray}
                    strokeWidth={2}
                    fill="none"
                    markerEnd={style.isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead-inactive)'}
                  />
                  
                  {/* Label with background for readability */}
                  {conn.label && (
                    <g>
                      <rect
                        x={labelX - 36}
                        y={labelY - 10}
                        width={70}
                        height={16}
                        fill="#0a0a0a"
                        rx={0}
                        ry={0}
                        pointerEvents="none"
                      />
                      <text
                        x={labelX}
                        y={labelY + 3}
                        className={`connection-label ${style.isActive ? 'connection-label-active' : 'connection-label-inactive'}`}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="400"
                        pointerEvents="none"
                      >
                        {conn.label}
                      </text>
                    </g>
                  )}
                </g>
              )
            })}
          </g>

          {/* Render nodes */}
          <g className="nodes">
            {nodesWithPixels.map((node) => {
              const isSelected = selectedNodeId === node.id
              const nodeActive = isNodeActive(node.id)
              const nodeRadius = node.category === 'user' || node.category === 'app' ? 18 : 16

              const emphasis = getNodeEmphasis(
                node.id,
                termsReadingProgress,
                privacyScore,
                optionalFieldsCount
              )

              return (
                <g key={node.id}>
                  <circle
                    cx={node.px}
                    cy={node.py}
                    r={nodeRadius}
                    fill={node.color}
                    opacity={nodeActive ? emphasis.opacity : 0.3}
                    className={`network-node ${isSelected ? 'network-node-selected' : ''} ${nodeActive ? 'network-node-active' : 'network-node-inactive'} ${emphasis.className}`}
                    onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                    style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                  />
                  <text
                    x={node.px}
                    y={node.py + nodeRadius + 14}
                    className="node-label"
                    textAnchor="middle"
                    fontSize="10"
                    fill="#fff"
                    pointerEvents="none"
                  >
                    {node.shortLabel}
                  </text>
                  
                  {emphasis.indicator && nodeActive && (
                    <title>{emphasis.indicator}</title>
                  )}
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      {selectedNode && (() => {
        const isAlwaysEnabled = selectedNode.id === 'user' || selectedNode.id === 'app'
        const nodeActive = isAlwaysEnabled || isNodeActive(selectedNode.id)
        const nodeData = getNodeFlowData(selectedNode.id)
        const emphasis = getNodeEmphasis(
          selectedNode.id,
          termsReadingProgress,
          privacyScore,
          optionalFieldsCount
        )

        return (
          <div className="flow-node-detail" role="dialog" aria-label={selectedNode.label}>
            <h3 className="flow-node-detail-title">{selectedNode.label}</h3>
            
            <p className="flow-node-detail-desc">{selectedNode.description}</p>
            
            {/* Inbound Data Module */}
            {selectedNode.inboundData && (
              <div className="flow-node-inbound">
                <strong>📥 Inbound Data</strong>
                <p>{selectedNode.inboundData}</p>
              </div>
            )}
            
            {/* Outbound Data Module */}
            {selectedNode.outboundData && (
              <div className="flow-node-outbound">
                <strong>📤 Outbound Data</strong>
                <p>{selectedNode.outboundData}</p>
              </div>
            )}
            
            {/* Score Impact Indicator */}
            {selectedNode.scoreImpactCategory && selectedNode.scoreImpactCategory !== 'none' && (
              <div className={`flow-node-impact ${emphasis.className.includes('low') ? 'low-impact' : 'high-impact'}`}>
                <strong>
                  {emphasis.indicator ? emphasis.indicator + ' — ' : ''}
                  {selectedNode.scoreImpactCategory === 'reading' && 'Visibility depends on terms comprehension'}
                  {selectedNode.scoreImpactCategory === 'consent' && 'Affected by your privacy toggle choices'}
                  {selectedNode.scoreImpactCategory === 'exposure' && 'Increases with personal data disclosure'}
                </strong>
              </div>
            )}
            
            <div className="flow-node-detail-status">
              <strong>Status:</strong>{' '}
              {isAlwaysEnabled || nodeActive
                ? '✓ Your data flows to this node' + (isAlwaysEnabled ? '' : ' (you consented)')
                : '✗ No data flows here (you did not consent)'}
            </div>
            
            {(isAlwaysEnabled || nodeActive) && nodeData && 'fields' in nodeData && Array.isArray(nodeData.fields) && nodeData.fields.length > 0 && (
              <div className="flow-node-fields">
                <strong>Data fields sent:</strong>
                <ul>
                  {(nodeData.fields as string[]).map((field: string) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
                {'sample' in nodeData && nodeData.sample && (
                  <div className="flow-node-sample">
                    <strong>Example:</strong>
                    <pre>{JSON.stringify(nodeData.sample as any, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
            
            {/* Expanded Score Breakdown */}
            <div className="flow-node-score-breakdown">
              <strong>Score Breakdown:</strong>
              {getScoreBreakdown(termsReadingProgress, termsReadingScore, privacyOptionsScore, (3 - optionalFieldsCount) * 10, surveyData).map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
            
            <button
              type="button"
              className="flow-node-detail-close"
              onClick={() => setSelectedNodeId(null)}
            >
              Close
            </button>
          </div>
        )
      })()}
    </div>
  )
}