import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from './theme/theme';
import AppRoutes from './routes/AppRoutes';

const App: React.FC = () => {
  const [paletteMode, setPaletteMode] = useState<'light' | 'dark'>('dark');

  // Memoize the theme to prevent unnecessary re-renders
  const theme = useMemo(() => getTheme(paletteMode), [paletteMode]);

  const toggleColorMode = () => {
    setPaletteMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* 100dvh = the *visible* viewport height on mobile (plain 100vh on iOS
          Safari includes the browser chrome, which shifted the matrix-rain
          canvas and cut off bottom-anchored buttons). */}
      <div style={{ width: '100vw', height: '100dvh' }}>
        <Router>
          <AppRoutes toggleColorMode={toggleColorMode} />
        </Router>
      </div>
    </ThemeProvider>
  );
};

export default App;