import React, { useState, useEffect } from 'react'

const SignupBar: React.FC<{ onSignup: () => void }> = ({ onSignup }) => {
  const [timeLeft, setTimeLeft] = useState('23:45:32')
  const [userCount, setUserCount] = useState(1234)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      // Simulate countdown
      setTimeLeft((prev) => {
        const [h, m, s] = prev.split(':').map(Number)
        let newS = s - 1
        let newM = m
        let newH = h

        if (newS < 0) {
          newS = 59
          newM -= 1
        }
        if (newM < 0) {
          newM = 59
          newH -= 1
        }
        if (newH < 0) {
          newH = 23
        }

        return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}:${String(newS).padStart(2, '0')}`
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Simulate users signing up
  useEffect(() => {
    const timer = setInterval(() => {
      setUserCount((prev) => prev + Math.floor(Math.random() * 5) + 1)
    }, 3000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{
      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
      color: 'white',
      padding: '16px',
      margin: '20px 12px',
      borderRadius: '14px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 8px 20px rgba(255, 107, 107, 0.3)'
    }}>
      {/* Animated Background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.1,
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, white 10px, white 20px)',
        animation: 'slide 15s linear infinite'
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{
          fontSize: '16px',
          fontWeight: 700,
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>⏰ Limited-Time Free Registration</span>
          <div style={{
            display: 'inline-block',
            animation: 'pulse 2s infinite'
          }}>
            🎁
          </div>
        </div>

        {/* Countdown */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '12px',
          alignItems: 'center',
          fontSize: '13px'
        }}>
          <div>Offer ends in:</div>
          <div style={{
            background: 'rgba(0,0,0,0.2)',
            padding: '6px 10px',
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: '14px',
            letterSpacing: '2px'
          }}>
            {timeLeft}
          </div>
        </div>

        {/* Live Users Signing Up */}
        <div style={{
          fontSize: '12px',
          marginBottom: '12px',
          opacity: 0.95
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#4ade80',
              animation: 'blink 1s infinite'
            }} />
            <span>{userCount} people signing up right now...</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => {
            setIsAnimating(true)
            setTimeout(() => {
              onSignup()
              setIsAnimating(false)
            }, 300)
          }}
          style={{
            width: '100%',
            background: 'white',
            color: '#ff6b6b',
            border: 'none',
            padding: '12px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            transform: isAnimating ? 'scale(0.95)' : 'scale(1)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          Register Now
        </button>

        {/* Hint Text */}
        <div style={{
          fontSize: '10px',
          marginTop: '8px',
          opacity: 0.8,
          textAlign: 'center'
        }}>
          👆 Tap to start your fitness journey
        </div>
      </div>

      <style>{`
        @keyframes slide {
          from { transform: translateX(0); }
          to { transform: translateX(20px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

export default SignupBar
