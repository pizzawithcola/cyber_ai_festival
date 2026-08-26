import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NetworkDataFlowDiagram } from './components/fitai/NetworkDataFlowDiagram'
import type { TermsConsent, SurveyData } from './components/fitai/dataFlowLogic'
import {
  loadDataShadowsChoices,
  type DataShadowsChoices,
} from './dataShadowsSession'
import './DataShadows.css'

/**
 * DataShadowsDataFlow — 数据流揭示页（/datashadows/dataflow）
 * 从 sessionStorage 读取游戏数据 → 展示完整的数据流图（沿用 reveal 页的霓虹暗色风格）。
 * 分数提交已在 /datashadows/reveal（成绩拆解页）完成，本页只负责可视化。
 */
function DataFlowContent() {
  const navigate = useNavigate()
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

  const scoreColor = privacyScore >= 40 ? '#4ade80' : '#fbbf24'

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

      {/* 顶部：标题 + 分数 */}
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
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 16px',
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
          opacity: visible ? 1 : 0,
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

      {/* 数据流图（由 NetworkDataFlowDiagram 内部左右分栏实现） */}
      <div
        className="data-shadows-reveal-diagram"
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          minHeight: 0,
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
