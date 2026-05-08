import React from 'react';
import { Button } from '@mui/material';
import type { ButtonProps } from '@mui/material';
import { ARCADE_COLORS } from '../../theme/theme';
import type { ArcadeColor } from '../../theme/theme';

export { ARCADE_COLORS };
export type { ArcadeColor };

export interface ArcadeButtonProps extends Omit<ButtonProps, 'variant' | 'color' | 'size'> {
  color?: ArcadeColor;
  variant?: 'filled' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glowing?: boolean;
  animation?: 'none' | 'blinking' | 'pulse';
}

const ArcadeButton: React.FC<ArcadeButtonProps> = ({
  children,
  color: colorKey = 'cyan',
  variant = 'filled',
  size = 'md',
  glowing = true,
  animation = 'none',
  sx,
  ...props
}) => {
  const color = ARCADE_COLORS[colorKey];

  const sizeStyles = {
    sm: { padding: '8px 16px', fontSize: '0.625rem' },
    md: { padding: '12px 24px', fontSize: '0.75rem' },
    lg: { padding: '16px 32px', fontSize: '0.875rem' },
  };

  const animationStyles =
    animation === 'blinking'
      ? {
          animation: 'blink 1s step-end infinite',
          '@keyframes blink': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.3 },
          },
        }
      : animation === 'pulse'
        ? {
            animation: 'pulse 1.5s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.05)' },
            },
          }
        : {};

  const baseStyles = {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    textTransform: 'uppercase' as const,
    letterSpacing: '2px',
    borderRadius: 0,
    position: 'relative' as const,
    overflow: 'hidden',
    transition: 'all 0.15s ease',
    ...sizeStyles[size],
  };

  const glowStyle = glowing
    ? {
        filled: `0 0 10px ${color}80, inset 0 0 10px ${color}40`,
        outline: `0 0 5px ${color}40`,
        ghost: 'none',
      }
    : {
        filled: 'none',
        outline: 'none',
        ghost: 'none',
      };

  const hoverGlow = glowing
    ? {
        filled: `0 0 20px ${color}, inset 0 0 20px ${color}60`,
        outline: `0 0 15px ${color}80`,
        ghost: `0 0 15px ${color}40`,
      }
    : {
        filled: 'none',
        outline: 'none',
        ghost: 'none',
      };

  const variants = {
    filled: {
      ...baseStyles,
      backgroundColor: color,
      color: ARCADE_COLORS.dark,
      border: `3px solid ${color}`,
      boxShadow: glowStyle.filled,
      '&:hover': {
        backgroundColor: color,
        boxShadow: hoverGlow.filled,
        transform: animation === 'pulse' ? 'scale(1.05)' : 'translateY(-2px)',
      },
      '&:active': {
        transform: 'translateY(2px)',
        boxShadow: glowStyle.filled,
      },
      '&:disabled': {
        backgroundColor: `${color}40`,
        borderColor: `${color}40`,
        color: `${ARCADE_COLORS.dark}60`,
        boxShadow: 'none',
      },
    },
    outline: {
      ...baseStyles,
      backgroundColor: 'transparent',
      color: color,
      border: `3px solid ${color}`,
      boxShadow: glowStyle.outline,
      '&:hover': {
        backgroundColor: `${color}20`,
        boxShadow: hoverGlow.outline,
        transform: animation === 'pulse' ? 'scale(1.05)' : 'translateY(-2px)',
      },
      '&:active': {
        transform: 'translateY(2px)',
      },
      '&:disabled': {
        color: `${color}40`,
        borderColor: `${color}40`,
        boxShadow: 'none',
      },
    },
    ghost: {
      ...baseStyles,
      backgroundColor: 'transparent',
      color: color,
      border: '3px solid transparent',
      boxShadow: glowStyle.ghost,
      '&:hover': {
        borderColor: color,
        boxShadow: hoverGlow.ghost,
      },
      '&:active': {
        transform: 'translateY(1px)',
      },
      '&:disabled': {
        color: `${color}40`,
        boxShadow: 'none',
      },
    },
  };

  return (
    <Button
      {...props}
      sx={{
        ...variants[variant],
        ...animationStyles,
        ...sx,
      }}
    >
      {children}
    </Button>
  );
};

export default ArcadeButton;
