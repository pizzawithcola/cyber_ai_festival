import React, { useState, useEffect, useRef } from 'react'
import { useFitAI } from './fitaiContext'

/**
 * TermsAndConditions - iOS-Style Privacy/Consent UI
 * 
 * Features:
 * - Clean, app-level UI (no system UI elements inside app content)
 * - Respects safe-area insets
 * - 5-second countdown after consent
 * - Expanded privacy and data settings with iOS-style toggles
 * - Professional layout with proper spacing and typography
 * - Reading progress tracking with hidden scoring mechanism
 */
const TermsAndConditions: React.FC = () => {
  const { completeTerms, updateUserChoices } = useFitAI()
  const [hasReadTerms, setHasReadTerms] = useState(false)
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [privacySettings, setPrivacySettings] = useState({
    analytics: true,
    marketing: true,
    thirdParty: false,
    dataRetention: true,
    aiTraining: true, // 原 crashReports → 改为 AI 训练选项
  })
  const [termsReadingProgress, setTermsReadingProgress] = useState(0)
  const termsContentRef = useRef<HTMLDivElement>(null)

  // Detailed terms content
  const detailedTerms = `TERMS OF SERVICE & PRIVACY POLICY

LAST UPDATED: January 2026

1. ACCEPTANCE OF TERMS
By accessing and using the FitAI mobile application ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use this Service.

2. ELIGIBILITY
You must be at least 18 years of age or have parental consent to use this Service. The Service is not intended for use by persons under the age of 13.

3. SERVICE DESCRIPTION
FitAI provides personalized fitness tracking, health insights, workout recommendations, and progress monitoring based on your personal data and activity patterns.

4. USER DATA COLLECTION
We collect the following types of information:
- Personal Information: Name, age, gender, email address
- Health and Fitness Data: Height, weight, body measurements, exercise habits, dietary preferences
- Usage Data: App interactions, feature usage, session duration
- Device Information: Device type, operating system, IP address

5. HOW WE USE YOUR DATA
- To provide personalized fitness recommendations
- To track your progress and generate insights
- To improve our algorithms and services
- To communicate important updates and notifications
- To conduct research and development (anonymized data only)

6. DATA SHARING AND THIRD PARTIES
We do not sell your personal data. We may share data with:
- Service providers necessary for app functionality
- Analytics partners (only with your consent)
- Research institutions (anonymized data only)
- Legal authorities when required by law

7. DATA RETENTION AND DELETION
We retain your personal data for as long as your account is active or as needed to provide services. You may request deletion of your data at any time by contacting support@fitai.com.

8. SECURITY MEASURES
We implement industry-standard security measures including:
- End-to-end encryption for sensitive health data
- Regular security audits and penetration testing
- Secure server infrastructure with firewalls
- Access controls and authentication protocols

9. USER RIGHTS
You have the right to:
- Access your personal data
- Correct inaccurate data
- Delete your data
- Export your data in a portable format
- Opt-out of marketing communications
- Withdraw consent for data processing

10. LIMITATION OF LIABILITY
FitAI provides fitness recommendations for informational purposes only. We are not medical professionals. Consult with healthcare providers before starting any new fitness program.

11. CHANGES TO TERMS
We may update these terms periodically. Continued use of the Service after changes constitutes acceptance of the new terms.

12. CONTACT INFORMATION
For questions about these terms, contact: legal@fitai.com`

  // Calculate reading progress for terms section only
  useEffect(() => {
    const container = termsContentRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const scrollHeight = container.scrollHeight
      const clientHeight = container.clientHeight
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100
      setTermsReadingProgress(Math.min(100, Math.max(0, Math.round(progress))))
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Calculate and save terms scoring
  const calculateAndSaveScore = () => {
    // Calculate reading score: +5 for every 25% read
    const readingScore = Math.floor(termsReadingProgress / 25) * 5
    
    // Calculate unchecked privacy options score: +10 for each unchecked
    let uncheckedCount = 0
    const uncheckedOptions: string[] = []
    
    if (!privacySettings.analytics) {
      uncheckedCount++
      uncheckedOptions.push('analytics')
    }
    if (!privacySettings.marketing) {
      uncheckedCount++
      uncheckedOptions.push('marketing')
    }
    if (!privacySettings.thirdParty) {
      uncheckedCount++
      uncheckedOptions.push('thirdParty')
    }
    if (!privacySettings.dataRetention) {
      uncheckedCount++
      uncheckedOptions.push('dataRetention')
    }
    if (!privacySettings.aiTraining) {
      uncheckedCount++
      uncheckedOptions.push('aiTraining')
    }
    
    const privacyOptionsScore = uncheckedCount * 10
    const totalTermsScore = readingScore + privacyOptionsScore
    
    // Save to context
    updateUserChoices({
      termsReadingProgress,
      termsReadingScore: readingScore,
      uncheckedOptions,
      privacyOptionsScore,
      totalTermsScore
    })
    
    console.log('Terms Scoring:', {
      readingProgress: termsReadingProgress,
      readingScore,
      uncheckedOptions,
      privacyOptionsScore,
      totalTermsScore
    })
  }

  useEffect(() => {
    if (countdown <= 0) return
    
    const timer = setTimeout(() => {
      setCountdown(countdown - 1)
      if (countdown === 1) {
        calculateAndSaveScore()
        completeTerms()
      }
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [countdown, completeTerms, termsReadingProgress, privacySettings, updateUserChoices])

  const handleConsentGiven = () => {
    if (hasReadTerms) {
      setCountdown(1)
    }
  }

  const togglePrivacySetting = (key: keyof typeof privacySettings) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#fff',
      overflow: 'hidden',
    }}>
      {/* Scrollable Content Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
      }}>
        
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
          color: '#fff',
          padding: '20px 16px',
          marginBottom: '12px'
        }}>
          <h1 style={{
            margin: '0 0 6px',
            fontSize: '28px',
            fontWeight: '700',
            letterSpacing: '-0.5px'
          }}>
            Terms & Privacy
          </h1>
          <p style={{
            margin: 0,
            fontSize: '15px',
            fontWeight: '400',
            opacity: 0.9
          }}>
            Review before using FitAI
          </p>
        </div>

        {/* Main Content */}
        <div style={{ padding: '0 16px 16px' }}>
          
          {/* Terms Section */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <h2 style={{
                fontSize: '17px',
                fontWeight: '600',
                color: '#000',
                margin: 0,
                letterSpacing: '-0.3px'
              }}>
                📄 Terms of Service
              </h2>
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                background: '#f3f4f6',
                padding: '4px 8px',
                borderRadius: '12px'
              }}>
                {termsReadingProgress}% read
              </div>
            </div>
            
            {/* Terms Content with Scrollable Area */}
            <div 
              ref={termsContentRef}
              style={{
                background: '#f9fafb',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '14px',
                color: '#374151',
                lineHeight: '1.6',
                border: '1px solid #e5e7eb',
                height: '300px',
                overflowY: 'auto',
                whiteSpace: 'pre-line'
              }}
            >
              {detailedTerms}
            </div>
            
            {/* Reading Progress Bar */}
            <div style={{
              width: '100%',
              height: '4px',
              background: '#f3f4f6',
              borderRadius: '2px',
              marginTop: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${termsReadingProgress}%`,
                background: 'linear-gradient(90deg, #10b981, #3b82f6)',
                transition: 'width 0.3s ease',
                borderRadius: '2px'
              }} />
            </div>
            
            <div style={{
              marginTop: '8px',
              fontSize: '12px',
              color: '#6b7280',
              textAlign: 'center'
            }}>
              Scroll to read the complete terms and conditions
            </div>
          </div>

          {/* Privacy Section */}
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{
              fontSize: '17px',
              fontWeight: '600',
              color: '#000',
              margin: '0 0 10px',
              letterSpacing: '-0.3px'
            }}>
              🔒 Privacy & Data Protection
            </h2>
            <p style={{
              fontSize: '15px',
              fontWeight: '400',
              color: '#6b7280',
              lineHeight: '1.6',
              margin: '0 0 10px'
            }}>
              Your privacy matters to us. We handle your data with care and transparency.
            </p>

            {/* Privacy Settings Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Analytics Toggle */}
              <div style={{
                background: '#f9fafb',
                borderRadius: '12px',
                padding: '12px',
                border: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#000' }}>
                    📊 Usage Analytics
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                    Help us improve the app by sharing usage data
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.analytics}
                  onChange={() => togglePrivacySetting('analytics')}
                  style={{
                    width: '44px',
                    height: '24px',
                    cursor: 'pointer',
                    accentColor: '#3b82f6'
                  }}
                />
              </div>

              {/* Marketing Toggle */}
              <div style={{
                background: '#f9fafb',
                borderRadius: '12px',
                padding: '12px',
                border: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#000' }}>
                    📢 Marketing Communications
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                    Receive updates, tips, and special offers
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.marketing}
                  onChange={() => togglePrivacySetting('marketing')}
                  style={{
                    width: '44px',
                    height: '24px',
                    cursor: 'pointer',
                    accentColor: '#3b82f6'
                  }}
                />
              </div>

              {/* Third-Party Sharing Toggle */}
              <div style={{
                background: '#f9fafb',
                borderRadius: '12px',
                padding: '12px',
                border: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#000' }}>
                    🤝 Third-Party Sharing
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                    Share anonymized data with research partners
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.thirdParty}
                  onChange={() => togglePrivacySetting('thirdParty')}
                  style={{
                    width: '44px',
                    height: '24px',
                    cursor: 'pointer',
                    accentColor: '#3b82f6'
                  }}
                />
              </div>

              {/* Data Retention Toggle */}
              <div style={{
                background: '#f9fafb',
                borderRadius: '12px',
                padding: '12px',
                border: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#000' }}>
                    💾 Extended Data Retention
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                    Keep historical data for long-term insights
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.dataRetention}
                  onChange={() => togglePrivacySetting('dataRetention')}
                  style={{
                    width: '44px',
                    height: '24px',
                    cursor: 'pointer',
                    accentColor: '#3b82f6'
                  }}
                />
              </div>

              {/* AI Model Training Toggle (原 Crash Reports) */}
              <div style={{
                background: '#f9fafb',
                borderRadius: '12px',
                padding: '12px',
                border: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#000' }}>
                    🤖 AI Model Training
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                    Allow anonymized data to train and improve FitAI’s algorithms
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.aiTraining}
                  onChange={() => togglePrivacySetting('aiTraining')}
                  style={{
                    width: '44px',
                    height: '24px',
                    cursor: 'pointer',
                    accentColor: '#3b82f6'
                  }}
                />
              </div>
            </div>

            {/* Privacy Details Expander */}
            <button
              onClick={() => setShowPrivacyDetails(!showPrivacyDetails)}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '12px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '500',
                color: '#3b82f6',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {showPrivacyDetails ? '▼ Hide More Details' : '▶ Show More Details'}
            </button>

            {/* Detailed Privacy Information */}
            {showPrivacyDetails && (
              <div style={{
                marginTop: '12px',
                background: '#f9fafb',
                borderRadius: '12px',
                padding: '14px',
                border: '1px solid #e5e7eb'
              }}>
                {/* Data Collection */}
                <div style={{ marginBottom: '14px' }}>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#000',
                    margin: '0 0 8px'
                  }}>
                    📊 Data We Collect
                  </h3>
                  <ul style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    margin: 0,
                    paddingLeft: '16px',
                    lineHeight: '1.5'
                  }}>
                    <li>Personal profile (name, age, gender, height, weight)</li>
                    <li>Fitness goals and activity level</li>
                    <li>Health and behavioral insights</li>
                    <li>Device information and usage patterns</li>
                  </ul>
                </div>

                {/* Data Usage */}
                <div style={{ marginBottom: '14px' }}>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#000',
                    margin: '0 0 8px'
                  }}>
                    🔍 How We Use Your Data
                  </h3>
                  <ul style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    margin: 0,
                    paddingLeft: '16px',
                    lineHeight: '1.5'
                  }}>
                    <li>Provide personalized recommendations</li>
                    <li>Track progress and generate insights</li>
                    <li>Improve service and algorithms</li>
                    <li>Send notifications and updates</li>
                  </ul>
                </div>

                {/* Data Protection Methods */}
                <div style={{ marginBottom: '14px' }}>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#000',
                    margin: '0 0 8px'
                  }}>
                    🛡️ Protection Measures
                  </h3>
                  <ul style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    margin: 0,
                    paddingLeft: '16px',
                    lineHeight: '1.5'
                  }}>
                    <li>End-to-end encryption for sensitive data</li>
                    <li>Secure servers with regular audits</li>
                    <li>No third-party sharing without consent</li>
                    <li>GDPR and privacy law compliance</li>
                  </ul>
                </div>

                {/* Your Rights */}
                <div>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#000',
                    margin: '0 0 8px'
                  }}>
                    ⚖️ Your Data Rights
                  </h3>
                  <ul style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    margin: 0,
                    paddingLeft: '16px',
                    lineHeight: '1.5'
                  }}>
                    <li>Access all your personal data anytime</li>
                    <li>Request data deletion or correction</li>
                    <li>Opt-out of analytics and tracking</li>
                    <li>Export your data in standard format</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Acknowledgment Checkbox */}
          <div style={{
            background: '#f0f9ff',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '20px',
            border: '1px solid #dbeafe'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              color: '#000'
            }}>
              <input
                type="checkbox"
                checked={hasReadTerms}
                onChange={(e) => setHasReadTerms(e.target.checked)}
                style={{
                  width: '20px',
                  height: '20px',
                  marginTop: '2px',
                  cursor: 'pointer',
                  accentColor: '#3b82f6',
                  flexShrink: 0
                }}
              />
              <span>I have read and agree to the Terms & Privacy Policy</span>
            </label>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action */}
      <div style={{
        padding: '12px 16px',
        background: '#fff',
        borderTop: '1px solid #e5e7eb',
        flexShrink: 0
      }}>
        <button
          onClick={handleConsentGiven}
          disabled={!hasReadTerms || countdown > 0}
          style={{
            width: '100%',
            padding: '14px',
            background: hasReadTerms && countdown === 0 ? 'linear-gradient(135deg, #10b981, #3b82f6)' : '#f3f4f6',
            color: (hasReadTerms && countdown === 0) ? '#fff' : '#9ca3af',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: (hasReadTerms && countdown === 0) ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            letterSpacing: '-0.3px'
          }}
          onMouseEnter={(e) => {
            if (hasReadTerms && countdown === 0) {
              e.currentTarget.style.transform = 'scale(1.01)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          {countdown > 0 ? `Next Step in ${countdown}s...` : 'Continue'}
        </button>
      </div>
    </div>
  )
}

export default TermsAndConditions