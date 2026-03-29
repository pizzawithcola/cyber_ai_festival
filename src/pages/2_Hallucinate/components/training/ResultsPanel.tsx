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
              p: 2.4,
              border: `1px solid ${NEON_CYAN}`,
              borderRadius: 3,
              background:
                'linear-gradient(135deg, rgba(6, 20, 34, 0.96), rgba(11, 26, 42, 0.94) 55%, rgba(18, 28, 52, 0.94))',
              boxShadow: '0 0 18px rgba(0, 255, 217, 0.16)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 12,
                border: '1px solid rgba(0,255,217,0.12)',
                borderRadius: 2,
                pointerEvents: 'none',
              },
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#eaffff', mb: 0.9 }}>
              Round complete
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 1.5 }}>
              <Paper
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid rgba(0,255,217,0.22)',
                  background: 'rgba(0,255,217,0.06)',
                }}
              >
                <Typography variant="caption" sx={{ color: '#c8f7ff', display: 'block', mb: 0.4 }}>
                  SCORE
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: NEON_CYAN }}>
                  {score}
                </Typography>
              </Paper>
              <Paper
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid rgba(199,211,255,0.18)',
                  background: 'rgba(91, 46, 255, 0.08)',
                }}
              >
                <Typography variant="caption" sx={{ color: '#dfe7ff', display: 'block', mb: 0.4 }}>
                  ACCURACY
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#d6ecff' }}>
                  {accuracy}%
                </Typography>
              </Paper>
            </Stack>
            <Typography variant="caption" sx={{ color: '#d7f2ff', display: 'block', mb: 1.2 }}>
              Total Questions Answered{' '}
              <Box component="span" sx={{ fontWeight: 900, color: '#c7d3ff' }}>
                {totalQuestionsAnswered}
              </Box>
            </Typography>
            <Box
              sx={{
                px: 1.1,
                py: 0.9,
                borderRadius: 1.5,
                border: `1px solid ${feedbackColor}`,
                backgroundColor: 'rgba(0, 0, 0, 0.18)',
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
        <Button variant="contained" onClick={onNext} sx={{ fontWeight: 900, minWidth: 140 }}>
          Next
        </Button>
      </Box>
    </Box>
  );
}
