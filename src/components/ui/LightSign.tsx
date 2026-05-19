import React, { useRef, useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/material/styles';

const blinkA = keyframes`
  0%, 100% { background-color: #ffff00; box-shadow: 0 0 6px #ffff00, 0 0 12px #ffff0060, inset 0 0 3px #ffff00; }
  50% { background-color: #b59556; box-shadow: none; }
`;

const blinkB = keyframes`
  0%, 100% { background-color: #b59556; box-shadow: none; }
  50% { background-color: #ffff00; box-shadow: 0 0 6px #ffff00, 0 0 12px #ffff0060, inset 0 0 3px #ffff00; }
`;

export interface LightSignProps {
  children: React.ReactNode;
}

const Bulb: React.FC<{ group: 'a' | 'b' }> = ({ group }) => (
  <Box
    sx={{
      width: 12,
      height: 12,
      borderRadius: '50%',
      animation: group === 'a'
        ? `${blinkA} 1.2s ease-in-out infinite`
        : `${blinkB} 1.2s ease-in-out infinite`,
    }}
  />
);

const BULB_SPACING = 35;
const BULB_SIZE = 12;
const EDGE_OFFSET = 12; // 灯泡更靠近内部

const LightSign: React.FC<LightSignProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [counts, setCounts] = useState({ h: 8, v: 4 });

  useEffect(() => {
    if (!containerRef.current) return;

    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        // space-evenly 产生 n+1 个间隙
        // 中心间距 = 间隙 + 灯泡宽度
        // n = 可用空间 / (目标间距 - 灯泡宽度) - 1
        const gap = BULB_SPACING - BULB_SIZE;
        const edgeH = w - 2 * EDGE_OFFSET;
        const edgeV = h - 2 * EDGE_OFFSET;
        setCounts({
          h: Math.max(3, Math.floor(edgeH / gap) - 1),
          v: Math.max(3, Math.floor(edgeV / gap) - 1),
        });
      }
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  const { h: hCount, v: vCount } = counts;

  const getGroup = (i: number): 'a' | 'b' =>
    i % 2 === 0 ? 'a' : 'b';

  const tlCorner = 0;
  const topOffset = 1;
  const trCorner = hCount + 1;
  const rightOffset = trCorner + 1;
  const brCorner = rightOffset + vCount;
  const bottomOffset = brCorner + 1;
  const blCorner = bottomOffset + hCount;
  const leftOffset = blCorner + 1;

  const hBulbs = Array.from({ length: hCount }, (_, i) => i);
  const vBulbs = Array.from({ length: vCount }, (_, i) => i);

  return (
    <Box ref={containerRef} sx={{ position: 'relative', display: 'inline-block' }}>
      {/* Sign body with texture */}
      <Box
        sx={{
          position: 'relative',
          backgroundColor: '#b30000',
          backgroundImage: `
            repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 6px),
            radial-gradient(ellipse at center, rgba(255,255,255,0.06) 0%, transparent 70%)
          `,
          backgroundSize: 'auto, 100% 100%',
          border: '5px solid #1a1a1a',
          borderRadius: '2px',
          px: 5,
          py: 3.5,
          textAlign: 'center',
          minWidth: 270,
          zIndex: 1,
        }}
      >
        <Typography
          sx={{
            fontFamily: '"Monoton", cursive',
            fontSize: '2.1rem',
            color: '#ffff00',
            textShadow: '0 0 10px #ffff0090, 0 0 30px #ffff0050, 0 0 60px #ffff0020',
            letterSpacing: '3px',
            lineHeight: 1.4,
            position: 'relative',
            zIndex: 2,
          }}
        >
          {children}
        </Typography>
      </Box>

      {/* Corner bulbs */}
      <Box sx={{ position: 'absolute', top: 4, left: 4, zIndex: 2, pointerEvents: 'none' }}>
        <Bulb key="tl" group={getGroup(tlCorner)} />
      </Box>
      <Box sx={{ position: 'absolute', top: 4, right: 4, zIndex: 2, pointerEvents: 'none' }}>
        <Bulb key="tr" group={getGroup(trCorner)} />
      </Box>
      <Box sx={{ position: 'absolute', bottom: 4, right: 4, zIndex: 2, pointerEvents: 'none' }}>
        <Bulb key="br" group={getGroup(brCorner)} />
      </Box>
      <Box sx={{ position: 'absolute', bottom: 4, left: 4, zIndex: 2, pointerEvents: 'none' }}>
        <Bulb key="bl" group={getGroup(blCorner)} />
      </Box>

      {/* Top bulbs */}
      <Box
        sx={{
          position: 'absolute',
          top: 4,
          left: 12,
          right: 12,
          display: 'flex',
          justifyContent: 'space-evenly',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        {hBulbs.map((i) => (
          <Bulb key={`t-${i}`} group={getGroup(topOffset + i)} />
        ))}
      </Box>

      {/* Right bulbs */}
      <Box
        sx={{
          position: 'absolute',
          right: 4,
          top: 12,
          bottom: 12,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-evenly',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        {vBulbs.map((i) => (
          <Bulb key={`r-${i}`} group={getGroup(rightOffset + i)} />
        ))}
      </Box>

      {/* Bottom bulbs */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 4,
          left: 12,
          right: 12,
          display: 'flex',
          justifyContent: 'space-evenly',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        {hBulbs.map((i) => (
          <Bulb key={`b-${i}`} group={getGroup(bottomOffset + (hCount - 1 - i))} />
        ))}
      </Box>

      {/* Left bulbs */}
      <Box
        sx={{
          position: 'absolute',
          left: 4,
          top: 12,
          bottom: 12,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-evenly',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        {vBulbs.map((i) => (
          <Bulb key={`l-${i}`} group={getGroup(leftOffset + (vCount - 1 - i))} />
        ))}
      </Box>
    </Box>
  );
};

export default LightSign;
