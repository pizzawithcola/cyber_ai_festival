import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredUser } from '../../utils/userStorage'
import { apiFetch } from '../../services/api'
import {
  loadDataShadowsChoices,
  type DataShadowsChoices,
} from './dataShadowsSession'
import './DataShadows.css'

/**
 * DataShadowsReveal — 成绩拆解页（/datashadows/reveal）
 * 从 sessionStorage 读取游戏数据 → 计算隐私分数 → 展示各维度得分拆解 → 提交后端分数。
 * 玩家点击 "VIEW DATA FLOW" 后跳转到 /datashadows/dataflow（数据流图）。
 */

// 隐私开关子项（用于展开/少选维度的逐项展示）
const PRIVACY_ITEMS = [
  { key: 'analytics', label: 'Usage Analytics' },
  { key: 'marketing', label: 'Marketing Communications' },
  { key: 'thirdParty', label: 'Third-Party Sharing' },
  { key: 'dataRetention', label: 'Extended Data Retention' },
  { key: 'aiTraining', label: 'AI Model Training' },
] as const

// 非健身必要字段子项（跳过 = +5 每个）
const SURVEY_ITEMS = [
  { key: 'birthDate', label: 'Date of Birth' },
  { key: 'maritalStatus', label: 'Marital Status' },
  { key: 'diningFrequency', label: 'Dining Frequency' },
  { key: 'occupation', label: 'Occupation' },
  { key: 'income', label: 'Income Level' },
  { key: 'homeAddress', label: 'Home Address' },
] as const

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

  // 整体缩放：空间不足时优先缩放而非滚动（缩放下限 0.68）
  const contentRef = useRef<HTMLDivElement | null>(null)
  const cardsContainerRef = useRef<HTMLDivElement | null>(null)
  const cardsListRef = useRef<HTMLDivElement | null>(null)
  const [contentScale, setContentScale] = useState(1)
  const [scaledHeight, setScaledHeight] = useState<number | null>(null)
  const [allowScroll, setAllowScroll] = useState(false)
  // 悬浮按钮：细则内容底部 → 页面底部空隙的居中位置（null = 空间不足，退为贴底）
  const [btnTop, setBtnTop] = useState<number | null>(null)

  // Guard: 无数据直接回入口页
  useEffect(() => {
    if (!choices) {
      navigate('/datashadows', { replace: true })
    }
  }, [choices, navigate])

  // 各维度得分
  const scores = useMemo(() => {
    if (!choices) return null
    return {
      termsReadingScore: typeof choices.termsReadingScore === 'number' ? choices.termsReadingScore : 0,
      educationCardsScore: typeof choices.educationCardsScore === 'number' ? choices.educationCardsScore : 0,
      detailExpansionScore: typeof choices.detailExpansionScore === 'number' ? choices.detailExpansionScore : 0,
      privacyOptionsScore: typeof choices.privacyOptionsScore === 'number' ? choices.privacyOptionsScore : 0,
      surveyScore: typeof choices.surveyScore === 'number' ? choices.surveyScore : 0,
    }
  }, [choices])

  // 总分（上限 100）
  const privacyScore = useMemo(() => {
    if (!scores) return 0
    return Math.max(0, Math.min(100, scores.termsReadingScore + scores.educationCardsScore + scores.detailExpansionScore + scores.privacyOptionsScore + scores.surveyScore))
  }, [scores])

  // 各维度 breakdown（含逐项得分，用于成绩拆解页展示）
  const breakdown = useMemo(() => {
    if (!scores) return null
    const expandedSet = new Set<string>((choices?.expandedOptions as string[] | undefined) ?? [])
    const uncheckedSet = new Set<string>((choices?.uncheckedOptions as string[] | undefined) ?? [])
    const surveyFilled: Record<string, boolean> = {
      birthDate: !!choices?.surveyBirthDate,
      maritalStatus: !!choices?.surveyMaritalStatus && choices.surveyMaritalStatus !== 'Prefer not to say',
      diningFrequency: !!choices?.surveyDiningFrequency && choices.surveyDiningFrequency !== 'Prefer not to say',
      occupation: !!choices?.surveyOccupation,
      income: !!choices?.surveyIncome && choices.surveyIncome !== 'Prefer not to say',
      homeAddress: !!choices?.surveyHomeAddress,
    }
    const readAllTerms = scores.termsReadingScore >= 5
    const timeScore = readAllTerms ? scores.termsReadingScore - 5 : 0

    return [
      {
        icon: '📖',
        label: 'Terms Read',
        max: 20,
        total: scores.termsReadingScore + scores.educationCardsScore,
        hint: 'Finish reading the terms and all feature cards to max out',
        items: [
          { label: 'Read all the terms', earned: readAllTerms ? 5 : 0, max: 5 },
          { label: 'Paid attention 3+ seconds', earned: timeScore, max: 5 },
          { label: 'Read all education cards', earned: scores.educationCardsScore, max: 10 },
        ],
      },
      {
        icon: '🔍',
        label: 'Details Reviewed',
        max: 15,
        total: scores.detailExpansionScore,
        hint: 'Opening each explanation earns 3 pts',
        items: PRIVACY_ITEMS.map((p) => ({
          label: p.label,
          earned: expandedSet.has(p.key) ? 3 : 0,
          max: 3,
        })),
      },
      {
        icon: '🛡️',
        label: 'Consent Refused',
        max: 35,
        total: scores.privacyOptionsScore,
        hint: 'Opting out of each sharing earns 7 pts',
        items: PRIVACY_ITEMS.map((p) => ({
          label: p.label,
          earned: uncheckedSet.has(p.key) ? 7 : 0,
          max: 7,
        })),
      },
      {
        icon: '📋',
        label: 'Non-Essential Data Guarded',
        max: 30,
        total: scores.surveyScore,
        hint: 'Skipping each non-essential question earns 5 pts',
        items: SURVEY_ITEMS.map((s) => ({
          label: s.label,
          earned: surveyFilled[s.key] ? 0 : 5,
          max: 5,
        })),
      },
    ]
  }, [scores, choices])

  const MAX_SCORE = 100

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

  // 入场节奏：分数揭晓（0.9s 后）
  useEffect(() => {
    if (!choices) return
    const timer = window.setTimeout(() => setIntroStep(1), 900)
    return () => window.clearTimeout(timer)
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

  // 空间不足时优先整体缩放（flex 优先），缩到最小仍不够才允许内部滚动
  useEffect(() => {
    const updateScale = () => {
      const el = contentRef.current
      if (!el) return
      const naturalHeight = el.scrollHeight
      const viewportH = window.innerHeight
      const rawScale = Math.min(1, viewportH / naturalHeight)
      const clamped = Math.max(0.68, rawScale)
      setContentScale(clamped)
      setScaledHeight(Math.round(naturalHeight * clamped))
    }
    const timer = window.setTimeout(updateScale, 80)
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('resize', updateScale)
    }
  }, [])

  // 悬浮按钮位置 + 细则溢出检测：
  // - 按钮：细则内容底部 → 内容层底部的中间；空间不足（<130px）时固定贴底不动
  // - allowScroll：细则内容超过容器可用高度时允许内部滚动（缩放优先，溢出才滚）
  useEffect(() => {
    const calcBtn = () => {
      const wrap = contentRef.current
      const cards = cardsContainerRef.current
      const list = cardsListRef.current
      if (!wrap || !cards || !list) return
      const listBottom = cards.offsetTop + list.offsetTop + list.offsetHeight
      const wrapH = wrap.offsetHeight
      const gap = wrapH - listBottom
      if (gap < 130) {
        setBtnTop(null)
      } else {
        setBtnTop(listBottom + gap / 2)
      }
      // 细则内容溢出容器 → 允许滚动（并切换为贴顶，避免 flex 居中时的滚动裁剪）
      const availH = cards.clientHeight - 96
      setAllowScroll(list.offsetHeight > availH)
    }
    const timer = window.setTimeout(calcBtn, 120)
    calcBtn()
    window.addEventListener('resize', calcBtn)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('resize', calcBtn)
    }
  }, [])

  if (!choices || !scores || !breakdown) return null

  const scoreColor = privacyScore >= 45 ? '#4ade80' : '#fbbf24'

  // 根据分数选择结语：≥80 赞扬 / 60-79 鼓励 / <60 警示原文
  const praiseMessage =
    privacyScore >= 80
      ? 'Outstanding — your data stayed exactly where it belongs.'
      : privacyScore >= 60
        ? 'Good effort — careful choices keep your data closer.'
        : 'Your data went further than you think.'

  return (
    <div className="data-shadows-reveal-page">
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

      {/* 内容层：空间不足时整体缩放（flex 优先），实在不够才滚动；横屏时最大宽度 1500px 居中 */}
      <div
        ref={contentRef}
        style={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          width: '100%',
          maxWidth: 1500,
          margin: '0 auto',
          alignSelf: 'center',
          display: 'flex',
          flexDirection: 'column',
          transform: `scale(${contentScale})`,
          transformOrigin: 'top center',
          height: scaledHeight !== null ? scaledHeight : undefined,
        }}
      >
        {/* 顶部：总分在左，标题右对齐 */}
        <div
          className="data-shadows-reveal-hero"
          style={{
            position: 'relative',
            zIndex: 2,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: '16px 20px 14px',
            animation: introStep >= 1 ? 'dsRevealGlitch 0.5s ease-out 1' : 'none',
          }}
        >
          {/* 左：总分（无 label） */}
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 26px',
              borderRadius: 12,
              border: '1px solid rgba(244, 114, 182, 0.42)',
              background: 'rgba(244, 114, 182, 0.1)',
              animation: 'dsRevealFadeUp 0.55s ease-out 0.15s both',
            }}
          >
            <span
              style={{
                color: scoreColor,
                fontSize: '52px',
                fontWeight: 900,
                lineHeight: 1,
                textShadow: `0 0 20px ${scoreColor === '#4ade80' ? 'rgba(74, 222, 128, 0.55)' : 'rgba(251, 191, 36, 0.55)'}`,
              }}
            >
              {introStep >= 1 ? animatedScore : 0}
            </span>
            <span style={{ color: 'rgba(226, 232, 240, 0.5)', fontSize: '17px', fontWeight: 600 }}>/ {MAX_SCORE}</span>
          </div>

          {/* 右：标题（右对齐） */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              textAlign: 'right',
              gap: 6,
              minWidth: 0,
              animation: 'dsRevealFadeUp 0.6s ease-out both',
            }}
          >
            {/* 游戏章节标签（大字号） */}
            <div
              style={{
                color: '#f9a8d4',
                fontSize: 'clamp(16px, 2.4vh, 26px)',
                fontWeight: 900,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                lineHeight: 1.2,
              }}
            >
              Data Shadows · Truth Reveal
            </div>
            {/* 结语（正常字距，随分数变化） */}
            <div
              style={{
                color: '#f8fafc',
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.01em',
                lineHeight: 1.5,
              }}
            >
              {praiseMessage}
            </div>
          </div>
        </div>

      {/* 维度拆解卡片 — 相对整个页面垂直居中（空间不足时退为贴顶滚动） */}
      <div
        ref={cardsContainerRef}
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          minHeight: 0,
          overflowY: allowScroll ? 'auto' : 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: allowScroll ? 'flex-start' : 'center',
          gap: 12,
          padding: '0 20px 96px',
        }}
      >
        <div ref={cardsListRef} style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
        {breakdown.map((section, i) => {
          const pct = Math.round((section.total / section.max) * 100)
          return (
            <div
              key={section.label}
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(34, 211, 238, 0.28)',
                borderRadius: 12,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                animation: `dsRevealFadeUp 0.5s ease-out both ${0.15 + i * 0.1}s`,
                boxShadow: '0 0 24px rgba(34, 211, 238, 0.06), inset 0 0 24px rgba(34, 211, 238, 0.03)',
              }}
            >
              {/* 卡片头：维度名 + 总分 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#e2e8f0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {section.icon} {section.label}
                </span>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#67e8f9', whiteSpace: 'nowrap', lineHeight: 1 }}>
                  {section.total}
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(148, 163, 184, 0.7)' }}>/{section.max}</span>
                </span>
              </div>

              {/* 进度条 */}
              <div style={{ height: 5, borderRadius: 3, background: 'rgba(148, 163, 184, 0.15)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg, #22d3ee, #67e8f9)',
                    borderRadius: 3,
                    boxShadow: '0 0 8px rgba(34, 211, 238, 0.6)',
                    transition: 'width 0.6s ease-out',
                  }}
                />
              </div>

              {/* 逐项列表 */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {section.items.map((item) => {
                  const earned = item.earned
                  const isEarned = earned > 0
                  return (
                    <div
                      key={item.label}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          flexShrink: 0,
                          background: isEarned ? '#4ade80' : 'rgba(148, 163, 184, 0.35)',
                          boxShadow: isEarned ? '0 0 6px rgba(74, 222, 128, 0.7)' : 'none',
                        }}
                      />
                      <span
                        style={{
                          flex: 1,
                          fontSize: '13px',
                          color: isEarned ? '#e2e8f0' : 'rgba(148, 163, 184, 0.55)',
                          fontWeight: isEarned ? 600 : 400,
                        }}
                      >
                        {item.label}
                      </span>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: isEarned ? '#67e8f9' : 'rgba(148, 163, 184, 0.5)',
                        }}
                      >
                        {earned}/{item.max} pts
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* 维度说明 */}
              <span style={{ fontSize: '10.5px', color: 'rgba(148, 163, 184, 0.7)', lineHeight: 1.4, marginTop: 2 }}>
                {section.hint}
              </span>
            </div>
          )
        })}
        </div>
      </div>

      {/* 悬浮按钮：位于细则内容底部 → 页面底部空隙的居中（空间不足时贴底不动） */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          zIndex: 3,
          top: btnTop !== null ? btnTop - 25 : undefined,
          bottom: btnTop === null ? 22 : undefined,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          animation: 'dsRevealFadeUp 0.5s ease-out 0.7s both',
        }}
      >
        <button
          onClick={() => navigate('/datashadows/dataflow')}
          style={{
            pointerEvents: 'auto',
            minWidth: 260,
            padding: '14px 30px',
            borderRadius: 8,
            border: '1px solid rgba(34, 211, 238, 0.55)',
            background: 'linear-gradient(90deg, rgba(244, 114, 182, 0.18), rgba(34, 211, 238, 0.18)), rgba(2, 6, 23, 0.9)',
            color: '#a5f3fc',
            fontFamily: 'inherit',
            fontSize: '15px',
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: '0 0 22px rgba(34, 211, 238, 0.25)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 34px rgba(34, 211, 238, 0.5)'
            e.currentTarget.style.color = '#ffffff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 22px rgba(34, 211, 238, 0.25)'
            e.currentTarget.style.color = '#a5f3fc'
          }}
        >
          VIEW DATA FLOW →
        </button>
      </div>
      </div>
    </div>
  )
}

const DataShadowsReveal: React.FC = () => {
  return <RevealContent />
}

export default DataShadowsReveal
