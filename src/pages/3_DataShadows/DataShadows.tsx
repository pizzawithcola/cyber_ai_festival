import React, { useEffect, useState } from 'react'
import { DataShadowsLayoutProvider, useDataShadowsLayout } from './DataShadowsLayoutContext'
import RealApplePhone from './components/RealApplePhone'
import DataShadowsIntro from './components/DataShadowsIntro'
import DataShadowsSidebar from './components/DataShadowsSidebar'
import './DataShadows.css'

const REVEAL_CANVAS_WIDTH = 1396
const REVEAL_CANVAS_HEIGHT = 892
const PHONE_BASE_WIDTH = 390
const PHONE_BASE_HEIGHT = 844
const PHONE_ASPECT_RATIO = PHONE_BASE_WIDTH / PHONE_BASE_HEIGHT

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
  const [viewportSize, setViewportSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))

  const isPortraitViewport = viewportSize.height > viewportSize.width
  const isPortraitReveal = isTruthRevealFinalStep && isPortraitViewport

  const layoutClassName = isTruthRevealFinalStep
    ? 'data-shadows-reveal-layout'
    : showSidebarNotice
      ? 'data-shadows-sidebar-layout'
      : 'data-shadows-phone-only'

  const responsiveLayoutStyle: React.CSSProperties | undefined = (!isTruthRevealFinalStep || isPortraitReveal)
    ? (() => {
        const horizontalPadding = 48
        const verticalPadding = isTruthRevealFinalStep ? 96 : 48
        const availableWidth = Math.max(280, viewportSize.width - horizontalPadding)
        const availableHeight = isTruthRevealFinalStep
          ? Math.max(520, viewportSize.height - verticalPadding)
          : showSidebarNotice
            ? Math.max(360, viewportSize.height - verticalPadding)
            : Math.max(360, viewportSize.height - verticalPadding)
        const maxPhoneWidth = isTruthRevealFinalStep
          ? 430
          : isPortraitViewport
            ? showSidebarNotice ? 468 : 507
            : PHONE_BASE_WIDTH
        const minPhoneWidth = isTruthRevealFinalStep ? 280 : 260
        const computedPhoneWidth = Math.max(
          minPhoneWidth,
          Math.min(maxPhoneWidth, availableWidth, availableHeight * PHONE_ASPECT_RATIO)
        )
        const computedPhoneHeight = computedPhoneWidth / PHONE_ASPECT_RATIO

        return {
          ['--data-shadows-phone-width' as const]: `${computedPhoneWidth}px`,
          ['--data-shadows-phone-height' as const]: `${computedPhoneHeight}px`,
        } as React.CSSProperties
      })()
    : undefined

  useEffect(() => {
    if (!isTruthRevealFinalStep || isPortraitReveal) return

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
  }, [isPortraitReveal, isTruthRevealFinalStep])

  const containerClassName = [
    'data-shadows-container',
    layoutClassName,
    isPortraitViewport && !isTruthRevealFinalStep ? 'data-shadows-portrait-stage' : '',
    isPortraitReveal ? 'data-shadows-portrait-reveal' : '',
  ].filter(Boolean).join(' ')

  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateViewportSize()
    window.addEventListener('resize', updateViewportSize)
    return () => window.removeEventListener('resize', updateViewportSize)
  }, [])

  const layoutContainerStyle: React.CSSProperties | undefined = isTruthRevealFinalStep
    ? isPortraitReveal
      ? responsiveLayoutStyle
      : {
          width: `${REVEAL_CANVAS_WIDTH}px`,
          height: `${REVEAL_CANVAS_HEIGHT}px`,
          minHeight: `${REVEAL_CANVAS_HEIGHT}px`,
          maxWidth: 'none',
        }
    : responsiveLayoutStyle

  const layoutContent = (
    <div
      className={containerClassName}
      style={layoutContainerStyle}
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
      <div className={isTruthRevealFinalStep && !isPortraitReveal ? 'data-shadows-reveal-shell' : 'data-shadows-stage-shell'}>
        <div
          className={isTruthRevealFinalStep && !isPortraitReveal ? 'data-shadows-reveal-canvas' : 'data-shadows-stage-canvas'}
          style={isTruthRevealFinalStep && !isPortraitReveal ? { transform: `scale(${revealScale})` } : undefined}
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
