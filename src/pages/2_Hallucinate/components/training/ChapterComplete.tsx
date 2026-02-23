import { Typography, Box, Card, CardContent, CardHeader, Button, Paper, Grid, Divider, Stack } from '@mui/material';
import { Celebration as CelebrationIcon } from '@mui/icons-material';

import { NEON_CYAN, NEON_PINK, NEON_PURPLE, PRIMARY_HEADER_GRADIENT, PANEL_BODY_BACKGROUND, panelCardSx, panelHeaderSx } from '../../hallucinateUi';

export function ChapterComplete({
  accuracy,
  score,
  maxCombo,
  onReviewResults,
  onStartFromBeginning,
}: {
  accuracy: number;
  score: number;
  maxCombo: number;
  onReviewResults: () => void;
  onStartFromBeginning?: () => void;
}) {
  return (
    <Card sx={panelCardSx}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <CelebrationIcon sx={{ color: NEON_CYAN, fontSize: 30 }} />
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              Chapter Complete
            </Typography>
          </Box>
        }
        sx={panelHeaderSx}
      />
      <Divider />
      <CardContent sx={{ background: PANEL_BODY_BACKGROUND }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#eaffff', mb: 0.75 }}>
              Congratulations!
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#d7f2ff', maxWidth: 760 }}>
              You&apos;ve completed all content in this chapter. Your training run is now logged as a clear win.
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper sx={{ p: 2, border: `1px solid ${NEON_CYAN}`, backgroundColor: 'rgba(0, 255, 217, 0.08)', textAlign: 'center' }}>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 900, color: '#bfeeff' }}>
                  Accuracy
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: NEON_CYAN }}>
                  {accuracy}%
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper sx={{ p: 2, border: `1px solid ${NEON_PINK}`, backgroundColor: 'rgba(255, 46, 147, 0.08)', textAlign: 'center' }}>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 900, color: '#ffd0e6' }}>
                  Total Score
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: NEON_PINK }}>
                  {score}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper sx={{ p: 2, border: `1px solid ${NEON_PURPLE}`, backgroundColor: 'rgba(91, 46, 255, 0.08)', textAlign: 'center' }}>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 900, color: '#d9d2ff' }}>
                  Max Combo
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: NEON_PURPLE }}>
                  {maxCombo}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={onReviewResults}
              sx={{ fontWeight: 900, borderColor: NEON_CYAN, color: NEON_CYAN }}
            >
              Review Results
            </Button>
            <Button
              variant="contained"
              onClick={onStartFromBeginning}
              sx={{ fontWeight: 900, background: PRIMARY_HEADER_GRADIENT }}
              disabled={!onStartFromBeginning}
            >
              Start From Beginning
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

