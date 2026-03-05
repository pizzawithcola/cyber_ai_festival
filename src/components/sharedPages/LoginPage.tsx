import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { setStoredUser } from '../../utils/userStorage';
import { COUNTRIES } from '../common/Countries';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  Link,
  MenuItem,
  useTheme,
} from '@mui/material';

const GAME_ROUTES: Record<string, string> = {
  deepfake: '/deepfake',
  hallucinate: '/hallucinate',
  datashadows: '/datashadows',
  retaildemolition: '/retaildemolition',
  phishing: '/phishing/edu',
};

const GAME_TITLES: Record<string, string> = {
  deepfake: 'DeepFake',
  hallucinate: 'AI Hallucination',
  datashadows: 'Data Shadows',
  retaildemolition: 'Retail Demolition',
  phishing: 'Phishing Defense',
};

function countryCodeToFlag(code: string) {
  return code
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}

const COUNTRY_NAME_TO_CODE = Object.fromEntries(COUNTRIES.map(c => [c.name, c.code])) as Record<string, string>;

type SnackState = { open: boolean; message: string; severity: 'success' | 'error' | 'warning' };

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { game } = useParams<{ game: string }>();

  const [isRegister, setIsRegister] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginFirstname, setLoginFirstname] = useState('');

  const [regFirstname, setRegFirstname] = useState('');
  const [regLastname, setRegLastname] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCountry, setRegCountry] = useState('');

  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<SnackState>({ open: false, message: '', severity: 'success' });

  const gameTitle = game ? GAME_TITLES[game] || game : 'Game';
  const gameRoute = game ? GAME_ROUTES[game] || '/' : '/';

  const handleLogin = async () => {
    if (!loginEmail || !loginFirstname) {
      setSnack({ open: true, message: 'Please fill in all fields.', severity: 'warning' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8848/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, firstname: loginFirstname }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Login failed');
      }
      const user = await res.json();
      const userId = user?.id;
      const firstname = user?.firstname ?? user?.first_name ?? loginFirstname;
      const lastname = user?.lastname ?? user?.last_name;
      const region = user?.region ?? user?.country;
      const countryCode =
        region && region.length === 2
          ? region.toUpperCase()
          : region
            ? COUNTRY_NAME_TO_CODE[region]
            : undefined;
      if (firstname) setStoredUser({ id: userId, firstname, lastname, countryCode });
      navigate(gameRoute);
    } catch (err) {
      setSnack({ open: true, message: String(err instanceof Error ? err.message : err), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regFirstname || !regLastname || !regEmail || !regCountry) {
      setSnack({ open: true, message: 'Please fill in all fields.', severity: 'warning' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8848/users/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstname: regFirstname,
          lastname: regLastname,
          email: regEmail,
          region: regCountry,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Registration failed');
      }
      setSnack({ open: true, message: 'Registration successful! Please log in.', severity: 'success' });
      setIsRegister(false);
      setLoginEmail(regEmail);
      setLoginFirstname(regFirstname);
      setRegFirstname('');
      setRegLastname('');
      setRegEmail('');
      setRegCountry('');
    } catch (err) {
      setSnack({ open: true, message: String(err instanceof Error ? err.message : err), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #0a1929 0%, #1a2027 100%)'
          : 'linear-gradient(135deg, #e3f2fd 0%, #f5f5f5 100%)',
      }}
    >
      <Paper
        elevation={8}
        sx={{
          width: 420,
          p: 4,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant='h5' sx={{ fontWeight: 700, textAlign: 'center', mb: 0.5 }}>
          {gameTitle}
        </Typography>
        <Typography variant='body2' sx={{ textAlign: 'center', color: 'text.secondary', mb: 3 }}>
          {isRegister ? 'Create a new account' : 'Sign in to continue'}
        </Typography>

        {!isRegister ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label='Email'
              type='email'
              fullWidth
              size='small'
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
            <TextField
              label='First Name'
              fullWidth
              size='small'
              value={loginFirstname}
              onChange={e => setLoginFirstname(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
            <Button
              variant='contained'
              fullWidth
              onClick={handleLogin}
              disabled={loading}
              sx={{ mt: 1, textTransform: 'none', fontWeight: 600 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <Typography variant='body2' sx={{ textAlign: 'center', mt: 1 }}>
              Don&apos;t have an account?{' '}
              <Link component='button' onClick={() => setIsRegister(true)} underline='hover'>
                Register
              </Link>
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                label='First Name'
                fullWidth
                size='small'
                value={regFirstname}
                onChange={e => setRegFirstname(e.target.value)}
              />
              <TextField
                label='Last Name'
                fullWidth
                size='small'
                value={regLastname}
                onChange={e => setRegLastname(e.target.value)}
              />
            </Box>
            <TextField
              label='Email'
              type='email'
              fullWidth
              size='small'
              value={regEmail}
              onChange={e => setRegEmail(e.target.value)}
            />
            <TextField
              label='Country'
              select
              fullWidth
              size='small'
              value={regCountry}
              onChange={e => setRegCountry(e.target.value)}
              slotProps={{
                select: {
                  MenuProps: {
                    PaperProps: { sx: { maxHeight: 300 } },
                    anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
                    transformOrigin: { vertical: 'top', horizontal: 'left' },
                  },
                },
              }}
            >
              {COUNTRIES.map(c => (
                <MenuItem key={c.code} value={c.name}>
                  {countryCodeToFlag(c.code)} {c.name}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant='contained'
              fullWidth
              onClick={handleRegister}
              disabled={loading}
              sx={{ mt: 1, textTransform: 'none', fontWeight: 600 }}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
            <Typography variant='body2' sx={{ textAlign: 'center', mt: 1 }}>
              Already have an account?{' '}
              <Link component='button' onClick={() => setIsRegister(false)} underline='hover'>
                Sign In
              </Link>
            </Typography>
          </Box>
        )}
      </Paper>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnack(prev => ({ ...prev, open: false }))}
          severity={snack.severity}
          variant='filled'
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LoginPage;
