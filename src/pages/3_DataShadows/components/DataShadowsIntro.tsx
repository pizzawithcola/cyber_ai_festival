import React, { useCallback, useEffect, useRef, useState } from 'react'

interface DataShadowsIntroProps {
  onComplete: () => void
}

const INTRO_LINES = [
  {
    label: 'What People Do',
    line: '81% of people accept terms without reading them.',
  },
  {
    label: 'What Can Happen',
    line: 'Your health, location, and identity data can be shared, leaked, profiled, and reused.',
  },
  {
    label: 'Real Consequences',
    line: 'BetterHelp paid $7.8M, and 23andMe said attackers reached data tied to about 7M profiles.',
  },
  {
    label: 'What This Round Asks',
    line: 'Slow down, notice the defaults, and see what convenience is quietly asking you to give away.',
  },
] as const

const INTRO_FADE_MS = 6500
const INTRO_STEP_MS = 7500

const DataShadowsIntro: React.FC<DataShadowsIntroProps> = ({ onComplete }) => {
  const [visible, setVisible] = useState(false)
  const [currentIntroIndex, setCurrentIntroIndex] = useState(0)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const completedRef = useRef(false)

  const completeNow = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    setVisible(false)
    onComplete()
  }, [onComplete])

  const advanceIntro = useCallback(() => {
    setIsFadingOut(false)

    if (currentIntroIndex < INTRO_LINES.length - 1) {
      setCurrentIntroIndex((prev) => prev + 1)
      return
    }

    completeNow()
  }, [completeNow, currentIntroIndex])

  useEffect(() => {
    const enterTimer = window.setTimeout(() => setVisible(true), 60)

    return () => {
      window.clearTimeout(enterTimer)
    }
  }, [])

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => {
      setIsFadingOut(true)
    }, INTRO_FADE_MS)

    const nextTimer = window.setTimeout(() => {
      advanceIntro()
    }, INTRO_STEP_MS)

    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(nextTimer)
    }
  }, [advanceIntro, currentIntroIndex])

  return (
    <div
      className={`data-shadows-intro-overlay ${visible ? 'data-shadows-intro-overlay-visible' : ''}`}
      onClick={advanceIntro}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          advanceIntro()
        }
      }}
      aria-label="Advance the Data Shadows intro"
    >
      <div className="data-shadows-intro-shell">
        <div className="data-shadows-intro-frame" />

        <div className="data-shadows-intro-content">
          <div className="data-shadows-intro-kicker">Data Shadows</div>

          <div className="data-shadows-intro-stage">
            {INTRO_LINES.map((intro, index) => {
              const isActive = index === currentIntroIndex

              return (
                <div
                  key={intro.label}
                  className={[
                    'data-shadows-intro-card',
                    isActive ? 'data-shadows-intro-card-active' : '',
                    isActive && isFadingOut ? 'data-shadows-intro-card-fading' : '',
                  ].filter(Boolean).join(' ')}
                >
                  <div className="data-shadows-intro-label">{intro.label}</div>
                  <p className="data-shadows-intro-line">{intro.line}</p>
                </div>
              )
            })}
          </div>

          <div className="data-shadows-intro-footer">
            {currentIntroIndex < INTRO_LINES.length - 1
              ? `Tap anywhere to continue · ${currentIntroIndex + 1}/${INTRO_LINES.length}`
              : 'Tap anywhere to begin the simulation'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataShadowsIntro
