import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  LinearProgress,
  useTheme,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

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

  const state = location.state as {
    reply: {
      total_score: number;
      score_details: Record<string, [number, string]>;
    };
  } | null;

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

  const { total_score, score_details } = state.reply;
  const maxTotal = Object.values(CATEGORY_LABELS).reduce((sum, c) => sum + c.maxScore, 0);
  const totalRatio = total_score / maxTotal;

  return (
    <Box sx={{ height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
      <Box sx={{ maxWidth: 1200, width: '100%' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/phishing')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant='h4' sx={{ fontWeight: 700 }}>
            Phishing Score Report
          </Typography>
        </Box>

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
          <Typography
            variant='h2'
            sx={{ fontWeight: 800, color: getScoreColor(totalRatio) }}
          >
            {total_score}
          </Typography>
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
      </Box>
    </Box>
  );
};

export default PhishingScorePage;
