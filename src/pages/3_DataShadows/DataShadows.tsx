import React, { useEffect, useState } from 'react'
import { DataShadowsLayoutProvider, useDataShadowsLayout } from './DataShadowsLayoutContext'
import RealApplePhone from './components/RealApplePhone'
import DataShadowsIntro from './components/DataShadowsIntro'
import DataShadowsSidebar from './components/DataShadowsSidebar'
import './DataShadows.css'

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
  const [viewportSize, setViewportSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))

  const isPortraitViewport = viewportSize.height > viewportSize.width
  const hasPortraitSidebarLayout = isPortraitViewport && showSidebarNotice
  const isFinalPortraitViewport = isTruthRevealFinalStep && isPortraitViewport

  const layoutClassName = isTruthRevealFinalStep
    ? 'data-shadows-diagram-only-layout'
    : showSidebarNotice
      ? 'data-shadows-sidebar-layout'
      : 'data-shadows-phone-only'

  const responsiveLayoutStyle: React.CSSProperties | undefined = !isTruthRevealFinalStep
    ? (() => {
        const stagePaddingX = Math.max(
          16,
          Math.round(viewportSize.width * (isPortraitViewport ? 0.03 : 0.022))
        )
        const stagePaddingY = Math.max(
          16,
          Math.round(viewportSize.height * (isPortraitViewport ? 0.024 : 0.03))
        )
        const stageGap = Math.max(
          16,
          Math.round(Math.min(viewportSize.width, viewportSize.height) * 0.02)
        )
        const availableWidth = Math.max(1, viewportSize.width - stagePaddingX * 2)
        const availableHeight = Math.max(1, viewportSize.height - stagePaddingY * 2)
        const widthReserve = showSidebarNotice && !isPortraitViewport
          ? availableWidth * 0.34
          : 0
        const phoneAvailableWidth = Math.max(
          1,
          availableWidth - widthReserve - (showSidebarNotice && !isPortraitViewport ? stageGap : 0)
        )
        const stackedContentHeight = Math.max(1, availableHeight - stageGap)
        const targetPortraitPhoneHeight = stackedContentHeight * 0.6
        const computedPhoneWidth = hasPortraitSidebarLayout
          ? Math.min(availableWidth, targetPortraitPhoneHeight * PHONE_ASPECT_RATIO)
          : Math.min(phoneAvailableWidth, availableHeight * PHONE_ASPECT_RATIO)
        const computedPhoneHeight = computedPhoneWidth / PHONE_ASPECT_RATIO
        const computedPhoneScale = computedPhoneWidth / PHONE_BASE_WIDTH
        const computedPortraitSidebarHeight = hasPortraitSidebarLayout
          ? Math.max(1, stackedContentHeight - computedPhoneHeight)
          : 0

        return {
          ['--data-shadows-phone-width' as const]: `${computedPhoneWidth}px`,
          ['--data-shadows-phone-height' as const]: `${computedPhoneHeight}px`,
          ['--data-shadows-phone-scale' as const]: `${computedPhoneScale}`,
          ['--data-shadows-stage-padding-x' as const]: `${stagePaddingX}px`,
          ['--data-shadows-stage-padding-y' as const]: `${stagePaddingY}px`,
          ['--data-shadows-stage-gap' as const]: `${stageGap}px`,
          ['--data-shadows-portrait-sidebar-height' as const]: `${computedPortraitSidebarHeight}px`,
        } as React.CSSProperties
      })()
    : (() => {
        const shellPadding = Math.max(8, Math.min(20, Math.round(Math.min(viewportSize.width, viewportSize.height) * 0.02)))
        const contentWidth = Math.max(1, viewportSize.width - shellPadding * 2)
        const contentHeight = Math.max(1, viewportSize.height - shellPadding * 2)
        const isPortraitLike = viewportSize.height >= viewportSize.width

        return {
          ['--data-shadows-final-shell-padding' as const]: `${shellPadding}px`,
          ['--data-shadows-final-content-width' as const]: `${contentWidth}px`,
          ['--data-shadows-final-content-height' as const]: `${contentHeight}px`,
          ['--data-shadows-final-layout-direction' as const]: isPortraitLike ? 'column' : 'row',
        } as React.CSSProperties
      })()

  const containerClassName = [
    'data-shadows-container',
    layoutClassName,
    isPortraitViewport && !isTruthRevealFinalStep ? 'data-shadows-portrait-stage' : '',
    isFinalPortraitViewport ? 'data-shadows-diagram-only-portrait' : '',
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

  const layoutContent = (
    <div
      className={containerClassName}
      style={responsiveLayoutStyle}
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
      <div className={isTruthRevealFinalStep ? 'data-shadows-diagram-shell' : 'data-shadows-stage-shell'}>
        <div
          className={isTruthRevealFinalStep ? 'data-shadows-diagram-canvas' : 'data-shadows-stage-canvas'}
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
