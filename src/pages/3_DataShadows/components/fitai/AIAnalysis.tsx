import React, { useEffect, useState } from 'react'

interface AIAnalysisProps {
  isActive: boolean
  answer: string
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ isActive, answer }) => {
  const [displayText, setDisplayText] = useState('')
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([])
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (!isActive) {
      setDisplayText('')
      setParticles([])
      setCountdown(5)
      return
    }

    // Simulate AI analysis typing effect
    let text = 'AI analyzing your response...'
    let index = 0
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index))
        index++
      } else {
        clearInterval(interval)
      }
    }, 30)

    // Generate floating particles
    const particleInterval = setInterval(() => {
      const newParticles = Array.from({ length: 3 }).map(() => ({
        id: Math.random(),
        x: Math.random() * 100,
        y: Math.random() * 100
      }))
      setParticles((prev) => [...prev, ...newParticles].slice(-10))
    }, 300)

    // Countdown timer
    let countdownValue = 5
    const countdownInterval = setInterval(() => {
      countdownValue--
      setCountdown(countdownValue)
    }, 1000)

    return () => {
      clearInterval(interval)
      clearInterval(particleInterval)
      clearInterval(countdownInterval)
    }
  }, [isActive])

  if (!isActive) return null

  const insights: { [key: string]: string } = {
    default: 'Based on your profile, we recommend a personalized plan...',
    young: 'For your age group, our AI has optimized results...',
    health: 'Your health goals align with 87% of our premium users...',
    active: 'Your activity level suggests advanced workouts...'
  }

  const getInsight = (answer: string) => {
    if (answer.toLowerCase().includes('reduce') || answer.toLowerCase().includes('lose')) {
      return insights.health
    }
    return insights.default
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.1))',
        border: '1px solid rgba(16,185,129,0.3)',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '280px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            style={{
              position: 'absolute',
              width: '4px',
              height: '4px',
              background: '#10b981',
              borderRadius: '50%',
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              opacity: 0.6,
              animation: 'float-up 2s ease-out forwards'
            }}
          />
        ))}

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            fontSize: '28px',
            marginBottom: '12px',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>
            🤖
          </div>

          <div style={{
            fontSize: '13px',
            color: '#ffffff',
            marginBottom: '16px',
            fontWeight: 600,
            minHeight: '40px'
          }}>
            {displayText}
            <span style={{ animation: 'blink 1s infinite' }}>_</span>
          </div>

          <div style={{
            fontSize: '11px',
            color: '#10b981',
            marginBottom: '12px',
            padding: '8px',
            background: 'rgba(16,185,129,0.1)',
            borderRadius: '8px'
          }}>
            Connecting to AI servers...
          </div>

          <div style={{
            fontSize: '12px',
            color: '#60a5fa',
            marginBottom: '12px',
            fontWeight: 600
          }}>
            Completing in {countdown}s
          </div>

          <div style={{
            fontSize: '10px',
            color: '#888888',
            fontStyle: 'italic'
          }}>
            {getInsight(answer)}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-60px) translateX(20px);
            opacity: 0;
          }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes blink {
          0%, 49%, 100% { opacity: 1; }
          50%, 99% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export default AIAnalysis
