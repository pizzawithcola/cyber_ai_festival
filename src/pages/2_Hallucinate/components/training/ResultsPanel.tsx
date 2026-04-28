import { Typography, Box, Button, Stack } from '@mui/material';
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
    <Box sx={{ width: '100%', maxWidth: 920, mx: 'auto', mt: 2, textAlign: 'center' }}>
      {resultPage === 'summary' && (
        <Stack spacing={2.4} sx={{ width: '100%', alignItems: 'center' }}>
          <Box
            sx={{
              width: '100%',
              maxWidth: 720,
              mx: 'auto',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                color: '#00ffd9',
                mb: 2,
                display: 'block',
                fontFamily: "'Press Start 2P', 'VT323', monospace",
                fontSize: { xs: '1.28rem', sm: '1.72rem', md: '2.08rem' },
                lineHeight: 1.42,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textShadow:
                  '0 3px 0 rgba(0,0,0,0.55), 0 0 18px rgba(0,255,217,0.32), 0 0 34px rgba(255,46,147,0.18)',
              }}
            >
              Round complete
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.4} sx={{ width: '100%', justifyContent: 'center', mb: 2 }}>
              <Box
                sx={{
                  flex: 1,
                }}
              >
                <Typography variant="caption" sx={{ color: '#c8f7ff', display: 'block', mb: 0.4 }}>
                  SCORE
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#00ffd9', lineHeight: 1.1 }}>
                  {score}
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: 1,
                }}
              >
                <Typography variant="caption" sx={{ color: '#dfe7ff', display: 'block', mb: 0.4 }}>
                  ACCURACY
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#d6ecff', lineHeight: 1.1 }}>
                  {accuracy}%
                </Typography>
              </Box>
            </Stack>
            <Typography variant="caption" sx={{ color: '#d7f2ff', display: 'block', mb: 1.2 }}>
              Total Questions Answered{' '}
              <Box component="span" sx={{ fontWeight: 900, color: '#c7d3ff' }}>
                {totalQuestionsAnswered}
              </Box>
            </Typography>
            <Box
              sx={{
                maxWidth: 620,
                mx: 'auto',
                px: 1.2,
                py: 1,
              }}
            >
              <Typography variant="body1" sx={{ color: '#d7f2ff', lineHeight: 1.75 }}>
                <Box component="span" sx={{ color: feedbackColor, fontWeight: 900 }}>
                  {feedback}
                </Box>
                {' — '}
                {feedbackDetail}
              </Typography>
            </Box>
          </Box>
        </Stack>
      )}

      <Box sx={{ mt: 2.4, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          onClick={onNext}
          sx={{
            fontWeight: 900,
            minWidth: 160,
            minHeight: 48,
            borderRadius: 2.5,
          }}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}
