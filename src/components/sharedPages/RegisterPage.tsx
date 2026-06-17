import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COUNTRIES } from '../common/Countries';
import { apiFetch } from '../../services/api';
import {
  Box,
  TextField,
  Snackbar,
  Alert,
  MenuItem,
  Dialog,
  keyframes,
} from '@mui/material';
import { ArcadeButton, ArcadeTypography } from '../ui';
import { ARCADE_COLORS, GRID_COLOR } from '../../theme/theme';

const color = ARCADE_COLORS.cyan;

// --- Animations ---
const matrixDrop = keyframes`
  0% { transform: translateY(-100%); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(100vh); opacity: 0; }
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
  52% { opacity: 1; }
`;

// --- Matrix BG ---
const MatrixBg: React.FC = () => (
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

// --- TextField Sx ---
const tfSx = {
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
};

function countryCodeToFlag(code: string) {
  return code.toUpperCase().split('').map(c => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join('');
}

type SnackState = { open: boolean; message: string; severity: 'success' | 'error' | 'warning' };

// --- Main Component ---
const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<SnackState>({ open: false, message: '', severity: 'success' });
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  const [registered, setRegistered] = useState(false);

  const handleRegisterClick = () => {
    if (!firstname || !lastname || !email || !country) {
      setSnack({ open: true, message: 'Please fill in all fields.', severity: 'warning' });
      return;
    }
    setDisclaimerOpen(true);
  };

  const handleRegister = async () => {
    if (!firstname || !lastname || !email || !country) {
      setSnack({ open: true, message: 'Please fill in all fields.', severity: 'warning' });
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/users/', {
        method: 'POST',
        body: JSON.stringify({ firstname, lastname, email, region: country }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Registration failed');
      }
      setDisclaimerOpen(false);
      setRegistered(true);
    } catch (err) {
      setSnack({ open: true, message: String(err instanceof Error ? err.message : err), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
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
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <Box
          sx={{
            maxWidth: 520,
            width: '100%',
            backgroundColor: '#0a0a1a',
            border: `2px solid ${color}`,
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: `0 0 40px ${color}30, 0 0 80px ${color}15`,
          }}
        >
          {/* Header */}
          <Box sx={{
            py: 2, px: 3,
            borderBottom: `1px solid ${color}30`,
            backgroundColor: `${color}10`,
            textAlign: 'center',
          }}>
            <ArcadeTypography arcadeSize="xs" component="p" sx={{ color, fontSize: '0.7rem', letterSpacing: '0.25em' }}>
              REGISTRATION COMPLETE
            </ArcadeTypography>
          </Box>

          {/* Body */}
          <Box sx={{ px: 4, py: 5, textAlign: 'center' }}>
            {/* Icon */}
            <Box sx={{
              width: 64, height: 64, borderRadius: '50%',
              border: `2px solid ${color}`,
              backgroundColor: `${color}10`,
              boxShadow: `0 0 20px ${color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <ArcadeTypography arcadeSize="xs" component="span" sx={{ color, fontSize: '1.5rem', lineHeight: 1 }}>✓</ArcadeTypography>
            </Box>

            <ArcadeTypography
              arcadeSize="md"
              component="h2"
              sx={{ color, mb: 1, textShadow: `0 0 12px ${color}80` }}
            >
              WELCOME
            </ArcadeTypography>
            <ArcadeTypography
              arcadeSize="xs"
              component="p"
              monospace
              glow={false}
              sx={{ color: `${ARCADE_COLORS.white}70`, fontSize: '0.75rem', mb: 3, lineHeight: 2 }}
            >
              {firstname} {lastname}<br />
              Your registration is confirmed.<br />
              See you at the event!
            </ArcadeTypography>

            <Box sx={{
              p: 2, mb: 3,
              border: `1px solid ${color}20`,
              borderRadius: '4px',
              backgroundColor: '#050510',
            }}>
              <ArcadeTypography arcadeSize="xs" component="p" monospace glow={false} sx={{ color: `${ARCADE_COLORS.white}50`, fontSize: '0.6rem', lineHeight: 1.9 }}>
                Keep your email handy — you will need it to sign in on the day of the event.
              </ArcadeTypography>
            </Box>

          </Box>
        </Box>
      </Box>
    );
  }

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
          boxShadow: `0 0 40px rgba(0,0,0,0.5), 0 0 15px ${color}10`,
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
              border: `2px solid ${color}`,
              borderRadius: '6px',
              textAlign: 'center',
              boxShadow: `0 0 12px ${color}50, inset 0 0 15px ${color}15`,
              animation: `${marqueeFlicker} 1.5s ease-in-out infinite`,
            }}
          >
            <ArcadeTypography
              arcadeSize="xs"
              component="p"
              sx={{
                color,
                textShadow: `0 0 8px ${color}, 0 0 16px ${color}60`,
                letterSpacing: '0.12em',
                fontSize: '0.7rem',
              }}
            >
              PRE-REGISTRATION
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
                inset 0 0 20px ${color}12,
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
            <MatrixBg />
            <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
              <ArcadeTypography
                arcadeSize="lg"
                component="h1"
                sx={{
                  color,
                  textShadow: `0 0 10px ${color}, 0 0 30px ${color}80, 0 0 50px ${color}40`,
                  mb: 2,
                  overflowWrap: 'normal',
                  wordBreak: 'keep-all',
                }}
              >
                CYBER AI FESTIVAL
              </ArcadeTypography>
              <ArcadeTypography
                arcadeSize="xs"
                component="p"
                monospace
                sx={{
                  color: `${color}90`,
                  fontSize: '0.7rem',
                  '&::after': {
                    content: '"_"',
                    animation: `${cursorBlink} 1s step-end infinite`,
                  },
                }}
              >
                REGISTER TO PLAY
              </ArcadeTypography>
            </Box>
          </Box>

          {/* Bottom speaker dots */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.8, mt: 2 }}>
            {[...Array(9)].map((_, i) => (
              <Box key={i} sx={{
                width: '4px', height: '4px', borderRadius: '50%',
                backgroundColor: i % 2 === 0 ? `${color}50` : '#2a2a4a',
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
            <Box sx={{
              width: 40, height: 16, backgroundColor: '#1a1a30',
              border: `1px solid #3a3a5a`, borderRadius: '4px',
              boxShadow: `inset 0 1px 2px rgba(255,255,255,0.05)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Box component="span" sx={{ fontSize: '8px', color: '#5a5a7a', fontFamily: 'monospace' }}>LB</Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: '30px', height: '4px', backgroundColor: '#1a1a30', borderRadius: '2px', border: `1px solid #2a2a4a` }} />
              <ArcadeTypography arcadeSize="xs" component="span" monospace sx={{ color: `${ARCADE_COLORS.white}20`, fontSize: '0.45rem' }}>
                COIN
              </ArcadeTypography>
              <Box sx={{ width: '30px', height: '4px', backgroundColor: '#1a1a30', borderRadius: '2px', border: `1px solid #2a2a4a` }} />
            </Box>
            <Box sx={{
              width: 40, height: 16, backgroundColor: '#1a1a30',
              border: `1px solid #3a3a5a`, borderRadius: '4px',
              boxShadow: `inset 0 1px 2px rgba(255,255,255,0.05)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Box component="span" sx={{ fontSize: '8px', color: '#5a5a7a', fontFamily: 'monospace' }}>RB</Box>
            </Box>
          </Box>

          {/* Divider */}
          <Box sx={{ height: '1px', background: `linear-gradient(90deg, transparent, ${color}40, transparent)`, mb: 3 }} />

          {/* --- FORM --- */}
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
              <ArcadeTypography arcadeSize="xs" component="p" monospace sx={{ color, fontSize: '0.65rem', letterSpacing: '0.2em' }}>
                [ NEW PLAYER ]
              </ArcadeTypography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField
                  label='FIRST NAME' fullWidth size='small'
                  value={firstname} onChange={e => setFirstname(e.target.value)} sx={tfSx}
                />
                <TextField
                  label='LAST NAME' fullWidth size='small'
                  value={lastname} onChange={e => setLastname(e.target.value)} sx={tfSx}
                />
              </Box>
              <TextField
                label='EMAIL' type='email' fullWidth size='small'
                value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
                sx={tfSx}
              />
              <TextField
                label='COUNTRY' select fullWidth size='small'
                value={country} onChange={e => setCountry(e.target.value)}
                sx={tfSx}
                slotProps={{
                  select: {
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          maxHeight: 300,
                          backgroundColor: ARCADE_COLORS.dark,
                          border: `1px solid ${color}40`,
                          '& .MuiMenuItem-root': {
                            fontFamily: '"Courier New", monospace',
                            fontSize: '0.8rem',
                            color: ARCADE_COLORS.white,
                            '&:hover': { backgroundColor: `${color}20` },
                            '&.Mui-selected': { backgroundColor: `${color}30` },
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
                color="cyan" variant="filled" size="md" glowing
                onClick={handleRegisterClick} disabled={loading}
                sx={{ width: '100%', mt: 1 }}
              >
                REGISTER
              </ArcadeButton>

              <Box sx={{ textAlign: 'center', mt: 0.5 }}>
                <Box
                  component="button"
                  onClick={() => navigate('/')}
                  sx={{
                    background: 'none', border: 'none',
                    color: `${ARCADE_COLORS.white}60`,
                    fontFamily: '"Courier New", monospace',
                    fontSize: '0.6rem', cursor: 'pointer', letterSpacing: '0.1em',
                    '&:hover': { color, textShadow: `0 0 6px ${color}` },
                  }}
                >
                  ← BACK TO HOME
                </Box>
              </Box>
            </Box>
          </Box>

          {/* --- Bottom: Controller Buttons --- */}
          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            {/* D-Pad */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ width: 20, height: 20, backgroundColor: '#1a1a30', border: `1px solid #3a3a5a`, borderRadius: '3px', mb: '-1px' }} />
              <Box sx={{ display: 'flex' }}>
                <Box sx={{ width: 20, height: 20, backgroundColor: '#1a1a30', border: `1px solid #3a3a5a`, borderRadius: '3px', mr: '-1px' }} />
                <Box sx={{ width: 20, height: 20, backgroundColor: '#0d0d20', border: `1px solid #3a3a5a` }} />
                <Box sx={{ width: 20, height: 20, backgroundColor: '#1a1a30', border: `1px solid #3a3a5a`, borderRadius: '3px', ml: '-1px' }} />
              </Box>
              <Box sx={{ width: 20, height: 20, backgroundColor: '#1a1a30', border: `1px solid #3a3a5a`, borderRadius: '3px', mt: '-1px' }} />
            </Box>
            {/* ABXY Buttons */}
            <Box sx={{ position: 'relative', width: 70, height: 70 }}>
              <Box sx={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 24, height: 24, borderRadius: '50%', backgroundColor: ARCADE_COLORS.yellow, boxShadow: `0 0 8px ${ARCADE_COLORS.yellow}60, inset 0 -2px 3px rgba(0,0,0,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box component="span" sx={{ fontSize: '9px', fontWeight: 700, color: '#000' }}>Y</Box>
              </Box>
              <Box sx={{ position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)', width: 24, height: 24, borderRadius: '50%', backgroundColor: ARCADE_COLORS.cyan, boxShadow: `0 0 8px ${ARCADE_COLORS.cyan}60, inset 0 -2px 3px rgba(0,0,0,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box component="span" sx={{ fontSize: '9px', fontWeight: 700, color: '#000' }}>X</Box>
              </Box>
              <Box sx={{ position: 'absolute', top: '50%', right: 0, transform: 'translateY(-50%)', width: 24, height: 24, borderRadius: '50%', backgroundColor: ARCADE_COLORS.red, boxShadow: `0 0 8px ${ARCADE_COLORS.red}60, inset 0 -2px 3px rgba(0,0,0,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box component="span" sx={{ fontSize: '9px', fontWeight: 700, color: '#000' }}>B</Box>
              </Box>
              <Box sx={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 24, height: 24, borderRadius: '50%', backgroundColor: ARCADE_COLORS.lime, boxShadow: `0 0 8px ${ARCADE_COLORS.lime}60, inset 0 -2px 3px rgba(0,0,0,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box component="span" sx={{ fontSize: '9px', fontWeight: 700, color: '#000' }}>A</Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Disclaimer Dialog */}
      <Dialog
        open={disclaimerOpen}
        onClose={() => setDisclaimerOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#0a0a1a',
            border: `2px solid ${color}`,
            borderRadius: '8px',
            boxShadow: `0 0 30px ${color}40, 0 0 60px ${color}20`,
            maxWidth: 480,
            width: '100%',
            p: 0,
            overflow: 'hidden',
          },
        }}
      >
        {/* Dialog Header */}
        <Box sx={{
          px: 3, py: 1.5,
          borderBottom: `1px solid ${color}30`,
          backgroundColor: `${color}10`,
          textAlign: 'center',
        }}>
          <ArcadeTypography
            arcadeSize="xs"
            component="p"
            sx={{ color, fontSize: '0.8rem', letterSpacing: '0.2em' }}
          >
            ⚠ SYSTEM NOTICE
          </ArcadeTypography>
        </Box>

        {/* Dialog Body */}
        <Box sx={{ px: 3, py: 3 }}>
          <Box sx={{
            p: 2,
            border: `1px solid ${color}20`,
            borderRadius: '4px',
            backgroundColor: '#050510',
            mb: 3,
            '&::before': {
              content: '""',
              display: 'block',
              height: '1px',
              background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
              mb: 1.5,
            },
          }}>
            <ArcadeTypography
              arcadeSize="xs"
              component="p"
              monospace
              glow={false}
              sx={{
                fontSize: '0.8rem',
                color: `${ARCADE_COLORS.white}80`,
                lineHeight: 2,
                letterSpacing: '0.05em',
              }}
            >
              By proceeding, you acknowledge that:
            </ArcadeTypography>
            <Box component="ul" sx={{ mt: 1, pl: 2, m: 0, listStyle: 'none' }}>
              {[
                'Do not enter personal or sensitive data during gameplay.',
                'Your registration info is used solely for this event.',
                'We will not share or retain your data beyond this event.',
              ].map((line, i) => (
                <Box key={i} component="li" sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <ArcadeTypography arcadeSize="xs" component="span" sx={{ color, fontSize: '0.75rem', flexShrink: 0 }}>›</ArcadeTypography>
                  <ArcadeTypography arcadeSize="xs" component="span" monospace glow={false} sx={{ fontSize: '0.75rem', color: `${ARCADE_COLORS.white}60`, lineHeight: 1.8 }}>{line}</ArcadeTypography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Dialog Buttons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <ArcadeButton
              color="white"
              variant="outline"
              size="sm"
              onClick={() => setDisclaimerOpen(false)}
              sx={{ flex: 1, borderColor: `${ARCADE_COLORS.white}40`, color: `${ARCADE_COLORS.white}60` }}
            >
              CANCEL
            </ArcadeButton>
            <ArcadeButton
              color="cyan"
              variant="filled"
              size="sm"
              glowing
              onClick={handleRegister}
              disabled={loading}
              sx={{ flex: 1 }}
            >
              {loading ? 'LOADING...' : 'CONFIRM'}
            </ArcadeButton>
          </Box>
        </Box>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnack(prev => ({ ...prev, open: false }))} severity={snack.severity} variant='filled'>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RegisterPage;
