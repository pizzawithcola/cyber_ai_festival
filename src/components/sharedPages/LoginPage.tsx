import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { setStoredUser } from '../../utils/userStorage';
import { COUNTRIES } from '../common/Countries';
import { apiFetch } from '../../services/api';
import {
  Box,
  TextField,
  Snackbar,
  Alert,
  MenuItem,
  keyframes,
} from '@mui/material';
import { ArcadeButton, ArcadeTypography } from '../ui';
import { ARCADE_COLORS, GRID_COLOR } from '../../theme/theme';

// --- Game theme configurations ---
interface GameTheme {
  title: string;
  subtitle: string;
  color: string;
  colorKey: 'magenta' | 'cyan' | 'yellow' | 'lime';
  bgEffect: 'glitch' | 'matrix' | 'pixel' | 'phishing';
}

const GAME_THEMES: Record<string, GameTheme> = {
  hallucinate: {
    title: 'AI HALLUCINATION',
    subtitle: 'CAN YOU TELL WHAT IS REAL?',
    color: ARCADE_COLORS.magenta,
    colorKey: 'magenta',
    bgEffect: 'glitch',
  },
  datashadows: {
    title: 'DATA SHADOWS',
    subtitle: 'ACCESS GRANTED_',
    color: ARCADE_COLORS.cyan,
    colorKey: 'cyan',
    bgEffect: 'matrix',
  },
  retaildemolition: {
    title: 'RETAIL DEMOLITION',
    subtitle: 'BREAK THE SYSTEM',
    color: ARCADE_COLORS.yellow,
    colorKey: 'yellow',
    bgEffect: 'pixel',
  },
  phishing: {
    title: 'PHISHING ATTACK',
    subtitle: 'DON\'T TAKE THE BAIT',
    color: ARCADE_COLORS.lime,
    colorKey: 'lime',
    bgEffect: 'phishing',
  },
};

const DEFAULT_THEME: GameTheme = {
  title: 'CYBER AI FESTIVAL',
  subtitle: 'SIGN IN TO PLAY',
  color: ARCADE_COLORS.cyan,
  colorKey: 'cyan',
  bgEffect: 'matrix',
};

// --- Animations ---
const glitchFlicker = keyframes`
  0%, 100% { opacity: 1; transform: translate(0); }
  20% { opacity: 0.8; transform: translate(-2px, 1px); }
  40% { opacity: 1; transform: translate(1px, -1px); }
  60% { opacity: 0.9; transform: translate(-1px, 2px); }
  80% { opacity: 1; transform: translate(2px, -1px); }
`;

const scanline = keyframes`
  0% { top: -10%; }
  100% { top: 110%; }
`;

const matrixDrop = keyframes`
  0% { transform: translateY(-100%); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(100vh); opacity: 0; }
`;

const pixelPop = keyframes`
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.8; }
`;

const warningBlink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
`;

const cursorBlink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
`;

const screenFlicker = keyframes`
  0%, 100% { opacity: 1; }
  92% { opacity: 1; }
  93% { opacity: 0.8; }
  94% { opacity: 1; }
`;

const marqueeFlicker = keyframes`
  0%, 100% { opacity: 1; }
  45% { opacity: 1; }
  48% { opacity: 0.3; }
  59% { opacity: 0.25; }
  52% { opacity: 1; }
`;

