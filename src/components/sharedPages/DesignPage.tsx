import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { ArcadeButton, ArcadeTypography, LightSign } from '../ui';
import { ARCADE_COLORS, GRID_COLOR } from '../../theme/theme';

const Scanlines: React.FC = () => (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 9999,
      background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
    }}
  />
);

const GridBackground: React.FC = () => (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: -1,
      background: `
        linear-gradient(90deg, ${GRID_COLOR} 1px, transparent 1px),
        linear-gradient(180deg, ${GRID_COLOR} 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px',
      backgroundColor: ARCADE_COLORS.dark,
    }}
  />
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Paper
    elevation={0}
    sx={{
      backgroundColor: 'rgba(10, 10, 26, 0.8)',
      border: `2px solid ${GRID_COLOR}`,
      borderRadius: 0,
      p: 4,
      mb: 4,
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        border: `1px solid ${ARCADE_COLORS.cyan}30`,
        pointerEvents: 'none',
      },
    }}
  >
    <ArcadeTypography arcadeColor="yellow" arcadeSize="md" component="h3">
      {`> ${title}`}
    </ArcadeTypography>
    <Box sx={{ mt: 3 }}>{children}</Box>
  </Paper>
);

const ColorSwatch: React.FC<{ color: string; name: string }> = ({ color, name }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
    <Box
      sx={{
        width: '100%',
        height: 140,
        backgroundColor: color,
        border: `3px solid ${ARCADE_COLORS.white}20`,
        boxShadow: `0 0 15px ${color}60`,
      }}
    />
    <Typography
      sx={{
        fontFamily: '"Courier New", monospace',
        fontSize: '0.7rem',
        color: ARCADE_COLORS.white,
        textAlign: 'center',
      }}
    >
      {name}
    </Typography>
    <Typography
      sx={{
        fontFamily: '"Courier New", monospace',
        fontSize: '0.6rem',
        color: `${ARCADE_COLORS.white}80`,
        textAlign: 'center',
      }}
    >
      {color}
    </Typography>
  </Box>
);

const PatternSwatch: React.FC<{ name: string }> = ({ name }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
    <Box
      sx={{
        width: '100%',
        height: 140,
        backgroundColor: ARCADE_COLORS.dark,
        backgroundImage: `
          linear-gradient(90deg, ${GRID_COLOR} 1px, transparent 1px),
          linear-gradient(180deg, ${GRID_COLOR} 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        border: `3px solid ${ARCADE_COLORS.white}20`,
      }}
    />
    <Typography
      sx={{
        fontFamily: '"Courier New", monospace',
        fontSize: '0.7rem',
        color: ARCADE_COLORS.white,
        textAlign: 'center',
      }}
    >
      {name}
    </Typography>
    <Typography
      sx={{
        fontFamily: '"Courier New", monospace',
        fontSize: '0.6rem',
        color: `${ARCADE_COLORS.white}80`,
        textAlign: 'center',
      }}
    >
      {'//'} PATTERN
    </Typography>
  </Box>
);

