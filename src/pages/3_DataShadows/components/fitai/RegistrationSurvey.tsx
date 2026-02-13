import React, { useState } from 'react'
import { useFitAI } from './fitaiContext'
import ProgressIndicator from './ProgressIndicator'
import QuestionCard from './QuestionCard'
import AIAnalysis from './AIAnalysis'

interface QuestionData {
  name?: string
  avatar?: string
  bodyParts?: string[]
  workHours?: number
  occupation?: string
  locations?: string[]
  goals?: string[]
  height?: number
  weight?: number
  homeAddress?: string
}

const RegistrationSurvey: React.FC = () => {
  const { setScreen, updateUserChoices } = useFitAI()
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<QuestionData>({})
  const [showAI, setShowAI] = useState(false)
  const [lastAnswer, setLastAnswer] = useState('')
  const [heightWeightVisible, setHeightWeightVisible] = useState(false)
  const [addressVisible, setAddressVisible] = useState(false)
  const [occupationVisible, setOccupationVisible] = useState(false)
  const [showLocationSuccess, setShowLocationSuccess] = useState(false) // 新增：位置获取成功提示状态

  const handleNext = () => {
    if (currentStep < 5) {
      setShowAI(true)
      setLastAnswer(JSON.stringify(data))
      setTimeout(() => {
        setShowAI(false)
        setCurrentStep(currentStep + 1)
      }, 1500)
    } else {
      // Save user choices to context
      console.log('Survey completed, saving user choices...')
      
      // Calculate survey score: +10 for each skipped optional question
      const skippedOptionalQuestions: string[] = []
      let surveyScore = 0
      
      if (!heightWeightVisible) {
        skippedOptionalQuestions.push('height_weight')
        surveyScore += 10
      }
      if (!addressVisible) {
        skippedOptionalQuestions.push('home_address')
        surveyScore += 10
      }
      if (!occupationVisible) {
        skippedOptionalQuestions.push('occupation')
        surveyScore += 10
      }
      
      // Update user choices - for privacy scoring
      const choices = {
        surveyScore,
        skippedOptionalQuestions,
        filledOptionalQuestions: 3 - skippedOptionalQuestions.length,
        sensitiveDataPoints: [
          ...(data.height && data.weight ? ['height', 'weight'] : []),
          ...(data.homeAddress ? ['home_address'] : []),
          ...(data.occupation ? ['occupation'] : [])
        ]
      }
      
      console.log('Survey Scoring:', {
        skippedOptionalQuestions,
        surveyScore,
        filledOptionalQuestions: choices.filledOptionalQuestions
      })
      
      // Call updateUserChoices if exists
      if (updateUserChoices) {
        updateUserChoices(choices)
      }
      
      // Navigate to truth reveal page
      console.log('Navigating to truthreveal screen...')
      if (setScreen) {
        setScreen('truthreveal')
      } else {
        console.error('setScreen function is not available')
        // Fallback: redirect or show error
        alert('Cannot navigate to next page. Please contact administrator.')
      }
    }
  }

  const isCurrentStepComplete = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!data.name
      case 2:
        return (data.bodyParts?.length || 0) > 0
      case 3:
        return data.workHours !== undefined && data.workHours > 0
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
            title="What's your name?"
            description="Help us personalize your experience"
            hint="Use your real name for personalized coaching"
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

        {/* Step 3: Lifestyle - 修改为工作相关信息 */}
        {currentStep === 3 && (
          <QuestionCard
            title="What is your daily work schedule?"
            description="This helps us understand your availability and plan workouts around your lifestyle"
            hint="Knowing your work schedule helps optimize timing for workouts"
            dataCollection="Work schedule data used to optimize workout timing, engagement strategies, and behavioral profiling"
            isCompleted={data.workHours !== undefined && data.workHours > 0}
          >
            <div style={{ marginTop: '20px', marginBottom: '20px' }}>
              <div style={{
                marginBottom: '16px'
              }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', marginBottom: '8px', display: 'block' }}>
                  How many hours do you typically work per day?
                </label>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#10b981',
                  textAlign: 'center',
                  marginBottom: '20px'
                }}>
                  {data.workHours || 0} hours
                </div>

                <input
                  type="range"
                  min="1"
                  max="16"
                  value={data.workHours || 0}
                  onChange={(e) => setData({ ...data, workHours: parseInt(e.target.value) })}
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
                  <span>1h</span>
                  <span>16h</span>
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
                💡 This information helps us recommend workout times that fit your schedule and avoid burnout. Research shows people with demanding jobs benefit from strategic workout scheduling.
              </div>
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
          </QuestionCard>
        )}

        {/* Step 4: Exercise Locations */}
        {currentStep === 4 && (
          <QuestionCard
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