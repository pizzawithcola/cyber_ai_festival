import { Typography, Box, Card, CardContent, CardHeader, Button, Divider, Stack } from '@mui/material';
import { Celebration as CelebrationIcon } from '@mui/icons-material';

import { NEON_CYAN, PRIMARY_HEADER_GRADIENT, PANEL_BODY_BACKGROUND, panelCardSx, panelHeaderSx } from '../../hallucinateUi';

export function ChapterComplete({
  onReviewResults,
  onStartFromBeginning,
}: {
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
