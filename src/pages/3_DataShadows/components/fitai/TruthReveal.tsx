import React, { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useFitAI } from './fitaiContext'
import { useDataShadowsLayout } from '../../DataShadowsLayoutContext'
import { NetworkDataFlowDiagram } from './NetworkDataFlowDiagram'
import type { TermsConsent, SurveyData } from './dataFlowLogic'
import { getStoredUser } from '../../../../utils/userStorage'
import { apiFetch } from '../../../../services/api'
import './TruthReveal.css'

function getPrivacyScoreBreakdown(
  termsReadingProgress: number,
  termsReadingScore: number,
  privacyOptionsScore: number,
  surveyScore: number,
  surveyData: SurveyData
) {
  const lines: string[] = []

  lines.push(`Reading: ${termsReadingProgress}% (${termsReadingScore} pts)`)
  lines.push(`Privacy Toggles: ${privacyOptionsScore} pts`)
  lines.push(`Survey Disclosure: ${surveyScore} pts`)

  const heightWeightFilled = !!(surveyData.height && surveyData.weight)
  const occupationFilled = !!surveyData.occupation
  const addressFilled = !!surveyData.homeAddress

  lines.push(`Height/Weight: ${heightWeightFilled ? 'shared' : 'not shared'}`)
  lines.push(`Occupation: ${occupationFilled ? 'shared' : 'not shared'}`)
  lines.push(`Home Address: ${addressFilled ? 'shared' : 'not shared'}`)

  return lines
}

