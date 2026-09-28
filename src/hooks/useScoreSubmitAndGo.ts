import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitGameScoreMax, type GameScoreKey } from '../services/scoreSubmission';

interface SubmitAndGoOptions {
  userId?: number;
  game: GameScoreKey;
  score: number;
}

/**
 * 「提交分数 → 成功后跳排行榜」的统一封装。
 *
 * 保证：**分数没有成功上传，就绝不跳转**。
 * - 提交成功 → navigate(`/ranking/game/<game>`)
 * - 提交失败（HTTP 非 2xx / 网络异常）→ 不跳转，`error` 里带明确报错文案，
 *   调用方把错误展示给用户，用户再次点击按钮即为**手动重试上传**。
 * - 没有 userId（登录态丢失）→ 回该游戏登录页，避免把玩家送去一个没有他数据的排行榜。
 */
export function useScoreSubmitAndGo() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitAndGo = useCallback(
    async ({ userId, game, score }: SubmitAndGoOptions) => {
      setError(null);

      if (!userId) {
        navigate(`/login/${game}`, { replace: true });
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await submitGameScoreMax({ userId, game, currentScore: score });
        if (!result.ok) {
          setError(
            `Score upload failed (server responded ${result.responseStatus}). Your score has NOT been saved — tap the button to retry.`,
          );
          return;
        }
        navigate(`/ranking/game/${game}`);
      } catch (e) {
        setError(
          `Score upload failed: ${e instanceof Error ? e.message : String(e)}. Your score has NOT been saved — tap the button to retry.`,
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [navigate],
  );

  return { submitAndGo, isSubmitting, error };
}
