/**
 * retailSession.ts
 * 跨路由传递 Retail Demolition 结算数据的 sessionStorage 中转层。
 *
 * 游戏路由（/retaildemolition/game）完成后把 score/decisions/scoreEvents 写入，
 * 总结路由（/retaildemolition/summary）读取并展示。
 */

const SESSION_KEY = 'retaildemolition_result_v1'

export interface RetailDecision {
  site: { isMalicious: boolean; isVerified: boolean; name: string }
  timeTaken: number
  decisionType: 'intentional' | 'educational' | 'manual_exploration'
  context: 'agentic_mode' | 'manual_mode'
  scoreImpact: number
  timestamp: number
}

export interface RetailScoreEvent {
  change: number
  reason: string
  meta: Record<string, unknown>
  timestamp: number
}

export interface RetailResult {
  score: number
  decisions: RetailDecision[]
  scoreEvents: RetailScoreEvent[]
  manualStepCount: number
}

export const saveRetailResult = (result: RetailResult): void => {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(result))
  } catch (error) {
    console.error('[RetailDemolition] Failed to save result:', error)
  }
}

export const loadRetailResult = (): RetailResult | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as RetailResult
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch (error) {
    console.error('[RetailDemolition] Failed to load result:', error)
    return null
  }
}

export const clearRetailResult = (): void => {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch (error) {
    console.error('[RetailDemolition] Failed to clear result:', error)
  }
}
