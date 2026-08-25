import React, { useState, useEffect, useRef, useCallback } from 'react'
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

// 隐私选项配置（标题/描述 + 展开说明内容）
const PRIVACY_OPTIONS = [
  { key: 'analytics', emoji: '📊', title: 'Usage Analytics', desc: 'Help us improve the app by sharing usage data' },
  { key: 'marketing', emoji: '📢', title: 'Marketing Communications', desc: 'Receive updates, tips, and special offers' },
  { key: 'thirdParty', emoji: '🤝', title: 'Third-Party Sharing', desc: 'Share anonymized data with research partners' },
  { key: 'dataRetention', emoji: '💾', title: 'Extended Data Retention', desc: 'Keep historical data for long-term insights' },
  { key: 'aiTraining', emoji: '🤖', title: 'AI Model Training', desc: "Allow anonymized data to train and improve FitAI's algorithms" },
]

const PRIVACY_OPTION_DETAILS: Record<string, string> = {
  analytics:
    'We may process information about how you interact with the Service, including session duration and device details, in order to improve our products and better understand usage patterns. This information may be shared with our analytics providers and aggregated for business and operational purposes, subject to applicable law.',
  marketing:
    'By using the Service you may receive communications about products, services, and promotional offers that we believe may be of interest to you. Your contact details and preferences may be used to tailor these communications and to support advertising efforts undertaken together with third-party marketing partners, and you may adjust your preferences at any time.',
  thirdParty:
    'Certain anonymized and aggregate information may be shared with selected partners and research institutions to support product development and industry benchmarking. We take reasonable measures to protect such information; however, once transferred, data becomes subject to the recipient\'s own policies and may be further processed or combined with other datasets.',
  dataRetention:
    'We retain your personal information for as long as your account remains active or as otherwise required to provide the Service, comply with legal obligations, and support legitimate business purposes. Historical records may be maintained after account termination for backup, analytical, and compliance purposes, and retention periods may vary depending on the type of data involved.',
  aiTraining:
    'Anonymized health and fitness information may be used to train, evaluate, and improve our machine learning models and related technologies. Once data has been incorporated into a model, removal may not be feasible, and such processed information may be stored within our infrastructure or with third-party providers engaged to support model development.',
}

