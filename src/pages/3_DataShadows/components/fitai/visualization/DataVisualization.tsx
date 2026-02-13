import React, { useState } from 'react'
import { useFitAI } from '../fitaiContext'
import { DeviceLayer } from './DeviceLayer'
import { NetworkFlow } from './NetworkFlow'
import { TimeDimension } from './TimeDimension'
import { RiskHeatmap } from './RiskHeatmap'

export const DataVisualization: React.FC = () => {
  const { completeRegistration } = useFitAI()
  const [activeView, setActiveView] = useState<'device' | 'network' | 'timeline' | 'risks'>('device')

  const views = [
    { id: 'device', label: 'Your Device', description: 'See how data leaves your phone' },
    { id: 'network', label: 'Network Flow', description: 'Where your data goes' },
    { id: 'timeline', label: 'Over Time', description: 'What happens to your data' },
    { id: 'risks', label: 'Risk Map', description: 'Understand the dangers' }
  ]

  return (
    <div style={{
      padding: '20px',
      paddingTop: '40px',
      maxHeight: '728px',
      overflowY: 'auto',
      background: '#ffffff'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #f5f5f5, #ffffff)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h2 style={{
          color: '#1f2937',
          margin: '0 0 8px',
          fontSize: '20px'
        }}>
          Your Data's Journey
        </h2>
        <p style={{
          color: '#6b7280',
          margin: 0,
          fontSize: '13px'
        }}>
          Understand where your fitness data goes after you agree
        </p>
      </div>

      {/* View Selector */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px',
        marginBottom: '20px'
      }}>
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id as any)}
            style={{
              padding: '12px',
              background: activeView === view.id
                ? 'linear-gradient(135deg, #667eea, #764ba2)'
                : '#f3f4f6',
              border: activeView === view.id
                ? '2px solid #667eea'
                : '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              color: activeView === view.id ? '#fff' : '#1f2937',
              fontWeight: activeView === view.id ? 700 : 600,
              fontSize: '12px',
              textAlign: 'left'
            }}
          >
            <div style={{ marginBottom: '2px' }}>{view.label}</div>
            <div style={{
              fontSize: '10px',
              opacity: 0.8,
              fontWeight: 400
            }}>
              {view.description}
            </div>
          </button>
        ))}
      </div>

      {/* Visualization Content */}
      <div>
        {activeView === 'device' && <DeviceLayer isActive={activeView === 'device'} />}
        {activeView === 'network' && <NetworkFlow />}
        {activeView === 'timeline' && <TimeDimension />}
        {activeView === 'risks' && <RiskHeatmap />}
      </div>

      {/* Education Info */}
      <div style={{
        background: '#f0fdf4',
        border: '1px solid #86efac',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <div style={{
          fontWeight: 700,
          color: '#166534',
          marginBottom: '8px',
          fontSize: '13px'
        }}>
          📚 Educational Purpose
        </div>
        <div style={{
          fontSize: '12px',
          color: '#166534',
          lineHeight: '1.5'
        }}>
          This visualization demonstrates the common data flows in health apps. These patterns are widespread across the fitness, health, and wellness industries. Understanding this helps you make informed choices about your privacy.
        </div>
      </div>

      {/* Navigation Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '12px',
            background: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            color: '#1f2937',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          Go Back
        </button>
        <button
          onClick={() => completeRegistration()}
          style={{
            padding: '12px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          Proceed to App
        </button>
      </div>
    </div>
  )
}
