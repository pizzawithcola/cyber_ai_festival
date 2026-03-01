import { Typography, Box, Button, Paper, Stack } from '@mui/material';

import { NEON_CYAN } from '../../hallucinateUi';
import { type ResultPage } from './types';

export function ResultsPanel({
  resultPage,
  score,
  accuracy,
  totalQuestionsAnswered,
  feedback,
  feedbackDetail,
  feedbackColor,
  onNext,
}: {
  resultPage: Exclude<ResultPage, 'complete'>;
  score: number;
  accuracy: number;
  totalQuestionsAnswered: number;
  feedback: string;
  feedbackDetail: string;
  feedbackColor: string;
  onNext: () => void;
}) {
  return (
    <Box sx={{ mt: 2 }}>
      {resultPage === 'summary' && (
        <Stack spacing={2}>
          <Paper
            sx={{
              p: 2,
              border: `1px solid ${NEON_CYAN}`,
              background: 'linear-gradient(135deg, rgba(0, 255, 217, 0.12), rgba(46, 227, 255, 0.06))',
              boxShadow: '0 0 18px rgba(0, 255, 217, 0.2)',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#eaffff', mb: 0.75 }}>
              Round complete
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: NEON_CYAN, mb: 1 }}>
              Score {score}
            </Typography>
            <Stack spacing={0.4} sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ color: '#d7f2ff' }}>
                Accuracy{' '}
                <Box component="span" sx={{ fontWeight: 900, color: NEON_CYAN }}>
                  {accuracy}%
                </Box>
              </Typography>
              <Typography variant="caption" sx={{ color: '#d7f2ff' }}>
                Total Questions Answered{' '}
                <Box component="span" sx={{ fontWeight: 900, color: '#c7d3ff' }}>
                  {totalQuestionsAnswered}
                </Box>
              </Typography>
            </Stack>
            <Box
              sx={{
                mt: 0.25,
                px: 1.1,
                py: 0.9,
                borderRadius: 1,
                border: `1px solid ${feedbackColor}`,
                backgroundColor: 'rgba(0, 0, 0, 0.12)',
              }}
            >
              <Typography variant="body2" sx={{ color: '#d7f2ff', lineHeight: 1.7 }}>
                <Box component="span" sx={{ color: feedbackColor, fontWeight: 900 }}>
                  {feedback}
                </Box>
                {' — '}
                {feedbackDetail}
              </Typography>
            </Box>
          </Paper>
        </Stack>
      )}

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={onNext} sx={{ fontWeight: 900 }}>
          Next
        </Button>
      </Box>
    </Box>
  );
}
