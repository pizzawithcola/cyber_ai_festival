import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getStoredUser } from '../../utils/userStorage';
import MatrixRainBackground from '../../components/common/MatrixRainBackground';
import { submitGameScoreMax } from '../../services/scoreSubmission';
import {
  Box,
  Typography,
  LinearProgress,
} from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import Header from '../../components/common/Header';
import { ArcadeButton, ArcadeTypography } from '../../components/ui';
import { ARCADE_COLORS } from '../../theme/theme';
import { useClickSound } from '../../hooks/useClickSound';

const CATEGORY_LABELS: Record<string, { label: string; maxScore: number }> = {
  '1': { label: 'Personalization', maxScore: 25 },
  '2': { label: 'Persuasion & Urgency', maxScore: 25 },
  '3': { label: 'Sender Credibility', maxScore: 25 },
  '4': { label: 'Call to Action', maxScore: 25 },
};

function getScoreColor(ratio: number) {
  if (ratio >= 0.7) return '#4caf50';
  if (ratio >= 0.4) return '#ff9800';
  return '#f44336';
}

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

  const { total_score, score_details } = state.reply;
  const maxTotal = Object.values(CATEGORY_LABELS).reduce((sum, c) => sum + c.maxScore, 0);
  const totalRatio = total_score / maxTotal;
  const user = getStoredUser();

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
            {/* Total Score */}
            <Box
              sx={{
                p: 4,
                mb: 4,
                textAlign: 'center',
                border: `2px solid ${getScoreColor(totalRatio)}`,
                backgroundColor: 'rgba(10, 10, 26, 0.95)',
                borderRadius: 1,
                boxShadow: `0 0 20px ${getScoreColor(totalRatio)}40`,
              }}
            >
              <Typography variant='subtitle1' sx={{ color: `${ARCADE_COLORS.white}80`, mb: 1, fontFamily: '"Electrolize", sans-serif' }}>
                TOTAL SCORE
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'baseline', 
                gap: 1,
                justifyContent: 'center'
              }}>
                <ArcadeTypography font="electrolize" arcadeSize="xl" sx={{ color: getScoreColor(totalRatio) }}>
                  {total_score}
                </ArcadeTypography>
              </Box>
              <Typography variant='subtitle2' sx={{ color: `${ARCADE_COLORS.white}60`, fontFamily: '"Electrolize", sans-serif' }}>
                out of {maxTotal}
              </Typography>
              <LinearProgress
                variant='determinate'
                value={totalRatio * 100}
                sx={{
                  mt: 2,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getScoreColor(totalRatio),
                    borderRadius: 5,
                  },
                }}
              />
            </Box>

          {/* Category Scores - 横向排列 */}
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
            {Object.entries(score_details).map(([key, [score, feedback]]) => {
              const category = CATEGORY_LABELS[key] || { label: `Category ${key}`, maxScore: 20 };
              const ratio = score / category.maxScore;

              return (
                <Box
                  key={key}
                  sx={{
                    p: 2.5,
                    flex: '1 1 0',
                    minWidth: 180,
                    border: `1px solid ${getScoreColor(ratio)}30`,
                    backgroundColor: 'rgba(10, 10, 26, 0.9)',
                    borderRadius: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: `0 0 8px ${getScoreColor(ratio)}15`,
                  }}
                >
                  <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 0.5, color: ARCADE_COLORS.white, fontFamily: '"Electrolize", sans-serif' }}>
                    {category.label}
                  </Typography>
                  <Typography
                    variant='h5'
                    sx={{ fontWeight: 700, color: getScoreColor(ratio), mb: 1, fontFamily: '"Electrolize", sans-serif' }}
                  >
                    {score} / {category.maxScore}
                  </Typography>
                  <LinearProgress
                    variant='determinate'
                    value={ratio * 100}
                    sx={{
                      mb: 1.5,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getScoreColor(ratio),
                        borderRadius: 3,
                      },
                    }}
                  />
                  <Typography variant='body2' sx={{ color: `${ARCADE_COLORS.white}90`, fontFamily: '"Electrolize", sans-serif', flex: 1 }}>
                    {feedback}
                  </Typography>
                </Box>
              );
            })}
          </Box>
          
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
