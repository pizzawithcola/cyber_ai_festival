import React, { useState } from 'react'

const HeroSection: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  const [scale, setScale] = useState(1)

  return (
    <div style={{
      background: 'linear-gradient(135deg, #ff8c42 0%, #3b82f6 100%)',
      color: 'white',
      padding: '40px 20px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.1,
        backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        animation: 'float 20s infinite'
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Brand + Rating */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '16px'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            fontWeight: 900,
            color: '#ff8c42',
            boxShadow: '0 4px 14px rgba(0,0,0,0.18)'
          }}>
            F
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.3px' }}>FitAI</div>
            <div style={{ fontSize: '11px', opacity: 0.92 }}>★★★★★ 4.8 · 128K reviews</div>
          </div>
        </div>

        {/* Before/After Visual */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          marginBottom: '20px',
          alignItems: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '80px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px'
          }}>
            😅
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>→</div>
          <div style={{
            width: '60px',
            height: '80px',
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px'
          }}>
            💪
          </div>
        </div>

        <h1 style={{
          fontSize: '28px',
          fontWeight: 800,
          margin: '16px 0 12px',
          letterSpacing: '-0.5px'
        }}>
          Lose Weight in 30 Days
          <br />
          AI-Powered Personal Coaching
        </h1>

        <p style={{
          fontSize: '14px',
          opacity: 0.95,
          margin: '0 0 24px',
          lineHeight: '1.6'
        }}>
          Based on your body data and habits,
          <br />
          we create your personalized plan
        </p>

        {/* Stats */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          margin: '24px 0',
          fontSize: '12px',
          opacity: 0.9
        }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>-8.2kg</div>
            <div>Avg Weight Loss</div>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '24px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>28 Days</div>
            <div>Results Timeline</div>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '24px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>97%</div>
            <div>Satisfaction</div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onGetStarted}
          onMouseEnter={() => setScale(1.05)}
          onMouseLeave={() => setScale(1)}
          style={{
            width: '100%',
            maxWidth: '320px',
            background: 'white',
            color: '#ff8c42',
            border: 'none',
            padding: '16px 28px',
            fontSize: '17px',
            fontWeight: 800,
            borderRadius: '14px',
            cursor: 'pointer',
            transform: `scale(${scale})`,
            transition: 'all 0.3s ease',
            boxShadow: '0 8px 24px rgba(0,0,0,0.28)',
            display: 'inline-block',
            letterSpacing: '0.01em'
          }}
        >
          Begin the Journey
        </button>

        <p style={{ fontSize: '11px', opacity: 0.85, marginTop: '12px' }}>
          Free for 7 days · then $9.99/month · cancel anytime
        </p>
      </div>
    </div>
  )
}

export default HeroSection
