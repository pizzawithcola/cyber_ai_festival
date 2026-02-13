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
            <TechDumbbellLogo />
          </div>
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
 * Tech Dumbbell Logo Component - Modern, tech-inspired dumbbell design
 */
const TechDumbbellLogo: React.FC = () => (
  <svg
    className="fitai-logo"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Main dumbbell bar - Tech gradient */}
    <rect
      x="20"
      y="45"
      width="60"
      height="10"
      rx="3"
      fill="url(#dumbbellBarGradient)"
      stroke="#fff"
      strokeWidth="2"
    />
    
    {/* Left weight - Circular with tech pattern */}
    <circle
      cx="30"
      cy="50"
      r="15"
      fill="url(#weightGradient1)"
      stroke="#fff"
      strokeWidth="2"
    />
    
    {/* Right weight - Circular with tech pattern */}
    <circle
      cx="70"
      cy="50"
      r="15"
      fill="url(#weightGradient2)"
      stroke="#fff"
      strokeWidth="2"
    />
    
    {/* Tech rings on weights - Left */}
    <circle
      cx="30"
      cy="50"
      r="12"
      stroke="rgba(255,255,255,0.7)"
      strokeWidth="1.5"
      fill="none"
    />
    <circle
      cx="30"
      cy="50"
      r="8"
      stroke="rgba(255,255,255,0.5)"
      strokeWidth="1"
      fill="none"
    />
    <circle
      cx="30"
      cy="50"
      r="4"
      stroke="rgba(255,255,255,0.9)"
      strokeWidth="1.5"
      fill="none"
    />
    
    {/* Tech rings on weights - Right */}
    <circle
      cx="70"
      cy="50"
      r="12"
      stroke="rgba(255,255,255,0.7)"
      strokeWidth="1.5"
      fill="none"
    />
    <circle
      cx="70"
      cy="50"
      r="8"
      stroke="rgba(255,255,255,0.5)"
      strokeWidth="1"
      fill="none"
    />
    <circle
      cx="70"
      cy="50"
      r="4"
      stroke="rgba(255,255,255,0.9)"
      strokeWidth="1.5"
      fill="none"
    />
    
    {/* Hexagonal patterns on weights - Left */}
    <path
      d="M30,40 L33,42 L33,46 L30,48 L27,46 L27,42 Z"
      fill="rgba(255,255,255,0.3)"
      stroke="rgba(255,255,255,0.6)"
      strokeWidth="0.5"
    />
    <path
      d="M30,52 L33,54 L33,58 L30,60 L27,58 L27,54 Z"
      fill="rgba(255,255,255,0.3)"
      stroke="rgba(255,255,255,0.6)"
      strokeWidth="0.5"
    />
    
    {/* Hexagonal patterns on weights - Right */}
    <path
      d="M70,40 L73,42 L73,46 L70,48 L67,46 L67,42 Z"
      fill="rgba(255,255,255,0.3)"
      stroke="rgba(255,255,255,0.6)"
      strokeWidth="0.5"
    />
    <path
      d="M70,52 L73,54 L73,58 L70,60 L67,58 L67,54 Z"
      fill="rgba(255,255,255,0.3)"
      stroke="rgba(255,255,255,0.6)"
      strokeWidth="0.5"
    />
    
    {/* Bar grip details */}
    <rect
      x="35"
      y="47"
      width="30"
      height="6"
      rx="1"
      fill="rgba(255,255,255,0.15)"
    />
    
    {/* Circuit lines - Tech detailing */}
    <path
      d="M25,50 L20,50"
      stroke="rgba(255,255,255,0.7)"
      strokeWidth="1"
      strokeDasharray="2,2"
    />
    <path
      d="M80,50 L85,50"
      stroke="rgba(255,255,255,0.7)"
      strokeWidth="1"
      strokeDasharray="2,2"
    />
    
    {/* Energy waves - Tech effect */}
    <path
      d="M50,40 Q55,35 60,40"
      stroke="rgba(255,255,255,0.4)"
      strokeWidth="1"
      fill="none"
      strokeDasharray="3,2"
    />
    <path
      d="M50,60 Q55,65 60,60"
      stroke="rgba(255,255,255,0.4)"
      strokeWidth="1"
      fill="none"
      strokeDasharray="3,2"
    />
    
    {/* Dot matrix pattern on bar */}
    {Array.from({ length: 5 }).map((_, i) => (
      <circle
        key={`dot-${i}`}
        cx={40 + i * 5}
        cy="50"
        r="0.8"
        fill="rgba(255,255,255,0.6)"
      />
    ))}
    
    {/* Gradients */}
    <defs>
      <linearGradient id="dumbbellBarGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="50%" stopColor="#764ba2" />
        <stop offset="100%" stopColor="#667eea" />
      </linearGradient>
      
      <radialGradient id="weightGradient1" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="70%" stopColor="#059669" />
        <stop offset="100%" stopColor="#047857" />
      </radialGradient>
      
      <radialGradient id="weightGradient2" cx="70%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="70%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </radialGradient>
    </defs>
  </svg>
)

export default RealApplePhone