const TruthReveal: React.FC = () => {
  const { userChoices } = useFitAI()
  const { rightSlotEl, setTruthRevealFinalStep } = useDataShadowsLayout()
  const [phase, setPhase] = useState(0)
  const [showTwist, setShowTwist] = useState(false)
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null)
  const [scrollPhase, setScrollPhase] = useState(0)
  const [screenShake, setScreenShake] = useState(false)
  const [privacyScore, setPrivacyScore] = useState<number>(0)
  const [showAllLayers, setShowAllLayers] = useState(false)
  const [isTransitioningToReveal, setIsTransitioningToReveal] = useState(false)
  const hasSyncedScoreRef = useRef(false)
  const storedUser = getStoredUser()
  const userId = storedUser?.id
  const confettiPieces = useMemo(
    () =>
      [...Array(20)].map((_, i) => ({
        id: i,
        color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'][i % 4],
        duration: 2 + (i % 5) * 0.18,
        left: 4 + ((i * 17) % 92),
      })),
    []
  )

  // 计算隐私分数
  useEffect(() => {
    const calculateScore = () => {
      let totalScore = 0
      
      // 1. Terms & Conditions Score
      const termsReadingScore = typeof userChoices?.termsReadingScore === 'number' ? userChoices.termsReadingScore : 0
      totalScore += termsReadingScore
      
      const privacyOptionsScore = typeof userChoices?.privacyOptionsScore === 'number' ? userChoices.privacyOptionsScore : 0
      totalScore += privacyOptionsScore
      
      // 2. Survey Score: +10 for each skipped optional question
      const surveyScore = typeof userChoices?.surveyScore === 'number' ? userChoices.surveyScore : 0
      totalScore += surveyScore
      
      // 确保分数在0-100范围内
      const finalScore = Math.max(0, Math.min(100, totalScore))
      
      console.log('Final Privacy Score Calculation:', {
        termsReadingScore,
        privacyOptionsScore,
        surveyScore,
        totalScore,
        finalScore
      })
      
      setPrivacyScore(finalScore)
    }

    calculateScore()
  }, [userChoices])

  useEffect(() => {
    const phases = [
      { delay: 0, action: () => setPhase(1) },
      { delay: 1700, action: () => setPhase(2) },
      { delay: 3400, action: () => {
        setShowTwist(true)
        setScreenShake(true)
        setTimeout(() => setScreenShake(false), 360)
      }},
      { delay: 4600, action: () => setPhase(3) },
    ]

    const timers = phases.map(({ delay, action }) => window.setTimeout(action, delay))
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [])

  useEffect(() => {
    if (phase !== 3 || showAllLayers || isTransitioningToReveal) return

    const sequence = [
      window.setTimeout(() => setScrollPhase(1), 360),
      window.setTimeout(() => setScrollPhase(2), 760),
      window.setTimeout(() => setScrollPhase(3), 1160),
      window.setTimeout(() => setScrollPhase(4), 1560),
      window.setTimeout(() => setIsTransitioningToReveal(true), 2050),
    ]

    return () => {
      sequence.forEach((timer) => window.clearTimeout(timer))
    }
  }, [phase, showAllLayers, isTransitioningToReveal])

  useEffect(() => {
    if (!isTransitioningToReveal) return

    const timer = window.setTimeout(() => {
      setShowAllLayers(true)
      setIsTransitioningToReveal(false)
    }, 520)

    return () => window.clearTimeout(timer)
  }, [isTransitioningToReveal])

  // Sync final-step layout and portal the diagram into the full-page slot.
  useEffect(() => {
    setTruthRevealFinalStep(showAllLayers)
    return () => { setTruthRevealFinalStep(false) }
  }, [showAllLayers, setTruthRevealFinalStep])

  useEffect(() => {
    if (!showAllLayers) return

    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
    }
  }, [showAllLayers])

  useEffect(() => {
    const syncScore = async () => {
      if (phase < 3 || !userId || hasSyncedScoreRef.current) return

      hasSyncedScoreRef.current = true

      const sessionKey = `datashadows_session_highscore_${userId}`
      const currentScore = Number(privacyScore) || 0
      const storedSessionHigh = Number(sessionStorage.getItem(sessionKey) || '0')
      const sessionHighScore = Math.max(currentScore, storedSessionHigh)

      if (sessionHighScore > storedSessionHigh) {
        sessionStorage.setItem(sessionKey, sessionHighScore.toString())
      }

      try {
        const existingScoreResponse = await apiFetch(`/scores/${userId}`)

        if (existingScoreResponse.ok) {
          const existingScore = await existingScoreResponse.json()
          const serverScore = Number(existingScore?.game2_score) || 0
          const scoreToSubmit = Math.max(serverScore, sessionHighScore)

          const updateResponse = await apiFetch(`/scores/${userId}`, {
            method: 'PUT',
            body: JSON.stringify({ game2_score: scoreToSubmit }),
          })

          if (!updateResponse.ok) {
            console.error('[TruthReveal] Failed to update Data Shadows score:', updateResponse.status)
          }
          return
        }

        if (existingScoreResponse.status === 404) {
          const createResponse = await apiFetch('/scores/', {
            method: 'POST',
            body: JSON.stringify({
              user_id: userId,
              game2_score: sessionHighScore,
            }),
          })

          if (!createResponse.ok) {
            console.error('[TruthReveal] Failed to create Data Shadows score:', createResponse.status)
          }
          return
        }

        console.error('[TruthReveal] Failed to fetch existing score:', existingScoreResponse.status)
      } catch (error) {
        console.error('[TruthReveal] Failed to sync Data Shadows score:', error)
      }
    }

    void syncScore()
  }, [phase, privacyScore, userId])

  const termsConsent: TermsConsent = {
    privacySettings: (userChoices?.privacySettings as TermsConsent['privacySettings']) ?? {
      analytics: false,
      marketing: false,
      thirdParty: false,
      dataRetention: false,
      aiTraining: false,
    },
    termsReadingProgress: typeof userChoices?.termsReadingProgress === 'number' ? userChoices.termsReadingProgress : 0,
    uncheckedOptions: userChoices?.uncheckedOptions as string[] | undefined,
  }
  const surveyData: SurveyData = {
    height: typeof userChoices?.surveyHeight === 'number' ? userChoices.surveyHeight : undefined,
    weight: typeof userChoices?.surveyWeight === 'number' ? userChoices.surveyWeight : undefined,
    occupation: typeof userChoices?.surveyOccupation === 'string' ? userChoices.surveyOccupation : undefined,
    homeAddress: typeof userChoices?.surveyHomeAddress === 'string' ? userChoices.surveyHomeAddress : undefined,
    workoutMinutes: typeof userChoices?.surveyWorkoutMinutes === 'number' ? userChoices.surveyWorkoutMinutes : undefined,
  }
  const termsReadingProgress = termsConsent.termsReadingProgress ?? 0
  const termsReadingScore = typeof userChoices?.termsReadingScore === 'number' ? userChoices.termsReadingScore : 0
  const privacyOptionsScore = typeof userChoices?.privacyOptionsScore === 'number' ? userChoices.privacyOptionsScore : 0
  const surveyScore = typeof userChoices?.surveyScore === 'number' ? userChoices.surveyScore : 0
  const portalContent =
    showAllLayers && rightSlotEl
      ? createPortal(
          <NetworkDataFlowDiagram
            termsConsent={termsConsent}
            surveyData={surveyData}
            overridePrivacyScore={privacyScore}
          />,
          rightSlotEl
        )
      : null

  return (
    <>
      {portalContent}
      <div
        className={`truth-reveal-arcade ${showAllLayers ? 'truth-reveal-arcade-final' : ''} ${isTransitioningToReveal ? 'truth-reveal-arcade-loading' : ''}`}
        style={{
          width: '100%',
          height: '100%',
          background: '#000000',
          overflow: 'hidden',
          position: 'relative',
          color: '#ffffff',
          transition: screenShake ? 'transform 0.1s' : 'none',
          transform: screenShake ? 'translateX(-5px)' : 'translateX(0)',
        }}
      >
        {isTransitioningToReveal && (
          <div className="truth-reveal-loading-overlay" style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: 'radial-gradient(circle at center, rgba(34,211,238,0.2), rgba(0,0,0,0.9) 58%)',
            backdropFilter: 'blur(8px)',
            animation: 'revealOverlayIn 0.35s ease-out',
          }}>
            <div className="truth-reveal-loading-card" style={{
              width: '100%',
              maxWidth: '300px',
              padding: '22px 20px',
              borderRadius: '8px',
              border: '2px solid rgba(34,211,238,0.48)',
              background: 'rgba(9, 14, 28, 0.9)',
              textAlign: 'center',
              boxShadow: '0 0 30px rgba(34,211,238,0.22), 0 24px 48px rgba(0,0,0,0.35)',
            }}>
              <div style={{
                fontSize: '12px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: '#67e8f9',
                fontWeight: 700,
                marginBottom: '12px',
              }}>
                Truth Review
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '10px' }}>
                Loading Dataflow Map...
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.72)', lineHeight: 1.6 }}>
                The dataflow diagram expands into a single-page view.
              </div>
              <div style={{
                marginTop: '18px',
                height: '6px',
                borderRadius: '999px',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.08)',
              }}>
                <div style={{
                  height: '100%',
                  width: '100%',
                  background: 'linear-gradient(90deg, #f472b6, #22d3ee, #a3e635)',
                  transformOrigin: 'left center',
                  animation: 'revealProgress 0.52s linear forwards',
                }} />
              </div>
            </div>
          </div>
        )}

        {/* Phase 0-2: 保持不变 */}
        {/* Phase 0: Completion Celebration */}
        {phase === 0 && (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            textAlign: 'center',
            animation: 'fadeIn 0.5s ease-out',
          }}>
            {/* Confetti Animation */}
            {confettiPieces.map((piece) => (
              <div
                key={piece.id}
                style={{
                  position: 'absolute',
                  width: '10px',
                  height: '10px',
                  background: piece.color,
                  borderRadius: '50%',
                  animation: `confetti ${piece.duration}s ease-out forwards`,
                  left: `${piece.left}%`,
                  top: '-10px',
                  opacity: 0.8,
                }}
              />
            ))}

            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>🎉</div>
              <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 12px' }}>
                Congratulations! Your Personalized Fitness Plan is Ready
              </h1>
              <p style={{ fontSize: '14px', color: '#b0b0b0', margin: 0 }}>
                Based on your unique data, AI has created the optimal plan for you
              </p>
              <div style={{
                width: '100%',
                height: '6px',
                background: '#333',
                borderRadius: '3px',
                marginTop: '20px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #10b981, #3b82f6)',
                  animation: 'fillProgress 2s ease-out forwards',
                }} />
              </div>
              <p style={{ fontSize: '12px', color: '#10b981', marginTop: '12px', fontWeight: 600 }}>
                100% Complete
              </p>
            </div>
          </div>
        )}

        {/* Phase 1: Loading & Analysis */}
        {phase === 1 && (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            textAlign: 'center',
            animation: 'fadeIn 0.5s ease-out',
          }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                fontSize: '50px',
                animation: 'spin 2s linear infinite',
                marginBottom: '20px'
              }}>📱</div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px' }}>
                Optimizing Your Plan Details...
              </h2>
              <p style={{ fontSize: '12px', color: '#888', margin: '0 0 16px' }}>
                Our App is analyzing all your data
              </p>
              <div style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'center',
                marginTop: '16px'
              }}>
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    style={{
                      width: '8px',
                      height: '8px',
                      background: '#10b981',
                      borderRadius: '50%',
                      animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Phase 2: Pre-Twist */}
        {phase === 2 && !showTwist && (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            textAlign: 'center',
            animation: 'fadeIn 0.5s ease-out',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✨</div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px' }}>
              Ready?
            </h2>
            <p style={{ fontSize: '13px', color: '#b0b0b0', margin: 0 }}>
              We have something important to share with you...
            </p>
          </div>
        )}

        {/* Phase 2+: Twist Point with Glitch - 移除马赛克，保留闪烁效果 */}
        {showTwist && phase === 2 && (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            textAlign: 'center',
            animation: 'glitch 0.3s ease-out, fadeIn 0.5s ease-out 0.3s forwards',
            background: '#000000',
          }}>
            {/* 不显示任何内容，只有闪烁效果 */}
          </div>
        )}

        {/* Phase 3+: Truth Revelations */}
        {phase >= 3 && !showAllLayers && (
          <div style={{ 
            padding: '20px',
            transition: 'all 0.3s ease-out',
            backgroundImage: 'radial-gradient(circle at top, rgba(59,130,246,0.08), transparent 28%)',
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '22px',
              padding: '8px 14px',
              borderRadius: '999px',
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.22)',
              color: '#86efac',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}>
              Truth Reveal Sequence
            </div>
            {/* Level 1: Fitness Plan Truth - 修改描述 */}
            {(showAllLayers || scrollPhase >= 0) && (
              <div style={{
                marginBottom: '40px',
                padding: '20px',
                background: 'linear-gradient(180deg, rgba(16,185,129,0.08), rgba(2,6,23,0.88))',
                borderRadius: '14px',
                border: '1px solid rgba(16,185,129,0.28)',
                boxShadow: '0 0 24px rgba(16,185,129,0.08)',
                opacity: showAllLayers ? 1 : (scrollPhase >= 0 ? 1 : 0),
                transform: showAllLayers ? 'translateY(0)' : (scrollPhase >= 0 ? 'translateY(0)' : 'translateY(20px)'),
                transition: 'all 0.5s ease-out'
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px' }}>
                  Layer 1: Understanding Your Fitness Plan
                </h2>
                <div style={{
                  background: 'rgba(0,0,0,0.5)',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                }}>
                  <p style={{ fontSize: '13px', margin: '0 0 12px' }}>
                    While our AI creates personalized fitness plans, it's important to understand how data flows through modern applications like ours.
                  </p>
                  <details style={{
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#10b981',
                  }}>
                    <summary>Learn More</summary>
                    <p style={{ marginTop: '12px', color: '#b0b0b0' }}>
                      Like most modern applications, data collection is essential for providing personalized experiences. However, it's crucial to understand where and how your data is used to make informed privacy choices.
                    </p>
                  </details>
                </div>
              </div>
            )}

            {/* Level 2: Business Model Truth */}
            {(showAllLayers || scrollPhase >= 1) && (
              <div style={{
                marginBottom: '40px',
                padding: '20px',
                background: 'linear-gradient(180deg, rgba(59,130,246,0.08), rgba(2,6,23,0.88))',
                borderRadius: '14px',
                border: '1px solid rgba(59,130,246,0.24)',
                boxShadow: '0 0 24px rgba(59,130,246,0.08)',
                opacity: showAllLayers ? 1 : (scrollPhase >= 1 ? 1 : 0),
                transform: showAllLayers ? 'translateY(0)' : (scrollPhase >= 1 ? 'translateY(0)' : 'translateY(20px)'),
                transition: 'all 0.5s ease-out 0.1s'
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px' }}>
                  Layer 2: Business Model Insights
                </h2>
                <div style={{
                  background: 'rgba(0,0,0,0.5)',
                  padding: '16px',
                  borderRadius: '8px',
                }}>
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '12px', color: '#888', margin: '0 0 8px' }}>
                      What users typically expect:
                    </p>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#3b82f6' }}>
                      Service-Based Revenue 📱
                    </div>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '2px',
                    background: '#333',
                    margin: '16px 0'
                  }} />
                  <div>
                    <p style={{ fontSize: '12px', color: '#888', margin: '0 0 8px' }}>
                      Additional revenue sources in many apps:
                    </p>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>
                      Data Analytics 💰
                    </div>
                    <p style={{ fontSize: '11px', color: '#fca5a5', marginTop: '12px', margin: '12px 0 0' }}>
                      Common industry practice
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Level 3: Privacy Score Assessment (跳过数据价值计算) */}
            {(showAllLayers || scrollPhase >= 2) && (
              <div style={{
                marginBottom: '40px',
                padding: '20px',
                background: 'linear-gradient(180deg, rgba(139,92,246,0.08), rgba(2,6,23,0.88))',
                borderRadius: '14px',
                border: '1px solid rgba(139,92,246,0.24)',
                boxShadow: '0 0 24px rgba(139,92,246,0.08)',
                opacity: showAllLayers ? 1 : (scrollPhase >= 2 ? 1 : 0),
                transform: showAllLayers ? 'translateY(0)' : (scrollPhase >= 2 ? 'translateY(0)' : 'translateY(20px)'),
                transition: 'all 0.5s ease-out 0.2s'
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px' }}>
                  Layer 3: Data Flow Awareness
                </h2>
                <div style={{
                  background: 'rgba(0,0,0,0.5)',
                  padding: '20px',
                  borderRadius: '8px',
                }}>
                  <p style={{ fontSize: '13px', color: '#b0b0b0', margin: '0 0 16px', lineHeight: '1.6' }}>
                    Modern applications often share data with analytics platforms, advertising networks, and third-party services to improve their offerings and sustain their business models.
                  </p>
                  <div style={{
                    fontSize: '14px',
                    color: '#f59e0b',
                    marginTop: '12px',
                    textAlign: 'center'
                  }}>
                    Your Privacy Choices Matter
                  </div>
                </div>
              </div>
            )}

            {/* Level 4: Privacy Score Assessment */}
            {(showAllLayers || scrollPhase >= 3) && (
              <div style={{
                marginBottom: '40px',
                padding: '20px',
                background: 'linear-gradient(180deg, rgba(14,165,233,0.08), rgba(2,6,23,0.9))',
                borderRadius: '14px',
                border: '1px solid rgba(14,165,233,0.24)',
                boxShadow: '0 0 24px rgba(14,165,233,0.08)',
                opacity: showAllLayers ? 1 : (scrollPhase >= 3 ? 1 : 0),
                transform: showAllLayers ? 'translateY(0)' : (scrollPhase >= 3 ? 'translateY(0)' : 'translateY(20px)'),
                transition: 'all 0.5s ease-out 0.3s'
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px' }}>
                  Layer 4: Your Privacy Score
                </h2>
                <div style={{
                  background: 'rgba(0,0,0,0.5)',
                  padding: '20px',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: '60px',
                    fontWeight: 700,
                    background: privacyScore >= 70 ? 'linear-gradient(135deg, #10b981, #3b82f6)' :
                             privacyScore >= 40 ? 'linear-gradient(135deg, #f59e0b, #f97316)' :
                                                  'linear-gradient(135deg, #ef4444, #dc2626)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    margin: '8px 0',
                    animation: showAllLayers ? 'none' : 'countUp 2s ease-out',
                  }}>
                    {privacyScore}/100
                  </div>
                  
                  <p style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: privacyScore >= 70 ? '#10b981' :
                           privacyScore >= 40 ? '#f59e0b' : '#ef4444',
                    margin: '8px 0 16px',
                  }}>
                    {privacyScore >= 70 ? 'Privacy Champion!' :
                     privacyScore >= 40 ? 'Aware User' : 'Privacy Novice'}
                  </p>

                  <div style={{
                    marginTop: '18px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    textAlign: 'left',
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#ffffff',
                      marginBottom: '10px',
                      textAlign: 'center',
                    }}>
                      Score Breakdown
                    </div>
                    <div style={{
                      display: 'grid',
                      gap: '6px',
                      fontSize: '12px',
                      lineHeight: 1.6,
                      color: '#d1d5db',
                    }}>
                      {getPrivacyScoreBreakdown(
                        termsReadingProgress,
                        termsReadingScore,
                        privacyOptionsScore,
                        surveyScore,
                        surveyData
                      ).map((line) => (
                        <div key={line}>{line}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Level 5: Contrast Matrix */}
            {(showAllLayers || scrollPhase >= 4) && (
              <div style={{
                marginBottom: '40px',
                padding: '20px',
                background: 'linear-gradient(180deg, rgba(244,63,94,0.08), rgba(2,6,23,0.9))',
                borderRadius: '14px',
                border: '1px solid rgba(244,63,94,0.24)',
                boxShadow: '0 0 24px rgba(244,63,94,0.08)',
                opacity: showAllLayers ? 1 : (scrollPhase >= 4 ? 1 : 0),
                transform: showAllLayers ? 'translateY(0)' : (scrollPhase >= 4 ? 'translateY(0)' : 'translateY(20px)'),
                transition: 'all 0.5s ease-out 0.4s'
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px' }}>
                  Layer 5: Reality Check
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{
                    background: 'rgba(16,185,129,0.1)',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(16,185,129,0.2)',
                  }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', margin: '0 0 8px' }}>
                      Common Assumptions...
                    </p>
                    <ul style={{ fontSize: '11px', color: '#b0b0b0', margin: 0, paddingLeft: '16px' }}>
                      <li>My data is only used for the service</li>
                      <li>Data sharing is minimal</li>
                      <li>Privacy settings are clear</li>
                      <li>Opt-outs are easy and effective</li>
                    </ul>
                  </div>
                  <div style={{
                    background: 'rgba(239,68,68,0.1)',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', margin: '0 0 8px' }}>
                      Actual Industry Practices...
                    </p>
                    <ul style={{ fontSize: '11px', color: '#fca5a5', margin: 0, paddingLeft: '16px' }}>
                      <li>Data is often shared with partners</li>
                      <li>Complex privacy policies</li>
                      <li>Opt-out options are hard to find</li>
                      <li>Data retention is rarely clear</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Emotion Selection */}
            {(showAllLayers || scrollPhase >= 4) && (
              <div style={{
                marginBottom: '40px',
                padding: '20px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                textAlign: 'center',
                opacity: showAllLayers ? 1 : (scrollPhase >= 4 ? 1 : 0),
                transform: showAllLayers ? 'translateY(0)' : (scrollPhase >= 4 ? 'translateY(0)' : 'translateY(20px)'),
                transition: 'all 0.5s ease-out 0.5s'
              }}>
                <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 16px' }}>
                  How do you feel now?
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                }}>
                  {[
                    { emoji: '😲', label: 'Shocked', value: 'shocked' },
                    { emoji: '😠', label: 'Angry', value: 'angry' },
                    { emoji: '😢', label: 'Disappointed', value: 'disappointed' },
                    { emoji: '🤔', label: 'Thoughtful', value: 'thoughtful' },
                  ].map(emotion => (
                    <button
                      key={emotion.value}
                      onClick={() => setSelectedEmotion(emotion.value)}
                      style={{
                        padding: '16px',
                        background: selectedEmotion === emotion.value
                          ? 'linear-gradient(135deg, #10b981, #3b82f6)'
                          : 'rgba(255,255,255,0.1)',
                        border: selectedEmotion === emotion.value
                          ? '2px solid #10b981'
                          : '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '24px',
                        marginBottom: '8px',
                      }}
                    >
                      {emotion.emoji}
                      <p style={{ fontSize: '11px', margin: '8px 0 0' }}>
                        {emotion.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {(showAllLayers || scrollPhase >= 4) && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '12px',
                marginBottom: '40px',
                opacity: showAllLayers ? 1 : (scrollPhase >= 4 ? 1 : 0),
                transform: showAllLayers ? 'translateY(0)' : (scrollPhase >= 4 ? 'translateY(0)' : 'translateY(20px)'),
                transition: 'all 0.5s ease-out 0.6s'
              }}>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    padding: '16px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Restart Experience
                </button>
              </div>
            )}

            {/* Auto transition hint */}
            {!showAllLayers && phase >= 3 && scrollPhase < 4 && (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: '#888',
                fontSize: '12px',
                animation: 'fadeInOut 2s ease-in-out infinite'
              }}>
                <p>Decrypting the rest of the network...</p>
                <div style={{
                  width: '20px',
                  height: '20px',
                  margin: '10px auto',
                  borderBottom: '2px solid #888',
                  borderRight: '2px solid #888',
                  transform: 'rotate(45deg)',
                  animation: 'bounceDown 1.5s infinite'
                }} />
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes confetti {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes fillProgress {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes bounce {
          0%, 100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(1.5);
          }
        }
        @keyframes glitch {
          0% {
            clip-path: inset(0 0 0 0);
          }
          5% {
            clip-path: inset(10% 0 85% 0);
          }
          10% {
            clip-path: inset(60% 0 30% 0);
          }
          15% {
            clip-path: inset(0 0 0 0);
          }
        }
        @keyframes revealOverlayIn {
          from {
            opacity: 0;
            transform: scale(1.02);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes revealProgress {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes countUp {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes bounceDown {
          0%, 100% {
            transform: rotate(45deg) translateY(0);
            opacity: 0.5;
          }
          50% {
            transform: rotate(45deg) translateY(10px);
            opacity: 1;
          }
        }
        @keyframes fadeInOut {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </>
  )
}

export default TruthReveal
