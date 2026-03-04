import React from 'react'
import { useFitAI } from '../fitaiContext'

export const DataVisualization: React.FC = () => {
  const { setScreen } = useFitAI()

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#000000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      color: '#ffffff',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '600px',
      }}>
        <div style={{ fontSize: '40px', marginBottom: '20px' }}>📊</div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 12px' }}>
          Your Data Visualization
        </h1>
        <p style={{ fontSize: '14px', color: '#b0b0b0', margin: '0 0 30px' }}>
          Analyzing your fitness data...
        </p>

        <button
          onClick={() => setScreen('truthreveal')}
          style={{
            padding: '16px 32px',
            background: 'linear-gradient(135deg, #10b981, #3b82f6)',
            border: 'none',
            borderRadius: '8px',
            color: '#ffffff',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '14px',
            marginTop: '20px',
          }}
        >
          Continue to Truth Reveal
        </button>
      </div>
    </div>
  )
}
