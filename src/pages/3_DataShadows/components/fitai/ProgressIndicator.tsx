import React from 'react'

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
}

const steps = ['Basic Info', 'Body Data', 'Lifestyle', 'Exercise', 'Goals']

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep, totalSteps }) => {
  const percentage = (currentStep / totalSteps) * 100

  return (
    <div style={{
      padding: '20px 16px',
      background: '#ffffff',
      borderBottom: '1px solid #e5e7eb'
    }}>
      {/* Progress Bar */}
      <div style={{
        width: '100%',
        height: '6px',
        background: '#f3f4f6',
        borderRadius: '999px',
        overflow: 'hidden',
        marginBottom: '16px'
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #10b981, #3b82f6)',
          width: `${percentage}%`,
          transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: '999px'
        }} />
      </div>

      {/* Step Indicators */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '8px',
        marginBottom: '12px'
      }}>
        {steps.map((step, index) => (
          <div
            key={index}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: index < currentStep 
                ? 'linear-gradient(135deg, #10b981, #3b82f6)'
                : index === currentStep - 1
                ? '#f0f9ff'  // 亮蓝色背景
                : '#f9fafb', // 浅灰色背景
              border: index === currentStep - 1 
                ? '2px solid #3b82f6' // 当前步骤蓝色边框
                : index < currentStep
                ? 'none' // 已完成无边框
                : '1px solid #e5e7eb', // 未完成浅灰色边框
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: index < currentStep ? '#ffffff' : 
                     index === currentStep - 1 ? '#1d4ed8' : '#6b7280',
              fontWeight: 700,
              fontSize: '12px',
              transition: 'all 0.3s',
              boxShadow: index === currentStep - 1 ? '0 0 0 2px rgba(59, 130, 246, 0.1)' : 'none'
            }}>
              {index < currentStep ? '✓' : index + 1}
            </div>
            <div style={{
              fontSize: '9px',
              color: index === currentStep - 1 ? '#1d4ed8' : 
                     index < currentStep ? '#111827' : '#6b7280',
              textAlign: 'center',
              lineHeight: '1.2',
              maxWidth: '60px',
              fontWeight: index === currentStep - 1 ? 600 : 500
            }}>
              {step}
            </div>
          </div>
        ))}
      </div>

      {/* Percentage */}
      <div style={{
        textAlign: 'center',
        fontSize: '12px',
        color: '#111827',
        marginTop: '8px',
        fontWeight: 500
      }}>
        {Math.round(percentage)}% Complete
      </div>
    </div>
  )
}

export default ProgressIndicator