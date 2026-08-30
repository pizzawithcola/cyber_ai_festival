import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NetworkDataFlowDiagram } from './components/fitai/NetworkDataFlowDiagram'
import type { TermsConsent, SurveyData } from './components/fitai/dataFlowLogic'
import {
  loadDataShadowsChoices,
  type DataShadowsChoices,
} from './dataShadowsSession'
import { useClickSound } from '../../hooks/useClickSound'
import './DataShadows.css'

/**
 * DataShadowsDataFlow — 数据流揭示页（/datashadows/dataflow）
 * 从 sessionStorage 读取游戏数据 → 展示完整的数据流图（沿用 reveal 页的霓虹暗色风格）。
 * 分数提交已在 /datashadows/reveal（成绩拆解页）完成，本页只负责可视化。
 */
function DataFlowContent() {
  const navigate = useNavigate()
  // 全部按钮点击播放咔嚓按键音
  useClickSound()

  const choicesRef = useRef<DataShadowsChoices | null>(null)
  if (choicesRef.current === null) {
    choicesRef.current = loadDataShadowsChoices()
  }
  const choices = choicesRef.current

  const [visible, setVisible] = useState(false)

  // Guard: 无数据直接回入口页；有数据则淡入
  useEffect(() => {
    if (!choices) {
      navigate('/datashadows', { replace: true })
      return
    }
    const timer = window.setTimeout(() => setVisible(true), 120)
    return () => window.clearTimeout(timer)
  }, [choices, navigate])

  // 计算隐私分数（供数据流图展示，与 reveal 页公式一致）
  const privacyScore = useMemo(() => {
    if (!choices) return 0
    const termsReadingScore = typeof choices.termsReadingScore === 'number' ? choices.termsReadingScore : 0
    const educationCardsScore = typeof choices.educationCardsScore === 'number' ? choices.educationCardsScore : 0
    const privacyOptionsScore = typeof choices.privacyOptionsScore === 'number' ? choices.privacyOptionsScore : 0
    const detailExpansionScore = typeof choices.detailExpansionScore === 'number' ? choices.detailExpansionScore : 0
    const surveyScore = typeof choices.surveyScore === 'number' ? choices.surveyScore : 0
    return Math.max(0, Math.min(100, termsReadingScore + educationCardsScore + privacyOptionsScore + detailExpansionScore + surveyScore))
  }, [choices])

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
      name: typeof choices?.surveyName === 'string' ? choices.surveyName : undefined,
      bodyParts: Array.isArray(choices?.surveyBodyParts) ? choices.surveyBodyParts : undefined,
      locations: Array.isArray(choices?.surveyLocations) ? choices.surveyLocations : undefined,
      goals: Array.isArray(choices?.surveyGoals) ? choices.surveyGoals : undefined,
      height: typeof choices?.surveyHeight === 'number' ? choices.surveyHeight : undefined,
      weight: typeof choices?.surveyWeight === 'number' ? choices.surveyWeight : undefined,
      occupation: typeof choices?.surveyOccupation === 'string' ? choices.surveyOccupation : undefined,
      homeAddress: typeof choices?.surveyHomeAddress === 'string' ? choices.surveyHomeAddress : undefined,
      workoutMinutes: typeof choices?.surveyWorkoutMinutes === 'number' ? choices.surveyWorkoutMinutes : undefined,
      birthDate: typeof choices?.surveyBirthDate === 'string' ? choices.surveyBirthDate : undefined,
      // 拒绝透露（Prefer not to say）= 未收集，不进数据流图
      maritalStatus: typeof choices?.surveyMaritalStatus === 'string' && choices.surveyMaritalStatus !== 'Prefer not to say' ? choices.surveyMaritalStatus : undefined,
      income: typeof choices?.surveyIncome === 'string' && choices.surveyIncome !== 'Prefer not to say' ? choices.surveyIncome : undefined,
      diningFrequency: typeof choices?.surveyDiningFrequency === 'string' && choices.surveyDiningFrequency !== 'Prefer not to say' ? choices.surveyDiningFrequency : undefined,
    }),
    [choices]
  )

  if (!choices) return null

  const scoreColor = privacyScore >= 45 ? '#4ade80' : '#fbbf24'

  return (
    <div
      className="data-shadows-reveal-page data-shadows-diagram-only-layout"
    >
      <style>{`
        @keyframes dsFlowFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* 顶部：标题（左）+ 分数（中）+ 操作按钮（右上） */}
      <div
        className="data-shadows-reveal-hero"
        style={{
          position: 'relative',
          zIndex: 2,
          flexShrink: 0,
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 16,
          padding: '16px 20px 10px',
          animation: visible ? 'dsFlowFadeUp 0.5s ease-out both' : 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 4,
            minWidth: 0,
            justifySelf: 'start',
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
            Data Shadows · Data Flow
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
            Where your data went
          </div>
        </div>

        <div
          style={{
            justifySelf: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            // 高度与右侧按钮严格一致（40px，含边框），内容垂直居中
            height: 40,
            minHeight: 40,
            padding: '0 16px',
            boxSizing: 'border-box',
            borderRadius: 10,
            border: '1px solid rgba(244, 114, 182, 0.42)',
            background: 'rgba(244, 114, 182, 0.1)',
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
            {privacyScore}
          </span>
        </div>

        {/* 右上角：Try Again（左） / Next（右） */}
        <div className="data-flow-hero-actions" style={{ justifySelf: 'end' }}>
          <button
            type="button"
            className="data-flow-retry-button"
            onClick={() => navigate('/datashadows')}
          >
            Try Again
          </button>
          <button
            type="button"
            className="data-flow-leaderboard-button"
            onClick={() => navigate('/ranking/game/datashadows')}
          >
            Next
          </button>
        </div>
      </div>

      {/* 数据流图（由 NetworkDataFlowDiagram 内部实现：Overview 在上、节点图在下） */}
      <div
        className="data-shadows-reveal-diagram"
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          minHeight: 0,
          // flex 容器：让子元素（NetworkDataFlowDiagram）用 flex:1 填充高度，
          // 避免 height:100% 百分比在 flex item 父级上解析失败导致内部 fr 行高失效
          display: 'flex',
          flexDirection: 'column',
          opacity: visible ? 1 : 0,
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

const DataShadowsDataFlow: React.FC = () => {
  return <DataFlowContent />
}

export default DataShadowsDataFlow
