import React, { useState } from 'react'

const features = [
  {
    id: 1,
    icon: '🍎',
    title: 'AI Diet Analysis',
    description: 'Smart nutritional guidance',
    details: 'Based on your intake data and health goals, AI creates a personalized diet plan for you.',
    dataWarning: '※ Collects eating records, calorie info, and nutrition data for analysis'
  },
  {
    id: 2,
    icon: '💪',
    title: 'Smart Workout Plans',
    description: 'Customized exercise routines',
    details: 'Based on your fitness level and preferences, the system recommends optimal workouts daily.',
    dataWarning: '※ Collects exercise data, heart rate, steps, and fitness metrics for real-time optimization'
  },
  {
    id: 3,
    icon: '📊',
    title: 'Progress Tracking',
    description: 'Visual results display',
    details: 'Track weight, measurements daily and view your progress changes through charts.',
    dataWarning: '※ Regularly syncs weight, body measurements, and body composition analysis'
  },
  {
    id: 4,
    icon: '👥',
    title: 'Community Support',
    description: 'Grow with millions of users',
    details: 'Share experiences, get encouragement, join challenges with like-minded people.',
    dataWarning: '※ User activity, social interactions, and personal info used for social recommendations'
  },
]

const FeatureCards: React.FC = () => {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showAllWarnings, setShowAllWarnings] = useState(false)

  return (
    <div style={{ padding: '24px 12px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#1a2942',
          margin: '0 0 8px 4px'
        }}>
          Core Features
        </h2>
        <p style={{
          fontSize: '12px',
          color: '#6b7280',
          margin: '0 0 0 4px'
        }}>
          Personalized fitness experience tailored for you
        </p>
      </div>

      {/* Feature Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {features.map((feature) => (
          <div
            key={feature.id}
            onClick={() => setExpandedId(expandedId === feature.id ? null : feature.id)}
            style={{
              background: 'white',
              borderRadius: '14px',
              padding: '16px',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: expandedId === feature.id ? '0 8px 16px rgba(0,0,0,0.1)' : '0 2px 6px rgba(0,0,0,0.05)',
              transform: expandedId === feature.id ? 'translateY(-4px)' : 'translateY(0)'
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>
              {feature.icon}
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#1a2942',
              marginBottom: '4px'
            }}>
              {feature.title}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#6b7280'
            }}>
              {feature.description}
            </div>

            {/* Expanded Details */}
            {expandedId === feature.id && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                <p style={{ fontSize: '12px', color: '#374151', margin: '0 0 8px 0', lineHeight: '1.5' }}>
                  {feature.details}
                </p>
                <div style={{
                  fontSize: '10px',
                  color: '#d97706',
                  background: '#fef3c7',
                  padding: '8px',
                  borderRadius: '6px',
                  lineHeight: '1.4'
                }}>
                  {feature.dataWarning}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Data Collection Notice */}
      <button
        onClick={() => setShowAllWarnings(!showAllWarnings)}
        style={{
          width: '100%',
          padding: '12px',
          background: showAllWarnings ? '#fee2e2' : '#f3f4f6',
          border: showAllWarnings ? '1px solid #fca5a5' : '1px solid #e5e7eb',
          borderRadius: '10px',
          fontSize: '12px',
          color: showAllWarnings ? '#991b1b' : '#6b7280',
          cursor: 'pointer',
          fontWeight: 600,
          transition: 'all 0.2s'
        }}
      >
        {showAllWarnings ? 'Hide' : 'View'} Data Usage Details
      </button>

      {showAllWarnings && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: '#fef2f2',
          border: '1px solid #fee2e2',
          borderRadius: '10px',
          fontSize: '11px',
          color: '#7f1d1d',
          lineHeight: '1.6'
        }}>
          <strong>📋 Data Privacy Notice</strong>
          <p style={{ margin: '8px 0 0 0' }}>
            To provide personalized AI fitness coaching, FitAI collects and analyzes:
          </p>
          <ul style={{ margin: '8px 0 0 16px', paddingLeft: 0 }}>
            <li>• Body measurements (height, weight, circumferences)</li>
            <li>• Dietary records and nutritional intake data</li>
            <li>• Exercise data and activity logs</li>
            <li>• Heart rate and other health metrics</li>
            <li>• Social interactions and user feedback</li>
            <li>• Location data for local recommendations</li>
          </ul>
          <p style={{ margin: '8px 0 0 0', opacity: 0.8 }}>
            This data may be used for AI model training, marketing analysis, or shared with third-party partners. See <u>Privacy Policy</u>.
          </p>
        </div>
      )}
    </div>
  )
}

export default FeatureCards