// --- Screen Background Effects ---
const GlitchBg: React.FC<{ color: string }> = ({ color }) => (
  <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
    <Box sx={{
      position: 'absolute', left: 0, right: 0, height: '2px',
      backgroundColor: `${color}40`, boxShadow: `0 0 10px ${color}`,
      animation: `${scanline} 3s linear infinite`,
    }} />
    <Box sx={{
      position: 'absolute', inset: 0,
      background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${color}08 2px, ${color}08 4px)`,
    }} />
    {[...Array(5)].map((_, i) => (
      <Box key={i} sx={{
        position: 'absolute',
        left: `${10 + i * 18}%`, top: `${20 + (i * 37) % 55}%`,
        width: `${30 + (i * 23) % 60}px`, height: '2px',
        backgroundColor: `${color}30`,
        animation: `${glitchFlicker} ${1.5 + i * 0.3}s ease-in-out infinite`,
        animationDelay: `${i * 0.2}s`,
      }} />
    ))}
  </Box>
);

const MatrixBg: React.FC<{ color: string }> = ({ color }) => (
  <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
    {[...Array(10)].map((_, i) => (
      <Box key={i} sx={{
        position: 'absolute', left: `${5 + i * 10}%`, top: 0,
        fontFamily: '"Courier New", monospace', fontSize: '10px',
        color: `${color}35`, writingMode: 'vertical-rl',
        animation: `${matrixDrop} ${4 + (i * 1.3) % 3}s linear infinite`,
        animationDelay: `${i * 0.5}s`, letterSpacing: '3px',
      }}>
        {Array.from({ length: 15 }, () => String.fromCharCode(0x30A0 + Math.random() * 96)).join('')}
      </Box>
    ))}
  </Box>
);

const PixelBg: React.FC<{ color: string }> = ({ color }) => (
  <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
    {[...Array(15)].map((_, i) => (
      <Box key={i} sx={{
        position: 'absolute',
        left: `${(i * 17) % 88}%`, top: `${(i * 23) % 80}%`,
        width: `${10 + (i * 7) % 16}px`, height: `${10 + (i * 7) % 16}px`,
        border: `2px solid ${color}30`,
        animation: `${pixelPop} ${2 + (i * 0.7) % 3}s ease-in-out infinite`,
        animationDelay: `${i * 0.3}s`,
      }} />
    ))}
  </Box>
);

const PhishingBg: React.FC<{ color: string }> = ({ color }) => (
  <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
    {[...Array(4)].map((_, i) => (
      <Box key={`w-${i}`} sx={{
        position: 'absolute',
        left: `${15 + i * 22}%`, top: `${20 + (i * 31) % 50}%`,
        fontSize: '20px', opacity: 0.2,
        animation: `${warningBlink} ${2 + i * 0.4}s ease-in-out infinite`,
        animationDelay: `${i * 0.5}s`,
      }}>⚠</Box>
    ))}
    {[...Array(3)].map((_, i) => (
      <Box key={`e-${i}`} sx={{
        position: 'absolute',
        right: `${10 + i * 25}%`, bottom: `${15 + (i * 27) % 40}%`,
        width: '32px', height: '22px',
        border: `1px solid ${color}25`, borderRadius: '2px', opacity: 0.4,
      }} />
    ))}
  </Box>
);

const ScreenEffect: React.FC<{ effect: string; color: string }> = ({ effect, color }) => {
  switch (effect) {
    case 'glitch': return <GlitchBg color={color} />;
    case 'matrix': return <MatrixBg color={color} />;
    case 'pixel': return <PixelBg color={color} />;
    case 'phishing': return <PhishingBg color={color} />;
    default: return null;
  }
};

// --- Routes ---
const GAME_ROUTES: Record<string, string> = {
  deepfake: '/deepfake',
  hallucinate: '/hallucinate',
  datashadows: '/datashadows',
  retaildemolition: '/retaildemolition',
  phishing: '/phishing/edu',
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

// --- Themed TextField sx ---
const getTextFieldSx = (color: string) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(5, 5, 15, 0.8)',
    fontFamily: '"Courier New", monospace',
    color: '#ffffff',
    fontSize: '0.85rem',
    '& fieldset': { borderColor: `${color}40` },
    '&:hover fieldset': { borderColor: `${color}80` },
    '&.Mui-focused fieldset': { borderColor: color, boxShadow: `0 0 6px ${color}30` },
  },
  '& .MuiInputLabel-root': { color: `${color}80`, fontFamily: '"Courier New", monospace', fontSize: '0.8rem' },
  '& .MuiInputLabel-root.Mui-focused': { color },
  '& .MuiSelect-icon': { color: `${color}80` },
});

// --- Main Component ---
const LoginPage: React.FC = () => {
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

  const theme = game && GAME_THEMES[game] ? GAME_THEMES[game] : DEFAULT_THEME;
  const gameRoute = game ? GAME_ROUTES[game] || '/' : '/';
  const flickerDuration = useMemo(() => 1 + Math.random() * 1, []);

  const handleLogin = async () => {
    if (!loginEmail || !loginFirstname) {
      setSnack({ open: true, message: 'Please fill in all fields.', severity: 'warning' });
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/users/login', {
        method: 'POST',
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
      const res = await apiFetch('/users/', {
        method: 'POST',
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

  const tfSx = getTextFieldSx(theme.color);

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#050510',
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 2px, ${GRID_COLOR}60 2px, ${GRID_COLOR}60 4px),
          repeating-linear-gradient(90deg, transparent, transparent 2px, ${GRID_COLOR}60 2px, ${GRID_COLOR}60 4px)
        `,
        backgroundSize: '40px 40px',
        p: 3,
      }}
    >
      {/* === ARCADE CABINET (Left-Right Layout) === */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 1000,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          backgroundColor: '#0a0a1a',
          border: `3px solid #2a2a4a`,
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: `0 0 40px rgba(0,0,0,0.5), 0 0 15px ${theme.color}10`,
        }}
      >
        {/* === LEFT SIDE: SCREEN === */}
        <Box
          sx={{
            flex: { md: '0 0 600px' },
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            p: 2.5,
            borderRight: { md: `3px solid #2a2a4a` },
            borderBottom: { xs: `3px solid #2a2a4a`, md: 'none' },
          }}
        >
          {/* Marquee header */}
          <Box
            sx={{
              py: 1,
              px: 2,
              mb: 2,
              backgroundColor: '#0d0d20',
              border: `2px solid ${theme.color}`,
              borderRadius: '6px',
              textAlign: 'center',
              boxShadow: `0 0 12px ${theme.color}50, inset 0 0 15px ${theme.color}15`,
              animation: `${marqueeFlicker} ${flickerDuration}s ease-in-out infinite`,
            }}
          >
            <ArcadeTypography
              arcadeSize="xs"
              component="p"
              sx={{
                color: theme.color,
                textShadow: `0 0 8px ${theme.color}, 0 0 16px ${theme.color}60`,
                letterSpacing: '0.12em',
                fontSize: '0.7rem',
              }}
            >
              {theme.subtitle}
            </ArcadeTypography>
          </Box>

          {/* CRT Screen */}
          <Box
            sx={{
              flex: 1,
              position: 'relative',
              backgroundColor: '#000008',
              border: `4px solid #1a1a30`,
              borderRadius: '8px',
              p: 4,
              minHeight: { xs: 180, md: 260 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              animation: `${screenFlicker} 5s ease-in-out infinite`,
              boxShadow: `
                inset 0 0 80px rgba(0,0,0,0.6),
                inset 0 0 20px ${theme.color}12,
                0 0 4px #1a1a30
              `,
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.12) 1px, rgba(0,0,0,0.12) 2px)',
                pointerEvents: 'none',
                borderRadius: '4px',
              },
            }}
          >
            <ScreenEffect effect={theme.bgEffect} color={theme.color} />

            <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
              <ArcadeTypography
                arcadeSize="lg"
                component="h1"
                sx={{
                  color: theme.color,
                  textShadow: `0 0 10px ${theme.color}, 0 0 30px ${theme.color}80, 0 0 50px ${theme.color}40`,
                  mb: 2,
                  overflowWrap: 'normal',
                  wordBreak: 'keep-all',
                  ...(theme.bgEffect === 'glitch' && {
                    animation: `${glitchFlicker} 3s ease-in-out infinite`,
                  }),
                }}
              >
                {theme.title}
              </ArcadeTypography>

              <ArcadeTypography
                arcadeSize="xs"
                component="p"
                monospace
                sx={{
                  color: `${theme.color}90`,
                  fontSize: '0.7rem',
                  ...(theme.bgEffect === 'matrix' && {
                    '&::after': {
                      content: '"_"',
                      animation: `${cursorBlink} 1s step-end infinite`,
                    },
                  }),
                }}
              >
                INSERT COIN TO START
              </ArcadeTypography>
            </Box>
          </Box>

          {/* Bottom speaker dots */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.8, mt: 2 }}>
            {[...Array(9)].map((_, i) => (
              <Box key={i} sx={{
                width: '4px', height: '4px', borderRadius: '50%',
                backgroundColor: i % 2 === 0 ? `${theme.color}50` : '#2a2a4a',
              }} />
            ))}
          </Box>
        </Box>

        {/* === RIGHT SIDE: CONTROL PANEL === */}
        <Box
          sx={{
            flex: { md: '1 1 auto' },
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            p: 3,
            position: 'relative',
          }}
        >
          {/* --- Top: Bumper Buttons (LB / RB) --- */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Left bumper */}
            <Box sx={{
              width: 40, height: 16,
              backgroundColor: '#1a1a30',
              border: `1px solid #3a3a5a`,
              borderRadius: '4px',
              boxShadow: `inset 0 1px 2px rgba(255,255,255,0.05)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Box component="span" sx={{ fontSize: '8px', color: '#5a5a7a', fontFamily: 'monospace' }}>LB</Box>
            </Box>

            {/* Center coin slot */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: '30px', height: '4px',
                backgroundColor: '#1a1a30',
                borderRadius: '2px',
                border: `1px solid #2a2a4a`,
              }} />
              <ArcadeTypography
                arcadeSize="xs"
                component="span"
                monospace
                sx={{ color: `${ARCADE_COLORS.white}20`, fontSize: '0.45rem' }}
              >
                COIN
              </ArcadeTypography>
              <Box sx={{
                width: '30px', height: '4px',
                backgroundColor: '#1a1a30',
                borderRadius: '2px',
                border: `1px solid #2a2a4a`,
              }} />
            </Box>

            {/* Right bumper */}
            <Box sx={{
              width: 40, height: 16,
              backgroundColor: '#1a1a30',
              border: `1px solid #3a3a5a`,
              borderRadius: '4px',
              boxShadow: `inset 0 1px 2px rgba(255,255,255,0.05)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Box component="span" sx={{ fontSize: '8px', color: '#5a5a7a', fontFamily: 'monospace' }}>RB</Box>
            </Box>
          </Box>

          {/* Divider */}
          <Box sx={{
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${theme.color}40, transparent)`,
            mb: 3,
          }} />

          {/* --- COIN SLOT / LOGIN FORM --- */}
          <Box
            sx={{
              backgroundColor: '#08081a',
              border: `2px solid #2a2a4a`,
              borderRadius: '6px',
              p: 3,
              boxShadow: `inset 2px 2px 6px rgba(0,0,0,0.5), inset -1px -1px 4px rgba(255,255,255,0.03)`,
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <ArcadeTypography
                arcadeSize="xs"
                component="p"
                monospace
                sx={{ color: theme.color, fontSize: '0.65rem', letterSpacing: '0.2em' }}
              >
                {isRegister ? '[ NEW PLAYER ]' : '[ INSERT CREDENTIALS ]'}
              </ArcadeTypography>
            </Box>

            {!isRegister ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label='EMAIL'
                  type='email'
                  fullWidth
                  size='small'
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  sx={tfSx}
                />
                <TextField
                  label='PLAYER NAME'
                  fullWidth
                  size='small'
                  value={loginFirstname}
                  onChange={e => setLoginFirstname(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  sx={tfSx}
                />
                <ArcadeButton
                  color={theme.colorKey}
                  variant="filled"
                  size="md"
                  glowing
                  onClick={handleLogin}
                  disabled={loading}
                  sx={{ width: '100%', mt: 1 }}
                >
                  {loading ? 'LOADING...' : 'INSERT COIN'}
                </ArcadeButton>
                <Box sx={{ textAlign: 'center', mt: 0.5 }}>
                  <Box
                    component="button"
                    onClick={() => setIsRegister(true)}
                    sx={{
                      background: 'none',
                      border: 'none',
                      color: `${ARCADE_COLORS.white}60`,
                      fontFamily: '"Courier New", monospace',
                      fontSize: '0.6rem',
                      cursor: 'pointer',
                      letterSpacing: '0.1em',
                      '&:hover': { color: theme.color, textShadow: `0 0 6px ${theme.color}` },
                    }}
                  >
                    NEW PLAYER? REGISTER HERE
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <TextField
                    label='FIRST NAME'
                    fullWidth
                    size='small'
                    value={regFirstname}
                    onChange={e => setRegFirstname(e.target.value)}
                    sx={tfSx}
                  />
                  <TextField
                    label='LAST NAME'
                    fullWidth
                    size='small'
                    value={regLastname}
                    onChange={e => setRegLastname(e.target.value)}
                    sx={tfSx}
                  />
                </Box>
                <TextField
                  label='EMAIL'
                  type='email'
                  fullWidth
                  size='small'
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  sx={tfSx}
                />
                <TextField
                  label='COUNTRY'
                  select
                  fullWidth
                  size='small'
                  value={regCountry}
                  onChange={e => setRegCountry(e.target.value)}
                  sx={tfSx}
                  slotProps={{
                    select: {
                      MenuProps: {
                        PaperProps: {
                          sx: {
                            maxHeight: 300,
                            backgroundColor: ARCADE_COLORS.dark,
                            border: `1px solid ${theme.color}40`,
                            '& .MuiMenuItem-root': {
                              fontFamily: '"Courier New", monospace',
                              fontSize: '0.8rem',
                              color: ARCADE_COLORS.white,
                              '&:hover': { backgroundColor: `${theme.color}20` },
                              '&.Mui-selected': { backgroundColor: `${theme.color}30` },
                            },
                          },
                        },
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
                <ArcadeButton
                  color={theme.colorKey}
                  variant="filled"
                  size="md"
                  glowing
                  onClick={handleRegister}
                  disabled={loading}
                  sx={{ width: '100%', mt: 1 }}
                >
                  {loading ? 'LOADING...' : 'REGISTER'}
                </ArcadeButton>
                <Box sx={{ textAlign: 'center', mt: 0.5 }}>
                  <Box
                    component="button"
                    onClick={() => setIsRegister(false)}
                    sx={{
                      background: 'none',
                      border: 'none',
                      color: `${ARCADE_COLORS.white}60`,
                      fontFamily: '"Courier New", monospace',
                      fontSize: '0.6rem',
                      cursor: 'pointer',
                      letterSpacing: '0.1em',
                      '&:hover': { color: theme.color, textShadow: `0 0 6px ${theme.color}` },
                    }}
                  >
                    ALREADY REGISTERED? SIGN IN
                  </Box>
                </Box>
              </Box>
            )}
          </Box>

          {/* --- Bottom: Controller Buttons (D-Pad + ABXY) --- */}
          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            {/* D-Pad */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Up */}
              <Box sx={{
                width: 20, height: 20, backgroundColor: '#1a1a30',
                border: `1px solid #3a3a5a`, borderRadius: '3px',
                mb: '-1px',
              }} />
              <Box sx={{ display: 'flex' }}>
                {/* Left */}
                <Box sx={{
                  width: 20, height: 20, backgroundColor: '#1a1a30',
                  border: `1px solid #3a3a5a`, borderRadius: '3px',
                  mr: '-1px',
                }} />
                {/* Center */}
                <Box sx={{
                  width: 20, height: 20, backgroundColor: '#0d0d20',
                  border: `1px solid #3a3a5a`,
                }} />
                {/* Right */}
                <Box sx={{
                  width: 20, height: 20, backgroundColor: '#1a1a30',
                  border: `1px solid #3a3a5a`, borderRadius: '3px',
                  ml: '-1px',
                }} />
              </Box>
              {/* Down */}
              <Box sx={{
                width: 20, height: 20, backgroundColor: '#1a1a30',
                border: `1px solid #3a3a5a`, borderRadius: '3px',
                mt: '-1px',
              }} />
            </Box>

            {/* ABXY Buttons (Diamond layout) */}
            <Box sx={{ position: 'relative', width: 70, height: 70 }}>
              {/* Y - top */}
              <Box sx={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 24, height: 24, borderRadius: '50%',
                backgroundColor: ARCADE_COLORS.yellow,
                boxShadow: `0 0 8px ${ARCADE_COLORS.yellow}60, inset 0 -2px 3px rgba(0,0,0,0.3)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Box component="span" sx={{ fontSize: '9px', fontWeight: 700, color: '#000' }}>Y</Box>
              </Box>
              {/* X - left */}
              <Box sx={{
                position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)',
                width: 24, height: 24, borderRadius: '50%',
                backgroundColor: ARCADE_COLORS.cyan,
                boxShadow: `0 0 8px ${ARCADE_COLORS.cyan}60, inset 0 -2px 3px rgba(0,0,0,0.3)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Box component="span" sx={{ fontSize: '9px', fontWeight: 700, color: '#000' }}>X</Box>
              </Box>
              {/* B - right */}
              <Box sx={{
                position: 'absolute', top: '50%', right: 0, transform: 'translateY(-50%)',
                width: 24, height: 24, borderRadius: '50%',
                backgroundColor: ARCADE_COLORS.red,
                boxShadow: `0 0 8px ${ARCADE_COLORS.red}60, inset 0 -2px 3px rgba(0,0,0,0.3)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Box component="span" sx={{ fontSize: '9px', fontWeight: 700, color: '#000' }}>B</Box>
              </Box>
              {/* A - bottom */}
              <Box sx={{
                position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                width: 24, height: 24, borderRadius: '50%',
                backgroundColor: ARCADE_COLORS.lime,
                boxShadow: `0 0 8px ${ARCADE_COLORS.lime}60, inset 0 -2px 3px rgba(0,0,0,0.3)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Box component="span" sx={{ fontSize: '9px', fontWeight: 700, color: '#000' }}>A</Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Snackbar */}
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

