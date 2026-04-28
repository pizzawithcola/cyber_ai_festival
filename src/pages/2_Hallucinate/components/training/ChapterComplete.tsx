import { Typography, Box, Button, Stack } from '@mui/material';
import { Celebration as CelebrationIcon } from '@mui/icons-material';

import { NEON_CYAN, PRIMARY_HEADER_GRADIENT } from '../../hallucinateUi';

export function ChapterComplete({
  onReviewResults,
  onViewRanking,
  isNavigatingToRanking = false,
  onStartFromBeginning,
}: {
  onReviewResults: () => void;
  onViewRanking?: () => void;
  isNavigatingToRanking?: boolean;
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
    <Box
      sx={{
        width: '100%',
        maxWidth: 920,
        mx: 'auto',
        minHeight: 'calc(100vh - 150px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: { xs: 1, md: 2 },
        py: { xs: 4, md: 6 },
      }}
    >
      <style>{animationCss}</style>
      <Stack spacing={2.6} sx={{ width: '100%', alignItems: 'center', textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.25 }}>
            <CelebrationIcon sx={{ color: NEON_CYAN, fontSize: 28, animation: 'badgeFloat 3s ease-in-out infinite' }} />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 900,
                color: NEON_CYAN,
                fontFamily: "'Press Start 2P', 'VT323', monospace",
                fontSize: { xs: '0.68rem', sm: '0.72rem' },
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Chapter Complete
            </Typography>
          </Box>
          <Box sx={{ width: '100%', maxWidth: 760, mx: 'auto' }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                color: '#eaffff',
                mb: 1,
                lineHeight: 1.58,
                fontFamily: "'Press Start 2P', 'VT323', monospace",
                fontSize: { xs: '1.1rem', sm: '1.42rem', md: '1.76rem' },
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                textShadow: '0 0 18px rgba(0,255,217,0.18)',
              }}
            >
              Congratulations!
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(228, 241, 255, 0.86)',
                maxWidth: 620,
                mx: 'auto',
                lineHeight: 1.82,
                fontSize: { xs: '1rem', sm: '1.08rem' },
              }}
            >
              You&apos;ve completed all content in this chapter.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.3} sx={{ justifyContent: 'center', width: '100%', maxWidth: 700 }}>
            <Button
              variant="outlined"
              onClick={onReviewResults}
              sx={{ fontWeight: 900, borderColor: NEON_CYAN, color: NEON_CYAN, minHeight: 46, borderRadius: 2.5 }}
              disabled={isNavigatingToRanking}
            >
              Review Results
            </Button>
            <Button
              variant="outlined"
              onClick={onStartFromBeginning}
              sx={{ fontWeight: 900, borderColor: 'rgba(255,255,255,0.28)', color: '#eaffff', minHeight: 46, borderRadius: 2.5 }}
              disabled={!onStartFromBeginning || isNavigatingToRanking}
            >
              Start From Beginning
            </Button>
            <Button
              variant="contained"
              onClick={onViewRanking}
              sx={{ fontWeight: 900, background: PRIMARY_HEADER_GRADIENT, minHeight: 46, borderRadius: 2.5 }}
              disabled={!onViewRanking || isNavigatingToRanking}
            >
              {isNavigatingToRanking ? 'Loading Ranking...' : 'View Ranking'}
            </Button>
          </Stack>
      </Stack>
    </Box>
  );
}
