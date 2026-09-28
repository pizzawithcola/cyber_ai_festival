import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getStoredUser } from '../../utils/userStorage';
import MatrixRainBackground from '../../components/common/MatrixRainBackground';
import { useScoreSubmitAndGo } from '../../hooks/useScoreSubmitAndGo';
import { Box, Typography } from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import Header from '../../components/common/Header';
import { ArcadeButton, ArcadeTypography } from '../../components/ui';
import { ARCADE_COLORS } from '../../theme/theme';
import { useClickSound } from '../../hooks/useClickSound';
import { buildReport } from './scoringRubric';
import PhishingScoreReport from './components/PhishingScoreReport';

const PhishingScorePage: React.FC = () => {
  useClickSound();
  const location = useLocation();
  const navigate = useNavigate();
  // 单次机会：attempt 计数仅保留写入 sessionStorage 的兼容性，不再驱动重试 UI
  const attemptCount = (() => {
    const stateAttempts = (location.state as { attemptCount?: number })?.attemptCount || 0;
    const storedAttempts = sessionStorage.getItem('phishing_attempt_count');
    return stateAttempts > 0 ? stateAttempts : parseInt(storedAttempts || '0', 10);
  })();
  const { submitAndGo, isSubmitting, error: submitError } = useScoreSubmitAndGo();
  
    // Check if this is a benchmark attempt (score won't be recorded)
    const isBenchmark = sessionStorage.getItem('phishing_is_benchmark') === 'true';

  const state = location.state as {
    reply: {
      total_score: number;
      score_details: Record<string, [number, string]>;
      user_id?: number;
    };
  } | null;

  console.log('[PhishingScorePage] State:', state);
  
  // Get user ID from sessionStorage (stored during login)
  const storedUser = getStoredUser();
  const userId = storedUser?.id;
  
  console.log('[PhishingScorePage] User ID from sessionStorage:', userId);
  
  // 本次尝试的总分（用于"无历史最高分"时的兜底；原实现误取 score_details['5'] 单项分）
  const currentAttemptScore = state?.reply?.total_score || 0;

  // Session high score: get from sessionStorage, or fall back to this attempt's total
  const getSessionHighScore = (): number => {
    if (!userId) return currentAttemptScore;
    const stored = sessionStorage.getItem(`phishing_session_highscore_${userId}`);
    console.log('[PhishingScorePage] Reading session high score:', { userId, stored, currentAttemptScore });
    const storedHigh = stored ? parseFloat(stored) : 0;

    // Return the stored high score if it exists, otherwise use this attempt's total
    return storedHigh > 0 ? storedHigh : currentAttemptScore;
  };
  
  const [sessionHighScore] = useState(getSessionHighScore());

  if (!state?.reply) {
    return (
      <MatrixRainBackground>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
          <ArcadeTypography font="electrolize" arcadeColor="white" arcadeSize="sm">No score data available</ArcadeTypography>
          <ArcadeButton color="lime" onClick={() => navigate('/phishing')} sx={{ fontFamily: '"Electrolize", sans-serif', letterSpacing: '0.5px' }}>
            <ArrowBack sx={{ mr: 1 }} /> Back to Phishing Panel
          </ArcadeButton>
        </Box>
      </MatrixRainBackground>
    );
  }

  const user = getStoredUser();
  // 组装玩家可读报告：4 维 × 5 条细则 + 总分（与明细自洽）
  const report = buildReport(state.reply);
  // 展示与提交用同一个数字，保证大屏/排行榜与玩家看到的完全一致
  const total_score = report.total;
  const itemDataMissing = report.dimensions.every((d) => d.verdicts.every((v) => v.score === undefined));

  const handleSubmitScoreAndNavigate = () => {
    // benchmark（不计分的练习模式）—— 当前流程已无入口
    const isBenchmarkAttempt = sessionStorage.getItem('phishing_is_benchmark') === 'true';
    if (isBenchmarkAttempt) {
      sessionStorage.removeItem('phishing_is_benchmark');
      navigate('/ranking/game/phishing');
      return;
    }

    const currentScore = total_score;
    const thisSessionHigh = Math.max(currentScore, sessionHighScore);

    // 记录本局最高分（展示 + 兼容）
    if (userId && currentScore > sessionHighScore) {
      sessionStorage.setItem(`phishing_session_highscore_${userId}`, currentScore.toString());
      sessionStorage.setItem('phishing_attempt_count', attemptCount.toString());
    }

    // 提交成功后才跳排行榜；失败则停留报错、可重试
    void submitAndGo({ userId, game: 'phishing', score: thisSessionHigh });
  };

  return (
    <MatrixRainBackground>
      <Box sx={{ height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Header
          title='Phishing Score Report'
          firstname={user?.firstname}
          lastname={user?.lastname}
          countryCode={user?.countryCode}
        />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
          <Box sx={{ maxWidth: 1400, width: '96%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Benchmark Banner */}
            {isBenchmark && (
              <Box
                sx={{
                  p: 2,
                  mb: 3,
                  textAlign: 'center',
                  border: `2px solid ${ARCADE_COLORS.yellow}`,
                  backgroundColor: 'rgba(255, 193, 7, 0.08)',
                  borderRadius: 1,
                  boxShadow: `0 0 12px ${ARCADE_COLORS.yellow}30`,
                }}
              >
                <ArcadeTypography font="electrolize" arcadeSize="sm" sx={{ color: ARCADE_COLORS.yellow }}>
                  ⚠ BENCHMARK MODE — Score NOT recorded
                </ArcadeTypography>
              </Box>
            )}
            <Box sx={{ flex: '0 0 80%', minHeight: 0 }}>
              <PhishingScoreReport
                total={total_score}
                dimensions={report.dimensions}
                focus={report.focus}
                itemDataMissing={itemDataMissing}
              />
            </Box>
          {/* Buttons section */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, mt: 'auto', pt: 2 }}>
            <ArcadeButton
              color="lime"
              onClick={handleSubmitScoreAndNavigate}
              disabled={isSubmitting}
              sx={{ fontFamily: '"Electrolize", sans-serif', letterSpacing: '0.5px' }}
            >
              {isSubmitting ? 'Submitting...' : 'View Ranking'} <ArrowForward sx={{ ml: 1 }} />
            </ArcadeButton>
            {submitError && (
              <Typography sx={{ color: ARCADE_COLORS.red, fontFamily: '"Electrolize", sans-serif', fontSize: '0.85rem', textAlign: 'center', maxWidth: 700 }}>
                ⚠ {submitError}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
      </Box>
    </MatrixRainBackground>
  );
};

export default PhishingScorePage;
