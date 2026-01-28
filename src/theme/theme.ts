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
        default: paletteMode === 'light' ? '#f5f5f5' : '#121212',
        paper: paletteMode === 'light' ? '#ffffff' : '#1d1d1d',
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
    },
  });

  theme = responsiveFontSizes(theme);
  return theme;
};