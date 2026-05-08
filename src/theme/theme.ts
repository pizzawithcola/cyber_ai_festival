import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { type PaletteMode } from '@mui/material';

// Arcade Design System Tokens
export const ARCADE_COLORS = {
  magenta: '#ff00ff',
  cyan: '#00ffff',
  yellow: '#ffff00',
  lime: '#00ff00',
  red: '#ff0040',
  orange: '#ff8000',
  purple: '#bf00ff',
  white: '#ffffff',
  dark: '#0a0a1a',
} as const;

export type ArcadeColor = keyof typeof ARCADE_COLORS;

export const GRID_COLOR = '#1a1a3a';

export type ArcadeSize = 'xl' | 'lg' | 'md' | 'sm' | 'xs';

export type ArcadeFont =
  | 'pressstart2p'
  | 'vt323'
  | 'silkscreen'
  | 'kumaroneoutline'
  | 'monoton'
  | 'bungeeoutline'
  | 'orbitron'
  | 'rubikmonoone';

export const ARCADE_FONT_MAP: Record<ArcadeFont, string> = {
  pressstart2p: '"Press Start 2P", monospace',
  vt323: '"VT323", monospace',
  silkscreen: '"Silkscreen", monospace',
  kumaroneoutline: '"Kumar One Outline", cursive',
  monoton: '"Monoton", cursive',
  bungeeoutline: '"Bungee Outline", cursive',
  orbitron: '"Orbitron", sans-serif',
  rubikmonoone: '"Rubik Mono One", monospace',
};

export const getTheme = (paletteMode: PaletteMode) => {
  let theme = createTheme({
    palette: {
      mode: paletteMode,
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: paletteMode === 'light' ? '#f5f5f5' : '#0a1929',
        paper: paletteMode === 'light' ? '#ffffff' : '#102233',
      },
      text: {
        primary: paletteMode === 'light' ? '#000000' : '#e6f7ff',
        secondary: paletteMode === 'light' ? '#555555' : '#a3cfff',
      },
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
      ].join(','),
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            marginBottom: '20px',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: paletteMode === 'light' ? '#ffffff' : '#152a3f',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: paletteMode === 'light' ? '#fafafa' : '#0f2639',
          },
        },
      },
    },
  });

  theme = responsiveFontSizes(theme);
  return theme;
};
