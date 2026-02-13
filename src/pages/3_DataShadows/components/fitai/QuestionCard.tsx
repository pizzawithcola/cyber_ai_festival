import React from 'react'

interface QuestionCardProps {
  title: string
  description: string
  children: React.ReactNode
  hint: string
  dataCollection: string
  isCompleted: boolean
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  title,
  description,
  children,
  hint,
  dataCollection,
  isCompleted
}) => {
  return (
    <div style={{
      padding: '24px 16px',
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Question Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 800,
          color: '#ffffff',
          margin: '0 0 8px',
          lineHeight: '1.2'
        }}>
          {title}
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#b0b0b0',
          margin: 0,
          lineHeight: '1.5'
        }}>
          {description}
        </p>
      </div>

      {/* Input Area */}
      <div style={{ flex: 1, marginBottom: '20px' }}>
        {children}
      </div>

      {/* Hint Text */}
      {hint && (
        <div style={{
          fontSize: '12px',
          color: '#666666',
          marginBottom: '12px',
          padding: '12px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          borderLeft: '3px solid #3b82f6'
        }}>
          💡 {hint}
        </div>
      )}

      {/* Data Collection Notice - Privacy Dark Pattern */}
      <div style={{
        fontSize: '10px',
        color: '#888888',
        padding: '10px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '6px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        lineHeight: '1.4'
      }}>
        📊 <strong style={{ color: '#999999' }}>Data Collection:</strong> {dataCollection}
      </div>

      {/* Completion Status */}
      {isCompleted && (
        <div style={{
          marginTop: '12px',
          fontSize: '11px',
          color: '#10b981',
          textAlign: 'center',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          ✓ Question completed
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default QuestionCard
