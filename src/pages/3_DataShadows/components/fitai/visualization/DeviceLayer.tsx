import React, { useEffect, useState } from 'react'

interface DeviceLayerProps {
  isActive: boolean
}

export const DeviceLayer: React.FC<DeviceLayerProps> = ({ isActive }) => {
  const [dataFlowing, setDataFlowing] = useState(false)

  useEffect(() => {
    if (isActive) {
      setDataFlowing(true)
    }
  }, [isActive])

  return (
    <div style={{
      padding: '20px',
      background: 'linear-gradient(135deg, #f5f5f5, #ffffff)',
      borderRadius: '12px',
      marginBottom: '20px'
    }}>
      <h3 style={{ color: '#1f2937', marginTop: 0, marginBottom: '16px' }}>
        Your Device
      </h3>

      {/* Simplified Phone Model */}
      <div style={{
        position: 'relative',
        width: '120px',
        height: '240px',
        background: '#000',
        border: '8px solid #333',
        borderRadius: '20px',
        margin: '0 auto 20px',
        boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* Screen */}
        <div style={{
          position: 'absolute',
          inset: '8px',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '10px',
          fontWeight: 600
        }}>
          FitAI
        </div>

        {/* Data Flow Out Animation */}
        {dataFlowing && (
          <>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: '2px',
                  height: '40px',
                  background: `rgba(102, 126, 234, ${1 - i * 0.3})`,
                  left: `${30 + i * 20}px`,
                  top: '-40px',
                  animation: `dataFlow 1.5s ease-in infinite ${i * 0.3}s`,
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* User Info Card */}
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '18px'
          }}>
            👤
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '14px' }}>
              User Profile
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              Active data collection
            </div>
          </div>
        </div>
      </div>

      {/* Data Types Being Collected */}
      <div style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.6' }}>
        <strong style={{ color: '#1f2937' }}>Collecting:</strong>
        <div style={{ marginTop: '4px' }}>
          • Location & movement<br/>
          • Health metrics<br/>
          • Usage patterns<br/>
          • Device information
        </div>
      </div>

      <style>{`
        @keyframes dataFlow {
          0% {
            opacity: 0;
            transform: translateY(-40px);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(280px);
          }
        }
      `}</style>
    </div>
  )
}
