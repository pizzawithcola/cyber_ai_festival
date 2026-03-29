import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getStoredUser, type StoredUser } from '../../utils/userStorage';
import MatrixRainBackground from '../../components/common/MatrixRainBackground';
import { apiFetch } from '../../services/api';
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
    // Get initial attempt count from state or sessionStorage
    // Start from 0, increment after each submission
    const stateAttempts = (location.state as any)?.attemptCount || 0;
    const storedAttempts = sessionStorage.getItem('phishing_attempt_count');
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
  
  // Get user ID from sessionStorage (stored during login)
  const storedUser = getStoredUser();
  const userId = storedUser?.id;
  
  console.log('[PhishingScorePage] User ID from sessionStorage:', userId);
  
  // Get current game5 score first
  const currentGame5Score = state?.reply?.score_details?.['5']?.[0] || 0;
  
  // Session high score: get from sessionStorage, or use current score if none stored
  const getSessionHighScore = (): number => {
    if (!userId) return currentGame5Score;
    const stored = sessionStorage.getItem(`phishing_session_highscore_${userId}`);
    console.log('[PhishingScorePage] Reading session high score:', { userId, stored, currentGame5Score });
    const storedHigh = stored ? parseFloat(stored) : 0;
    
    // Return the stored high score if it exists, otherwise use current score
    return storedHigh > 0 ? storedHigh : currentGame5Score;
  };
  
  const [sessionHighScore, setSessionHighScore] = useState(getSessionHighScore());
  const isHighScore = currentGame5Score >= sessionHighScore;

  if (!state?.reply) {
    return (
      <MatrixRainBackground>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
          <Typography variant='h5'>No score data available</Typography>
          <Button variant='contained' startIcon={<ArrowBack />} onClick={() => navigate('/phishing')}>
            Back to Phishing Panel
          </Button>
        </Box>
      </MatrixRainBackground>
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

    // Current score from this attempt
    const currentScore = total_score;
    
    console.log('[PhishingScorePage] Submitting score...', {
      userId,
      currentScore,
      sessionHighScore,
    });

    setIsSubmitting(true);
    try {
      // Get existing score from server
      let serverScore = 0;
      try {
        const getUrl = `/scores/${userId}`;
        const getResponse = await apiFetch(getUrl);
        
        if (getResponse.ok) {
          const userData = await getResponse.json();
          serverScore = Number(userData.game5_score) || 0;
        }
      } catch (err) {
        console.log('[PhishingScorePage] Error fetching existing score:', err);
      }
      
      // Calculate the highest score from this session (current vs session high)
      const thisSessionHigh = Math.max(currentScore, sessionHighScore);
      
      // Determine what to submit: use the highest of server score and this session's high score
      console.log('[PhishingScorePage] Score comparison:', {
        currentScore,
        sessionHighScore,
        thisSessionHigh,
        serverScore
      });
      
      // Update session high score if current is higher
      console.log('[PhishingScorePage] Before update:', { currentScore, sessionHighScore, willUpdate: currentScore > sessionHighScore });
      if (currentScore > sessionHighScore) {
        sessionStorage.setItem(`phishing_session_highscore_${userId}`, currentScore.toString());
        sessionStorage.setItem('phishing_attempt_count', attemptCount.toString());
        console.log('[PhishingScorePage] Updated sessionStorage to:', currentScore);
      }

      // Always submit the highest score from this session (even if same as server)
      const scoreToSubmit = Math.max(serverScore, thisSessionHigh);
      
      // Submit to server
      const url = `/scores/${userId}`;
      const requestBody = {
        game5_score: scoreToSubmit
      };
    
      console.log('[PhishingScorePage] Submitting score:', scoreToSubmit);

      const response = await apiFetch(url, {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
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
            </Box>
            <Typography variant='subtitle2' sx={{ color: 'text.secondary' }}>
              out of {maxTotal}
            </Typography>
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
          
          {/* Maximum attempts message */}
          {attemptCount >= 2 && (
            <Typography variant="body2" sx={{ mt: 2, mb: 4, color: 'text.secondary', textAlign: 'center' }}>
              Maximum attempts reached. Click "Next" to finish the challenge.
            </Typography>
          )}
          
          {/* Buttons section */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 3 }}>
            {attemptCount < 2 ? (
              <Button
                variant="contained"
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
                }}
                sx={{ px: 3 }}
              >
                Try Again ({2 - attemptCount} left)
              </Button>
            ) : null}
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
        </Box>
      </Box>
      </Box>
    </MatrixRainBackground>
  );
};

export default PhishingScorePage;
