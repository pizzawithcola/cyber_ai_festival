import { Typography, Box, Stack } from '@mui/material';
import { ArcadeButton } from '../../../../components/ui';
import { ARCADE_FONT, READABLE_FONT, TITLE_FONT, arcadeKickerSx, arcadeScreenSx } from '../../hallucinateUi';
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
    <Box sx={{ width: '100%', maxWidth: 1080, mx: 'auto', mt: 2, textAlign: 'center' }}>
      {resultPage === 'summary' && (
        <Stack
          spacing={2.4}
          sx={{
            ...arcadeScreenSx,
            width: '100%',
            alignItems: 'center',
            px: { xs: 1.9, sm: 3, md: 4 },
            py: { xs: 2.6, sm: 3.4, md: 4 },
          }}
        >
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              maxWidth: 840,
              mx: 'auto',
            }}
          >
            <Typography variant="caption" sx={{ ...arcadeKickerSx, mb: 1.5 }}>
              Results screen
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                color: '#ff00ff',
                mb: 2.5,
                display: 'block',
                fontFamily: TITLE_FONT,
                fontSize: { xs: '1.78rem', sm: '2.24rem', md: '2.68rem' },
                lineHeight: 1.3,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                textShadow:
                  '0 3px 0 rgba(0,0,0,0.55), 0 0 18px rgba(255, 0, 255, 0.32), 0 0 34px rgba(255, 46, 147,0.18)',
              }}
            >
              Round complete
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.4} sx={{ width: '100%', justifyContent: 'center', mb: 2 }}>
              <Box
                sx={{
                  flex: 1,
                  px: { xs: 2.3, md: 3.6 },
                  py: 2.4,
                  borderRadius: 0,
                  background: 'linear-gradient(180deg, rgba(255, 0, 255, 0.13), rgba(18, 8, 38, 0.88))',
                  border: '1px solid rgba(255, 0, 255, 0.36)',
                  backdropFilter: 'blur(8px)',
                  textAlign: 'center',
                  boxShadow: 'inset 0 0 18px rgba(255, 0, 255, 0.06)',
                }}
              >
                <Typography variant="caption" sx={{ color: '#ffc7ff', display: 'block', mb: 0.6, letterSpacing: '0.12em', fontFamily: ARCADE_FONT, fontSize: '0.68rem' }}>
                  SCORE
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#ff70bf', fontFamily: TITLE_FONT, lineHeight: 1.1, textShadow: '0 0 18px rgba(255, 0, 255, 0.28)' }}>
                  {score}
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  px: { xs: 2.3, md: 3.6 },
                  py: 2.4,
                  borderRadius: 0,
                  background: 'linear-gradient(180deg, rgba(143, 196, 255, 0.1), rgba(8, 12, 30, 0.88))',
                  border: '1px solid rgba(143, 196, 255, 0.24)',
                  backdropFilter: 'blur(8px)',
                  textAlign: 'center',
                  boxShadow: 'inset 0 0 18px rgba(143, 196, 255, 0.04)',
                }}
              >
                <Typography variant="caption" sx={{ color: '#dfe7ff', display: 'block', mb: 0.6, letterSpacing: '0.12em', fontFamily: ARCADE_FONT, fontSize: '0.68rem' }}>
                  ACCURACY
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#d6ecff', fontFamily: TITLE_FONT, lineHeight: 1.1, textShadow: '0 0 18px rgba(143, 196, 255, 0.22)' }}>
                  {accuracy}%
                </Typography>
              </Box>
            </Stack>
            <Typography variant="caption" sx={{ color: '#d7f2ff', display: 'block', mb: 1.2, fontFamily: READABLE_FONT, letterSpacing: '0.08em' }}>
              Total Questions Answered{' '}
              <Box component="span" sx={{ fontWeight: 900, color: '#c7d3ff' }}>
                {totalQuestionsAnswered}
              </Box>
            </Typography>
            <Box
              sx={{
                maxWidth: 740,
                mx: 'auto',
                px: 1.2,
                py: 1,
              }}
            >
              <Typography variant="body1" sx={{ color: '#d7f2ff', lineHeight: 1.75, fontFamily: READABLE_FONT, fontSize: { xs: '1.05rem', sm: '1.14rem' } }}>
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
        <ArcadeButton
          color="magenta"
          size="md"
          onClick={onNext}
          sx={{
            minWidth: 188,
            minHeight: 54,
          }}
        >
          Next
        </ArcadeButton>
      </Box>
    </Box>
  );
}
