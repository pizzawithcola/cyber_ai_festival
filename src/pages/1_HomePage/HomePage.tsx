import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  // AppBar, 
  // Toolbar, 
} from '@mui/material';
import ThemeToggle from '../../components/common/ThemeToggle';

interface HomePageProps {
  toggleColorMode: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ toggleColorMode }) => {

  return (
    <>
      {/* <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Cyber AI Festival
          </Typography>
        </Toolbar>
      </AppBar> */}
      
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h2" component="h1" gutterBottom>
            Welcome to Cyber AI Festival
          </Typography>
          <Typography variant="h5" component="h2" color="text.secondary" gutterBottom>
            Your Vite + React + TypeScript + MUI project is ready!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{width: '100%'}} paragraph>
            This project features a modular architecture with separate routing and theme management,
            supporting both light and dark modes.
          </Typography>
          <ThemeToggle toggleColorMode={toggleColorMode} />
        </Box>
      </Container>
    </>
  );
};

export default HomePage;