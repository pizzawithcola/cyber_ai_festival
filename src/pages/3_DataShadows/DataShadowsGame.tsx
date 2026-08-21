import React, { useEffect, useState } from 'react'
import RealApplePhone from './components/RealApplePhone'
import './DataShadows.css'

const PHONE_BASE_WIDTH = 390
const PHONE_BASE_HEIGHT = 844
const PHONE_ASPECT_RATIO = PHONE_BASE_WIDTH / PHONE_BASE_HEIGHT

/**
 * DataShadowsGame — 手机游戏页（/datashadows/game）
 * iPhone 模拟器居中展示，承载 FitAI app 的完整注册流程。
 * 流程结束后由 RegistrationSurvey 写入 sessionStorage 并跳转 /datashadows/reveal。
 */
function DataShadowsGameContent() {
  const [viewportSize, setViewportSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))

  const isPortraitViewport = viewportSize.height > viewportSize.width

  const responsiveLayoutStyle: React.CSSProperties = (() => {
    const stagePaddingX = Math.max(16, Math.round(viewportSize.width * (isPortraitViewport ? 0.03 : 0.022)))
    const stagePaddingY = Math.max(16, Math.round(viewportSize.height * (isPortraitViewport ? 0.024 : 0.03)))
    const availableWidth = Math.max(1, viewportSize.width - stagePaddingX * 2)
    const availableHeight = Math.max(1, viewportSize.height - stagePaddingY * 2)
    const computedPhoneWidth = Math.min(availableWidth, availableHeight * PHONE_ASPECT_RATIO)
    const computedPhoneHeight = computedPhoneWidth / PHONE_ASPECT_RATIO
    const computedPhoneScale = computedPhoneWidth / PHONE_BASE_WIDTH

    return {
      ['--data-shadows-phone-width' as const]: `${computedPhoneWidth}px`,
      ['--data-shadows-phone-height' as const]: `${computedPhoneHeight}px`,
      ['--data-shadows-phone-scale' as const]: `${computedPhoneScale}`,
      ['--data-shadows-stage-padding-x' as const]: `${stagePaddingX}px`,
      ['--data-shadows-stage-padding-y' as const]: `${stagePaddingY}px`,
    } as React.CSSProperties
  })()

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

  return (
    <div className="data-shadows-diagram-shell">
      <div className="data-shadows-diagram-canvas">
        <div
          className={[
            'data-shadows-container',
            'data-shadows-phone-only',
            isPortraitViewport ? 'data-shadows-portrait-stage' : '',
          ].filter(Boolean).join(' ')}
          style={responsiveLayoutStyle}
        >
          <div className="phone-panel">
            <RealApplePhone />
          </div>
        </div>
      </div>
    </div>
  )
}

const DataShadowsGame: React.FC = () => {
  return <DataShadowsGameContent />
}

export default DataShadowsGame