const DesignPage: React.FC = () => {
  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', pb: 8 }}>
      <GridBackground />
      <Scanlines />

      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 4, position: 'relative', zIndex: 1 }}>
        {/* Title */}
        <Box sx={{ textAlign: 'center', mb: 6, pt: 4 }}>
          <ArcadeTypography arcadeColor="magenta" arcadeSize="xl" component="h1">
            ARCADE
          </ArcadeTypography>
          <ArcadeTypography arcadeColor="cyan" arcadeSize="lg" component="h2" blink>
            DESIGN SYSTEM
          </ArcadeTypography>
          <Typography
            sx={{
              fontFamily: '"Courier New", monospace',
              color: `${ARCADE_COLORS.white}60`,
              mt: 2,
              fontSize: '0.875rem',
            }}
          >
            {'<'} V 1.0.0 {'>'} | {'{'} 199X RETRO FUTURE {'}'}
          </Typography>
        </Box>

        {/* Color Palette */}
        <Section title="COLOR PALETTE">
          {/* Color row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, mb: 3 }}>
            <ColorSwatch color={ARCADE_COLORS.magenta} name="MAGENTA" />
            <ColorSwatch color={ARCADE_COLORS.cyan} name="CYAN" />
            <ColorSwatch color={ARCADE_COLORS.yellow} name="YELLOW" />
            <ColorSwatch color={ARCADE_COLORS.lime} name="LIME" />
            <ColorSwatch color={ARCADE_COLORS.red} name="RED" />
            <ColorSwatch color={ARCADE_COLORS.orange} name="ORANGE" />
            <ColorSwatch color={ARCADE_COLORS.purple} name="PURPLE" />
          </Box>

          {/* Background row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            <ColorSwatch color={ARCADE_COLORS.dark} name="DARK" />
            <ColorSwatch color={GRID_COLOR} name="GRID" />
            <PatternSwatch name="GRID PATTERN" />
          </Box>
        </Section>

        {/* Typography Section */}
        <Section title="TYPOGRAPHY">
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {/* Pixel Fonts Card */}
            <Paper
              elevation={0}
              sx={{
                flex: '1 1 300px',
                backgroundColor: 'rgba(10, 10, 26, 0.9)',
                border: `2px solid ${GRID_COLOR}`,
                borderRadius: 0,
                p: 3,
              }}
            >
              <ArcadeTypography arcadeColor="cyan" arcadeSize="xs" font="pressstart2p" glow={false}>
                {'//'} PIXEL FONTS
              </ArcadeTypography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <ArcadeTypography font="pressstart2p" arcadeSize="sm" arcadeColor="cyan" sx={{ fontSize: '1.25rem' }}>
                  PRESS START 2P
                </ArcadeTypography>
                <ArcadeTypography font="vt323" arcadeSize="sm" arcadeColor="lime" sx={{ fontSize: '2rem' }}>
                  VT323 TERMINAL
                </ArcadeTypography>
                <ArcadeTypography font="silkscreen" arcadeSize="sm" arcadeColor="magenta" sx={{ fontSize: '1.25rem' }}>
                  SILKSCREEN PIXEL
                </ArcadeTypography>
              </Box>
            </Paper>

            {/* Neon / Outline Fonts Card */}
            <Paper
              elevation={0}
              sx={{
                flex: '1 1 300px',
                backgroundColor: 'rgba(10, 10, 26, 0.9)',
                border: `2px solid ${GRID_COLOR}`,
                borderRadius: 0,
                p: 3,
              }}
            >
              <ArcadeTypography arcadeColor="yellow" arcadeSize="xs" font="pressstart2p" glow={false}>
                {'//'} NEON / OUTLINE
              </ArcadeTypography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <ArcadeTypography font="kumaroneoutline" arcadeSize="sm" arcadeColor="yellow" sx={{ fontSize: '1.5rem' }}>
                  KUMAR ONE OUTLINE
                </ArcadeTypography>
                <ArcadeTypography font="monoton" arcadeSize="sm" arcadeColor="red" sx={{ fontSize: '1.5rem' }}>
                  MONOTON NEON
                </ArcadeTypography>
                <ArcadeTypography font="bungeeoutline" arcadeSize="sm" arcadeColor="orange" sx={{ fontSize: '1.25rem' }}>
                  BUNGEE OUTLINE
                </ArcadeTypography>
              </Box>
            </Paper>

            {/* Arcade / Sci-Fi Fonts Card */}
            <Paper
              elevation={0}
              sx={{
                flex: '1 1 300px',
                backgroundColor: 'rgba(10, 10, 26, 0.9)',
                border: `2px solid ${GRID_COLOR}`,
                borderRadius: 0,
                p: 3,
              }}
            >
              <ArcadeTypography arcadeColor="purple" arcadeSize="xs" font="pressstart2p" glow={false}>
                {'//'} ARCADE / SCI-FI
              </ArcadeTypography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <ArcadeTypography font="orbitron" arcadeSize="sm" arcadeColor="purple" sx={{ fontSize: '1.5rem', fontWeight: 900 }}>
                  ORBITRON SCIFI
                </ArcadeTypography>
                <ArcadeTypography font="audiowide" arcadeSize="sm" arcadeColor="cyan" sx={{ fontSize: '1.5rem' }}>
                  AUDIOWIDE ARCADE
                </ArcadeTypography>
                <ArcadeTypography font="electrolize" arcadeSize="sm" arcadeColor="lime" sx={{ fontSize: '1.5rem' }}>
                  ELECTROLIZE DIGITAL
                </ArcadeTypography>
              </Box>
            </Paper>
          </Box>
        </Section>

        {/* Buttons Section */}
        <Section title="BUTTONS">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Color variants */}
            <Box>
              <Typography
                sx={{
                  fontFamily: '"Courier New", monospace',
                  color: `${ARCADE_COLORS.white}60`,
                  fontSize: '0.75rem',
                  mb: 2,
                }}
              >
                {'//'} COLORS
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <ArcadeButton color="magenta">MAGENTA</ArcadeButton>
                <ArcadeButton color="cyan">CYAN</ArcadeButton>
                <ArcadeButton color="yellow">YELLOW</ArcadeButton>
                <ArcadeButton color="lime">LIME</ArcadeButton>
                <ArcadeButton color="red">RED</ArcadeButton>
                <ArcadeButton color="orange">ORANGE</ArcadeButton>
                <ArcadeButton color="purple">PURPLE</ArcadeButton>
              </Box>
            </Box>

            {/* Variant styles */}
            <Box>
              <Typography
                sx={{
                  fontFamily: '"Courier New", monospace',
                  color: `${ARCADE_COLORS.white}60`,
                  fontSize: '0.75rem',
                  mb: 2,
                }}
              >
                {'//'} VARIANTS (CYAN)
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <ArcadeButton color="cyan" variant="filled">FILLED</ArcadeButton>
                <ArcadeButton color="cyan" variant="outline">OUTLINE</ArcadeButton>
                <ArcadeButton color="cyan" variant="ghost">GHOST</ArcadeButton>
              </Box>
            </Box>

            {/* Size variants */}
            <Box>
              <Typography
                sx={{
                  fontFamily: '"Courier New", monospace',
                  color: `${ARCADE_COLORS.white}60`,
                  fontSize: '0.75rem',
                  mb: 2,
                }}
              >
                {'//'} SIZES (CYAN)
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <ArcadeButton color="cyan" size="sm">SMALL</ArcadeButton>
                <ArcadeButton color="cyan" size="md">MEDIUM</ArcadeButton>
                <ArcadeButton color="cyan" size="lg">LARGE</ArcadeButton>
              </Box>
            </Box>

            {/* Animation variants */}
            <Box>
              <Typography
                sx={{
                  fontFamily: '"Courier New", monospace',
                  color: `${ARCADE_COLORS.white}60`,
                  fontSize: '0.75rem',
                  mb: 2,
                }}
              >
                {'//'} ANIMATIONS (CYAN)
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <ArcadeButton color="cyan" animation="blinking">BLINKING</ArcadeButton>
                <ArcadeButton color="cyan" animation="pulse">PULSE</ArcadeButton>
                <ArcadeButton color="cyan" animation="none">STATIC</ArcadeButton>
              </Box>
            </Box>
          </Box>
        </Section>

        {/* Component Demo */}
        <Section title="COMPONENT DEMO">
          <Box
            sx={{
              p: 4,
              border: `2px dashed ${ARCADE_COLORS.cyan}40`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <ArcadeTypography arcadeColor="yellow" arcadeSize="md" component="h3">
              GAME OVER
            </ArcadeTypography>
            <Typography
              sx={{
                fontFamily: '"Courier New", monospace',
                color: ARCADE_COLORS.white,
                fontSize: '1rem',
                textAlign: 'center',
              }}
            >
              SCORE: 999999
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <ArcadeButton color="cyan">TRY AGAIN</ArcadeButton>
              <ArcadeButton color="magenta" variant="outline">
                QUIT
              </ArcadeButton>
            </Box>
          </Box>
        </Section>

        {/* Light Sign */}
        <Section title="LIGHT SIGN">
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <LightSign>CYBER AI ARCADE</LightSign>
          </Box>
        </Section>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Typography
            sx={{
              fontFamily: '"Courier New", monospace',
              color: `${ARCADE_COLORS.white}30`,
              fontSize: '0.75rem',
            }}
          >
            {'*'} INSERT COIN TO CONTINUE {'*'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default DesignPage;
