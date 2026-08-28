import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFitAI } from './fitaiContext'
import ProgressIndicator from './ProgressIndicator'
import QuestionCard from './QuestionCard'
import AIAnalysis from './AIAnalysis'
import { saveDataShadowsChoices } from '../../dataShadowsSession'

interface QuestionData {
  name?: string
  avatar?: string
  bodyParts?: string[]
  workoutMinutes?: number
  occupation?: string
  locations?: string[]
  goals?: string[]
  height?: number
  weight?: number
  homeAddress?: string
  birthDate?: string
  birthDay?: string
  birthMonth?: string
  birthYear?: string
  maritalStatus?: string
  income?: string
  diningFrequency?: string
}

// 出生日期分段选项（日/月/年）
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
// 年份范围：至少 18 岁，最多 80 岁
const BIRTH_YEAR_OPTIONS = Array.from({ length: 63 }, (_, i) => String(new Date().getFullYear() - 18 - i))

// 拒绝透露的值视为未收集数据（同样给予保护隐私加分）
const REFUSED_TO_SAY = 'Prefer not to say'
const isSkippedOptional = (value?: string): boolean => !value || value === REFUSED_TO_SAY

const RegistrationSurvey: React.FC = () => {
  const navigate = useNavigate()
  const { updateUserChoices, userChoices } = useFitAI()
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<QuestionData>({ workoutMinutes: 0 })
  const [showAI, setShowAI] = useState(false)
  const [showGlitch, setShowGlitch] = useState(false)
  const [lastAnswer, setLastAnswer] = useState('')
  const aiTrainingConsent = (userChoices?.privacySettings as { aiTraining?: boolean } | undefined)?.aiTraining === true
  const [heightWeightVisible, setHeightWeightVisible] = useState(false)
  const [addressVisible, setAddressVisible] = useState(false)
  const [occupationVisible, setOccupationVisible] = useState(false)
  const [showLocationSuccess, setShowLocationSuccess] = useState(false) 

  // iOS 风格分段下拉的共享样式（与名字输入框同色系）
  const segmentedSelectStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 8px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    background: '#f9fafb',
    color: '#1f2937',
    fontSize: '14px',
    boxSizing: 'border-box',
    transition: 'all 0.2s',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
    backgroundSize: '14px'
  }

  // 组装出生日期：三段都选好后拼成 YYYY-MM-DD
  const updateBirthField = (field: 'birthDay' | 'birthMonth' | 'birthYear', value: string) => {
    const next = { ...data, [field]: value }
    next.birthDate =
      next.birthDay && next.birthMonth && next.birthYear
        ? `${next.birthYear}-${next.birthMonth}-${next.birthDay}`
        : ''
    setData(next)
  }

  const handleNext = () => {
    if (currentStep < 5) {
      if (aiTrainingConsent) {
        setShowAI(true)
        setLastAnswer(JSON.stringify(data))
        setTimeout(() => {
          setShowAI(false)
          setCurrentStep(currentStep + 1)
        }, 1500)
      } else {
        setCurrentStep(currentStep + 1)
      }
    } else {
      // Save user choices to context
      console.log('Survey completed, saving user choices...')
      
      // Calculate survey score: +10 for each unfilled optional question
      // Score only when:
      // 1. Field is visible AND has actual content filled in = 0 pts
      // 2. Field is not visible OR no content filled in = 10 pts each
      const skippedOptionalQuestions: string[] = []
      let surveyScore = 0
      
      // 头像、身高/体重不参与考察计分（合理需求），仅作为已填数据展示
      const heightWeightFilled = heightWeightVisible && data.height && data.weight
      
      // 6 个非健身必要字段全部纳入评分体系：跳过/拒绝透露/未实际填写 = +5 每个
      const addressFilled = addressVisible && data.homeAddress
      if (!addressFilled) {
        skippedOptionalQuestions.push('home_address')
        surveyScore += 5
      }
      
      const occupationFilled = occupationVisible && data.occupation
      if (!occupationFilled) {
        skippedOptionalQuestions.push('occupation')
        surveyScore += 5
      }
      
      if (isSkippedOptional(data.birthDate)) {
        skippedOptionalQuestions.push('birth_date')
        surveyScore += 5
      }
      
      if (isSkippedOptional(data.maritalStatus)) {
        skippedOptionalQuestions.push('marital_status')
        surveyScore += 5
      }
      
      if (isSkippedOptional(data.diningFrequency)) {
        skippedOptionalQuestions.push('dining_frequency')
        surveyScore += 5
      }
      
      if (isSkippedOptional(data.income)) {
        skippedOptionalQuestions.push('income')
        surveyScore += 5
      }
      
      // Update user choices - for privacy scoring
      // Store individual survey field values at top level for context compatibility
      const choices = {
        // 条款页分数（从 context 合并，避免 sessionStorage 丢失 → reveal 页读不到）
        termsReadingProgress: typeof userChoices?.termsReadingProgress === 'number' ? userChoices.termsReadingProgress : 0,
        termsReadingScore: typeof userChoices?.termsReadingScore === 'number' ? userChoices.termsReadingScore : 0,
        detailExpansionScore: typeof userChoices?.detailExpansionScore === 'number' ? userChoices.detailExpansionScore : 0,
        expandedOptions: Array.isArray(userChoices?.expandedOptions) ? userChoices.expandedOptions : [],
        uncheckedOptions: Array.isArray(userChoices?.uncheckedOptions) ? userChoices.uncheckedOptions : [],
        privacyOptionsScore: typeof userChoices?.privacyOptionsScore === 'number' ? userChoices.privacyOptionsScore : 0,
        totalTermsScore: typeof userChoices?.totalTermsScore === 'number' ? userChoices.totalTermsScore : 0,
        privacySettings: userChoices?.privacySettings as Record<string, boolean> | undefined,
        // 教育卡片：读完全部 4 张 = +10
        educationCardsScore: userChoices?.educationCardsRead === 4 ? 10 : 0,
        // 问卷
        surveyScore,
        skippedOptionalQuestions,
        filledOptionalQuestions: 6 - skippedOptionalQuestions.length,
        sensitiveDataPoints: [
          ...(heightWeightFilled ? ['height', 'weight'] : []),
          ...(addressFilled ? ['home_address'] : []),
          ...(occupationFilled ? ['occupation'] : []),
          ...(data.birthDate ? ['birth_date'] : []),
          ...(data.maritalStatus && data.maritalStatus !== REFUSED_TO_SAY ? ['marital_status'] : []),
          ...(data.income && data.income !== REFUSED_TO_SAY ? ['income'] : []),
          ...(data.diningFrequency && data.diningFrequency !== REFUSED_TO_SAY ? ['dining_frequency'] : [])
        ],
        // Store actual user input data at top level (UserChoices compatible)
        surveyName: data.name,
        surveyBodyParts: data.bodyParts,
        surveyLocations: data.locations,
        surveyGoals: data.goals,
        surveyHeight: data.height,
        surveyWeight: data.weight,
        surveyOccupation: data.occupation,
        surveyHomeAddress: data.homeAddress,
        surveyWorkoutMinutes: data.workoutMinutes,
        surveyBirthDate: data.birthDate,
        surveyMaritalStatus: data.maritalStatus,
        surveyIncome: data.income,
        surveyDiningFrequency: data.diningFrequency,
      }
      
      console.log('Survey Scoring:', {
        skippedOptionalQuestions,
        surveyScore,
        filledOptionalQuestions: choices.filledOptionalQuestions,
        sensitiveDataPoints: choices.sensitiveDataPoints,
        surveyBirthDate: choices.surveyBirthDate,
        surveyMaritalStatus: choices.surveyMaritalStatus,
        surveyIncome: choices.surveyIncome,
        surveyDiningFrequency: choices.surveyDiningFrequency,
      })
      
      // Call updateUserChoices if exists
      if (updateUserChoices) {
        updateUserChoices(choices)
      }

      // 保存到 sessionStorage 供 reveal 路由读取
      saveDataShadowsChoices(choices as Parameters<typeof saveDataShadowsChoices>[0])

      // 极简 glitch twist（约 1s）后跳转全屏揭示页
      setShowGlitch(true)
      window.setTimeout(() => {
        navigate('/datashadows/reveal')
      }, 1000)
    }
  }

  const isCurrentStepComplete = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!data.name
      case 2:
        return (data.bodyParts?.length || 0) > 0
      case 3:
        return data.workoutMinutes !== undefined
      case 4:
        return (data.locations?.length || 0) > 0
      case 5:
        return (data.goals?.length || 0) > 0
      default:
        return false
    }
  }

  const avatarOptions = [
    '👨',  // Young adult male (Caucasian)
    '👩',  // Young adult female (Caucasian)
    '👨🏿', // Adult male (African descent)
    '👩🏿', // Adult female (African descent)
    '👨🏽', // Adult male (South Asian/Middle Eastern)
    '👩🏽', // Adult female (South Asian/Middle Eastern)
    '👨🏼', // Adult male (East Asian/Light skin tone)
    '👩🏼', // Adult female (East Asian/Light skin tone)
    '🧑'   // Gender-neutral/Non-binary person
  ]
  const bodyParts = ['Face', 'Arms', 'Chest', 'Abs', 'Legs', 'Back']
  const locations = ['Home', 'Gym', 'Park', 'Office']
  const goalOptions = ['Weight Loss', 'Muscle Gain', 'Stay Healthy', 'Better Sleep']

  // 职业选项（下拉菜单）
  const occupationOptions = [
    'Select your occupation',
    'Software Engineer',
    'Teacher',
    'Nurse',
    'Construction Worker',
    'Office Worker',
    'Sales',
    'Manager',
    'Driver',
    'Chef',
    'Other'
  ]

  // 婚姻状况选项（直接显示）
  const maritalOptions = [
    'Select marital status',
    'Single',
    'Married',
    'Married with children',
    'Divorced',
    'Prefer not to say'
  ]

  // 收入水平选项（直接显示）
  const incomeOptions = [
    'Select your income range',
    'Under £20K',
    '£20K – £50K',
    '£50K – £100K',
    '£100K+',
    'Prefer not to say'
  ]

  // 外食频率选项（直接显示）
  const diningOptions = [
    'Select how often you eat out',
    'Rarely / Never',
    '1-2 times a week',
    '3-5 times a week',
    'Every day',
    'Prefer not to say'
  ]

  const handleGetCurrentLocation = () => {
    // Simulate getting current location
    setData({ ...data, homeAddress: '123 Main St, New York, NY 10001' })
    
    // 显示成功提示，3秒后自动消失
    setShowLocationSuccess(true)
    setTimeout(() => setShowLocationSuccess(false), 3000)
  }

  return (
    <div style={{
      position: 'relative',
      height: '100%',
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      color: '#1f2937',
      overflow: 'hidden'
    }}>
      {/* Glitch twist — 完成注册后的 1s 反转镜头，随后跳转全屏揭示页 */}
      {showGlitch && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 999,
          background: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'dsSurveyGlitch 0.32s linear infinite',
        }}>
          <div style={{
            color: '#67e8f9',
            fontSize: '15px',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            textShadow: '0 0 12px rgba(103, 232, 249, 0.8)',
          }}>
            Analyzing your data...
          </div>
        </div>
      )}

      <AIAnalysis isActive={showAI} answer={lastAnswer} />

      <ProgressIndicator currentStep={currentStep} totalSteps={5} />

      {/* Main content area - scrollable */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '16px 16px 120px', // More bottom padding for navigation buttons
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth'
      }}>
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <QuestionCard
            required
            title="What's your name?"
            description="Help us personalize your experience"
            hint="Use your name for personalized coaching"
            dataCollection="Name stored for profile identification and personalized marketing"
            isCompleted={!!data.name}
          >
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Enter your name"
                value={data.name || ''}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  background: '#f9fafb',
                  color: '#1f2937',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s'
                }}
              />
            </div>

            {/* Date of Birth - iOS 风格日/月/年分段选择 */}
            <div style={{ marginTop: '20px' }}>
              <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', display: 'block' }}>
                Date of Birth
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={data.birthDay || ''}
                  onChange={(e) => updateBirthField('birthDay', e.target.value)}
                  style={{ ...segmentedSelectStyle, flex: 1 }}
                >
                  <option value="" disabled>Day</option>
                  {DAY_OPTIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  value={data.birthMonth || ''}
                  onChange={(e) => updateBirthField('birthMonth', e.target.value)}
                  style={{ ...segmentedSelectStyle, flex: 1 }}
                >
                  <option value="" disabled>Month</option>
                  {MONTH_OPTIONS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select
                  value={data.birthYear || ''}
                  onChange={(e) => updateBirthField('birthYear', e.target.value)}
                  style={{ ...segmentedSelectStyle, flex: 1.4 }}
                >
                  <option value="" disabled>Year</option>
                  {BIRTH_YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Marital Status - 直接显示 */}
            <div style={{ marginTop: '20px' }}>
              <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', display: 'block' }}>
                Marital Status
              </label>
              <select
                value={data.maritalStatus || ''}
                onChange={(e) => setData({ ...data, maritalStatus: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  background: '#f9fafb',
                  color: '#1f2937',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px'
                }}
              >
                {maritalOptions.map((opt, idx) => (
                  <option
                    key={idx}
                    value={opt === 'Select marital status' ? '' : opt}
                    disabled={opt === 'Select marital status' && idx === 0}
                  >
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: '20px' }}>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 12px' }}>
                Select Avatar
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px'
              }}>
                {avatarOptions.map((avatar, i) => (
                  <button
                    key={i}
                    onClick={() => setData({ ...data, avatar })}
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '12px',
                      background: data.avatar === avatar
                        ? 'linear-gradient(135deg, #10b981, #3b82f6)'
                        : '#f3f4f6',
                      border: data.avatar === avatar
                        ? '2px solid #10b981'
                        : '1px solid #e5e7eb',
                      color: data.avatar === avatar ? '#ffffff' : '#4b5563',
                      fontSize: '28px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
          </QuestionCard>
        )}

        {/* Step 2: Body Data */}
        {currentStep === 2 && (
          <QuestionCard
            required
            title="Which areas to improve?"
            description="Select the body parts you want to focus on"
            hint="You can select multiple areas"
            dataCollection="Body part preferences tracked for AI workout recommendations and marketing profiling"
            isCompleted={(data.bodyParts?.length || 0) > 0}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px'
            }}>
              {bodyParts.map((part) => (
                <button
                  key={part}
                  onClick={() => {
                    const current = data.bodyParts || []
                    const updated = current.includes(part)
                      ? current.filter((p) => p !== part)
                      : [...current, part]
                    setData({ ...data, bodyParts: updated })
                  }}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: (data.bodyParts || []).includes(part)
                      ? 'linear-gradient(135deg, #10b981, #3b82f6)'
                      : '#f3f4f6',
                    border: (data.bodyParts || []).includes(part)
                      ? '2px solid #10b981'
                      : '1px solid #e5e7eb',
                    color: (data.bodyParts || []).includes(part) ? '#ffffff' : '#4b5563',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {part}
                </button>
              ))}
            </div>

            {/* Optional: Body Measurements */}
            <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px', color: '#1f2937' }}>
                    Optional: Body Measurements
                  </p>
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>
                    For more accurate workout recommendations (optional)
                  </p>
                </div>
                <button
                  onClick={() => setHeightWeightVisible(!heightWeightVisible)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: heightWeightVisible
                      ? 'linear-gradient(135deg, #10b981, #3b82f6)'
                      : '#f3f4f6',
                    border: heightWeightVisible
                      ? '2px solid #10b981'
                      : '1px solid #e5e7eb',
                    color: heightWeightVisible ? '#ffffff' : '#4b5563',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {heightWeightVisible ? '✓ Added' : '+ Add'}
                </button>
              </div>

              {heightWeightVisible && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  animation: 'fadeIn 0.3s ease-out'
                }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', display: 'block' }}>
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 175"
                      value={data.height || ''}
                      onChange={(e) => setData({ ...data, height: parseInt(e.target.value) || undefined })}
                      min="100"
                      max="250"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        border: '1px solid #10b981',
                        background: 'rgba(16,185,129,0.05)',
                        color: '#1f2937',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        transition: 'all 0.2s'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', display: 'block' }}>
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 70"
                      value={data.weight || ''}
                      onChange={(e) => setData({ ...data, weight: parseInt(e.target.value) || undefined })}
                      min="30"
                      max="200"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        border: '1px solid #10b981',
                        background: 'rgba(16,185,129,0.05)',
                        color: '#1f2937',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        transition: 'all 0.2s'
                      }}
                    />
                  </div>
                </div>
              )}
              
              {heightWeightVisible && (
                <div style={{
                  background: 'rgba(255,140,66,0.1)',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#f97316',
                  marginTop: '16px',
                  border: '1px solid rgba(255,140,66,0.2)'
                }}>
                  ⚠️ Body measurements are sensitive health data. Sharing this helps create more personalized plans, 
                  but may be used for health risk assessments by third parties.
                </div>
              )}
            </div>
          </QuestionCard>
        )}

        {/* Step 3: Lifestyle - Workout duration */}
        {currentStep === 3 && (
          <QuestionCard
            required
            title="How much time do you usually spend on a workout?"
            description="This helps us shape realistic coaching intensity and daily exercise recommendations."
            hint="Workout duration gives FitAI a quick read on your routine and recovery rhythm."
            dataCollection="Workout duration data used for recommendation timing, engagement analysis, and behavioral profiling"
            isCompleted={data.workoutMinutes !== undefined}
          >
            <div style={{ marginTop: '20px', marginBottom: '20px' }}>
              <div style={{
                marginBottom: '16px'
              }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', marginBottom: '8px', display: 'block' }}>
                  How many minutes do you spend on your workout each day?
                </label>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#10b981',
                  textAlign: 'center',
                  marginBottom: '20px'
                }}>
                  {(data.workoutMinutes ?? 0) >= 180 ? '180+' : (data.workoutMinutes ?? 0)} mins
                </div>

                <input
                  type="range"
                  min="0"
                  max="180"
                  step="15"
                  value={data.workoutMinutes ?? 0}
                  onChange={(e) => setData({ ...data, workoutMinutes: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: '#e5e7eb',
                    outline: 'none',
                    WebkitAppearance: 'none',
                    cursor: 'pointer'
                  }}
                />

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '10px',
                  color: '#9ca3af',
                  marginTop: '12px'
                }}>
                  <span>0 mins</span>
                  <span>180+ mins</span>
                </div>
              </div>

              <div style={{
                background: 'rgba(16,185,129,0.1)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#10b981',
                marginTop: '16px',
                border: '1px solid rgba(16,185,129,0.2)',
                lineHeight: '1.5'
              }}>
                💡 This helps FitAI calibrate realistic workout pacing, recovery windows, and push timing. Short sessions and long training blocks can trigger very different nudges inside the app.
              </div>
            </div>

            {/* Dining Out Frequency - 直接显示 */}
            <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', marginBottom: '8px', display: 'block' }}>
                How often do you eat out or order takeaway?
              </label>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 12px' }}>
                Helps us tailor realistic nutrition guidance around your routine
              </p>
              <select
                value={data.diningFrequency || ''}
                onChange={(e) => setData({ ...data, diningFrequency: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #3b82f6',
                  background: 'rgba(59,130,246,0.05)',
                  color: '#1f2937',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px'
                }}
              >
                {diningOptions.map((opt, idx) => (
                  <option
                    key={idx}
                    value={opt === 'Select how often you eat out' ? '' : opt}
                    disabled={opt === 'Select how often you eat out' && idx === 0}
                  >
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional: Occupation - 改为下拉菜单 */}
            <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px', color: '#1f2937' }}>
                    Optional: What is your occupation?
                  </p>
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>
                    Understanding your job type helps customize exercise plans (e.g., desk jobs vs. physical jobs)
                  </p>
                </div>
                <button
                  onClick={() => setOccupationVisible(!occupationVisible)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: occupationVisible
                      ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                      : '#f3f4f6',
                    border: occupationVisible
                      ? '2px solid #f59e0b'
                      : '1px solid #e5e7eb',
                    color: occupationVisible ? '#ffffff' : '#4b5563',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {occupationVisible ? '✓ Added' : '+ Add'}
                </button>
              </div>

              {occupationVisible && (
                <div style={{
                  animation: 'fadeIn 0.3s ease-out'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', display: 'block' }}>
                      Your Occupation / Job Title
                    </label>
                    {/* 原文本输入框 → 替换为下拉选择框 */}
                    <select
                      value={data.occupation || ''}
                      onChange={(e) => setData({ ...data, occupation: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        border: '1px solid #f59e0b',
                        background: 'rgba(245,158,11,0.05)',
                        color: '#1f2937',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        transition: 'all 0.2s',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23f59e0b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        backgroundSize: '16px'
                      }}
                    >
                      {occupationOptions.map((opt, idx) => (
                        <option 
                          key={idx} 
                          value={opt === 'Select your occupation' ? '' : opt}
                          disabled={opt === 'Select your occupation' && idx === 0}
                        >
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{
                    background: 'rgba(245,158,11,0.1)',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f59e0b',
                    border: '1px solid rgba(245,158,11,0.2)',
                    lineHeight: '1.5'
                  }}>
                    💡 Knowing your occupation helps us create more effective fitness plans. For example:
                    <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                      <li>Desk jobs → Focus on posture correction and mobility</li>
                      <li>Physical jobs → Focus on recovery and injury prevention</li>
                      <li>High-stress jobs → Include stress-relief exercises</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Income Level - 直接显示 */}
            <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', marginBottom: '8px', display: 'block' }}>
                What is your annual income range?
              </label>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 12px' }}>
                Helps us recommend the right premium plan tier for you
              </p>
              <select
                value={data.income || ''}
                onChange={(e) => setData({ ...data, income: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #3b82f6',
                  background: 'rgba(59,130,246,0.05)',
                  color: '#1f2937',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px'
                }}
              >
                {incomeOptions.map((opt, idx) => (
                  <option
                    key={idx}
                    value={opt === 'Select your income range' ? '' : opt}
                    disabled={opt === 'Select your income range' && idx === 0}
                  >
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </QuestionCard>
        )}

        {/* Step 4: Exercise Locations */}
        {currentStep === 4 && (
          <QuestionCard
            required
            title="Where do you usually exercise?"
            description="Select your typical exercise locations"
            hint="Multiple selections help with location-based recommendations"
            dataCollection="Location data collected for geolocation tracking and local marketing partnerships"
            isCompleted={(data.locations?.length || 0) > 0}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {locations.map((loc) => (
                <button
                  key={loc}
                  onClick={() => {
                    const current = data.locations || []
                    const updated = current.includes(loc)
                      ? current.filter((l) => l !== loc)
                      : [...current, loc]
                    setData({ ...data, locations: updated })
                  }}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: (data.locations || []).includes(loc)
                      ? 'linear-gradient(135deg, #10b981, #3b82f6)'
                      : '#f3f4f6',
                    border: (data.locations || []).includes(loc)
                      ? '2px solid #10b981'
                      : '1px solid #e5e7eb',
                    color: (data.locations || []).includes(loc) ? '#ffffff' : '#4b5563',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                >
                  {loc === 'Home' && '🏠 '}
                  {loc === 'Gym' && '🏋️ '}
                  {loc === 'Park' && '🌳 '}
                  {loc === 'Office' && '🏢 '}
                  {loc}
                </button>
              ))}
            </div>

            {/* Optional: Home Address for Gym Recommendations */}
            <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px', color: '#1f2937' }}>
                    Optional: Home Address
                  </p>
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>
                    For personalized gym and fitness coach recommendations near you
                  </p>
                </div>
                <button
                  onClick={() => setAddressVisible(!addressVisible)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: addressVisible
                      ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                      : '#f3f4f6',
                    border: addressVisible
                      ? '2px solid #3b82f6'
                      : '1px solid #e5e7eb',
                    color: addressVisible ? '#ffffff' : '#4b5563',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {addressVisible ? '✓ Added' : '+ Add'}
                </button>
              </div>

              {addressVisible && (
                <div style={{
                  animation: 'fadeIn 0.3s ease-out'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', display: 'block' }}>
                      Home Address
                    </label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <input
                        type="text"
                        placeholder="Enter your home address"
                        value={data.homeAddress || ''}
                        onChange={(e) => setData({ ...data, homeAddress: e.target.value })}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '10px',
                          border: '1px solid #3b82f6',
                          background: 'rgba(59,130,246,0.05)',
                          color: '#1f2937',
                          fontSize: '14px',
                          boxSizing: 'border-box',
                          transition: 'all 0.2s'
                        }}
                      />
                      <button
                        onClick={handleGetCurrentLocation}
                        style={{
                          flex: '0 0 auto',        // 防止被压缩
                          width: '90px',          // 固定宽度，确保不超出
                          textAlign: 'center',
                          padding: '12px 8px',     // 适当减小内边距以适应120px
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                          border: 'none',
                          color: '#ffffff',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '10px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        📍Get Address
                      </button>
                    </div>
                    {/* 新增：位置获取成功提示，替代 alert */}
                    {showLocationSuccess && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        background: 'rgba(16,185,129,0.1)',
                        border: '1px solid rgba(16,185,129,0.2)',
                        borderRadius: '8px',
                        color: '#10b981',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>✓</span> Location retrieved! Using your current address for personalized gym recommendations.
                      </div>
                    )}
                  </div>

                  <div style={{
                    background: 'rgba(59,130,246,0.1)',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#3b82f6',
                    border: '1px solid rgba(59,130,246,0.2)'
                  }}>
                    💡 Sharing your address helps us recommend nearby gyms, fitness classes, and personal trainers. 
                    This also enables location-based notifications and local fitness events.
                  </div>
                </div>
              )}
            </div>
          </QuestionCard>
        )}

        {/* Step 5: Goals */}
        {currentStep === 5 && (
          <QuestionCard
            required
            title="What are your main goals?"
            description="Select all that apply to your fitness journey"
            hint="Your goals will personalize your AI coaching"
            dataCollection="Goal preferences used for psychological profiling, AI personalization, and targeted marketing"
            isCompleted={(data.goals?.length || 0) > 0}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {goalOptions.map((goal) => (
                <button
                  key={goal}
                  onClick={() => {
                    const current = data.goals || []
                    const updated = current.includes(goal)
                      ? current.filter((g) => g !== goal)
                      : [...current, goal]
                    setData({ ...data, goals: updated })
                  }}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: (data.goals || []).includes(goal)
                      ? 'linear-gradient(135deg, #10b981, #3b82f6)'
                      : '#f3f4f6',
                    border: (data.goals || []).includes(goal)
                      ? '2px solid #10b981'
                      : '1px solid #e5e7eb',
                    color: (data.goals || []).includes(goal) ? '#ffffff' : '#4b5563',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ marginRight: '8px' }}>
                    {goal === 'Weight Loss' && '📉'}
                    {goal === 'Muscle Gain' && '💪'}
                    {goal === 'Stay Healthy' && '💚'}
                    {goal === 'Better Sleep' && '😴'}
                  </span>
                  {goal}
                </button>
              ))}
            </div>

            <div style={{
              background: 'rgba(59,130,246,0.1)',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#3b82f6',
              marginTop: '20px',
              border: '1px solid rgba(59,130,246,0.2)'
            }}>
              ✨ Your profile will be optimized by our advanced AI algorithms
            </div>
          </QuestionCard>
        )}
      </div>

      {/* Navigation buttons fixed at bottom within container */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        padding: '16px',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        gap: '12px',
        background: '#ffffff',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
        boxSizing: 'border-box'
      }}>
        {currentStep > 1 && (
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid #d1d5db',
              background: 'transparent',
              color: '#4b5563',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '14px'
            }}
          >
            ← Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!isCurrentStepComplete()}
          style={{
            flex: currentStep > 1 ? 1 : 2,
            padding: '16px',
            borderRadius: '10px',
            background: isCurrentStepComplete()
              ? 'linear-gradient(135deg, #10b981, #3b82f6)'
              : '#f3f4f6',
            border: 'none',
            color: isCurrentStepComplete() ? '#ffffff' : '#9ca3af',
            fontWeight: 600,
            cursor: isCurrentStepComplete() ? 'pointer' : 'not-allowed',
            opacity: isCurrentStepComplete() ? 1 : 0.6,
            transition: 'all 0.2s',
            fontSize: '14px',
            boxShadow: isCurrentStepComplete() ? '0 4px 20px rgba(16,185,129,0.3)' : 'none'
          }}
        >
          {currentStep === 5 ? 'Complete Registration' : 'Next →'}
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes dsSurveyGlitch {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px) scaleY(1.01); }
          50% { transform: translateX(2px) scaleY(0.99); }
          75% { transform: translateX(-2px) scaleY(1.01); }
        }

        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #3b82f6);
          cursor: pointer;
          boxShadow: 0 2px 8px rgba(16,185,129,0.3);
        }

        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #3b82f6);
          cursor: pointer;
          border: none;
          boxShadow: 0 2px 8px rgba(16,185,129,0.3);
        }

        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        /* Ensure content area is scrollable on mobile devices */
        @media (max-height: 700px) {
          .question-content {
            padding-bottom: 100px;
          }
        }
      `}</style>
    </div>
  )
}

export default RegistrationSurvey
