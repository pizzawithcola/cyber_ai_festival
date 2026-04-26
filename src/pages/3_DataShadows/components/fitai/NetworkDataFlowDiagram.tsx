import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFitAI } from './fitaiContext'
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
  labelLines?: string[]
  labelPosition?: 'above' | 'below' | 'left' | 'right'
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
  // Which optional fields make this route richer. These do not gate the line:
  // toggles decide whether a route exists, optional data decides how risky it is.
  requiredSurveyFields?: ('height' | 'weight' | 'occupation' | 'homeAddress')[]
}

// Vertical topology for final reveal panel
// Top-to-bottom flow: User → App → internal/SDK branches → downstream platforms → real-world outcomes
const NODE_POSITIONS: NodePosition[] = [
  {
    id: 'user',
    x: 50,
    y: 8,
    label: 'You (the user)',
    shortLabel: 'You',
    labelLines: ['You'],
    labelPosition: 'above',
    description: `Your profile data: name, fitness goals, body measurements, location, work hours. App behavior: taps, swipes, viewing duration, feature usage. Foundation for all downstream data flows.`,
    color: '#3b82f6',
    category: 'user',
    scoreImpactCategory: 'none',
  },
  {
    id: 'app',
    x: 50,
    y: 22,
    label: 'FitAI App',
    shortLabel: 'FitAI',
    labelLines: ['FitAI'],
    labelPosition: 'left',
    description: `Central hub that collects, stores, and processes your data. The primary decision point for where your data flows internally (cloud, AI) and externally (SDKs, ads).`,
    color: '#10b981',
    category: 'app',
    scoreImpactCategory: 'none',
  },
  {
    id: 'cloud',
    x: 27,
    y: 43,
    label: 'Cloud Services / Logs / Analytics',
    shortLabel: 'Cloud',
    labelLines: ['Cloud', 'Services'],
    labelPosition: 'left',
    description: `Servers storing your data, activity logs, and analytics. Includes crash reports, performance metrics, session duration, and feature usage patterns. Stays within FitAI infrastructure for optimization and debugging.`,
    color: '#93c5fd',
    category: 'internal',
    scoreImpactCategory: 'reading',
  },
  {
    id: 'ai',
    x: 50,
    y: 44,
    label: 'AI Profiling & Recommendations',
    shortLabel: 'AI',
    labelLines: ['AI', 'Profiling'],
    labelPosition: 'right',
    description: `Machine learning models for fitness recommendations and health risk inference.`,
    inboundData: `Fitness data (goals, schedule) + Demographics (Height/Weight, Occupation)`,
    outboundData: `Personalized recommendations + Health risk inferences → Forms basis for downstream targeting`,
    color: '#93c5fd',
    category: 'internal',
    scoreImpactCategory: 'reading',
  },
  {
    id: 'sdk',
    x: 70,
    y: 43,
    label: 'Third-Party SDKs (Analytics / Ads)',
    shortLabel: 'SDKs',
    labelLines: ['Third-Party', 'SDKs'],
    labelPosition: 'right',
    description: `Analytics & ad tracking SDKs embedded in the app.`,
    inboundData: `App data (ad IDs, behavior) + Any survey data (Height/Weight, Occupation, Home Address)`,
    outboundData: `Segmented data profiles to Data Brokers and Ad Platforms → Entry point for external data sharing`,
    color: '#a78bfa',
    category: 'sdk',
    scoreImpactCategory: 'consent',
  },
  {
    id: 'broker',
    x: 34,
    y: 68,
    label: 'Data Brokers & Aggregators',
    shortLabel: 'Brokers',
    labelLines: ['Data', 'Brokers'],
    labelPosition: 'left',
    description: `Data aggregation and profiling companies.`,
    inboundData: `Health/fitness data from SDKs (Height/Weight, Occupation, Home Address) + External sources (health searches, purchases, social media)`,
    outboundData: `Comprehensive risk profiles → Insurance/Credit/Hiring companies for underwriting & screening`,
    color: '#fb923c',
    category: 'broker',
    scoreImpactCategory: 'exposure',
  },
  {
    id: 'ads',
    x: 66,
    y: 68,
    label: 'Ad Platforms / Audience Targeting',
    shortLabel: 'Ads',
    labelLines: ['Ad', 'Platforms'],
    labelPosition: 'right',
    description: `Ad networks building cross-app targeting profiles.`,
    inboundData: `Location data (Home Address) directly from app + Behavior/advertising IDs from SDKs`,
    outboundData: `Your ad profile across hundreds of apps/sites + Audience segments to advertisers + Behavioral data to Insurance/Credit/Hiring`,
    color: '#ef4444',
    category: 'adplatform',
    scoreImpactCategory: 'exposure',
  },
  {
    id: 'ins',
    x: 50,
    y: 86,
    label: 'Insurance / Credit / Hiring Profiles',
    shortLabel: 'Downstream',
    labelLines: ['Downstream', 'Impact'],
    labelPosition: 'below',
    description: `Where data determines your real-world outcomes.`,
    inboundData: `From Brokers: Complete profiles (Height/Weight risk, Occupation screening)\nFrom Ads: Behavioral + location targeting data`,
    outboundData: `Insurance premiums set by health data + risk factors\nCredit scores influenced by spending/lifestyle patterns\nJob screening based on fitness level & demographics`,
    color: '#b91c1c',
    category: 'downstream',
    scoreImpactCategory: 'exposure',
  },
]

