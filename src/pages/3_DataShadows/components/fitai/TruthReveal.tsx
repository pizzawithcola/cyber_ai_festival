import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useFitAI } from './fitaiContext'
import { useDataShadowsLayout } from '../../DataShadowsLayoutContext'
import { NetworkDataFlowDiagram } from './NetworkDataFlowDiagram'
import type { TermsConsent, SurveyData } from './dataFlowLogic'

const TruthReveal: React.FC = () => {
  const { setScreen, userChoices } = useFitAI()
  const layout = useDataShadowsLayout()
  const [phase, setPhase] = useState(0)
  const [showTwist, setShowTwist] = useState(false)
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null)
  const [scrollPhase, setScrollPhase] = useState(0)
  const [screenShake, setScreenShake] = useState(false)
  const [privacyScore, setPrivacyScore] = useState<number>(0)
  const [showAllLayers, setShowAllLayers] = useState(false)

  // Calculate privacy score
  useEffect(() => {
    const calculateScore = () => {
      let totalScore = 0
      
      const termsReadingScore = typeof userChoices?.termsReadingScore === 'number' ? userChoices.termsReadingScore : 0
      totalScore += termsReadingScore
      
      const privacyOptionsScore = typeof userChoices?.privacyOptionsScore === 'number' ? userChoices.privacyOptionsScore : 0
      totalScore += privacyOptionsScore
      
      const surveyScore = typeof userChoices?.surveyScore === 'number' ? userChoices.surveyScore : 0
      totalScore += surveyScore
      
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
      if (scrollPhase < 5) {
        setScrollPhase(scrollPhase + 1)
      } else if (scrollPhase === 5) {
        setShowAllLayers(true)
      }
    }
  }

  useEffect(() => {
    if (showAllLayers) layout.setTruthRevealFinalStep(true)
    return () => { layout.setTruthRevealFinalStep(false) }
  }, [showAllLayers, layout])

  const rightSlotEl = layout.rightSlotMounted ? layout.rightSlotRef.current : null
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
  }
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
        onWheel={handleScroll}
        className="truth-reveal-container"
        style={{
          width: '100%',
          height: '100%',
          overflow: showAllLayers ? 'auto' : 'hidden',
          position: 'relative',
          transition: screenShake ? 'transform 0.1s' : 'none',
          transform: screenShake ? 'translateX(-5px)' : 'translateX(0)',
        }}
      >
        {/* Phase 0: Completion Celebration */}
        {phase === 0 && (
          <div className="phase phase-0 arcade-card celebration-card">
            {/* Confetti Animation - Keep original, colors may be changed to neon */}
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: '10px',
                  height: '10px',
                  background: ['#00ffff', '#ff00ff', '#ffff00', '#ff4444'][i % 4],
                  borderRadius: '50%',
                  animation: `confetti ${2 + Math.random()}s ease-out forwards`,
                  left: `${Math.random() * 100}%`,
                  top: '-10px',
                  opacity: 0.8,
                  boxShadow: '0 0 8px currentColor',
                }}
              />
            ))}

            <div style={{ position: 'relative', zIndex: 2 }}>
              <div className="arcade-emoji">🎉</div>
              <h1 className="arcade-title">Congratulations! Your Personalized Fitness Plan is Ready</h1>
              <p className="arcade-subtitle">Based on your unique data, AI has created the optimal plan for you</p>
              <div className="arcade-progress-bar">
                <div className="arcade-progress-fill" style={{ width: '100%' }} />
              </div>
              <p className="arcade-status">100% Complete</p>
            </div>
          </div>
        )}

        {/* Phase 1: Loading & Analysis */}
        {phase === 1 && (
          <div className="phase phase-1 arcade-card loading-card">
            <div className="loading-content">
              <div className="arcade-spinner">📱</div>
              <h2 className="arcade-title">Optimizing Your Plan Details...</h2>
              <p className="arcade-subtitle">Our App is analyzing all your data</p>
              <div className="arcade-dots">
                {[0, 1, 2].map(i => (
                  <div key={i} className="arcade-dot" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Phase 2: Pre-Twist */}
        {phase === 2 && !showTwist && (
          <div className="phase phase-2 arcade-card pre-twist-card">
            <div className="arcade-emoji">✨</div>
            <h2 className="arcade-title">Ready?</h2>
            <p className="arcade-subtitle">We have something important to share with you...</p>
          </div>
        )}

        {/* Phase 2+: Twist Point with Glitch */}
        {showTwist && phase === 2 && (
          <div className="phase phase-2 twist-card arcade-card" />
        )}

        {/* Phase 3+: Truth Revelations */}
        {phase >= 3 && (
          <div className="truth-layers-container">
            {/* Level 1: Fitness Plan Truth */}
            {(showAllLayers || scrollPhase >= 0) && (
              <div className={`layer-card layer-1 ${showAllLayers ? 'visible' : ''}`}>
                <h2 className="arcade-title">Layer 1: Understanding Your Fitness Plan</h2>
                <div className="arcade-inset">
                  <p className="arcade-text">
                    While our AI creates personalized fitness plans, it's important to understand how data flows through modern applications like ours.
                  </p>
                  <details className="arcade-details">
                    <summary>Learn More</summary>
                    <p className="arcade-text-small">
                      Like most modern applications, data collection is essential for providing personalized experiences. However, it's crucial to understand where and how your data is used to make informed privacy choices.
                    </p>
                  </details>
                </div>
              </div>
            )}

            {/* Level 2: Business Model Truth */}
            {(showAllLayers || scrollPhase >= 1) && (
              <div className={`layer-card layer-2 ${showAllLayers ? 'visible' : ''}`}>
                <h2 className="arcade-title">Layer 2: Business Model Insights</h2>
                <div className="arcade-inset">
                  <div className="model-row">
                    <p className="arcade-label">What users typically expect:</p>
                    <div className="arcade-value service">Service-Based Revenue 📱</div>
                  </div>
                  <div className="arcade-divider" />
                  <div className="model-row">
                    <p className="arcade-label">Additional revenue sources in many apps:</p>
                    <div className="arcade-value data">Data Analytics 💰</div>
                    <p className="arcade-note">Common industry practice</p>
                  </div>
                </div>
              </div>
            )}

            {/* Level 3: Data Flow Awareness */}
            {(showAllLayers || scrollPhase >= 2) && (
              <div className={`layer-card layer-3 ${showAllLayers ? 'visible' : ''}`}>
                <h2 className="arcade-title">Layer 3: Data Flow Awareness</h2>
                <div className="arcade-inset">
                  <p className="arcade-text">
                    Modern applications often share data with analytics platforms, advertising networks, and third-party services to improve their offerings and sustain their business models.
                  </p>
                  <div className="arcade-highlight">Your Privacy Choices Matter</div>
                </div>
              </div>
            )}

            {/* Level 4: Privacy Score Assessment */}
            {(showAllLayers || scrollPhase >= 3) && (
              <div className={`layer-card layer-4 ${showAllLayers ? 'visible' : ''}`}>
                <h2 className="arcade-title">Layer 4: Your Privacy Score</h2>
                <div className="arcade-inset score-display">
                  <div className={`arcade-score ${privacyScore >= 70 ? 'high' : privacyScore >= 40 ? 'mid' : 'low'}`}>
                    {privacyScore}/100
                  </div>
                  <p className={`arcade-score-label ${privacyScore >= 70 ? 'high' : privacyScore >= 40 ? 'mid' : 'low'}`}>
                    {privacyScore >= 70 ? 'Privacy Champion!' :
                     privacyScore >= 40 ? 'Aware User' : 'Privacy Novice'}
                  </p>
                </div>
              </div>
            )}

            {/* Level 5: Reality Check */}
            {(showAllLayers || scrollPhase >= 4) && (
              <div className={`layer-card layer-5 ${showAllLayers ? 'visible' : ''}`}>
                <h2 className="arcade-title">Layer 5: Reality Check</h2>
                <div className="contrast-grid">
                  <div className="contrast-card assumption">
                    <p className="contrast-title">Common Assumptions...</p>
                    <ul className="contrast-list">
                      <li>My data is only used for the service</li>
                      <li>Data sharing is minimal</li>
                      <li>Privacy settings are clear</li>
                      <li>Opt-outs are easy and effective</li>
                    </ul>
                  </div>
                  <div className="contrast-card reality">
                    <p className="contrast-title">Actual Industry Practices...</p>
                    <ul className="contrast-list">
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
              <div className={`layer-card emotion-card ${showAllLayers ? 'visible' : ''}`}>
                <p className="arcade-title">How do you feel now?</p>
                <div className="emotion-grid">
                  {[
                    { emoji: '😲', label: 'Shocked', value: 'shocked' },
                    { emoji: '😠', label: 'Angry', value: 'angry' },
                    { emoji: '😢', label: 'Disappointed', value: 'disappointed' },
                    { emoji: '🤔', label: 'Thoughtful', value: 'thoughtful' },
                  ].map(emotion => (
                    <button
                      key={emotion.value}
                      onClick={() => setSelectedEmotion(emotion.value)}
                      className={`arcade-emotion-btn ${selectedEmotion === emotion.value ? 'selected' : ''}`}
                    >
                      <span className="emotion-emoji">{emotion.emoji}</span>
                      <span className="emotion-label">{emotion.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {(showAllLayers || scrollPhase >= 4) && (
              <div className="action-buttons">
                <button onClick={() => setScreen('home')} className="arcade-btn">Back to Home</button>
                <button onClick={() => window.location.reload()} className="arcade-btn">Restart Experience</button>
                <button onClick={() => setScreen('terms')} className="arcade-btn primary">Would you like to try again?</button>
              </div>
            )}

            {/* Scroll hint */}
            {!showAllLayers && phase >= 3 && scrollPhase < 4 && (
              <div className="scroll-hint">
                <p>Scroll down to continue...</p>
                <div className="scroll-arrow" />
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

        .truth-reveal-container {
          font-family: 'Space Mono', monospace;
          background-color: #0a0a0a;
          background-image: 
            linear-gradient(rgba(0, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 20px 20px;
          color: #fff;
        }

        .phase {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          text-align: center;
        }

        .arcade-card {
          background: #000000;
          border: 2px dashed #00ffff;
          box-shadow: 0 0 0 2px #000, 0 0 0 4px #00ffff, 0 0 30px #00ffff;
          border-radius: 0;
          padding: 24px;
        }

        .arcade-title {
          font-size: 20px;
          font-weight: 400;
          margin: 0 0 12px;
          color: #ffff00;
          text-shadow: 0 0 5px #ffff00, 0 0 10px #ffff00, 0 0 20px #ffaa00;
          font-family: 'Press Start 2P', monospace;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .arcade-subtitle {
          font-size: 10px;
          color: #ff00ff;
          margin: 0;
          text-shadow: 0 0 3px #ff00ff;
          font-family: 'Press Start 2P', monospace;
        }

        .arcade-emoji {
          font-size: 60px;
          margin-bottom: 20px;
          filter: drop-shadow(0 0 10px #ffff00);
        }

        .arcade-progress-bar {
          width: 100%;
          height: 6px;
          background: #333;
          border: 1px solid #ff00ff;
          margin: 20px 0 12px;
          box-shadow: 0 0 5px #ff00ff;
        }

        .arcade-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #00ffff, #ff00ff);
          box-shadow: 0 0 10px #00ffff;
        }

        .arcade-status {
          font-size: 14px;
          color: #00ffff;
          font-weight: 600;
          text-shadow: 0 0 3px #00ffff;
        }

        .arcade-spinner {
          font-size: 50px;
          animation: arcade-spin 2s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes arcade-spin {
          from { transform: rotate(0deg); filter: drop-shadow(0 0 5px #00ffff); }
          to { transform: rotate(360deg); filter: drop-shadow(0 0 15px #ff00ff); }
        }

        .arcade-dots {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-top: 16px;
        }

        .arcade-dot {
          width: 8px;
          height: 8px;
          background: #00ffff;
          border-radius: 0;
          animation: arcade-bounce 1.2s ease-in-out infinite;
          box-shadow: 0 0 8px #00ffff;
        }

        @keyframes arcade-bounce {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.5); background: #ff00ff; box-shadow: 0 0 12px #ff00ff; }
        }

        .truth-layers-container {
          padding: 20px;
        }

        .layer-card {
          margin-bottom: 40px;
          padding: 20px;
          background: rgba(0,0,0,0.8);
          border: 2px solid;
          border-radius: 0;
          transition: all 0.5s ease-out;
          opacity: 0;
          transform: translateY(20px);
        }

        .layer-card.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .layer-1 { border-color: #10b981; box-shadow: 0 0 15px #10b981; }
        .layer-2 { border-color: #3b82f6; box-shadow: 0 0 15px #3b82f6; }
        .layer-3 { border-color: #a78bfa; box-shadow: 0 0 15px #a78bfa; }
        .layer-4 { border-color: #f59e0b; box-shadow: 0 0 15px #f59e0b; }
        .layer-5 { border-color: #ef4444; box-shadow: 0 0 15px #ef4444; }
        .emotion-card { border-color: #ff00ff; box-shadow: 0 0 15px #ff00ff; }

        .arcade-inset {
          background: rgba(0,0,0,0.5);
          padding: 16px;
          border: 1px solid currentColor;
          box-shadow: inset 0 0 10px currentColor;
        }

        .arcade-text {
          font-size: 14px;
          margin: 0 0 12px;
          line-height: 1.5;
          color: #fff;
          text-shadow: 0 0 2px #000;
        }

        .arcade-text-small {
          font-size: 12px;
          color: #b0b0b0;
        }

        .arcade-details summary {
          cursor: pointer;
          color: #00ffff;
          text-shadow: 0 0 3px #00ffff;
        }

        .model-row {
          margin-bottom: 16px;
        }

        .arcade-label {
          font-size: 12px;
          color: #888;
          margin: 0 0 8px;
        }

        .arcade-value {
          font-size: 28px;
          font-weight: 400;
          text-transform: uppercase;
        }

        .arcade-value.service { color: #3b82f6; text-shadow: 0 0 5px #3b82f6; }
        .arcade-value.data { color: #f59e0b; text-shadow: 0 0 5px #f59e0b; }

        .arcade-divider {
          width: 100%;
          height: 2px;
          background: #ff00ff;
          box-shadow: 0 0 5px #ff00ff;
          margin: 16px 0;
        }

        .arcade-note {
          font-size: 11px;
          color: #fca5a5;
          margin-top: 12px;
        }

        .arcade-highlight {
          font-size: 14px;
          color: #f59e0b;
          text-align: center;
          margin-top: 12px;
          text-shadow: 0 0 3px #f59e0b;
        }

        .score-display {
          text-align: center;
        }

        .arcade-score {
          font-size: 60px;
          font-weight: 700;
          margin: 8px 0;
          animation: arcade-glow 2s infinite;
        }

        .arcade-score.high { color: #10b981; text-shadow: 0 0 10px #10b981; }
        .arcade-score.mid { color: #f59e0b; text-shadow: 0 0 10px #f59e0b; }
        .arcade-score.low { color: #ef4444; text-shadow: 0 0 10px #ef4444; }

        .arcade-score-label {
          font-size: 14px;
          font-weight: 600;
        }
        .arcade-score-label.high { color: #10b981; }
        .arcade-score-label.mid { color: #f59e0b; }
        .arcade-score-label.low { color: #ef4444; }

        .contrast-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .contrast-card {
          padding: 16px;
          border: 2px dashed;
          border-radius: 0;
        }

        .contrast-card.assumption { border-color: #10b981; box-shadow: 0 0 10px #10b981; }
        .contrast-card.reality { border-color: #ef4444; box-shadow: 0 0 10px #ef4444; }

        .contrast-title {
          font-size: 11px;
          font-weight: 700;
          margin: 0 0 8px;
          text-transform: uppercase;
        }
        .assumption .contrast-title { color: #10b981; }
        .reality .contrast-title { color: #ef4444; }

        .contrast-list {
          font-size: 11px;
          margin: 0;
          padding-left: 16px;
          color: #b0b0b0;
        }
        .contrast-list li { margin-bottom: 4px; }

        .emotion-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .arcade-emotion-btn {
          padding: 4px;
          background: #000;
          border: 2px solid #ff00ff;
          border-radius: 0;
          color: #ff00ff;
          font-family: 'Press Start 2P', monospace;
          font-size: 28px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 0 10px #ff00ff;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .arcade-emotion-btn.selected {
          background: #ff00ff;
          color: #000;
          box-shadow: 0 0 20px #ff00ff;
        }

        .emotion-label {
          font-size: 11px;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          margin-bottom: 40px;
        }

        .arcade-btn {
          padding: 8px;
          background: #000;
          border: 2px solid #00ffff;
          border-radius: 0;
          color: #00ffff;
          font-family: 'Press Start 2P', monospace;
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 0 10px #00ffff;
          transition: all 0.2s;
          text-transform: uppercase;
        }

        .arcade-btn:hover {
          background: #00ffff;
          color: #000;
          box-shadow: 0 0 20px #00ffff;
        }

        .arcade-btn.primary {
          border-color: #ffaa00;
          color: #ffaa00;
          box-shadow: 0 0 10px #ffaa00;
        }

        .arcade-btn.primary:hover {
          background: #ffaa00;
          color: #000;
          box-shadow: 0 0 20px #ffaa00;
        }

        .scroll-hint {
          text-align: center;
          padding: 20px;
          color: #ff00ff;
          font-size: 12px;
          animation: arcade-fade 2s ease-in-out infinite;
        }

        .scroll-arrow {
          width: 20px;
          height: 20px;
          margin: 10px auto;
          border-bottom: 2px solid #ff00ff;
          border-right: 2px solid #ff00ff;
          transform: rotate(45deg);
          animation: arcade-bounce-down 1.5s infinite;
          box-shadow: 0 0 5px #ff00ff;
        }

        @keyframes arcade-bounce-down {
          0%, 100% { transform: rotate(45deg) translateY(0); opacity: 0.5; }
          50% { transform: rotate(45deg) translateY(10px); opacity: 1; }
        }

        @keyframes arcade-fade {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        @keyframes confetti {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        .twist-card {
          animation: arcade-glitch 0.3s ease-out;
        }

        @keyframes arcade-glitch {
          0% { clip-path: inset(0 0 0 0); filter: drop-shadow(0 0 5px #ff00ff); }
          5% { clip-path: inset(10% 0 85% 0); filter: drop-shadow(0 0 15px #00ffff); }
          10% { clip-path: inset(60% 0 30% 0); filter: drop-shadow(0 0 15px #ffff00); }
          15% { clip-path: inset(0 0 0 0); filter: drop-shadow(0 0 5px #ff00ff); }
        }
      `}</style>
    </>
  )
}

export default TruthReveal