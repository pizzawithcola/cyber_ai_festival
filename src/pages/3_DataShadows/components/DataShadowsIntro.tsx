import React, { useCallback, useEffect, useRef, useState } from 'react'

interface DataShadowsIntroProps {
  onComplete: () => void
}

const AUTO_CLOSE_MS = 6800

const DataShadowsIntro: React.FC<DataShadowsIntroProps> = ({ onComplete }) => {
  const [visible, setVisible] = useState(false)
  const [showAllBlocks, setShowAllBlocks] = useState(false)
  const completedRef = useRef(false)
  const revealTimerRef = useRef<number | null>(null)
  const exitTimerRef = useRef<number | null>(null)
  const completeTimerRef = useRef<number | null>(null)

  const completeNow = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    setVisible(false)
    onComplete()
  }, [onComplete])

  const revealAllText = useCallback(() => {
    setShowAllBlocks(true)
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current)
      revealTimerRef.current = null
    }
  }, [])

  const handleAdvanceIntro = useCallback(() => {
    if (!showAllBlocks) {
      revealAllText()
      return
    }

    completeNow()
  }, [completeNow, revealAllText, showAllBlocks])

  useEffect(() => {
    const enterTimer = window.setTimeout(() => setVisible(true), 60)
    revealTimerRef.current = window.setTimeout(() => setShowAllBlocks(true), 2100)
    exitTimerRef.current = window.setTimeout(() => setVisible(false), AUTO_CLOSE_MS - 420)
    completeTimerRef.current = window.setTimeout(() => completeNow(), AUTO_CLOSE_MS)

    return () => {
      window.clearTimeout(enterTimer)
      if (revealTimerRef.current) window.clearTimeout(revealTimerRef.current)
      if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current)
      if (completeTimerRef.current) window.clearTimeout(completeTimerRef.current)
    }
  }, [completeNow])

  return (
    <div
      className={`data-shadows-intro-overlay ${visible ? 'data-shadows-intro-overlay-visible' : ''}`}
      onClick={handleAdvanceIntro}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') handleAdvanceIntro()
      }}
      aria-label="Reveal intro text, then continue to the Data Shadows experience"
    >
      <div className="data-shadows-intro-shell">
        <div className="data-shadows-intro-frame" />

        <div className="data-shadows-intro-content">
          <div className="data-shadows-intro-kicker">Data Shadows</div>

          <div className={`data-shadows-intro-block data-shadows-intro-block-delay-1 ${showAllBlocks ? 'data-shadows-intro-block-force-visible' : ''}`}>
            <div className="data-shadows-intro-label">What People Do</div>
            <p className="data-shadows-intro-line">
              <span className="data-shadows-intro-highlight">81%</span> of people accept terms without reading them.
            </p>
          </div>

          <div className={`data-shadows-intro-block data-shadows-intro-block-delay-2 ${showAllBlocks ? 'data-shadows-intro-block-force-visible' : ''}`}>
            <div className="data-shadows-intro-label">What Can Happen</div>
            <p className="data-shadows-intro-line">
              Your health, location, and identity data can be shared, leaked, profiled, and reused.
            </p>
          </div>

          <div className={`data-shadows-intro-block data-shadows-intro-block-delay-3 ${showAllBlocks ? 'data-shadows-intro-block-force-visible' : ''}`}>
            <div className="data-shadows-intro-label">Real Consequences</div>
            <p className="data-shadows-intro-line">
              BetterHelp paid <span className="data-shadows-intro-highlight">$7.8M</span>; 23andMe said attackers reached data tied to about <span className="data-shadows-intro-highlight">7M</span> profiles.
            </p>
          </div>

          <div className="data-shadows-intro-footer">
            Briefing complete. Loading app simulation...
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataShadowsIntro
