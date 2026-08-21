/**
 * dataShadowsSession.ts
 * 跨路由传递 Data Shadows 评分数据的 sessionStorage 中转层。
 *
 * 游戏路由（/datashadows/game）完成后把 userChoices 写入，
 * 揭示路由（/datashadows/reveal）读取并计算隐私分数。
 */

const SESSION_KEY = 'datashadows_user_choices_v1'

type PrivacySettings = {
  analytics?: boolean
  marketing?: boolean
  thirdParty?: boolean
  dataRetention?: boolean
  aiTraining?: boolean
}

export type DataShadowsChoices = {
  termsReadingProgress?: number
  termsReadingScore?: number
  privacyOptionsScore?: number
  totalTermsScore?: number
  surveyScore?: number
  uncheckedOptions?: string[]
  skippedOptionalQuestions?: string[]
  filledOptionalQuestions?: number
  sensitiveDataPoints?: string[]
  privacySettings?: PrivacySettings
  surveyHeight?: number
  surveyWeight?: number
  surveyOccupation?: string
  surveyHomeAddress?: string
  surveyWorkoutMinutes?: number
  [key: string]: unknown
}

export const saveDataShadowsChoices = (choices: DataShadowsChoices): void => {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(choices))
  } catch (error) {
    console.error('[DataShadows] Failed to save choices:', error)
  }
}

export const loadDataShadowsChoices = (): DataShadowsChoices | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DataShadowsChoices
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch (error) {
    console.error('[DataShadows] Failed to load choices:', error)
    return null
  }
}

export const clearDataShadowsChoices = (): void => {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch (error) {
    console.error('[DataShadows] Failed to clear choices:', error)
  }
}
