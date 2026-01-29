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
        default: paletteMode === 'light' ? '#f5f5f5' : '#0a1929', // 深蓝色背景
        paper: paletteMode === 'light' ? '#ffffff' : '#102233', // 较浅的深蓝色纸张
      },
      text: {
        primary: paletteMode === 'light' ? '#000000' : '#e6f7ff', // 浅蓝白色文字
        secondary: paletteMode === 'light' ? '#555555' : '#a3cfff', // 较浅的蓝色辅助文字
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
            backgroundColor: paletteMode === 'light' ? '#ffffff' : '#152a3f', // 深蓝色卡片
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: paletteMode === 'light' ? '#fafafa' : '#0f2639', // 深蓝色对话框
          },
        },
      },
    },
  });

  theme = responsiveFontSizes(theme);
  return theme;
};