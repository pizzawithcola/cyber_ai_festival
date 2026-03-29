import React, { useState } from 'react'
import { useFitAI } from './fitaiContext'
import HeroSection from './HeroSection'
import SocialProof from './SocialProof'
import FeatureCards from './FeatureCards'
import SignupBar from './SignupBar'

const HomePage: React.FC = () => {
  const { initiateRegistrationFlow } = useFitAI()
  const [showDataWarning, setShowDataWarning] = useState(false)

  // Register/Login button - triggers Terms
  const handleSignup = () => {
    initiateRegistrationFlow()
  }

  const handleGetStarted = () => {
    setShowDataWarning(true)
  }

  const handleConfirmWarning = () => {
    setShowDataWarning(false)
    // Browse features without registering
    // This can navigate to profile or other sections
  }

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Data Privacy Warning Modal */}
      {showDataWarning && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '16px',
            boxSizing: 'border-box'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '365px',
              background: 'white',
              borderRadius: '16px',
              padding: '20px',
              animation: 'fadeIn 0.3s ease-out',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
        
            
            <h2 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#1a2942',
              margin: '0 0 16px 0',
              paddingRight: '32px'
            }}>
              💡 Learn About Data Usage
            </h2>
            
            {/* Scrollable content */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              paddingRight: '4px',
              marginRight: '-4px'
            }}>
              <div style={{
                background: '#fef3c7',
                border: '1px solid #fcd34d',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
                fontSize: '14px',
                color: '#92400e',
                lineHeight: '1.6'
              }}>
                <strong style={{ display: 'block', marginBottom: '8px' }}>🔍 We use your data for:</strong>
                <ul style={{ 
                  margin: '0 0 0 0', 
                  paddingLeft: '18px',
                  listStyleType: 'disc'
                }}>
                  <li style={{ marginBottom: '6px' }}>AI model training and optimization (your fitness data improves our algorithm)</li>
                  <li style={{ marginBottom: '6px' }}>Personalized recommendations and marketing analytics</li>
                  <li style={{ marginBottom: '6px' }}>Sharing with third-party fitness brands and insurance companies</li>
                  <li>Behavioral analysis and user profiling</li>
                </ul>
              </div>
              
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#166534',
                lineHeight: '1.5'
              }}>
                ✅ You can change data privacy settings anytime in the app settings
              </div>
              
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                textAlign: 'center',
                padding: '8px 0',
                borderTop: '1px solid #f3f4f6',
                marginTop: '8px'
              }}>
                Tap outside this window or press ESC to close
              </div>
            </div>
            
            {/* Fixed buttons at bottom */}
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              marginTop: '20px',
              flexShrink: 0
            }}>
              <button
                onClick={() => setShowDataWarning(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                  color: '#6b7280',
                  borderRadius: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '15px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f3f4f6'
                  e.currentTarget.style.borderColor = '#d1d5db'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f9fafb'
                  e.currentTarget.style.borderColor = '#e5e7eb'
                }}
              >
                Skip
              </button>
              <button
                onClick={handleConfirmWarning}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '15px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <HeroSection onGetStarted={handleSignup} />

      {/* Social Proof */}
      <SocialProof />

      {/* Feature Cards */}
      <FeatureCards />

      {/* Signup Bar - 点击时进入 Terms */}
      <SignupBar onSignup={handleSignup} />

      {/* Bottom Stats */}
      <div style={{ padding: '24px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
          Choose Your Fitness Goal
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { icon: '📉', label: 'Weight Loss', count: '485K' },
            { icon: '💪', label: 'Muscle Gain', count: '312K' },
            { icon: '🏃', label: 'Endurance', count: '437K' }
          ].map((item, i) => (
            <div key={i} style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(59,130,246,0.05))',
              borderRadius: '12px',
              padding: '12px',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>{item.icon}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#1a2942' }}>{item.label}</div>
              <div style={{ fontSize: '10px', color: '#6b7280' }}>{item.count} users</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideIn {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        /* Custom scrollbar for modal */
        div::-webkit-scrollbar {
          width: 4px;
        }
        div::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  )
}

export default HomePage