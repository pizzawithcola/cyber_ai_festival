import React from 'react'
import { useFitAI } from './fitaiContext'
import { useDataShadowsLayout } from '../../DataShadowsLayoutContext'
import HeroSection from './HeroSection'
import SocialProof from './SocialProof'
import FeatureCards from './FeatureCards'
import SignupBar from './SignupBar'

const HomePage: React.FC = () => {
  const { initiateRegistrationFlow } = useFitAI()
  const { recenterPhoneForExperience } = useDataShadowsLayout()

  // Register/Login button - triggers Terms
  const handleSignup = async () => {
    await recenterPhoneForExperience()
    initiateRegistrationFlow()
  }

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Hero Section */}
      <HeroSection onGetStarted={() => { void handleSignup() }} />

      {/* Social Proof */}
      <SocialProof />

      {/* Feature Cards */}
      <FeatureCards />

      {/* Signup Bar - 点击时进入 Terms */}
      <SignupBar onSignup={() => { void handleSignup() }} />

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