// Detailed connections with new layered branching topology
// Layer 1→2: User to App (entry point)
// Layer 2→3: App branches to Cloud, AI, SDK
// Layer 3→4: SDK branches to Broker and Ads; App also directly connects to Ads
// Layer 4→5: Broker and Ads both converge at Insurance/Credit/Hiring
const CONNECTIONS: Connection[] = [
  // Layer 1→2: User to App (entry point - always active)
  { from: 'user', to: 'app', label: 'Form & behavior', style: 'solid' },
  
  // Layer 2→3: App branches out to three independent systems
  { from: 'app', to: 'cloud', label: 'Storage & logs', controlledBy: 'analytics', style: 'solid' },
  
  // app→ai: Activated by Height/Weight or Occupation (AI needs body/work data for recommendations)
  { from: 'app', to: 'ai', label: 'Modeling & inference', controlledBy: 'aiTraining', style: 'solid', requiredSurveyFields: ['height', 'weight', 'occupation'] },
  
  // app→sdk: Activated by any survey data (SDK benefits from having user data to track/share)
  { from: 'app', to: 'sdk', label: 'SDK sharing', controlledBy: 'analytics', style: 'solid', requiredSurveyFields: ['height', 'weight', 'occupation', 'homeAddress'] },
  
  // app→ads: Activated by Home Address (Location/audience targeting only meaningful with location data)
  { from: 'app', to: 'ads', label: 'Location/audience', controlledBy: 'thirdParty', style: 'dashed', requiredSurveyFields: ['homeAddress'] },
  
  // Layer 3→4: SDK branches to both Broker and Ads
  // sdk→broker: Activated by any survey data (broker needs data to aggregate)
  { from: 'sdk', to: 'broker', label: 'Re-share/aggregate', controlledBy: 'thirdParty', style: 'dashed', requiredSurveyFields: ['height', 'weight', 'occupation', 'homeAddress'] },
  
  // sdk→ads: Activated by any survey data (ads benefit from any user data for targeting)
  { from: 'sdk', to: 'ads', label: 'Ad identifier', controlledBy: 'thirdParty', style: 'dashed', requiredSurveyFields: ['height', 'weight', 'occupation', 'homeAddress'] },
  
  // Layer 4→5: Both Broker and Ads converge at Insurance/Credit/Hiring
  // broker→ins: Activated by any survey data (broker profiles affect downstream scoring)
  { from: 'broker', to: 'ins', label: 'Profile usage', controlledBy: 'thirdParty', style: 'dashed', requiredSurveyFields: ['height', 'weight', 'occupation', 'homeAddress'] },
  
  // ads→ins: Activated by Home Address or any survey data (ads data + location drives targeting/screening)
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
      // Internal nodes (Cloud, AI) emphasize reading comprehension
      // Low reading progress → muted; high → bright
      const readingRatio = termsReadingProgress / 100
      const opacity = 0.5 + readingRatio * 0.5 // range: 0.5-1.0
      const indicator = termsReadingProgress < 50 ? '⚠️ Not fully read' : '✓ Read'
      return {
        className: termsReadingProgress < 50 ? 'node-low-reading' : 'node-high-reading',
        opacity,
        indicator,
      }
    }

    case 'consent': {
      // SDK node emphasizes consent toggle state
      // All toggles disabled → very muted; all enabled → bright
      const opacity = 0.5 + (privacyScore_normalized / 50) * 0.5
      return {
        className: privacyScore < 30 ? 'node-low-consent' : 'node-high-consent',
        opacity,
      }
    }

    case 'exposure': {
      // Downstream chain (Broker, Ads, Insurance) emphasizes data exposure risk
      // High exposure (all optional fields filled) → bright warning; low → muted
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
      // Neutral nodes (User, App) always prominent
      return { className: '', opacity: 1 }
    }
  }
}

