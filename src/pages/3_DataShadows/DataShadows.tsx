import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataShadowsIntro from './components/DataShadowsIntro'
import DataShadowsStartGate from './components/DataShadowsStartGate'
import './DataShadows.css'

/**
 * DataShadows — 叙事入口页（/datashadows）
 * 只承载 Animated Intro + Mission Brief，完成后跳转到手机游戏路由。
 */
function DataShadowsContent() {
  const navigate = useNavigate()
  const [showIntroOverlay, setShowIntroOverlay] = useState(true)
  const [showStartGate, setShowStartGate] = useState(false)

  const completeIntro = () => {
    setShowIntroOverlay(false)
    setShowStartGate(true)
  }

  const startExperience = () => {
    navigate('/datashadows/game')
  }

  return (
    <>
      {showIntroOverlay ? <DataShadowsIntro onComplete={completeIntro} /> : null}
      {showStartGate ? <DataShadowsStartGate onStart={startExperience} /> : null}
    </>
  )
}

const DataShadows: React.FC = () => {
  return <DataShadowsContent />
}

export default DataShadows
