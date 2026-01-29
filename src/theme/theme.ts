import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { type PaletteMode } from '@mui/material';

interface CustomThemeOptions {
  paletteMode: PaletteMode;
}

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