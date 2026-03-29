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
  const animationCss = `
@keyframes arcadeGlow {
  0% { text-shadow: 0 0 6px rgba(0, 255, 217, 0.4), 0 0 12px rgba(0, 255, 217, 0.25); }
  50% { text-shadow: 0 0 12px rgba(255, 46, 147, 0.55), 0 0 24px rgba(255, 46, 147, 0.3); }
  100% { text-shadow: 0 0 6px rgba(0, 255, 217, 0.4), 0 0 12px rgba(0, 255, 217, 0.25); }
}
@keyframes badgeFloat {
  0% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
  100% { transform: translateY(0); }
}
@keyframes scanSweep {
  0% { opacity: 0; transform: translateY(-40%); }
  35% { opacity: 0.12; }
  70% { opacity: 0.05; }
  100% { opacity: 0; transform: translateY(40%); }
}
  `;

  return (
    <Card sx={panelCardSx}>
      <style>{animationCss}</style>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <CelebrationIcon sx={{ color: NEON_CYAN, fontSize: 30, animation: 'badgeFloat 3s ease-in-out infinite' }} />
            <Typography variant="h5" sx={{ fontWeight: 900, animation: 'arcadeGlow 2.6s ease-in-out infinite' }}>
              Chapter Complete
            </Typography>
          </Box>
        }
        sx={panelHeaderSx}
      />
      <Divider />
      <CardContent
        sx={{
          background: PANEL_BODY_BACKGROUND,
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,255,217,0.06), rgba(0,0,0,0) 40%, rgba(255,46,147,0.05) 80%, rgba(0,0,0,0))',
            animation: 'scanSweep 4.5s ease-in-out infinite',
            pointerEvents: 'none',
          },
        }}
      >
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#eaffff', mb: 0.75, animation: 'arcadeGlow 2.6s ease-in-out infinite' }}>
              Congratulations!
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                color: '#eaffff',
                maxWidth: 760,
                fontFamily: "'Press Start 2P', 'VT323', monospace",
                lineHeight: 1.6,
                animation: 'arcadeGlow 2.6s ease-in-out infinite',
              }}
            >
              You&apos;ve completed all content in this chapter.
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
