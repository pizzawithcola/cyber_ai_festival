import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser } from '../../utils/userStorage';
import { submitGameScoreMax } from '../../services/scoreSubmission';
import GameSummary from './components/GameSummary';
import ArcadeBackground from './components/ui/ArcadeBackground';
import { loadRetailResult, clearRetailResult } from './retailSession';
import { useClickSound } from '../../hooks/useClickSound';

/**
 * RetailDemolitionSummary — 总结页（/retaildemolition/summary）
 * 从 sessionStorage 读取游戏结果 → 全屏展示 GameSummary → 提交分数。
 */
const RetailDemolitionSummary = () => {
  const navigate = useNavigate();
  // 本页所有按钮播放咔嚓按键音
  useClickSound();
  const [hasVerifiedSession, setHasVerifiedSession] = useState(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resultRef = useRef(loadRetailResult());
  const result = resultRef.current;

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser?.id) {
      navigate('/login/retaildemolition', { replace: true });
      return;
    }
    setHasVerifiedSession(true);
  }, [navigate]);

  // Guard: 无结果直接回入口页
  useEffect(() => {
    if (!result) {
      navigate('/retaildemolition', { replace: true });
    }
  }, [result, navigate]);

  const handleSubmitScore = async (): Promise<void> => {
    if (isSubmittingScore || !result) return;
    const storedUser = getStoredUser();
    const userId = storedUser?.id;
    if (!userId) {
      navigate('/login/retaildemolition', { replace: true });
      return;
    }
    setSubmitError(null);
    setIsSubmittingScore(true);
    try {
      const submitResult = await submitGameScoreMax({
        userId,
        game: 'retaildemolition',
        currentScore: result.score,
      });
      if (!submitResult.ok) {
        setSubmitError('Failed to sync score. Redirecting to leaderboard.');
      }
    } catch (error) {
      console.error('[RetailDemolition] Error submitting score:', error);
      setSubmitError('Network error. Redirecting to leaderboard.');
    } finally {
      setIsSubmittingScore(false);
      navigate('/ranking/game/retaildemolition');
    }
  };

  const handleTryAgain = () => {
    clearRetailResult();
    navigate('/retaildemolition');
  };

  if (!hasVerifiedSession || !result) return null;

  return (
    <div className="relative flex h-screen w-full text-slate-300 font-sans overflow-hidden">
      <ArcadeBackground />
      <div className="relative z-10 flex w-full items-center justify-center overflow-y-auto p-8">
        <div className="w-full max-w-2xl flex flex-col gap-4">
          <GameSummary
            score={result.score}
            decisions={result.decisions}
            scoreEvents={result.scoreEvents}
            manualStepCount={result.manualStepCount}
          />

          {/* 操作按钮 */}
          <div className="flex flex-col gap-3 shrink-0">
            <button
              onClick={() => void handleSubmitScore()}
              disabled={isSubmittingScore}
              className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              {isSubmittingScore ? 'Submitting...' : 'Submit Score & View Leaderboard'}
            </button>
            {submitError && (
              <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3">
                {submitError}
              </div>
            )}
            <button
              onClick={handleTryAgain}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetailDemolitionSummary;
