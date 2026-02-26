import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getStoredUser, type StoredUser } from '../../utils/userStorage';
import {
  Box,
  Typography,
  Paper,
  Button,
  LinearProgress,
  useTheme,
} from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import Header from '../../components/common/Header';

const CATEGORY_LABELS: Record<string, { label: string; maxScore: number }> = {
  '1': { label: 'Personalization', maxScore: 20 },
  '2': { label: 'Persuasion & Urgency', maxScore: 20 },
  '3': { label: 'Sender Credibility', maxScore: 20 },
  '4': { label: 'Call to Action', maxScore: 20 },
  '5': { label: 'Technical Quality', maxScore: 20 },
};

function getScoreColor(ratio: number) {
  if (ratio >= 0.7) return '#4caf50';
  if (ratio >= 0.4) return '#ff9800';
  return '#f44336';
}

const PhishingScorePage: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [attemptCount, setAttemptCount] = useState(() => {
    // Get initial attempt count from state or localStorage
    const stateAttempts = (location.state as any)?.attemptCount || 0;
    const storedAttempts = localStorage.getItem('phishing_attempt_count');
    return stateAttempts > 0 ? stateAttempts : parseInt(storedAttempts || '0', 10);
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const state = location.state as {
    reply: {
      total_score: number;
      score_details: Record<string, [number, string]>;
      user_id?: number;
    };
  } | null;

  console.log('[PhishingScorePage] State:', state);
  
  // Get user ID from localStorage (stored during login)
  const storedUser = getStoredUser();
  const userId = storedUser?.id;
  
  console.log('[PhishingScorePage] User ID from localStorage:', userId);
  
  // Get current game5 score first
  const currentGame5Score = state?.reply?.score_details?.['5']?.[0] || 0;
  
  // Session high score: only keep it if current score beats it
  // Otherwise, reset to current score (this attempt becomes the new baseline)
  const getSessionHighScore = (): number => {
    if (!userId) return currentGame5Score;
    const stored = localStorage.getItem(`phishing_session_highscore_${userId}`);
    const storedHigh = stored ? parseFloat(stored) : 0;
    
    // If current score beats stored high, use current (will update storage later)
    // If not, keep stored high for comparison
    return storedHigh > currentGame5Score ? storedHigh : currentGame5Score;
  };
  
  const [sessionHighScore, setSessionHighScore] = useState(getSessionHighScore());
  const isHighScore = currentGame5Score >= sessionHighScore;

  if (!state?.reply) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
        <Typography variant='h5'>No score data available</Typography>
        <Button variant='contained' startIcon={<ArrowBack />} onClick={() => navigate('/phishing')}>
          Back to Phishing Panel
        </Button>
      </Box>
    );
  }

  const { total_score, score_details, user_id } = state.reply;
  const maxTotal = Object.values(CATEGORY_LABELS).reduce((sum, c) => sum + c.maxScore, 0);
  const totalRatio = total_score / maxTotal;
  const user = getStoredUser();

  const handleSubmitScoreAndNavigate = async () => {
    if (!userId) {
      console.error('No user_id provided');
      navigate('/ranking/game/phishing');
      return;
    }

    // The TOTAL score of Phishing game should be submitted to game5_score
    // total_score = sum of all 5 scoring criteria in Phishing
    const phishingTotalScore = total_score;
    
    console.log('[PhishingScorePage] Submitting score...', {
      userId,
      phishing_total_score: phishingTotalScore,
      explanation: 'Phishing game has 5 criteria, total_score is their sum, which should be uploaded to game5_score',
      sessionHighScore,
      score_details_all_criteria: score_details
    });

    setIsSubmitting(true);
    try {
      console.log('[PhishingScorePage] Phishing scores - Current:', phishingTotalScore, 'Session High:', sessionHighScore);
      
      // Only update and submit if current score beats session high score
      let scoreToSubmit = phishingTotalScore;
      
      if (phishingTotalScore > sessionHighScore && userId) {
        // New session high score! Update localStorage and submit new score
        localStorage.setItem(`phishing_session_highscore_${userId}`, phishingTotalScore.toString());
        localStorage.setItem('phishing_attempt_count', attemptCount.toString());
        setSessionHighScore(phishingTotalScore);
        scoreToSubmit = phishingTotalScore;
        console.log('[PhishingScorePage] New session high score! Submitting:', scoreToSubmit);
      } else {
        // Didn't beat session high score, just submit current score
        console.log('[PhishingScorePage] Did not beat session high. Submitting current:', scoreToSubmit);
      }

      const url = `http://localhost:8848/scores/${userId}`;
      const requestBody = {
        game5_score: scoreToSubmit  // Upload Phishing TOTAL score to game5_score
      };
      
      console.log('[PhishingScorePage] Calling API:', {
        method: 'PUT',
        url,
        body: requestBody
      });

      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('[PhishingScorePage] API Response:', {
        status: response.status,
        ok: response.ok
      });

      if (!response.ok) {
        console.error('Failed to submit score:', response.status);
      } else {
        console.log('[PhishingScorePage] Score submitted successfully!');
      }
    } catch (err) {
      console.error('Error submitting score:', err);
    } finally {
      setIsSubmitting(false);
      navigate('/ranking/game/phishing');
    }
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      <Header
        title='Phishing Score Report'
        firstname={user?.firstname}
        lastname={user?.lastname}
        countryCode={user?.countryCode}
      />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
        <Box sx={{ maxWidth: 1200, width: '100%' }}>
          {/* Total Score */}
          <Paper
            sx={{
              p: 4,
              mb: 4,
              textAlign: 'center',
              border: `2px solid ${getScoreColor(totalRatio)}`,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Typography variant='subtitle1' sx={{ color: 'text.secondary', mb: 1 }}>
              TOTAL SCORE
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'baseline', 
              gap: 1,
              justifyContent: 'center'
            }}>
              <Typography
                variant='h2'
                sx={{ fontWeight: 800, color: getScoreColor(totalRatio) }}
              >
                {total_score}
              </Typography>
              {sessionHighScore > 0 && currentGame5Score <= sessionHighScore && (
                <Typography 
                  variant='h6' 
                  sx={{ 
                    color: 'text.secondary',
                    fontWeight: 500,
                    fontSize: '1rem'
                  }}
                >
                  (Session High: {sessionHighScore})
                </Typography>
              )}
            </Box>
            <Typography variant='subtitle2' sx={{ color: 'text.secondary' }}>
              out of {maxTotal}
            </Typography>
            {isHighScore && (
              <Typography variant='body2' sx={{ mt: 1, color: 'success.main', fontWeight: 600 }}>
                🎉 New High Score!
              </Typography>
            )}
            <LinearProgress
              variant='determinate'
              value={totalRatio * 100}
              sx={{
                mt: 2,
                height: 10,
                borderRadius: 5,
                backgroundColor: theme.palette.action.hover,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getScoreColor(totalRatio),
                  borderRadius: 5,
                },
              }}
            />
          </Paper>

          {/* Category Scores - 横向排列 */}
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
            {Object.entries(score_details).map(([key, [score, feedback]]) => {
              const category = CATEGORY_LABELS[key] || { label: `Category ${key}`, maxScore: 20 };
              const ratio = score / category.maxScore;

              return (
                <Paper
                  key={key}
                  sx={{
                    p: 2.5,
                    flex: '1 1 0',
                    minWidth: 180,
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 0.5 }}>
                    {category.label}
                  </Typography>
                  <Typography
                    variant='h5'
                    sx={{ fontWeight: 700, color: getScoreColor(ratio), mb: 1 }}
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
                      backgroundColor: theme.palette.action.hover,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getScoreColor(ratio),
                        borderRadius: 3,
                      },
                    }}
                  />
                  <Typography variant='body2' sx={{ color: 'text.secondary', flex: 1 }}>
                    {feedback}
                  </Typography>
                </Paper>
              );
            })}
          </Box>
          
          {/* Buttons section */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 5 }}>
            {attemptCount < 3 && (
              <Button
                variant="contained"
                onClick={() => {
                  setAttemptCount((prev: number) => prev + 1);
                  localStorage.setItem('phishing_attempt_count', (attemptCount + 1).toString());
                  navigate('/phishing');
                }}
                sx={{ px: 3 }}
              >
                Try Again ({3 - attemptCount})
              </Button>
            )}
            <Button
              variant="contained"
              onClick={handleSubmitScoreAndNavigate}
              disabled={isSubmitting}
              endIcon={<ArrowForward />}
              sx={{ px: 3 }}
            >
              {isSubmitting ? 'Submitting...' : 'Next'}
            </Button>
          </Box>
          {attemptCount >= 3 && (
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary', textAlign: 'center' }}>
              Maximum attempts reached. Click "Next" to finish the challenge.
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default PhishingScorePage;
