import React, { useState, useEffect } from 'react'
import { useFitAI } from './fitaiContext'

const TruthReveal: React.FC = () => {
  const { setScreen, userChoices } = useFitAI()
  const [phase, setPhase] = useState(0)
  const [showTwist, setShowTwist] = useState(false)
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null)
  const [scrollPhase, setScrollPhase] = useState(0)
  const [screenShake, setScreenShake] = useState(false)
  const [privacyScore, setPrivacyScore] = useState<number>(0)
  const [showAllLayers, setShowAllLayers] = useState(false)

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
      { delay: 2500, action: () => setPhase(2) },
      { delay: 5000, action: () => {
        setShowTwist(true)
        setScreenShake(true)
        setTimeout(() => setScreenShake(false), 500)
      }},
      { delay: 7000, action: () => setPhase(3) },
    ]

    phases.forEach(({ delay, action }) => {
      const timer = setTimeout(action, delay)
      return () => clearTimeout(timer)
    })
  }, [])

  const handleScroll = (e: React.WheelEvent) => {
    if (phase !== 3 || showAllLayers) return
    
    if (e.deltaY > 0) {
      // 向下滚动，增加scrollPhase，最多到5
      if (scrollPhase < 5) {
        setScrollPhase(scrollPhase + 1)
      } else if (scrollPhase === 5) {
        // 当到达第5层时，设置showAllLayers为true，停止滚动动画
        setShowAllLayers(true)
      }
    }
  }

  return (
    <>
      <div
        onWheel={handleScroll}
        style={{
          width: '100%',
          height: '100%',
          background: '#000000',
          overflow: showAllLayers ? 'auto' : 'hidden',
          position: 'relative',
          color: '#ffffff',
          transition: screenShake ? 'transform 0.1s' : 'none',
          transform: screenShake ? 'translateX(-5px)' : 'translateX(0)',
        }}
      >
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
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: '10px',
                  height: '10px',
                  background: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'][i % 4],
                  borderRadius: '50%',
                  animation: `confetti ${2 + Math.random()}s ease-out forwards`,
                  left: `${Math.random() * 100}%`,
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
              }}>🤖</div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px' }}>
                Optimizing Your Plan Details...
              </h2>
              <p style={{ fontSize: '12px', color: '#888', margin: '0 0 16px' }}>
                Our AI is analyzing all your data
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
        {phase >= 3 && (
          <div style={{ 
            padding: '20px',
            transition: 'all 0.3s ease-out'
          }}>
            {/* Level 1: Fitness Plan Truth - 修改描述 */}
            {(showAllLayers || scrollPhase >= 0) && (
              <div style={{
                marginBottom: '40px',
                padding: '20px',
                background: 'rgba(16,185,129,0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(16,185,129,0.2)',
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
                background: 'rgba(59,130,246,0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(59,130,246,0.2)',
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
                background: 'rgba(139,92,246,0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(139,92,246,0.2)',
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
                background: 'rgba(139,92,246,0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(139,92,246,0.2)',
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
                </div>
              </div>
            )}

            {/* Level 5: Contrast Matrix */}
            {(showAllLayers || scrollPhase >= 4) && (
              <div style={{
                marginBottom: '40px',
                padding: '20px',
                background: 'rgba(168,85,247,0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(168,85,247,0.2)',
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
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '12px',
                marginBottom: '40px',
                opacity: showAllLayers ? 1 : (scrollPhase >= 4 ? 1 : 0),
                transform: showAllLayers ? 'translateY(0)' : (scrollPhase >= 4 ? 'translateY(0)' : 'translateY(20px)'),
                transition: 'all 0.5s ease-out 0.6s'
              }}>
                <button
                  onClick={() => setScreen('home')}
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
                  Back to Home
                </button>
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
                {/* 新增：跳转到TermsAndConditions的按钮 */}
                <button
                  onClick={() => setScreen('terms')}
                  style={{
                    padding: '16px',
                    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Would you like to try again?
                </button>
              </div>
            )}

            {/* 滚动提示 */}
            {!showAllLayers && phase >= 3 && scrollPhase < 4 && (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: '#888',
                fontSize: '12px',
                animation: 'fadeInOut 2s ease-in-out infinite'
              }}>
                <p>Scroll down to continue...</p>
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