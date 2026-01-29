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
      <div style={{ width: '100vw', height: '100vh' }}>
        <Router>
          <AppRoutes toggleColorMode={toggleColorMode} />
        </Router>
      </div>
    </ThemeProvider>
  );
};

export default App;