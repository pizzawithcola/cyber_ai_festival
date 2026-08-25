import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NetworkDataFlowDiagram } from './components/fitai/NetworkDataFlowDiagram'
import type { TermsConsent, SurveyData } from './components/fitai/dataFlowLogic'
import { getStoredUser } from '../../utils/userStorage'
import { apiFetch } from '../../services/api'
import {
  loadDataShadowsChoices,
  type DataShadowsChoices,
} from './dataShadowsSession'
import './DataShadows.css'

/**
 * DataShadowsReveal — 全屏揭示页（/datashadows/reveal）
 * 从 sessionStorage 读取游戏数据 → 计算隐私分数 → 展示数据流图 → 提交后端分数。
 */
function RevealContent() {
  const navigate = useNavigate()
  const choicesRef = useRef<DataShadowsChoices | null>(null)
  if (choicesRef.current === null) {
    choicesRef.current = loadDataShadowsChoices()
  }
  const choices = choicesRef.current

  const [introStep, setIntroStep] = useState(0)
  const [animatedScore, setAnimatedScore] = useState(0)
  const hasSyncedScoreRef = useRef(false)
  const storedUser = getStoredUser()
  const userId = storedUser?.id

  // Guard: 无数据直接回入口页
  useEffect(() => {
    if (!choices) {
      navigate('/datashadows', { replace: true })
    }
  }, [choices, navigate])

  // 计算隐私分数（与 TruthReveal 相同的公式）
  const privacyScore = useMemo(() => {
    if (!choices) return 0
    const termsReadingScore = typeof choices.termsReadingScore === 'number' ? choices.termsReadingScore : 0
    const privacyOptionsScore = typeof choices.privacyOptionsScore === 'number' ? choices.privacyOptionsScore : 0
    const detailExpansionScore = typeof choices.detailExpansionScore === 'number' ? choices.detailExpansionScore : 0
    const surveyScore = typeof choices.surveyScore === 'number' ? choices.surveyScore : 0
    return Math.max(0, Math.min(100, termsReadingScore + privacyOptionsScore + detailExpansionScore + surveyScore))
  }, [choices])

  // 分数滚动动画（0 → 目标值，约 1.1s）
  useEffect(() => {
    if (introStep < 1) {
      setAnimatedScore(0)
      return
    }

    const target = privacyScore
    const duration = 1100
    const startTime = performance.now()
    let frameId = 0

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedScore(Math.round(target * eased))
      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick)
      }
    }

    frameId = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frameId)
  }, [introStep, privacyScore])

  // 构造数据流图参数
  const termsConsent: TermsConsent = useMemo(
    () => ({
      privacySettings: (choices?.privacySettings as TermsConsent['privacySettings']) ?? {
        analytics: false,
        marketing: false,
        thirdParty: false,
        dataRetention: false,
        aiTraining: false,
      },
      termsReadingProgress: typeof choices?.termsReadingProgress === 'number' ? choices.termsReadingProgress : 0,
      uncheckedOptions: choices?.uncheckedOptions as string[] | undefined,
    }),
    [choices]
  )

  const surveyData: SurveyData = useMemo(
    () => ({
      height: typeof choices?.surveyHeight === 'number' ? choices.surveyHeight : undefined,
      weight: typeof choices?.surveyWeight === 'number' ? choices.surveyWeight : undefined,
      occupation: typeof choices?.surveyOccupation === 'string' ? choices.surveyOccupation : undefined,
      homeAddress: typeof choices?.surveyHomeAddress === 'string' ? choices.surveyHomeAddress : undefined,
      workoutMinutes: typeof choices?.surveyWorkoutMinutes === 'number' ? choices.surveyWorkoutMinutes : undefined,
    }),
    [choices]
  )

  // 入场节奏：反转句 → 分数揭晓 → 数据流图
  useEffect(() => {
    if (!choices) return
    const timers = [
      window.setTimeout(() => setIntroStep(1), 900),
      window.setTimeout(() => setIntroStep(2), 2300),
    ]
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [choices])

  // 提交后端分数（幂等）
  useEffect(() => {
    if (introStep < 1 || !userId || hasSyncedScoreRef.current) return

    hasSyncedScoreRef.current = true

    const syncScore = async () => {
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
            console.error('[DataShadowsReveal] Failed to update score:', updateResponse.status)
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
            console.error('[DataShadowsReveal] Failed to create score:', createResponse.status)
          }
          return
        }

        console.error('[DataShadowsReveal] Failed to fetch existing score:', existingScoreResponse.status)
      } catch (error) {
        console.error('[DataShadowsReveal] Failed to sync score:', error)
      }
    }

    void syncScore()
  }, [introStep, privacyScore, userId])

  if (!choices) return null

  const scoreColor = privacyScore >= 50 ? '#4ade80' : '#fbbf24'

  return (
    <div
      className="data-shadows-reveal-page data-shadows-diagram-only-layout"
    >
      <style>{`
        @keyframes dsRevealFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dsRevealGlitch {
          0%, 100% { transform: translateX(0); filter: none; }
          20% { transform: translateX(-4px); filter: hue-rotate(-12deg); }
          40% { transform: translateX(3px); filter: hue-rotate(9deg); }
          60% { transform: translateX(-2px); filter: hue-rotate(-6deg); }
          80% { transform: translateX(2px); filter: hue-rotate(4deg); }
        }
      `}</style>

      {/* 顶部：标题 + 分数（单行左右排布） */}
      <div
        className="data-shadows-reveal-hero"
        style={{
          position: 'relative',
          zIndex: 2,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '16px 20px 10px',
          animation: introStep >= 1 ? 'dsRevealGlitch 0.5s ease-out 1' : 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 4,
            minWidth: 0,
            animation: 'dsRevealFadeUp 0.6s ease-out both',
          }}
        >
          <div
            style={{
              color: '#f9a8d4',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
            }}
          >
            Data Shadows · Truth Reveal
          </div>
          <div
            style={{
              color: '#f8fafc',
              fontSize: 'clamp(18px, 2.4vh, 28px)',
              fontWeight: 900,
              letterSpacing: '0.01em',
              lineHeight: 1.2,
            }}
          >
            Your data went further than you think.
          </div>
        </div>

        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 16px',
            borderRadius: 10,
            border: '1px solid rgba(244, 114, 182, 0.42)',
            background: 'rgba(244, 114, 182, 0.1)',
            animation: 'dsRevealFadeUp 0.55s ease-out both',
          }}
        >
          <span style={{ color: 'rgba(226, 232, 240, 0.8)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Privacy Score
          </span>
          <span
            style={{
              color: scoreColor,
              fontSize: '24px',
              fontWeight: 900,
              textShadow: `0 0 16px ${scoreColor === '#4ade80' ? 'rgba(74, 222, 128, 0.5)' : 'rgba(251, 191, 36, 0.5)'}`,
            }}
          >
            {introStep >= 1 ? animatedScore : 0}
          </span>
          <span style={{ color: 'rgba(226, 232, 240, 0.5)', fontSize: '12px', fontWeight: 600 }}>/ 100</span>
        </div>
      </div>

      {/* 图例一行 — 3 秒理解图 */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          padding: '2px 16px 8px',
          flexWrap: 'wrap',
          opacity: introStep >= 2 ? 1 : 0,
          transition: 'opacity 0.5s ease-out',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '12px', fontWeight: 700, color: 'rgba(226, 232, 240, 0.86)', letterSpacing: '0.06em' }}>
          <span style={{ width: 22, height: 3, background: '#22d3ee', boxShadow: '0 0 8px rgba(34, 211, 238, 0.7)', borderRadius: 2 }} />
          Data flowing out
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '12px', fontWeight: 700, color: 'rgba(226, 232, 240, 0.72)', letterSpacing: '0.06em' }}>
          <span style={{ width: 22, height: 3, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.45) 0 5px, transparent 5px 9px)', borderRadius: 2 }} />
          Blocked by your choices
        </span>
      </div>

      {/* 下方：左流程图 + 右解释/按钮（由 NetworkDataFlowDiagram 内部左右分栏实现） */}
      <div
        className="data-shadows-reveal-diagram"
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          minHeight: 0,
          opacity: introStep >= 2 ? 1 : 0,
          transition: 'opacity 0.6s ease-out',
        }}
      >
        <NetworkDataFlowDiagram
          termsConsent={termsConsent}
          surveyData={surveyData}
          overridePrivacyScore={privacyScore}
        />
      </div>
    </div>
  )
}

const DataShadowsReveal: React.FC = () => {
  return <RevealContent />
}

export default DataShadowsReveal
