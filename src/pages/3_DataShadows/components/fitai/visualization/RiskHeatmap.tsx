import React, { useState } from 'react'

interface RiskHeatmapProps {}

interface RiskArea {
  id: string
  name: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  scenarios: string[]
  protectionTips: string[]
}

export const RiskHeatmap: React.FC<RiskHeatmapProps> = () => {
  const [selectedRisk, setSelectedRisk] = useState<string>('data-breach')

  const risks: RiskArea[] = [
    {
      id: 'data-breach',
      name: 'Data Breach',
      riskLevel: 'critical',
      scenarios: [
        'Hackers access FitAI servers',
        'Employee steals database',
        'SQL injection attack succeeds'
      ],
      protectionTips: [
        'Use unique passwords',
        'Enable 2FA where available',
        'Monitor accounts for suspicious activity'
      ]
    },
    {
      id: 'tracking',
      name: 'Behavioral Tracking',
      riskLevel: 'high',
      scenarios: [
        'Ads follow you across websites',
        'Fitness data used for targeting',
        'Real-time location tracking'
      ],
      protectionTips: [
        'Use privacy browser extensions',
        'Disable location services when not needed',
        'Clear cookies regularly'
      ]
    },
    {
      id: 'discrimination',
      name: 'Price Discrimination',
      riskLevel: 'high',
      scenarios: [
        'Insurance premiums increase',
        'Health coverage denied',
        'Different prices based on profile'
      ],
      protectionTips: [
        'Review insurance policies',
        'Know your rights',
        'Request data audit from insurers'
      ]
    },
    {
      id: 'employment',
      name: 'Employment Risk',
      riskLevel: 'medium',
      scenarios: [
        'Employer sees unhealthy fitness',
        'Used against you in hiring',
        'Affects promotion prospects'
      ],
      protectionTips: [
        'Separate work and personal data',
        'Don\'t connect work accounts',
        'Know employment laws in your area'
      ]
    },
    {
      id: 'resale',
      name: 'Data Re-selling',
      riskLevel: 'high',
      scenarios: [
        'Sold to 20+ companies',
        'Multiple re-sales occur',
        'Impossible to track all uses'
      ],
      protectionTips: [
        'Check privacy policies carefully',
        'Request data deletion regularly',
        'Use data access requests (GDPR/CCPA)'
      ]
    },
    {
      id: 'fingerprinting',
      name: 'Device Fingerprinting',
      riskLevel: 'medium',
      scenarios: [
        'Unique ID created from your data',
        'Tracked even with VPN/private mode',
        'Combined with other profiles'
      ],
      protectionTips: [
        'Use privacy tools',
        'Vary browser settings periodically',
        'Don\'t trust incognito alone'
      ]
    }
  ]

  const risk = risks.find(r => r.id === selectedRisk)
  const getRiskColor = (level: string) => {
    switch(level) {
      case 'low': return { bg: '#dcfce7', border: '#22c55e', text: '#166534' }
      case 'medium': return { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' }
      case 'high': return { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' }
      case 'critical': return { bg: '#fed7aa', border: '#ea580c', text: '#7c2d12' }
      default: return { bg: '#f3f4f6', border: '#d1d5db', text: '#374151' }
    }
  }

  return (
    <div style={{
      padding: '20px',
      background: 'linear-gradient(135deg, #f5f5f5, #ffffff)',
      borderRadius: '12px',
      marginBottom: '20px'
    }}>
      <h3 style={{ color: '#1f2937', marginTop: 0, marginBottom: '16px' }}>
        Risk Heatmap
      </h3>

      {/* Risk Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {risks.map((r) => {
          const colors = getRiskColor(r.riskLevel)
          return (
            <div
              key={r.id}
              onClick={() => setSelectedRisk(r.id)}
              style={{
                background: colors.bg,
                border: `2px solid ${colors.border}`,
                borderRadius: '8px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                opacity: selectedRisk === r.id ? 1 : 0.7,
                transform: selectedRisk === r.id ? 'scale(1.05)' : 'scale(1)',
                boxShadow: selectedRisk === r.id ? `0 4px 12px ${colors.border}33` : 'none'
              }}
            >
              <div style={{ fontWeight: 700, color: colors.text, fontSize: '13px', marginBottom: '4px' }}>
                {r.name}
              </div>
              <div style={{
                fontSize: '11px',
                color: colors.text,
                opacity: 0.8,
                textTransform: 'uppercase',
                fontWeight: 600,
                letterSpacing: '0.5px'
              }}>
                {r.riskLevel}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Risk Details */}
      {risk && (
        <div style={{
          background: '#fff',
          border: `2px solid ${getRiskColor(risk.riskLevel).border}`,
          borderRadius: '8px',
          padding: '16px'
        }}>
          <div style={{
            background: getRiskColor(risk.riskLevel).bg,
            border: `1px solid ${getRiskColor(risk.riskLevel).border}`,
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 700,
              color: getRiskColor(risk.riskLevel).text,
              marginBottom: '8px'
            }}>
              {risk.name}
            </div>
            <div style={{
              fontSize: '11px',
              color: getRiskColor(risk.riskLevel).text,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              ⚠️ {risk.riskLevel} RISK
            </div>
          </div>

          {/* Scenarios */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 700, color: '#1f2937', marginBottom: '8px', fontSize: '13px' }}>
              Possible Scenarios:
            </div>
            <div style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.6' }}>
              {risk.scenarios.map((scenario, i) => (
                <div key={i} style={{ marginBottom: '6px' }}>
                  • {scenario}
                </div>
              ))}
            </div>
          </div>

          {/* Protection Tips */}
          <div>
            <div style={{ fontWeight: 700, color: '#1f2937', marginBottom: '8px', fontSize: '13px' }}>
              How to Protect Yourself:
            </div>
            <div style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.6' }}>
              {risk.protectionTips.map((tip, i) => (
                <div key={i} style={{ marginBottom: '6px', paddingLeft: '12px' }}>
                  ✓ {tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Info Footer */}
      <div style={{
        marginTop: '16px',
        background: '#f0f9ff',
        border: '1px solid #bfdbfe',
        borderRadius: '6px',
        padding: '12px',
        fontSize: '11px',
        color: '#1e40af'
      }}>
        💡 <strong>Tip:</strong> Understanding these risks helps you make informed decisions about what data to share
      </div>
    </div>
  )
}