function getOverviewContent(
  termsReadingProgress: number,
  privacySettings: TermsConsent['privacySettings'],
  optionalFieldsCount: number
) {
  const enabledCount = Object.values(privacySettings).filter(Boolean).length
  const readingBucket = termsReadingProgress < 40 ? 'low' : termsReadingProgress < 80 ? 'mid' : 'high'
  const consentBucket = enabledCount <= 1 ? 'strict' : enabledCount <= 3 ? 'mixed' : 'open'
  const exposureBucket = optionalFieldsCount === 0 ? 'low' : optionalFieldsCount <= 2 ? 'medium' : 'high'

  if (termsReadingProgress <= 0 && enabledCount === 0 && optionalFieldsCount === 0) {
    return {
      title: 'No optional data routes are active yet',
      summary: 'There is not enough valid user input to build a rich profile. The core user-to-app path remains visible, but external sharing, targeting, and downstream profiling stay largely dormant.',
      bullets: [
        'This is the safest fallback state for missing or skipped data: the diagram still renders, but it does not invent extra exposure.',
        'Choose any node below to inspect which fields would appear there if later choices activate that path.',
      ],
    }
  }

  const titleMap = {
    'low-open-high': 'High visibility and high downstream risk',
    'low-open-medium': 'Broad sharing with moderate personal exposure',
    'low-open-low': 'Broad consent but limited personal inputs',
    'low-mixed-high': 'Partial controls, but sensitive data still spreads',
    'low-mixed-medium': 'Some barriers exist, but leakage paths remain',
    'low-mixed-low': 'Muted exposure, though key terms were still skipped',
    'low-strict-high': 'You blocked many paths, but exposed sensitive details',
    'low-strict-medium': 'Restricted sharing, with some details still exposed',
    'low-strict-low': 'Tightest flow, but the policy context was missed',
    'mid-open-high': 'Convenience-first setup with strong downstream reach',
    'mid-open-medium': 'Useful protections, but sharing still stays broad',
    'mid-open-low': 'Low personal exposure despite generous permissions',
    'mid-mixed-high': 'Balanced settings, but optional data raises risk',
    'mid-mixed-medium': 'Moderate exposure across several branches',
    'mid-mixed-low': 'Fairly contained flow with manageable risk',
    'mid-strict-high': 'Most sharing blocked, but sensitive disclosures still matter',
    'mid-strict-medium': 'Reduced spread with some remaining exposure',
    'mid-strict-low': 'Contained network with relatively low downstream reach',
    'high-open-high': 'Well-understood risks, but you still allowed deep sharing',
    'high-open-medium': 'You read carefully, yet broad consent keeps routes open',
    'high-open-low': 'Low exposure today, though broad sharing stays available',
    'high-mixed-high': 'Good awareness, but sensitive disclosures activate risk',
    'high-mixed-medium': 'Informed and partly protected, with some downstream flow',
    'high-mixed-low': 'Good control with limited exposure',
    'high-strict-high': 'Strong consent control, but disclosed data still propagates',
    'high-strict-medium': 'Tight sharing model with a few exposed branches',
    'high-strict-low': 'Best-case setup: informed, restricted, and low exposure',
  } as const

  const key = `${readingBucket}-${consentBucket}-${exposureBucket}` as keyof typeof titleMap

  const readingLine =
    readingBucket === 'low'
      ? 'You skipped a large share of the terms, so internal processing and downstream reuse stayed harder to anticipate.'
      : readingBucket === 'mid'
        ? 'You caught some of the policy detail, but not enough to fully map the data routes.'
        : 'You read enough of the policy to understand more of the network before revealing data.'

  const consentLine =
    consentBucket === 'strict'
      ? 'Most optional sharing paths were blocked, which keeps the outer branches dimmer.'
      : consentBucket === 'mixed'
        ? 'Some sharing stayed enabled, so parts of the external network still activate.'
        : 'Most sharing switches stayed on, which lights up analytics, SDK, and downstream partner routes.'

  const exposureLine =
    exposureBucket === 'low'
      ? 'You shared very little optional personal data, so downstream profiles stay relatively thin.'
      : exposureBucket === 'medium'
        ? 'A few optional data points were disclosed, which strengthens audience and profiling paths.'
        : 'Several optional personal details were shared, creating richer profiles for targeting and screening.'

  return {
    title: titleMap[key],
    summary: `${readingLine} ${consentLine}`,
    bullets: [exposureLine, 'Tap a node to focus the full inbound/outbound detail. The map itself keeps only short route keywords so the network stays readable.'],
  }
}