const TermsAndConditions: React.FC = () => {
  const { completeTerms, updateUserChoices } = useFitAI()
  const [hasReadTerms, setHasReadTerms] = useState(false)
  const [countdown, setCountdown] = useState(0)
  // 隐私选项：expandedOptions = UI 当前展开状态；seenOptions = 已展开过的集合（计分依据，首次展开永久 +5/项）
  const [expandedOptions, setExpandedOptions] = useState<string[]>([])
  const [seenOptions, setSeenOptions] = useState<string[]>([])
  const [privacySettings, setPrivacySettings] = useState({
    analytics: true,
    marketing: true,
    thirdParty: true,
    dataRetention: true,
    aiTraining: true, // 原 crashReports → 改为 AI 训练选项
  })
  const [termsReadingProgress, setTermsReadingProgress] = useState(0)
  const termsContentRef = useRef<HTMLDivElement>(null)
  // 阅读计时：首次滚动（开始阅读）时间 + 触及 100% 时间，用于阅读计分
  const termsStartTimeRef = useRef<number | null>(null)
  const completionTimeRef = useRef<number | null>(null)

  // Detailed terms content（正式且精简，便于快速阅读）
  const detailedTerms = `TERMS OF SERVICE & PRIVACY POLICY

LAST UPDATED: January 2026

1. ACCEPTANCE
By using FitAI ("the Service"), you accept these terms. If you do not agree, please do not use the Service.

2. ELIGIBILITY
You must be at least 18 years old or have parental consent.

3. SERVICE
FitAI provides personalized fitness coaching, progress tracking, and health insights based on your personal data.

4. DATA WE COLLECT
- Personal information: name, age, gender, email
- Health and fitness data: height, weight, body measurements, exercise habits
- Usage data: app interactions, session duration
- Device information: device type, OS, IP address

5. HOW WE USE YOUR DATA
- To personalize fitness plans and recommendations
- To track progress and generate insights
- To improve our algorithms and services
- To send updates and notifications
- For research and development (anonymized data only)

6. DATA SHARING
We do not sell your data. We may share data with:
- Service providers required for app functionality
- Analytics partners (only with your consent)
- Research institutions (anonymized data only)
- Legal authorities when required by law

7. DATA RETENTION
We retain your data while your account is active. You may request deletion anytime at support@fitai.com.

8. SECURITY
We protect your data with encryption, regular security audits, and access controls.

9. YOUR RIGHTS
You may access, correct, delete, or export your data, and withdraw consent at any time.

10. NOT MEDICAL ADVICE
FitAI provides fitness guidance for informational purposes only. Consult a healthcare professional before starting any program.

11. CHANGES TO TERMS
We may update these terms. Continued use after changes means you accept them.

12. CONTACT
For questions, contact: legal@fitai.com`

  // Calculate reading progress for terms section only
  useEffect(() => {
    const container = termsContentRef.current
    if (!container) return

    const handleScroll = () => {
      // 已触及 100% 后进度锁定，不再变化（避免滚回后倒退）
      if (completionTimeRef.current !== null) {
        setTermsReadingProgress(100)
        return
      }
      // 首次滚动即开始阅读计时
      if (termsStartTimeRef.current === null) {
        termsStartTimeRef.current = Date.now()
      }
      const scrollTop = container.scrollTop
      const scrollHeight = container.scrollHeight
      const clientHeight = container.clientHeight
      const maxScroll = Math.max(1, scrollHeight - clientHeight)
      const progress = (scrollTop / maxScroll) * 100
      const clamped = Math.min(100, Math.max(0, Math.round(progress)))
      setTermsReadingProgress(clamped)
      // 触及 100%（读完）时记录时间戳，用于阅读计分
      if (clamped >= 100) {
        completionTimeRef.current = Date.now()
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Calculate and save terms scoring
  const calculateAndSaveScore = useCallback(() => {
    // Reading score: 不读=0；读完=5；时间分：耗时≥1s=1、≥2s=3、≥3s=5（封顶）；满分10
    const completedReading = completionTimeRef.current !== null
    const secondsToRead =
      completedReading &&
      completionTimeRef.current !== null &&
      termsStartTimeRef.current !== null
        ? Math.round((completionTimeRef.current - termsStartTimeRef.current) / 1000)
        : 0
    const timeScore = secondsToRead >= 3 ? 5 : secondsToRead >= 2 ? 3 : secondsToRead >= 1 ? 1 : 0
    const readingScore = completedReading ? 5 + timeScore : 0
    
    // Calculate unchecked privacy options score: +7 for each unchecked (max 5×7=35)
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
    
    // 展开说明分：每首次展开一个选项 +3（最多 5×3=15，收起不扣分）
    const detailExpansionScore = seenOptions.length * 3
    const privacyOptionsScore = uncheckedCount * 7
    const totalTermsScore = readingScore + detailExpansionScore + privacyOptionsScore

    // Save privacy settings so RegistrationSurvey and TruthReveal can use them
    updateUserChoices({
      termsReadingProgress,
      termsReadingScore: readingScore,
      expandedOptions: seenOptions,
      detailExpansionScore,
      uncheckedOptions,
      privacyOptionsScore,
      totalTermsScore,
      privacySettings: { ...privacySettings },
    })
    
    console.log('Terms Scoring:', {
      readingProgress: termsReadingProgress,
      completedReading,
      secondsToRead,
      timeScore,
      readingScore,
      seenOptions,
      detailExpansionScore,
      uncheckedOptions,
      privacyOptionsScore,
      totalTermsScore
    })
  }, [privacySettings, termsReadingProgress, seenOptions, updateUserChoices])

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
  }, [countdown, calculateAndSaveScore, completeTerms])

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

  const toggleOptionDetail = (key: string) => {
    setExpandedOptions(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
    // 首次展开即永久计分（收起或再展开不会重复/丢失）
    setSeenOptions(prev => (prev.includes(key) ? prev : [...prev, key]))
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

            {/* Privacy Settings Cards — 每项可独立展开说明 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {PRIVACY_OPTIONS.map((opt) => {
                const isExpanded = expandedOptions.includes(opt.key)
                return (
                  <div key={opt.key} style={{
                    background: '#f9fafb',
                    borderRadius: '12px',
                    padding: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#000' }}>
                          {opt.emoji} {opt.title}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                          {opt.desc}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacySettings[opt.key as keyof typeof privacySettings]}
                        onChange={() => togglePrivacySetting(opt.key as keyof typeof privacySettings)}
                        style={{
                          width: '44px',
                          height: '24px',
                          cursor: 'pointer',
                          accentColor: '#3b82f6'
                        }}
                      />
                    </div>

                    {/* 展开说明 - 无框纯文字链接 */}
                    <button
                      type="button"
                      onClick={() => toggleOptionDetail(opt.key)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        marginTop: '10px',
                        padding: 0,
                        background: 'transparent',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#3b82f6',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7' }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                    >
                      {isExpanded ? '▼ Hide details' : '▶ See details'}
                    </button>

                    {isExpanded && (
                      <div style={{
                        marginTop: '10px',
                        fontSize: '11.5px',
                        color: '#6b7280',
                        lineHeight: 1.7
                      }}>
                        {PRIVACY_OPTION_DETAILS[opt.key]}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
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
