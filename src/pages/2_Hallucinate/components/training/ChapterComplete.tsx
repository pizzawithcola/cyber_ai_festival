import { Typography, Box, Stack } from '@mui/material';
import { Celebration as CelebrationIcon } from '@mui/icons-material';

import { ArcadeButton } from '../../../../components/ui';
import { NEON_CYAN, READABLE_FONT, TITLE_FONT, arcadeKickerSx, arcadeScreenSx } from '../../hallucinateUi';

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
  0% { text-shadow: 0 0 6px rgba(255, 0, 255, 0.4), 0 0 12px rgba(255, 0, 255, 0.25); }
  50% { text-shadow: 0 0 12px rgba(255, 46, 147, 0.55), 0 0 24px rgba(255, 46, 147, 0.3); }
  100% { text-shadow: 0 0 6px rgba(255, 0, 255, 0.4), 0 0 12px rgba(255, 0, 255, 0.25); }
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
        maxWidth: 1080,
        mx: 'auto',
        minHeight: 'calc(100vh - 150px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: { xs: 1.2, md: 2.4 },
        py: { xs: 4.4, md: 6.6 },
      }}
    >
      <style>{animationCss}</style>
      <Stack
        spacing={2.6}
        sx={{
          ...arcadeScreenSx,
          width: '100%',
          alignItems: 'center',
          textAlign: 'center',
          px: { xs: 1.9, sm: 3.1, md: 4.2 },
          py: { xs: 3.2, sm: 4, md: 4.8 },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.25 }}>
            <CelebrationIcon sx={{ color: NEON_CYAN, fontSize: 28, animation: 'badgeFloat 3s ease-in-out infinite' }} />
            <Typography
              variant="caption"
              sx={{
                ...arcadeKickerSx,
                fontWeight: 900,
                color: NEON_CYAN,
              }}
            >
              Chapter Complete
            </Typography>
          </Box>
          <Box sx={{ width: '100%', maxWidth: 860, mx: 'auto', mb: { xs: 3.4, sm: 4.2, md: 4.8 } }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                color: '#eaffff',
                mb: 1.4,
                lineHeight: 1.3,
                fontFamily: TITLE_FONT,
                fontSize: { xs: '1.8rem', sm: '2.45rem', md: '3.1rem' },
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                textShadow: '0 0 24px rgba(255, 0, 255, 0.22), 0 3px 0 rgba(0,0,0,0.45)',
              }}
            >
              Congratulations!
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(228, 241, 255, 0.86)',
                maxWidth: 740,
                mx: 'auto',
                lineHeight: 1.82,
                fontSize: { xs: '1.08rem', sm: '1.18rem' },
                fontFamily: READABLE_FONT,
              }}
            >
              You&apos;ve completed all content in this chapter.
            </Typography>
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.3}
            sx={{
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              maxWidth: 820,
              mx: 'auto',
            }}
          >
            <ArcadeButton
              variant="outline"
              color="magenta"
              size="md"
              onClick={onReviewResults}
              sx={{ minHeight: 56, width: { xs: '100%', sm: 230 } }}
              disabled={isNavigatingToRanking}
            >
              Review Results
            </ArcadeButton>
            <ArcadeButton
              variant="outline"
              color="magenta"
              size="md"
              onClick={onStartFromBeginning}
              sx={{
                minHeight: 56,
                width: { xs: '100%', sm: 230 },
                whiteSpace: 'normal',
                lineHeight: 1.5,
                fontSize: { xs: '0.62rem', sm: '0.82rem' },
              }}
              disabled={!onStartFromBeginning || isNavigatingToRanking}
            >
              Start From Beginning
            </ArcadeButton>
            <ArcadeButton
              color="magenta"
              size="md"
              animation={isNavigatingToRanking ? 'blinking' : 'pulse'}
              onClick={onViewRanking}
              sx={{
                minHeight: 56,
                width: { xs: '100%', sm: 230 },
                whiteSpace: 'normal',
                lineHeight: 1.5,
                fontSize: { xs: '0.62rem', sm: '0.82rem' },
              }}
              disabled={!onViewRanking || isNavigatingToRanking}
            >
              {isNavigatingToRanking ? 'Loading Ranking...' : 'View Ranking'}
            </ArcadeButton>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