function getNodeFlowSummary(nodeId: string): { inbound: string; outbound: string } {
  switch (nodeId) {
    case 'user':
      return {
        inbound: 'profile choices',
        outbound: 'answers + taps',
      }
    case 'app':
      return {
        inbound: 'signup + settings',
        outbound: 'routes to systems',
      }
    case 'cloud':
      return {
        inbound: 'usage logs',
        outbound: 'app analytics',
      }
    case 'ai':
      return {
        inbound: 'goals/body/work',
        outbound: 'recs + risk signals',
      }
    case 'sdk':
      return {
        inbound: 'ad ID + behavior',
        outbound: 'partner segments',
      }
    case 'broker':
      return {
        inbound: 'SDK + public data',
        outbound: 'risk profile',
      }
    case 'ads':
      return {
        inbound: 'location + ad ID',
        outbound: 'audience targeting',
      }
    case 'ins':
      return {
        inbound: 'broker/ad profiles',
        outbound: 'pricing/screening',
      }
    default:
      return {
        inbound: 'data in',
        outbound: 'data out',
      }
  }
}

function getConnectionTriggerLabel(conn: Connection): string {
  const key = `${conn.from}-${conn.to}`
  switch (key) {
    case 'user-app':
      return 'signup'
    case 'app-cloud':
      return 'analytics'
    case 'app-ai':
      return 'AI training'
    case 'app-sdk':
      return 'SDK events'
    case 'app-ads':
      return 'third-party'
    case 'sdk-broker':
      return 'data share'
    case 'sdk-ads':
      return 'ad ID'
    case 'broker-ins':
      return 'risk profile'
    case 'ads-ins':
      return 'targeting'
    default:
      return conn.label ?? 'data'
  }
}

function getNodeConsequence(nodeId: string): string {
  switch (nodeId) {
    case 'user':
      return 'Your answers become the source record that every downstream route depends on.'
    case 'app':
      return 'Centralized collection makes the app the main gatekeeper for which data leaves the phone.'
    case 'cloud':
      return 'Usage logs can reveal routines, engagement patterns, and moments when you are most reachable.'
    case 'ai':
      return 'Model inferences can turn fitness inputs into health, lifestyle, or risk assumptions.'
    case 'sdk':
      return 'Embedded trackers can connect your FitAI behavior to profiles built outside the app.'
    case 'broker':
      return 'Aggregated profiles may be resold or matched with outside records you never directly provided.'
    case 'ads':
      return 'Audience segments can follow you across apps and shape what offers, prices, or messages you see.'
    case 'ins':
      return 'Downstream profiles can influence eligibility, pricing, screening, or other real-world judgments.'
    default:
      return 'This route can increase how far your data travels beyond the original app experience.'
  }
}

