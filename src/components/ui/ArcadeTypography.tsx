import React from 'react';
import { Typography } from '@mui/material';
import type { TypographyProps } from '@mui/material';
import { ARCADE_COLORS, ARCADE_FONT_MAP } from '../../theme/theme';
import type { ArcadeColor, ArcadeSize, ArcadeFont } from '../../theme/theme';

export type { ArcadeSize, ArcadeFont };

export interface ArcadeTypographyProps extends Omit<TypographyProps, 'variant'> {
  arcadeColor?: ArcadeColor;
  arcadeSize?: ArcadeSize;
  font?: ArcadeFont;
  glow?: boolean;
  blink?: boolean;
  monospace?: boolean;
}

const sizeMap: Record<ArcadeSize, { fontSize: string; letterSpacing: string }> = {
  xl: { fontSize: '3rem', letterSpacing: '6px' },
  lg: { fontSize: '2rem', letterSpacing: '4px' },
  md: { fontSize: '1.25rem', letterSpacing: '3px' },
  sm: { fontSize: '0.875rem', letterSpacing: '2px' },
  xs: { fontSize: '0.625rem', letterSpacing: '1px' },
};

const ArcadeTypography: React.FC<ArcadeTypographyProps> = ({
  children,
  arcadeColor = 'cyan',
  arcadeSize = 'md',
  font,
  glow = true,
  blink = false,
  monospace = false,
  sx,
  component = 'span',
  ...props
}) => {
  const color = ARCADE_COLORS[arcadeColor];
  const size = sizeMap[arcadeSize];

  const glowStyle = glow
    ? {
        textShadow: `0 0 10px ${color}80, 0 0 20px ${color}40, 0 0 40px ${color}20`,
      }
    : {};

  const blinkStyle = blink
    ? {
        animation: 'blink 1s step-end infinite',
        '@keyframes blink': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0 },
        },
      }
    : {};

  const fontFamily = font
    ? ARCADE_FONT_MAP[font]
    : monospace
      ? '"Courier New", monospace'
      : '"Press Start 2P", "Courier New", monospace';

  return (
    <Typography
      component={component}
      {...props}
      sx={{
        fontFamily,
        color: color,
        ...size,
        ...glowStyle,
        ...blinkStyle,
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
};

// Preset components for common use cases
export const ArcadeTitle: React.FC<Omit<ArcadeTypographyProps, 'arcadeSize'>> = (props) => (
  <ArcadeTypography arcadeSize="xl" arcadeColor="magenta" component="h1" {...props} />
);

export const ArcadeSubtitle: React.FC<Omit<ArcadeTypographyProps, 'arcadeSize'>> = (props) => (
  <ArcadeTypography arcadeSize="lg" arcadeColor="cyan" component="h2" {...props} />
);

export const ArcadeHeading: React.FC<Omit<ArcadeTypographyProps, 'arcadeSize'>> = (props) => (
  <ArcadeTypography arcadeSize="md" arcadeColor="yellow" component="h3" {...props} />
);

export const ArcadeText: React.FC<Omit<ArcadeTypographyProps, 'arcadeSize'>> = (props) => (
  <ArcadeTypography arcadeSize="sm" arcadeColor="white" glow={false} {...props} />
);

export const ArcadeLabel: React.FC<Omit<ArcadeTypographyProps, 'arcadeSize'>> = (props) => (
  <ArcadeTypography arcadeSize="xs" arcadeColor="white" glow={false} monospace {...props} />
);

export default ArcadeTypography;
