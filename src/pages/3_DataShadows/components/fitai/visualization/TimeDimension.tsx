import React, { useState } from 'react'

interface TimeDimensionProps {}

interface TimePoint {
  id: string
  label: string
  time: string
  description: string
  dataLocations: string[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

export const TimeDimension: React.FC<TimeDimensionProps> = () => {
  const [currentTime, setCurrentTime] = useState(0)

  const timePoints: TimePoint[] = [
    {
      id: 'instant',
      label: 'Instant',
      time: 'Now',
      description: 'Data just left your device',
      dataLocations: ['FitAI Server'],
      riskLevel: 'low'
    },
    {
      id: '1hour',
      label: '1 Hour Later',
      time: '+1h',
      description: 'Initial analysis complete, shared with AI engine',
      dataLocations: ['FitAI Server', 'AI Analysis Engine', 'Analytics Tools'],
      riskLevel: 'medium'
    },
    {
      id: '1day',
      label: '1 Day Later',
      time: '+1d',
      description: 'User profile created, shared with ad networks',
      dataLocations: ['FitAI', 'Google/Meta', 'Analytics Services', 'Partner Services'],
      riskLevel: 'high'
    },
    {
      id: '1month',
      label: '1 Month Later',
      time: '+1mo',
      description: 'Sold to data brokers, distributed further',
      dataLocations: ['Data Brokers', 'Insurance Companies', 'Marketing Firms', '10+ Partners'],
      riskLevel: 'high'
    },
    {
      id: '1year',
      label: '1 Year Later',
      time: '+1y',
      description: 'Still in multiple databases, re-sold multiple times',
      dataLocations: ['20+ Companies', 'Dark Web Markets', 'Aggregators', 'Legacy Systems'],
      riskLevel: 'critical'
    }
  ]

  const point = timePoints[currentTime]
  const getRiskColor = (level: string) => {
    switch(level) {
      case 'low': return '#10b981'
      case 'medium': return '#f59e0b'
      case 'high': return '#ef4444'
      case 'critical': return '#7c2d12'
      default: return '#6b7280'
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
        Data Over Time
      </h3>

      {/* Timeline Slider */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="range"
          min="0"
          max={timePoints.length - 1}
          value={currentTime}
          onChange={(e) => setCurrentTime(parseInt(e.target.value))}
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            background: '#e5e7eb',
            outline: 'none',
            WebkitAppearance: 'slider-horizontal'
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#6b7280',
          marginTop: '8px'
        }}>
          {timePoints.map((p, i) => (
            <div
              key={p.id}
              style={{
                cursor: 'pointer',
                fontWeight: i === currentTime ? 700 : 400,
                color: i === currentTime ? '#1f2937' : '#9ca3af'
              }}
              onClick={() => setCurrentTime(i)}
            >
              {p.label}
            </div>
          ))}
        </div>
      </div>

      {/* Current Time Point Details */}
      <div style={{
        background: '#fff',
        border: `3px solid ${getRiskColor(point.riskLevel)}`,
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1f2937' }}>
              {point.time}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {point.label}
            </div>
          </div>
          <div style={{
            background: getRiskColor(point.riskLevel),
            color: '#fff',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase'
          }}>
            {point.riskLevel} RISK
          </div>
        </div>

        <p style={{ fontSize: '12px', color: '#4b5563', margin: '12px 0' }}>
          {point.description}
        </p>

        <div style={{
          background: '#f9fafb',
          borderRadius: '6px',
          padding: '12px',
          fontSize: '12px'
        }}>
          <strong style={{ color: '#1f2937', display: 'block', marginBottom: '8px' }}>
            Data Locations:
          </strong>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {point.dataLocations.map((loc, i) => (
              <div
                key={i}
                style={{
                  background: '#fff',
                  border: `1px solid ${getRiskColor(point.riskLevel)}`,
                  borderRadius: '4px',
                  padding: '6px 8px',
                  fontSize: '11px',
                  color: '#1f2937'
                }}
              >
                📍 {loc}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div style={{
        background: '#f9fafb',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '12px',
        color: '#6b7280',
        lineHeight: '1.6'
      }}>
        <strong style={{ color: '#1f2937', display: 'block', marginBottom: '8px' }}>
          Timeline Summary:
        </strong>
        <div style={{ background: '#fff', borderRadius: '6px', padding: '12px', fontSize: '11px', color: '#4b5563' }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontWeight: 600, color: '#1f2937' }}>📤 Sharing:</span> Your data leaves your device immediately
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontWeight: 600, color: '#1f2937' }}>📊 Analysis:</span> Analyzed and profiled within hours
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontWeight: 600, color: '#1f2937' }}>💰 Monetization:</span> Sold to data brokers within days
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontWeight: 600, color: '#1f2937' }}>♻️ Perpetual:</span> Continues to exist in databases indefinitely
          </div>
        </div>
      </div>
    </div>
  )
}
