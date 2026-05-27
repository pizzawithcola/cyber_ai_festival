import React, { useEffect, useState } from 'react'
import { DataShadowsLayoutProvider, useDataShadowsLayout } from './DataShadowsLayoutContext'
import RealApplePhone from './components/RealApplePhone'
import DataShadowsIntro from './components/DataShadowsIntro'
import DataShadowsSidebar from './components/DataShadowsSidebar'
import './DataShadows.css'

const REVEAL_CANVAS_WIDTH = 1396
const REVEAL_CANVAS_HEIGHT = 892

function DataShadowsContent() {
  const {
    isTruthRevealFinalStep,
    setRightSlotEl,
    showIntroOverlay,
    completeIntro,
    showSidebarNotice,
    isPhoneRecentering,
  } = useDataShadowsLayout()
  const [revealScale, setRevealScale] = useState(1)

  const layoutClassName = isTruthRevealFinalStep
    ? 'data-shadows-reveal-layout'
    : showSidebarNotice
      ? 'data-shadows-sidebar-layout'
      : 'data-shadows-phone-only'

  useEffect(() => {
    if (!isTruthRevealFinalStep) return

    const updateRevealScale = () => {
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const widthScale = (viewportWidth - 24) / REVEAL_CANVAS_WIDTH
      const heightScale = (viewportHeight - 24) / REVEAL_CANVAS_HEIGHT
      setRevealScale(Math.min(1, widthScale, heightScale))
    }

    updateRevealScale()
    window.addEventListener('resize', updateRevealScale)
    return () => window.removeEventListener('resize', updateRevealScale)
  }, [isTruthRevealFinalStep])

  const layoutContent = (
    <div
      className={`data-shadows-container ${layoutClassName}`}
      style={
        isTruthRevealFinalStep
          ? {
              width: `${REVEAL_CANVAS_WIDTH}px`,
              height: `${REVEAL_CANVAS_HEIGHT}px`,
              minHeight: `${REVEAL_CANVAS_HEIGHT}px`,
              maxWidth: 'none',
            }
          : undefined
      }
    >
      <div className={`phone-panel ${isPhoneRecentering ? 'phone-panel-recentering' : ''} ${isTruthRevealFinalStep ? 'phone-panel-truth-reveal' : ''}`}>
        <RealApplePhone />
      </div>
      <div
        ref={setRightSlotEl}
        className={[
          'data-shadows-side-panel',
          isTruthRevealFinalStep ? 'truth-reveal-right-visible' : '',
          showSidebarNotice ? 'data-shadows-side-panel-visible' : '',
        ].filter(Boolean).join(' ')}
        aria-hidden={!(isTruthRevealFinalStep || showSidebarNotice)}
      >
        {!isTruthRevealFinalStep && showSidebarNotice ? <DataShadowsSidebar /> : null}
      </div>
    </div>
  )

  return (
    <>
      <div className={isTruthRevealFinalStep ? 'data-shadows-reveal-shell' : 'data-shadows-stage-shell'}>
        <div
          className={isTruthRevealFinalStep ? 'data-shadows-reveal-canvas' : 'data-shadows-stage-canvas'}
          style={isTruthRevealFinalStep ? { transform: `scale(${revealScale})` } : undefined}
        >
          {layoutContent}
        </div>
      </div>
      {showIntroOverlay ? <DataShadowsIntro onComplete={completeIntro} /> : null}
    </>
  )
}

const DataShadows: React.FC = () => {
  return (
    <DataShadowsLayoutProvider>
      <DataShadowsContent />
    </DataShadowsLayoutProvider>
  )
}

export default DataShadows
