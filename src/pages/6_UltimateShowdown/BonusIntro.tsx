import React, { useEffect, useState } from 'react';
import { Box, keyframes } from '@mui/material';
import { ARCADE_COLORS } from '../../theme/theme';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// Reel symbols spin before settling on the real multiplier, slot-machine style.
const BONUS_REEL = ['×2', '★', '×3', '◆', '×2', '7', '×3', '✦'];

/**
 * Full-screen slot-machine teaser shown before a ×2/×3 question, on both the
 * player phones and the admin screen.
 */
export const BonusIntroView: React.FC<{ multiplier: number }> = ({ multiplier }) => {
  const [spin, setSpin] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setSpin((n) => n + 1), 90);
    return () => window.clearInterval(t);
  }, []);

  const settled = spin > 12;
  const symbol = BONUS_REEL[spin % BONUS_REEL.length];

  return (
    <Box sx={{
      position: 'fixed', inset: 0, zIndex: 60,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(5,5,16,0.95)', animation: `${fadeIn} 0.2s ease`,
    }}>
      <Box sx={{
        fontFamily: '"Press Start 2P", monospace', fontSize: '0.9rem', letterSpacing: '0.3em',
        color: ARCADE_COLORS.yellow, textShadow: `0 0 20px ${ARCADE_COLORS.yellow}80`, mb: 3,
      }}>
        BONUS ROUND
      </Box>
      <Box sx={{
        width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `6px solid ${ARCADE_COLORS.yellow}`, borderRadius: '12px', backgroundColor: '#0a0a1a',
        boxShadow: `0 0 60px ${ARCADE_COLORS.yellow}60, inset 0 0 40px ${ARCADE_COLORS.yellow}20`,
      }}>
        <Box sx={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: settled ? '4rem' : '2.6rem',
          color: settled ? ARCADE_COLORS.lime : ARCADE_COLORS.yellow,
          textShadow: '0 0 30px currentColor', transition: 'font-size 0.15s',
        }}>
          {settled ? `×${multiplier}` : symbol}
        </Box>
      </Box>
      <Box sx={{
        mt: 3, fontFamily: '"Audiowide", sans-serif', fontSize: '1rem',
        color: ARCADE_COLORS.white, letterSpacing: '0.15em', opacity: settled ? 1 : 0.45,
      }}>
        {settled ? `NEXT ANSWER IS WORTH ×${multiplier}` : 'SPINNING…'}
      </Box>
    </Box>
  );
};

export default BonusIntroView;