export const NetworkDataFlowDiagram: React.FC<NetworkDataFlowDiagramProps> = ({
  termsConsent,
  surveyData,
  overridePrivacyScore,
}) => {
  const navigate = useNavigate()
  const { setScreen } = useFitAI()
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [containerSize, setContainerSize] = useState({ width: 780, height: 520 })
  const [nodePositionOverrides, setNodePositionOverrides] = useState<Record<string, { x: number; y: number }>>({})
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragMovedRef = useRef(false)

  // Update container size when it changes
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateSize = () => {
      const rect = container.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setContainerSize({
          width: rect.width,
          height: Math.max(420, rect.height),
        })
      }
    }

    updateSize()
    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [])

  // Compute flow result
  const flowResult = determineDataFlow(termsConsent, surveyData)
  
  // Extract score components for emphasis calculation
  // These come from context/props that track scoring across the form flow
  const termsReadingProgress = termsConsent.termsReadingProgress ?? 0
  // Count filled optional survey fields (each represents -5 points potential)
  const optionalFieldsCount = [
    !!(surveyData.height && surveyData.weight),
    !!surveyData.occupation,
    !!surveyData.homeAddress,
  ].filter(Boolean).length
  
  // Calculate total and privacy score
  const computedScore = (() => {
    const enabledCount = Object.values(termsConsent.privacySettings).filter(Boolean).length
    const hasHeightWeight = !!(surveyData.height && surveyData.weight)
    const hasOccupation = !!surveyData.occupation
    const hasAddress = !!surveyData.homeAddress
    const optFilled = [hasHeightWeight, hasOccupation, hasAddress].filter(Boolean).length
    return Math.min(100, Math.max(0, enabledCount * 20 - optFilled * 5))
  })()
  const privacyScore = overridePrivacyScore !== undefined ? overridePrivacyScore : computedScore

  // Calculate node positions in pixels
  const nodesWithPixels = useMemo(() => {
    return NODE_POSITIONS.map((node) => ({
      ...node,
      x: nodePositionOverrides[node.id]?.x ?? node.x,
      y: nodePositionOverrides[node.id]?.y ?? node.y,
      px: ((nodePositionOverrides[node.id]?.x ?? node.x) / 100) * containerSize.width,
      py: ((nodePositionOverrides[node.id]?.y ?? node.y) / 100) * containerSize.height,
    }))
  }, [containerSize, nodePositionOverrides])

  const getPointerPercent = (event: React.PointerEvent<SVGElement>) => {
    const svg = svgRef.current
    if (!svg) return null

    const rect = svg.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    return {
      x: Number(Math.min(94, Math.max(6, x)).toFixed(1)),
      y: Number(Math.min(94, Math.max(4, y)).toFixed(1)),
    }
  }

  const logNodePositionsForHardcoding = (nextOverrides: Record<string, { x: number; y: number }>) => {
    const positions = NODE_POSITIONS.map((node) => ({
      id: node.id,
      x: nextOverrides[node.id]?.x ?? node.x,
      y: nextOverrides[node.id]?.y ?? node.y,
    }))

    console.table(positions)
    console.log(
      '[DataShadows] Dragged node positions for NODE_POSITIONS:',
      positions.map((node) => `{ id: '${node.id}', x: ${node.x}, y: ${node.y} }`).join(',\n')
    )
  }

  const handleNodePointerDown = (event: React.PointerEvent<SVGCircleElement>, nodeId: string) => {
    event.preventDefault()
    event.stopPropagation()
    dragMovedRef.current = false
    setDraggingNodeId(nodeId)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleNodePointerMove = (event: React.PointerEvent<SVGElement>) => {
    if (!draggingNodeId) return

    const nextPosition = getPointerPercent(event)
    if (!nextPosition) return

    dragMovedRef.current = true
    setNodePositionOverrides((prev) => ({
      ...prev,
      [draggingNodeId]: nextPosition,
    }))
  }

  const handleNodePointerUp = (event: React.PointerEvent<SVGElement>) => {
    if (!draggingNodeId) return

    const finalPosition = getPointerPercent(event)
    const nextOverrides = finalPosition
      ? {
          ...nodePositionOverrides,
          [draggingNodeId]: finalPosition,
        }
      : nodePositionOverrides

    setNodePositionOverrides(nextOverrides)
    logNodePositionsForHardcoding(nextOverrides)
    setDraggingNodeId(null)
    window.setTimeout(() => {
      dragMovedRef.current = false
    }, 0)
  }

  const getConnectionGeometry = (
    from: NodePosition & { px: number; py: number },
    to: NodePosition & { px: number; py: number },
    t = 0.5
  ): { pathD: string; labelPoint: { x: number; y: number } } => {
    const dx = to.px - from.px
    const dy = to.py - from.py
    const curvature = Math.max(24, Math.abs(dx) * 0.24)
    const control1X = from.px + dx * 0.12
    const control1Y = from.py + Math.max(36, dy * 0.34) + (dx < 0 ? -curvature * 0.2 : curvature * 0.2)
    const control2X = to.px - dx * 0.12
    const control2Y = to.py - Math.max(36, dy * 0.34) - (dx < 0 ? -curvature * 0.2 : curvature * 0.2)
    const cubic = (start: number, c1: number, c2: number, end: number) => {
      const invT = 1 - t
      return invT ** 3 * start + 3 * invT ** 2 * t * c1 + 3 * invT * t ** 2 * c2 + t ** 3 * end
    }

    return {
      pathD: `M ${from.px} ${from.py} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${to.px} ${to.py}`,
      labelPoint: {
        x: cubic(from.px, control1X, control2X, to.px),
        y: cubic(from.py, control1Y, control2Y, to.py),
      },
    }
  }

  // Helper to check if a connection/node is enabled. A toggle creates the route;
  // optional survey fields only enrich the route detail and risk explanation.
  const isConnectionActive = (conn: Connection): boolean => {
    if (conn.controlledBy && termsConsent.privacySettings[conn.controlledBy] !== true) {
      return false
    }

    return true
  }

  // Determine connection style based on privacy settings
  const getConnectionStyle = (conn: Connection): { isActive: boolean; strokeDasharray?: string } => {
    const isActive = isConnectionActive(conn)
    const isDashed = conn.style === 'dashed'
    return {
      isActive,
      strokeDasharray: (isDashed || !isActive) ? '5,5' : undefined,
    }
  }

  // Determine if a node should be visually active
  const isNodeActive = (nodeId: string): boolean => {
    if (nodeId === 'user' || nodeId === 'app') return true
    
    // Check if any incoming connection is active
    const incomingConnections = CONNECTIONS.filter(conn => conn.to === nodeId)
    return incomingConnections.some(conn => isConnectionActive(conn))
  }

  const selectedNode = selectedNodeId ? NODE_POSITIONS.find((n) => n.id === selectedNodeId) : null
  const overview = getOverviewContent(termsReadingProgress, termsConsent.privacySettings, optionalFieldsCount)

  const getConnectionLabelPosition = (
    conn: Connection,
    from: NodePosition & { px: number; py: number },
    to: NodePosition & { px: number; py: number }
  ) => {
    const width = Math.min(108, Math.max(78, containerSize.width * 0.14))
    const height = 24
    const gutter = 8
    const key = `${conn.from}-${conn.to}`
    const offsetMap: Record<string, { x: number; y: number; t?: number }> = {
      'user-app': { x: 30, y: -4, t: 0.5 },
      'app-cloud': { x: -12, y: -18, t: 0.48 },
      'app-ai': { x: -20, y: 4, t: 0.58 },
      'app-sdk': { x: 5, y: -12, t: 0.5 },
      'app-ads': { x: 0, y: 50, t: 0.56 },
      'sdk-broker': { x: -50, y: 10, t: 0.55 },
      'sdk-ads': { x: -10, y: -30, t: 0.45 },
      'broker-ins': { x: -30, y: -20, t: 0.54 },
      'ads-ins': { x: 15, y: -30, t: 0.56 },
    }
    const offset = offsetMap[key] ?? { x: 0, y: 0, t: 0.5 }
    const { labelPoint } = getConnectionGeometry(from, to, offset.t ?? 0.5)
    const x = labelPoint.x + offset.x - width / 2
    const y = labelPoint.y + offset.y - height / 2

    return {
      width,
      height,
      x: Math.min(Math.max(gutter, x), containerSize.width - width - gutter),
      y: Math.min(Math.max(gutter, y), containerSize.height - height - gutter),
    }
  }

  const getNodeLabelLayout = (
    node: NodePosition & { px: number; py: number },
    radius: number
  ): { x: number; y: number; width: number; height: number; className: string } => {
    const lineCount = node.labelLines?.length ?? 1
    const width = node.category === 'downstream' ? 142 : 128
    const height = lineCount > 1 ? 42 : 24
    const gutter = 6
    const clampX = (x: number) => Math.min(Math.max(gutter, x), containerSize.width - width - gutter)
    const clampY = (y: number) => Math.min(Math.max(gutter, y), containerSize.height - height - gutter)
    const nodeSpecificLayout: Record<string, { x: number; y: number; className: string }> = {
      ai: {
        x: node.px + radius - 70,
        y: node.py - height / 2 + 24,
        className: 'node-label-box node-label-box-right',
      },
      sdk: {
        x: node.px + radius + 2,
        y: node.py - height / 2 ,
        className: 'node-label-box node-label-box-right',
      },
      ads: {
        x: node.px + radius + 2,
        y: node.py - height / 2 ,
        className: 'node-label-box node-label-box-right',
      },
      broker: {
        x: node.px - radius - width - 2,
        y: node.py - height / 2 ,
        className: 'node-label-box node-label-box-left',
      },
      ins: {
        x: node.px - width / 2,
        y: node.py + radius + 18,
        className: 'node-label-box node-label-box-center',
      },
    }
    const override = nodeSpecificLayout[node.id]
    if (override) {
      return {
        x: clampX(override.x),
        y: clampY(override.y),
        width,
        height,
        className: override.className,
      }
    }

    switch (node.labelPosition) {
      case 'left':
        return {
          x: clampX(node.px - radius - width - 2),
          y: clampY(node.py - height / 2),
          width,
          height,
          className: 'node-label-box node-label-box-left',
        }
      case 'right':
        return {
          x: clampX(node.px + radius + 2),
          y: clampY(node.py - height / 2),
          width,
          height,
          className: 'node-label-box node-label-box-right',
        }
      case 'above':
        return {
          x: clampX(node.px - width / 2),
          y: clampY(node.py - radius - height - 2),
          width,
          height,
          className: 'node-label-box node-label-box-center',
        }
      case 'below':
      default:
        return {
          x: clampX(node.px - width / 2),
          y: clampY(node.py + radius + 2),
          width,
          height,
          className: 'node-label-box node-label-box-center',
        }
    }
  }

  const getScoreClass = (score: number) => {
    if (score >= 70) return 'score-high'
    if (score >= 40) return 'score-mid'
    return 'score-low'
  }

  // Get detailed description for node based on flowResult
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
        <div className="data-flow-header-copy">
          <h2 className="data-flow-title">Your Data Flow Network</h2>
          <p className="data-flow-subtitle">Tap a node to inspect what data it receives and passes onward.</p>
        </div>
        <div className="privacy-score-block">
          <span className="privacy-score-label">Privacy Score</span>
          <span className={`privacy-score-value ${getScoreClass(privacyScore)}`}>
            {privacyScore}/100
          </span>
        </div>
      </div>

      <div className="network-data-flow-body">
        <section className="network-visual-panel">
          <div className="network-diagram-container" ref={containerRef}>
            <div className="network-diagram-stage">
              <svg
                ref={svgRef}
                className="network-svg"
                width="100%"
                height="100%"
                viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}
                preserveAspectRatio="xMidYMid meet"
                onPointerMove={handleNodePointerMove}
                onPointerUp={handleNodePointerUp}
                onPointerCancel={handleNodePointerUp}
              >
              <defs>
                <marker
                  id="arrowhead-active"
                  markerWidth="12"
                  markerHeight="12"
                  refX="10"
                  refY="4"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <polygon points="0 0, 12 4, 0 8" fill="#22d3ee" />
                </marker>
                <marker
                  id="arrowhead-inactive"
                  markerWidth="12"
                  markerHeight="12"
                  refX="10"
                  refY="4"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <polygon points="0 0, 12 4, 0 8" fill="rgba(255,255,255,0.35)" />
                </marker>
              </defs>

              <g className="connections">
                {CONNECTIONS.map((conn, idx) => {
                  const fromNode = nodesWithPixels.find((n) => n.id === conn.from)
                  const toNode = nodesWithPixels.find((n) => n.id === conn.to)
                  if (!fromNode || !toNode) return null

                  const style = getConnectionStyle(conn)
                  const { pathD } = getConnectionGeometry(fromNode, toNode)
                  const label = getConnectionTriggerLabel(conn)
                  const labelPosition = getConnectionLabelPosition(conn, fromNode, toNode)
                  return (
                    <g key={`conn-${idx}`}>
                      <path
                        d={pathD}
                        className={style.isActive ? 'connection-line-active' : 'connection-line-inactive'}
                        strokeDasharray={style.strokeDasharray}
                        strokeWidth={3}
                        fill="none"
                        markerEnd={style.isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead-inactive)'}
                      />
                      <foreignObject
                        x={labelPosition.x}
                        y={labelPosition.y}
                        width={labelPosition.width}
                        height={labelPosition.height}
                        className="connection-flow-label-object"
                        pointerEvents="none"
                      >
                        <div
                          className={[
                            'connection-flow-label',
                            style.isActive ? 'connection-flow-label-active' : 'connection-flow-label-inactive',
                          ].join(' ')}
                          title={conn.label}
                        >
                          {label}
                        </div>
                      </foreignObject>
                    </g>
                  )
                })}
              </g>

              <g className="nodes">
                {nodesWithPixels.map((node) => {
                  const isSelected = selectedNodeId === node.id
                  const nodeActive = isNodeActive(node.id)
                  const nodeRadius = node.category === 'user' || node.category === 'app' ? 22 : 18
                  const nodeLabelLayout = getNodeLabelLayout(node, nodeRadius)
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
                        opacity={nodeActive ? emphasis.opacity : 0.28}
                        className={`network-node network-node-draggable ${isSelected ? 'network-node-selected' : ''} ${nodeActive ? 'network-node-active' : 'network-node-inactive'} ${draggingNodeId === node.id ? 'network-node-dragging' : ''} ${emphasis.className}`}
                        onPointerDown={(event) => handleNodePointerDown(event, node.id)}
                        onClick={() => {
                          if (dragMovedRef.current) return
                          setSelectedNodeId(isSelected ? null : node.id)
                        }}
                        style={{ transition: 'opacity 0.2s' }}
                      />
                      <foreignObject
                        x={nodeLabelLayout.x}
                        y={nodeLabelLayout.y}
                        width={nodeLabelLayout.width}
                        height={nodeLabelLayout.height}
                        pointerEvents="none"
                      >
                        <div
                          className={[
                            nodeLabelLayout.className,
                            nodeActive ? 'node-label-active' : 'node-label-inactive',
                          ].join(' ')}
                        >
                          {(node.labelLines ?? [node.shortLabel]).map((line) => (
                            <span key={`${node.id}-${line}`}>{line}</span>
                          ))}
                        </div>
                      </foreignObject>

                      {emphasis.indicator && nodeActive && (
                        <title>{emphasis.indicator}</title>
                      )}
                    </g>
                  )
                })}
              </g>
            </svg>
            </div>
          </div>
        </section>

        <section className="data-flow-info-strip">
          <div className="data-flow-info-content">
            {selectedNode ? (() => {
            const isAlwaysEnabled = selectedNode.id === 'user' || selectedNode.id === 'app'
            const nodeActive = isAlwaysEnabled || isNodeActive(selectedNode.id)
            const nodeData = getNodeFlowData(selectedNode.id)
            const emphasis = getNodeEmphasis(
              selectedNode.id,
              termsReadingProgress,
              privacyScore,
              optionalFieldsCount
            )
            const ioSummary = getNodeFlowSummary(selectedNode.id)
            const consequence = getNodeConsequence(selectedNode.id)

            return (
              <div className="flow-node-detail flow-node-detail-selected" role="dialog" aria-label={selectedNode.label}>
                <div className="flow-node-detail-main">
                  <div>
                    <h3 className="flow-node-detail-title">{selectedNode.label}</h3>
                    <p className="flow-node-detail-desc">{selectedNode.description}</p>
                  </div>

                  <div className="flow-node-compact-io">
                    <div className="flow-node-module flow-node-module-in">
                      <strong>Inbound</strong>
                      <p>{selectedNode.inboundData ?? ioSummary.inbound}</p>
                    </div>

                    <div className="flow-node-module flow-node-module-out">
                      <strong>Outbound</strong>
                      <p>{selectedNode.outboundData ?? ioSummary.outbound}</p>
                    </div>
                  </div>
                </div>

                {selectedNode.scoreImpactCategory && selectedNode.scoreImpactCategory !== 'none' && (
                  <div className={`flow-node-impact ${emphasis.className.includes('low') ? 'flow-node-impact-risk' : 'flow-node-impact-safe'}`}>
                    <strong>
                      {emphasis.indicator ? emphasis.indicator + ' — ' : ''}
                      {selectedNode.scoreImpactCategory === 'reading' && 'Visibility depends on terms comprehension'}
                      {selectedNode.scoreImpactCategory === 'consent' && 'Affected by your privacy toggle choices'}
                      {selectedNode.scoreImpactCategory === 'exposure' && 'Increases with personal data disclosure'}
                    </strong>
                  </div>
                )}

                <div className="flow-node-consequence">
                  <strong>Possible consequence</strong>
                  <p>{consequence}</p>
                </div>

                <div className="flow-node-detail-footer">
                  <div
                    className={[
                      'flow-node-detail-status',
                      isAlwaysEnabled || nodeActive
                        ? 'flow-node-detail-status-risk'
                        : 'flow-node-detail-status-safe',
                    ].join(' ')}
                  >
                    <strong>Status:</strong>{' '}
                    {isAlwaysEnabled || nodeActive
                      ? 'Your data reaches this node' + (isAlwaysEnabled ? '' : ' through active consent paths')
                      : 'No active data route with your current choices'}
                  </div>

                  {(isAlwaysEnabled || nodeActive) && nodeData && 'fields' in nodeData && Array.isArray(nodeData.fields) && nodeData.fields.length > 0 && (
                    <div className="flow-node-fields">
                      <strong>Fields:</strong> {(nodeData.fields as string[]).join(', ')}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="flow-node-detail-close"
                  onClick={() => setSelectedNodeId(null)}
                >
                  Clear Selection
                </button>
              </div>
            )
          })() : (
            <div className="flow-node-detail flow-node-detail-placeholder">
              <div className="flow-node-overview-heading">
                <div className="flow-node-overview-badge">Overview</div>
                <h3 className="flow-node-detail-title">{overview.title}</h3>
              </div>
              <p className="flow-node-detail-desc">{overview.summary}</p>
              <div className="flow-node-overview-list">
                {overview.bullets.map((bullet) => (
                  <div key={bullet} className="flow-node-overview-item">{bullet}</div>
                ))}
              </div>
            </div>
            )}
          </div>

          <button
            type="button"
            className="data-flow-leaderboard-button"
            onClick={() => navigate('/ranking/game/datashadows')}
          >
            View Leaderboard
          </button>
          <button
            type="button"
            className="data-flow-retry-button"
            onClick={() => setScreen('terms')}
          >
            Would you like to try again?
          </button>
        </section>
      </div>
    </div>
  )
}
