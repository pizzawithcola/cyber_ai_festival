import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getStoredUser } from '../../utils/userStorage';
import MatrixRainBackground from '../../components/common/MatrixRainBackground';
import { submitGameScoreMax } from '../../services/scoreSubmission';
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
  const [attemptCount, setAttemptCount] = useState(() => {
    // Get initial attempt count from state or sessionStorage
    // Start from 0, increment after each submission
    const stateAttempts = (location.state as { attemptCount?: number })?.attemptCount || 0;
    const storedAttempts = sessionStorage.getItem('phishing_attempt_count');
    return stateAttempts > 0 ? stateAttempts : parseInt(storedAttempts || '0', 10);
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  const handleSubmitScoreAndNavigate = async () => {
    // Check if this is a benchmark attempt — skip score submission
    const isBenchmark = sessionStorage.getItem('phishing_is_benchmark') === 'true';
    if (isBenchmark) {
      sessionStorage.removeItem('phishing_is_benchmark');
      navigate('/ranking/game/phishing');
      return;
    }

    if (!userId) {
      console.error('No user_id provided');
      navigate('/ranking/game/phishing');
      return;
    }

    // Current score from this attempt
    const currentScore = total_score;
    
    console.log('[PhishingScorePage] Submitting score...', {
      userId,
      currentScore,
      sessionHighScore,
    });

    setIsSubmitting(true);
    try {
      // Calculate the highest score from this session (current vs session high)
      const thisSessionHigh = Math.max(currentScore, sessionHighScore);

      // Update session high score if current is higher
      console.log('[PhishingScorePage] Before update:', { currentScore, sessionHighScore, willUpdate: currentScore > sessionHighScore });
      if (currentScore > sessionHighScore) {
        sessionStorage.setItem(`phishing_session_highscore_${userId}`, currentScore.toString());
        sessionStorage.setItem('phishing_attempt_count', attemptCount.toString());
        console.log('[PhishingScorePage] Updated sessionStorage to:', currentScore);
      }

      // Submit the highest score from this session via the shared max-submission helper
      const submitResult = await submitGameScoreMax({
        userId,
        game: 'phishing',
        currentScore: thisSessionHigh,
      });
      console.log('[PhishingScorePage] Submitting score:', thisSessionHigh);

      if (!submitResult.ok) {
        console.error('[PhishingScorePage] Score submission failed:', submitResult.responseStatus);
      }
    } catch (err) {
      console.error('Error submitting score:', err);
    } finally {
      setIsSubmitting(false);
      navigate('/ranking/game/phishing');
    }
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
          <Box sx={{ maxWidth: 1200, width: '100%' }}>
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
            <PhishingScoreReport
              total={total_score}
              dimensions={report.dimensions}
              focus={report.focus}
              itemDataMissing={itemDataMissing}
            />
          {/* Maximum attempts message */}
          {attemptCount >= 2 && (
            <Typography variant="body2" sx={{ mt: 2, mb: 4, color: `${ARCADE_COLORS.white}60`, textAlign: 'center', fontFamily: '"Electrolize", sans-serif' }}>
              Maximum attempts reached. Click "Next" to finish the challenge.
            </Typography>
          )}
          
          {/* Buttons section */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 3 }}>
            {attemptCount < 2 ? (
              <ArcadeButton
                color="lime"
                variant="outline"
                onClick={() => {
                  // Update session high score before going back
                  const thisScore = total_score;
                  if (thisScore > sessionHighScore) {
                    sessionStorage.setItem(`phishing_session_highscore_${userId}`, thisScore.toString());
                    console.log('[PhishingScorePage] Try Again - Updated session high to:', thisScore);
                  }
                  const newCount = attemptCount + 1;
                  setAttemptCount(newCount);
                  sessionStorage.setItem('phishing_attempt_count', newCount.toString());
                  navigate('/phishing');
                  sessionStorage.removeItem('phishing_is_benchmark');
                }}
                sx={{ fontFamily: '"Electrolize", sans-serif', letterSpacing: '0.5px' }}
              >
                Try Again ({2 - attemptCount} left)
              </ArcadeButton>
            ) : null}
            <ArcadeButton
              color="lime"
              onClick={handleSubmitScoreAndNavigate}
              disabled={isSubmitting}
              sx={{ fontFamily: '"Electrolize", sans-serif', letterSpacing: '0.5px' }}
            >
              {isSubmitting ? 'Submitting...' : 'Next'} <ArrowForward sx={{ ml: 1 }} />
            </ArcadeButton>
          </Box>
        </Box>
      </Box>
      </Box>
    </MatrixRainBackground>
  );
};

export default PhishingScorePage;
