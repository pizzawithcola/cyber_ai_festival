import React, { useState } from 'react'

interface NetworkFlowProps {}

interface Node {
  id: string
  label: string
  icon: string
  description: string
  risks: string[]
  ring: number
}

export const NetworkFlow: React.FC<NetworkFlowProps> = () => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const nodes: Node[] = [
    // Ring 1: Direct Services
    {
      id: 'fitai',
      label: 'FitAI Server',
      icon: '☁️',
      description: 'Stores raw data and performs AI analysis',
      risks: ['Data breach', 'Unauthorized access', 'AI training on your data'],
      ring: 1
    },
    {
      id: 'aiengine',
      label: 'AI Engine',
      icon: '🤖',
      description: 'Analyzes fitness patterns and predicts behavior',
      risks: ['Behavior profiling', 'Predictive surveillance'],
      ring: 1
    },
    // Ring 2: Ad Networks
    {
      id: 'google',
      label: 'Google/Meta Ads',
      icon: '🎯',
      description: 'Creates ad profiles and tracks cross-site behavior',
      risks: ['Behavioral tracking', 'Targeted advertising', 'Profile building'],
      ring: 2
    },
    {
      id: 'analytics',
      label: 'Analytics Tools',
      icon: '📊',
      description: 'Aggregate user behavior across services',
      risks: ['Behavioral analytics', 'User tracking'],
      ring: 2
    },
    // Ring 3: Data Brokers
    {
      id: 'brokers',
      label: 'Data Brokers',
      icon: '🔄',
      description: 'Combine data from multiple sources, create complete profiles',
      risks: ['Uncontrolled data sales', 'Profile aggregation', 'No privacy control'],
      ring: 3
    },
    // Ring 4: End Users
    {
      id: 'insurance',
      label: 'Insurance Co.',
      icon: '🛡️',
      description: 'Assess health risks and adjust premiums',
      risks: ['Price discrimination', 'Coverage denial'],
      ring: 4
    },
    {
      id: 'employer',
      label: 'Employer',
      icon: '💼',
      description: 'Evaluate work habits and health risks',
      risks: ['Employment discrimination', 'Job loss risk'],
      ring: 4
    }
  ]

  const getRingRadius = (ring: number) => {
    return 40 + ring * 35
  }

  const getNodePosition = (ring: number, index: number, total: number) => {
    const radius = getRingRadius(ring)
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2
    const x = 120 + radius * Math.cos(angle)
    const y = 120 + radius * Math.sin(angle)
    return { x, y }
  }

  const nodesByRing = nodes.reduce((acc, node) => {
    if (!acc[node.ring]) acc[node.ring] = []
    acc[node.ring].push(node)
    return acc
  }, {} as Record<number, Node[]>)

  return (
    <div style={{ padding: '20px', background: 'linear-gradient(135deg, #f5f5f5, #ffffff)', borderRadius: '12px', marginBottom: '20px' }}>
      <h3 style={{ color: '#1f2937', marginTop: 0, marginBottom: '16px' }}>
        Data Flow Network
      </h3>

      {/* SVG Canvas */}
      <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
        <svg width="240" height="240" style={{ minWidth: '240px', background: '#fafafa', borderRadius: '8px' }}>
          {/* Rings */}
          {[1, 2, 3, 4].map((ring) => (
            <circle
              key={`ring-${ring}`}
              cx="120"
              cy="120"
              r={getRingRadius(ring)}
              fill="none"
              stroke="#e5e7eb"
              strokeDasharray="2,2"
              opacity="0.5"
            />
          ))}

          {/* Center node (User) */}
          <circle cx="120" cy="120" r="16" fill="#667eea" />
          <text x="120" y="125" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
            YOU
          </text>

          {/* Nodes and connections */}
          {Object.entries(nodesByRing).map(([ring, ringNodes]) =>
            ringNodes.map((node, index) => {
              const pos = getNodePosition(parseInt(ring), index, ringNodes.length)
              return (
                <g key={node.id}>
                  {/* Connection line */}
                  <line
                    x1="120"
                    y1="120"
                    x2={pos.x}
                    y2={pos.y}
                    stroke="#d1d5db"
                    strokeWidth="1"
                    opacity={selectedNode === node.id ? 1 : 0.3}
                  />
                  {/* Node circle */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="14"
                    fill={selectedNode === node.id ? '#f59e0b' : '#10b981'}
                    opacity={selectedNode === null || selectedNode === node.id ? 1 : 0.4}
                    style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                    onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 5}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {node.icon}
                  </text>
                </g>
              )
            })
          )}
        </svg>
      </div>

      {/* Node Details */}
      {selectedNode && (
        <div style={{
          background: '#fef3c7',
          border: '2px solid #fcd34d',
          borderRadius: '8px',
          padding: '12px'
        }}>
          {nodes.find(n => n.id === selectedNode) && (
            <>
              <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span>{nodes.find(n => n.id === selectedNode)!.icon}</span>
                {nodes.find(n => n.id === selectedNode)!.label}
              </div>
              <p style={{ fontSize: '12px', color: '#b45309', margin: '8px 0' }}>
                {nodes.find(n => n.id === selectedNode)!.description}
              </p>
              <div style={{ fontSize: '11px', color: '#d97706' }}>
                <strong>Risks:</strong>
                <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                  {nodes.find(n => n.id === selectedNode)!.risks.map((risk, i) => (
                    <li key={i}>{risk}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}

      {/* Legend */}
      <div style={{ marginTop: '12px', fontSize: '11px', color: '#6b7280', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>🟢 Ring 1: Direct Services</div>
        <div>🟡 Ring 2: Ad Networks</div>
        <div>🔴 Ring 3: Data Brokers</div>
        <div>⚫ Ring 4: End Users</div>
      </div>
    </div>
  )
}
