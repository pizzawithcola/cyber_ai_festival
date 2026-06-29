import { apiFetch } from './api'

export type GameScoreKey =
  | 'deepfake'
  | 'hallucinate'
  | 'datashadows'
  | 'retaildemolition'
  | 'phishing'
  | 'final'

type ScoreField =
  | 'game1_score'
  | 'game2_score'
  | 'game3_score'
  | 'game4_score'
  | 'game5_score'

const GAME_SCORE_FIELD_MAP: Record<GameScoreKey, ScoreField> = {
  deepfake: 'game1_score',
  hallucinate: 'game1_score',
  datashadows: 'game2_score',
  retaildemolition: 'game3_score',
  phishing: 'game4_score',
  final: 'game5_score',
}

interface SubmitGameScoreParams {
  userId: number
  game: GameScoreKey
  currentScore: number
}

interface ScorePayload {
  game1_score?: number
  game2_score?: number
  game3_score?: number
  game4_score?: number
  game5_score?: number
}

export interface SubmitGameScoreResult {
  ok: boolean
  userId: number
  game: GameScoreKey
  scoreField: ScoreField
  serverScore: number
  submittedScore: number
  responseStatus: number
}

const normalizeScore = (score: number): number => {
  if (!Number.isFinite(score)) return 0
  return Math.max(0, Math.min(100, score))
}

export const submitGameScoreMax = async ({
  userId,
  game,
  currentScore,
}: SubmitGameScoreParams): Promise<SubmitGameScoreResult> => {
  const scoreField = GAME_SCORE_FIELD_MAP[game]
  let serverScore = 0

  const getResponse = await apiFetch(`/scores/${userId}`)
  if (getResponse.ok) {
    const payload = (await getResponse.json()) as ScorePayload
    const existingScore = payload[scoreField]
    serverScore = typeof existingScore === 'number' ? existingScore : 0
  }

  const submittedScore = Math.max(serverScore, normalizeScore(currentScore))
  const updateResponse = await apiFetch(`/scores/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ [scoreField]: submittedScore }),
  })

  return {
    ok: updateResponse.ok,
    userId,
    game,
    scoreField,
    serverScore,
    submittedScore,
    responseStatus: updateResponse.status,
  }
}
