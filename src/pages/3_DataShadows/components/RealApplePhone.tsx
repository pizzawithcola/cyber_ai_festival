import React, { useState, useEffect } from 'react'
import './real-apple-phone.css'
import FitAI from './fitai/FitAI'

type ScreenType = 'home' | 'fitai'

/**
 * RealApplePhone - iPhone Device Simulator with Grey Status Bar
 * Status bar shows time, cellular signal, and battery
 */
const RealApplePhone: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home')
  const [currentTime, setCurrentTime] = useState<string>('21:28')
  const [signalStrength, setSignalStrength] = useState<number>(4) // 1-4 bars
  const [batteryLevel, setBatteryLevel] = useState<number>(75) // 0-100 percentage

  // Update time every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }))
    }
    
    updateTime()
    const timer = setInterval(updateTime, 60000)
    
    return () => clearInterval(timer)
  }, [])

  // Simulate signal strength and battery changes
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly change signal strength
      setSignalStrength(prev => {
        const change = Math.random() > 0.7 ? 1 : (Math.random() > 0.5 ? -1 : 0)
        const newStrength = Math.min(4, Math.max(1, prev + change))
        return newStrength
      })
      
      // Slowly decrease battery over time, with small random fluctuations
      setBatteryLevel(prev => {
        if (prev <= 1) return 1
        const decrease = Math.random() > 0.3 ? 0.1 : 0
        const fluctuation = Math.random() > 0.5 ? 0.2 : -0.2
        const newLevel = Math.max(1, prev - decrease + fluctuation)
        return Math.round(newLevel * 10) / 10
      })
    }, 30000) // Change every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  const handleAppTap = () => {
    const icon = document.querySelector('.fitai-icon') as HTMLElement
    if (icon) {
      icon.style.transform = 'scale(0.95)'
      setTimeout(() => {
        icon.style.transform = 'scale(1)'
        setTimeout(() => {
          setCurrentScreen('fitai')
        }, 150)
      }, 150)
    }
  }

  const handleBackToHome = () => {
    setCurrentScreen('home')
  }

  return (
    <div className="apple-phone-container">
      <div className="phone-bezel">
        <div className="phone-screen">
          {/* Status Bar - Grey theme with time, signal and battery */}
          <div className="status-bar">
            {/* Left side of notch - Time */}
            <div className="status-left-container">
              <div className="status-content">
                <span className="status-time">{currentTime}</span>
              </div>
            </div>
            
            {/* Right side of notch - Signal and Battery */}
            <div className="status-right-container">
              <div className="status-indicators">
                {/* Cellular Signal - Dynamic bars based on signal strength */}
                <div className="cellular-signal">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className="cellular-bar"
                      style={{ 
                        opacity: i <= signalStrength ? 0.85 : 0.3,
                        background: i <= signalStrength ? 
                          '#000000 !important' : 
                          '#CCCCCC !important'
                      }}
                    />
                  ))}
                </div>
                
                {/* Battery Indicator - Dynamic level */}
                <div className="battery-icon">
                  <div 
                    className="battery-fill"
                    style={{ width: `${batteryLevel}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Screen Content */}
          <div className="screen-content">
            {currentScreen === 'home' ? (
              <HomeScreen onAppTap={handleAppTap} />
            ) : (
              <FitAI onBack={handleBackToHome} />
            )}
          </div>

          {/* Home Indicator */}
          <div className="home-indicator" />
        </div>
      </div>
    </div>
  )
}

/**
 * HomeScreen
 */
interface HomeScreenProps {
  onAppTap: () => void
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onAppTap }) => {
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    size: Math.random() * 60 + 40,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 8,
    duration: Math.random() * 4 + 8,
  }))

  return (
    <div className="home-screen">
      {/* Background Elements */}
      <div className="background-elements">
        <div className="background-grid" />
        <div className="floating-particles">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="particle"
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="app-icon-container">
        <button
          className="fitai-icon"
          onClick={onAppTap}
          aria-label="Launch FitAI"
        >
          <div className="icon-content">
            <FitAIActiveLogo />
          </div>
          <span className="fitai-icon-beacon" aria-hidden="true" />
        </button>

        <h1 className="app-name">FitAI</h1>
        <p className="app-tagline">Intelligent Fitness Training</p>
      </div>

      {/* Description */}
      <div className="description-container">
        <h2 className="description-title">Smart Fitness</h2>
        <p className="description-text">
          AI-powered workout tracking with real-time analytics and performance optimization.
        </p>
        <p className="instruction-text">
          Tap the icon to start your fitness journey
        </p>
      </div>
    </div>
  )
}

/**
 * FitAIActiveLogo - Fitness-first AI icon with a connected dumbbell mark
 */
const FitAIActiveLogo: React.FC = () => (
  <svg
    className="fitai-logo"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="50" cy="50" r="31" fill="url(#outerGlow)" opacity="0.3" />
    <circle cx="50" cy="50" r="24" fill="url(#ringFill)" />
    <circle
      cx="50"
      cy="50"
      r="24"
      stroke="rgba(255,255,255,0.42)"
      strokeWidth="2"
    />
    <path
      d="M21 43H28V57H21V43Z"
      fill="rgba(255,255,255,0.96)"
    />
    <path
      d="M29 39H34V61H29V39Z"
      fill="#99f6e4"
    />
    <path
      d="M66 39H71V61H66V39Z"
      fill="#c4b5fd"
    />
    <path
      d="M72 43H79V57H72V43Z"
      fill="rgba(255,255,255,0.96)"
    />
    <rect
      x="34"
      y="46"
      width="32"
      height="8"
      rx="4"
      fill="rgba(255,255,255,0.22)"
    />
    <path
      d="M30 50H39L45 42L50 58L55 47L61 50H70"
      stroke="white"
      strokeWidth="4.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="50" cy="50" r="5.5" fill="rgba(7, 16, 28, 0.95)" />
    <circle
      cx="50"
      cy="50"
      r="8.5"
      stroke="rgba(255,255,255,0.22)"
      strokeWidth="1.6"
    />
    <path
      d="M35 31C40 27 45 25 50 25"
      stroke="rgba(255,255,255,0.62)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M65 31C60 27 55 25 50 25"
      stroke="rgba(255,255,255,0.28)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M35 69C40 73 45 75 50 75"
      stroke="rgba(255,255,255,0.22)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M65 69C60 73 55 75 50 75"
      stroke="rgba(255,255,255,0.52)"
      strokeWidth="2"
      strokeLinecap="round"
    />

    <defs>
      <radialGradient id="outerGlow" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor="#67e8f9" />
        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
      </radialGradient>

      <linearGradient id="ringFill" x1="18" y1="18" x2="82" y2="82" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="52%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
  </svg>
)

export default RealApplePhone
