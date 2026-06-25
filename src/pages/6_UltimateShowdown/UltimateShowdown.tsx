import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  LinearProgress,
  TextField,
  keyframes,
} from '@mui/material';
import { Trophy } from 'lucide-react';
import { ArcadeButton } from '../../components/ui';
import { useGameWebSocket } from '../../hooks/useGameWebSocket';
import type { QuestionData, ResultData, LeaderboardEntry, PlayerEntry } from '../../hooks/useGameWebSocket';
import { getStoredUser, setStoredUser } from '../../utils/userStorage';
import { apiFetch } from '../../services/api';
import { ARCADE_COLORS, GRID_COLOR } from '../../theme/theme';
import { COUNTRIES } from '../../components/common/Countries';

// ─── Animations ───────────────────────────────────────────────────────────────
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;
const pulseScale = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
`;

// ─── Shared Styles ────────────────────────────────────────────────────────────
const pageBg = {
  width: '100%', minHeight: '100vh',
  backgroundColor: '#050510',
  backgroundImage: `
    repeating-linear-gradient(0deg, transparent, transparent 2px, ${GRID_COLOR}50 2px, ${GRID_COLOR}50 4px),
    repeating-linear-gradient(90deg, transparent, transparent 2px, ${GRID_COLOR}50 2px, ${GRID_COLOR}50 4px)
  `,
  backgroundSize: '40px 40px',
  display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
  p: 3, boxSizing: 'border-box' as const,
};

const cardSx = {
  backgroundColor: '#0a0a1a',
  border: '2px solid #2a2a4a',
  borderRadius: '8px',
  p: 3,
};

function countryCodeToFlag(code: string) {
  return code.toUpperCase().split('').map(c => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join('');
}
const COUNTRY_NAME_TO_CODE = Object.fromEntries(COUNTRIES.map(c => [c.name, c.code])) as Record<string, string>;

// ─── Join Screen (Step 1: Enter room code) ───────────────────────────────────
const JoinScreen: React.FC<{
  onJoin: (code: string) => void;
  loading: boolean;
  error: string;
  onHostLogin: () => void;
}> = ({ onJoin, loading, error, onHostLogin }) => {
  const [code, setCode] = useState('');

  return (
    <Box sx={{ width: '100%', maxWidth: 400, textAlign: 'center', ...cardSx }}>
      <Box sx={{
        fontFamily: '"Press Start 2P", monospace', fontSize: '0.85rem',
        color: ARCADE_COLORS.magenta, textShadow: `0 0 15px ${ARCADE_COLORS.magenta}60`,
        mb: 3, letterSpacing: '0.1em',
      }}>
        JOIN GAME
      </Box>
      <TextField
        label="ENTER ROOM CODE"
        fullWidth
        size="small"
        value={code}
        onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
        onKeyDown={e => e.key === 'Enter' && code.length === 4 && onJoin(code)}
        inputProps={{ maxLength: 4, style: { fontFamily: '"Courier New", monospace', fontSize: '1.5rem', textAlign: 'center', letterSpacing: '0.5em' } }}
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(5, 5, 15, 0.8)',
            '& fieldset': { borderColor: `${ARCADE_COLORS.magenta}40` },
            '&:hover fieldset': { borderColor: `${ARCADE_COLORS.magenta}80` },
            '&.Mui-focused fieldset': { borderColor: ARCADE_COLORS.magenta },
          },
          '& .MuiInputLabel-root': { color: `${ARCADE_COLORS.magenta}80`, fontFamily: '"Courier New", monospace' },
          '& .MuiInputLabel-root.Mui-focused': { color: ARCADE_COLORS.magenta },
        }}
      />
      {error && (
        <Box sx={{ color: ARCADE_COLORS.red, fontFamily: '"Courier New", monospace', fontSize: '0.7rem', mb: 1 }}>
          {error}
        </Box>
      )}
      <ArcadeButton
        color="magenta"
        variant="filled"
        size="md"
        glowing
        onClick={() => onJoin(code)}
        disabled={loading || code.length !== 4}
        sx={{ width: '100%' }}
      >
        {loading ? 'JOINING...' : 'JOIN ROOM'}
      </ArcadeButton>
      <Box
        onClick={onHostLogin}
        sx={{
          mt: 1.5, cursor: 'pointer',
          fontFamily: '"Courier New", monospace', fontSize: '0.55rem',
          color: `${ARCADE_COLORS.white}25`,
          letterSpacing: '0.15em',
          '&:hover': { color: ARCADE_COLORS.cyan },
          transition: 'color 0.2s',
        }}
      >
        HOST LOGIN
      </Box>
    </Box>
  );
};

// ─── Login Screen (Step 2: Login with existing account or register) ──────────
const LoginScreen: React.FC<{
  onLogin: (email: string, name: string) => void;
  onRegister: (firstname: string, lastname: string, email: string, country: string) => void;
  loading: boolean;
  error: string;
}> = ({ onLogin, onRegister, loading, error }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [regLastname, setRegLastname] = useState('');
  const [regCountry, setRegCountry] = useState('');

  const tfSx = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(5, 5, 15, 0.8)',
      fontFamily: '"Courier New", monospace',
      color: '#ffffff',
      fontSize: '0.85rem',
      '& fieldset': { borderColor: `${ARCADE_COLORS.cyan}40` },
      '&:hover fieldset': { borderColor: `${ARCADE_COLORS.cyan}80` },
      '&.Mui-focused fieldset': { borderColor: ARCADE_COLORS.cyan, boxShadow: `0 0 6px ${ARCADE_COLORS.cyan}30` },
    },
    '& .MuiInputLabel-root': { color: `${ARCADE_COLORS.cyan}80`, fontFamily: '"Courier New", monospace', fontSize: '0.8rem' },
    '& .MuiInputLabel-root.Mui-focused': { color: ARCADE_COLORS.cyan },
    '& .MuiSelect-icon': { color: `${ARCADE_COLORS.cyan}80` },
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 420, textAlign: 'center', ...cardSx }}>
      <Box sx={{
        fontFamily: '"Press Start 2P", monospace', fontSize: '0.75rem',
        color: ARCADE_COLORS.cyan, textShadow: `0 0 15px ${ARCADE_COLORS.cyan}60`,
        mb: 3, letterSpacing: '0.1em',
      }}>
        {isRegister ? 'CREATE ACCOUNT' : 'PLAYER LOGIN'}
      </Box>

      {!isRegister ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="EMAIL"
            type="email"
            fullWidth
            size="small"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && email && name && onLogin(email, name)}
            sx={tfSx}
          />
          <TextField
            label="PLAYER NAME"
            fullWidth
            size="small"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && email && name && onLogin(email, name)}
            sx={tfSx}
          />
          {error && (
            <Box sx={{ color: ARCADE_COLORS.red, fontFamily: '"Courier New", monospace', fontSize: '0.7rem' }}>
              {error}
            </Box>
          )}
          <ArcadeButton
            color="cyan"
            variant="filled"
            size="md"
            glowing
            onClick={() => onLogin(email, name)}
            disabled={loading || !email || !name}
            sx={{ width: '100%' }}
          >
            {loading ? 'LOGGING IN...' : 'LOGIN & JOIN'}
          </ArcadeButton>
          <Box
            component="button"
            onClick={() => setIsRegister(true)}
            sx={{
              background: 'none', border: 'none',
              color: `${ARCADE_COLORS.white}50`,
              fontFamily: '"Courier New", monospace', fontSize: '0.75rem',
              cursor: 'pointer', letterSpacing: '0.1em',
              '&:hover': { color: ARCADE_COLORS.cyan },
            }}
          >
            NEW PLAYER? REGISTER HERE
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField label="FIRST NAME" fullWidth size="small" value={name} onChange={e => setName(e.target.value)} sx={tfSx} />
            <TextField label="LAST NAME" fullWidth size="small" value={regLastname} onChange={e => setRegLastname(e.target.value)} sx={tfSx} />
          </Box>
          <TextField label="EMAIL" type="email" fullWidth size="small" value={email} onChange={e => setEmail(e.target.value)} sx={tfSx} />
          <TextField
            label="COUNTRY"
            select
            fullWidth
            size="small"
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
                      border: `1px solid ${ARCADE_COLORS.cyan}40`,
                      '& .MuiMenuItem-root': {
                        fontFamily: '"Courier New", monospace',
                        fontSize: '0.8rem',
                        color: ARCADE_COLORS.white,
                        '&:hover': { backgroundColor: `${ARCADE_COLORS.cyan}20` },
                        '&.Mui-selected': { backgroundColor: `${ARCADE_COLORS.cyan}30` },
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
          {error && (
            <Box sx={{ color: ARCADE_COLORS.red, fontFamily: '"Courier New", monospace', fontSize: '0.7rem' }}>
              {error}
            </Box>
          )}
          <ArcadeButton
            color="cyan"
            variant="filled"
            size="md"
            glowing
            onClick={() => onRegister(name, regLastname, email, regCountry)}
            disabled={loading || !name || !regLastname || !email || !regCountry}
            sx={{ width: '100%' }}
          >
            {loading ? 'REGISTERING...' : 'REGISTER & JOIN'}
          </ArcadeButton>
          <Box
            component="button"
            onClick={() => setIsRegister(false)}
            sx={{
              background: 'none', border: 'none',
              color: `${ARCADE_COLORS.white}50`,
              fontFamily: '"Courier New", monospace', fontSize: '0.75rem',
              cursor: 'pointer', letterSpacing: '0.1em',
              '&:hover': { color: ARCADE_COLORS.cyan },
            }}
          >
            ALREADY REGISTERED? SIGN IN
          </Box>
        </Box>
      )}
    </Box>
  );
};

// ─── Waiting Room ─────────────────────────────────────────────────────────────
const WaitingRoom: React.FC<{
  roomCode: string;
  playerCount: number;
  players: PlayerEntry[];
  isConnected: boolean;
}> = ({ roomCode, playerCount, players, isConnected }) => (
  <Box sx={{ width: '100%', maxWidth: 600, textAlign: 'center', animation: `${fadeIn} 0.5s ease` }}>
    <Box sx={{ mb: 4 }}>
      <Box sx={{
        fontFamily: '"Press Start 2P", monospace', fontSize: '0.8rem',
        color: ARCADE_COLORS.magenta, textShadow: `0 0 15px ${ARCADE_COLORS.magenta}60`,
        mb: 2, letterSpacing: '0.1em',
      }}>
        WAITING ROOM
      </Box>
      <Box sx={{
        display: 'inline-block', px: 4, py: 1.5, mb: 2,
        fontFamily: '"Press Start 2P", monospace', fontSize: '1.5rem', fontWeight: 900,
        letterSpacing: '0.3em', color: ARCADE_COLORS.yellow,
        textShadow: `0 0 20px ${ARCADE_COLORS.yellow}80`,
        border: `2px solid ${ARCADE_COLORS.yellow}40`, backgroundColor: `${ARCADE_COLORS.yellow}08`, borderRadius: '4px',
      }}>
        {roomCode}
      </Box>
    </Box>

    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
      <Box sx={{
        width: 10, height: 10, borderRadius: '50%',
        backgroundColor: isConnected ? ARCADE_COLORS.lime : ARCADE_COLORS.red,
        boxShadow: `0 0 8px ${isConnected ? ARCADE_COLORS.lime : ARCADE_COLORS.red}`,
        animation: isConnected ? 'pulse 1.5s ease-in-out infinite' : 'none',
        '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
      }} />
      <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.85rem', color: ARCADE_COLORS.lime }}>
        <Box component="span" sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '1.2rem', mr: 1 }}>{playerCount}</Box>
        {playerCount === 0 ? 'Waiting for players...' : 'players connected'}
      </Box>
    </Box>

    {players.length > 0 && (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 4 }}>
        {players.map((p, i) => (
          <Box key={p.player_id} sx={{
            px: 1.5, py: 0.8, borderRadius: '4px',
            backgroundColor: [ARCADE_COLORS.cyan, ARCADE_COLORS.magenta, ARCADE_COLORS.yellow, ARCADE_COLORS.lime, ARCADE_COLORS.red][i % 5] + '30',
            border: `1px solid ${[ARCADE_COLORS.cyan, ARCADE_COLORS.magenta, ARCADE_COLORS.yellow, ARCADE_COLORS.lime, ARCADE_COLORS.red][i % 5]}50`,
            fontFamily: '"Press Start 2P", monospace', fontSize: '0.45rem',
            color: [ARCADE_COLORS.cyan, ARCADE_COLORS.magenta, ARCADE_COLORS.yellow, ARCADE_COLORS.lime, ARCADE_COLORS.red][i % 5],
          }}>
            {p.player_name.length > 10 ? p.player_name.slice(0, 10) + '..' : p.player_name}
          </Box>
        ))}
      </Box>
    )}

    <Box sx={{
      py: 2, px: 3,
      border: `1px solid ${ARCADE_COLORS.cyan}30`,
      borderRadius: '6px',
      backgroundColor: `${ARCADE_COLORS.cyan}08`,
    }}>
      <Box sx={{
        fontFamily: '"Courier New", monospace', fontSize: '0.8rem',
        color: `${ARCADE_COLORS.cyan}`,
        animation: 'pulse 2s ease-in-out infinite',
        '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
      }}>
        Waiting for host to start the game...
      </Box>
    </Box>
  </Box>
);

// ─── Countdown View ───────────────────────────────────────────────────────────
const CountdownView: React.FC<{ value: number }> = ({ value }) => (
  <Box sx={{ textAlign: 'center', animation: `${pulseScale} 1s ease infinite` }}>
    <Box sx={{
      fontFamily: '"Press Start 2P", monospace', fontSize: '6rem', fontWeight: 900,
      color: ARCADE_COLORS.yellow, textShadow: `0 0 60px ${ARCADE_COLORS.yellow}80`,
    }}>
      {value}
    </Box>
  </Box>
);

// ─── Question View (Player — 4 clickable options) ────────────────────────────
const QuestionView: React.FC<{
  question: QuestionData;
  timeRemaining: number;
  isPaused: boolean;
  onAnswer: (option: string) => void;
}> = ({ question, timeRemaining, isPaused, onAnswer }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const progress = timeRemaining / question.time_limit;

  const handleSelect = (optionId: string) => {
    if (selected) return;
    setSelected(optionId);
    onAnswer(optionId);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 860 }}>
      {/* Top bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.75rem', color: `${ARCADE_COLORS.white}50` }}>
          Q {question.number} / {question.total}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            fontFamily: '"Press Start 2P", monospace', fontSize: '1rem',
            color: progress > 0.4 ? ARCADE_COLORS.lime : progress > 0.2 ? ARCADE_COLORS.yellow : ARCADE_COLORS.red,
            textShadow: `0 0 10px currentColor`,
          }}>
            {timeRemaining}
          </Box>
          <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.65rem', color: `${ARCADE_COLORS.white}40` }}>SEC</Box>
        </Box>
      </Box>

      {/* Timer bar */}
      <LinearProgress variant="determinate" value={progress * 100} sx={{
        mb: 3, height: 6, borderRadius: 0,
        backgroundColor: `${ARCADE_COLORS.white}15`,
        '& .MuiLinearProgress-bar': {
          backgroundColor: progress > 0.4 ? ARCADE_COLORS.lime : progress > 0.2 ? ARCADE_COLORS.yellow : ARCADE_COLORS.red,
          borderRadius: 0,
          transition: isPaused ? 'none' : 'width 1s linear',
        },
      }} />

      {/* Paused overlay */}
      {isPaused && (
        <Box sx={{
          textAlign: 'center', mb: 2, py: 1.5,
          backgroundColor: `${ARCADE_COLORS.yellow}15`, border: `2px solid ${ARCADE_COLORS.yellow}60`,
          borderRadius: '6px',
        }}>
          <Box sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.7rem', color: ARCADE_COLORS.yellow, textShadow: `0 0 10px ${ARCADE_COLORS.yellow}60` }}>
            ⏸ GAME PAUSED
          </Box>
        </Box>
      )}

      {/* Question card */}
      <Box sx={{
        ...cardSx, mb: 3, textAlign: 'center',
        borderColor: `${ARCADE_COLORS.cyan}40`,
        boxShadow: `0 0 30px ${ARCADE_COLORS.cyan}15`,
      }}>
        <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.65rem', color: `${ARCADE_COLORS.cyan}60`, letterSpacing: '0.2em', mb: 1.5 }}>
          QUESTION {question.number}
        </Box>
        <Box sx={{ fontFamily: '"Audiowide", sans-serif', fontSize: '1.1rem', color: ARCADE_COLORS.white, lineHeight: 1.6 }}>
          {question.text}
        </Box>
      </Box>

      {/* Answer options (2x2 grid) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        {question.options.map(opt => (
          <Box
            key={opt.id}
            onClick={() => handleSelect(opt.id)}
            sx={{
              p: 2.5, cursor: !selected ? 'pointer' : 'default', borderRadius: '6px',
              display: 'flex', alignItems: 'center', gap: 2,
              backgroundColor: selected === opt.id ? `${ARCADE_COLORS[opt.color as keyof typeof ARCADE_COLORS] || opt.color}25` : `${ARCADE_COLORS[opt.color as keyof typeof ARCADE_COLORS] || opt.color}10`,
              border: `2px solid ${selected === opt.id ? (ARCADE_COLORS[opt.color as keyof typeof ARCADE_COLORS] || opt.color) : (ARCADE_COLORS[opt.color as keyof typeof ARCADE_COLORS] || opt.color) + '50'}`,
              boxShadow: selected === opt.id ? `0 0 20px ${(ARCADE_COLORS[opt.color as keyof typeof ARCADE_COLORS] || opt.color)}50` : 'none',
              transition: 'all 0.15s',
              opacity: selected && selected !== opt.id ? 0.5 : 1,
              '&:hover': !selected ? {
                backgroundColor: `${ARCADE_COLORS[opt.color as keyof typeof ARCADE_COLORS] || opt.color}20`,
                borderColor: ARCADE_COLORS[opt.color as keyof typeof ARCADE_COLORS] || opt.color,
                boxShadow: `0 0 15px ${(ARCADE_COLORS[opt.color as keyof typeof ARCADE_COLORS] || opt.color)}40`,
              } : {},
            }}
          >
            <Box sx={{
              width: 36, height: 36, flexShrink: 0, borderRadius: '4px',
              backgroundColor: ARCADE_COLORS[opt.color as keyof typeof ARCADE_COLORS] || opt.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', color: '#050510', fontWeight: 900,
            }}>
              {opt.icon}
            </Box>
            <Box sx={{ fontFamily: '"Audiowide", sans-serif', fontSize: '0.82rem', color: ARCADE_COLORS.white, lineHeight: 1.4 }}>
              {opt.label}
            </Box>
          </Box>
        ))}
      </Box>

      {selected && (
        <Box sx={{ mt: 3, textAlign: 'center', fontFamily: '"Courier New", monospace', fontSize: '0.7rem', color: `${ARCADE_COLORS.white}40`, animation: `${fadeIn} 0.3s ease` }}>
          ✓ Answer locked in — waiting for others...
        </Box>
      )}
    </Box>
  );
};

// ─── Result View ──────────────────────────────────────────────────────────────
const ResultView: React.FC<{
  result: ResultData;
  question: QuestionData;
}> = ({ result, question }) => {
  const isCorrect = result.is_correct ?? false;

  return (
    <Box sx={{ width: '100%', maxWidth: 720, textAlign: 'center', animation: `${fadeIn} 0.5s ease` }}>
      {/* Correct / Wrong banner */}
      <Box sx={{
        py: 3, mb: 4,
        backgroundColor: isCorrect ? `${ARCADE_COLORS.lime}15` : `${ARCADE_COLORS.red}15`,
        border: `2px solid ${isCorrect ? ARCADE_COLORS.lime : ARCADE_COLORS.red}`,
        borderRadius: '8px',
        boxShadow: `0 0 30px ${isCorrect ? ARCADE_COLORS.lime : ARCADE_COLORS.red}30`,
      }}>
        <Box sx={{
          fontFamily: '"Press Start 2P", monospace', fontSize: '1.2rem',
          color: isCorrect ? ARCADE_COLORS.lime : ARCADE_COLORS.red,
          textShadow: `0 0 20px currentColor`, mb: 1,
        }}>
          {isCorrect ? '✓ CORRECT!' : '✗ WRONG!'}
        </Box>
        <Box sx={{ fontFamily: '"Audiowide", sans-serif', fontSize: '0.85rem', color: `${ARCADE_COLORS.white}70` }}>
          Your answer: <Box component="span" sx={{ color: isCorrect ? ARCADE_COLORS.lime : ARCADE_COLORS.red }}>{result.your_option}</Box>
        </Box>
      </Box>

      {/* Points earned */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{
          fontFamily: '"Press Start 2P", monospace', fontSize: '2.2rem',
          color: ARCADE_COLORS.yellow, textShadow: `0 0 30px ${ARCADE_COLORS.yellow}80`, lineHeight: 1,
        }}>
          +{result.score_earned?.toLocaleString() ?? 0}
        </Box>
        <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.7rem', color: `${ARCADE_COLORS.white}40`, mt: 0.5, letterSpacing: '0.2em' }}>
          POINTS EARNED
        </Box>
      </Box>

      {/* Answer distribution */}
      {result.distribution && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.6rem', color: `${ARCADE_COLORS.white}40`, letterSpacing: '0.15em', mb: 1.5, textAlign: 'left' }}>
            ANSWER DISTRIBUTION
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {question.options.map(opt => {
              const count = result.distribution?.[opt.id] ?? 0;
              const total = Object.values(result.distribution ?? {}).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <Box key={opt.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 28, fontFamily: '"Press Start 2P", monospace', fontSize: '0.5rem', color: opt.color, textAlign: 'center', flexShrink: 0 }}>{opt.icon}</Box>
                  <Box sx={{ flex: 1, height: 18, backgroundColor: `${opt.color}15`, borderRadius: '2px', overflow: 'hidden', border: `1px solid ${opt.color}20` }}>
                    <Box sx={{
                      width: `${pct}%`, height: '100%',
                      backgroundColor: opt.id === result.correct_option ? ARCADE_COLORS.lime : `${opt.color}60`,
                      transition: 'width 0.6s ease',
                    }} />
                  </Box>
                  <Box sx={{ width: 36, fontFamily: '"Courier New", monospace', fontSize: '0.7rem', color: `${ARCADE_COLORS.white}60`, textAlign: 'right', flexShrink: 0 }}>{pct}%</Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.7rem', color: `${ARCADE_COLORS.white}25`, letterSpacing: '0.1em' }}>
        Next question in 3s...
      </Box>
    </Box>
  );
};

// ─── Leaderboard View ─────────────────────────────────────────────────────────
const LeaderboardView: React.FC<{
  leaderboard: LeaderboardEntry[];
  questionTotal: number;
  questionIndex: number;
}> = ({ leaderboard, questionTotal, questionIndex }) => (
  <Box sx={{ width: '100%', maxWidth: 600, animation: `${fadeIn} 0.5s ease` }}>
    <Box sx={{ textAlign: 'center', mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <Trophy size={28} color={ARCADE_COLORS.yellow} />
        <Box sx={{
          fontFamily: '"Press Start 2P", monospace', fontSize: '0.9rem',
          color: ARCADE_COLORS.yellow, textShadow: `0 0 20px ${ARCADE_COLORS.yellow}60`, letterSpacing: '0.1em',
        }}>
          LIVE RANKINGS
        </Box>
        <Trophy size={28} color={ARCADE_COLORS.yellow} />
      </Box>
    </Box>

    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {leaderboard.map((p, i) => {
        const medalColor = i === 0 ? ARCADE_COLORS.yellow : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : `${ARCADE_COLORS.white}30`;
        const isTop3 = i < 3;
        return (
          <Box key={p.player_id} sx={{
            display: 'flex', alignItems: 'center', gap: 2,
            p: 2, borderRadius: '6px',
            backgroundColor: isTop3 ? `${medalColor}10` : '#08081a',
            border: `1px solid ${isTop3 ? medalColor + '40' : ARCADE_COLORS.white + '08'}`,
            boxShadow: isTop3 ? `0 0 15px ${medalColor}20` : 'none',
          }}>
            <Box sx={{
              width: 36, textAlign: 'center',
              fontFamily: '"Press Start 2P", monospace',
              fontSize: isTop3 ? '1rem' : '0.65rem',
              color: medalColor, flexShrink: 0,
            }}>
              {i === 0 ? '👑' : `#${p.rank}`}
            </Box>
            <Box sx={{ flex: 1, fontFamily: '"Audiowide", sans-serif', fontSize: '0.9rem', color: ARCADE_COLORS.white }}>
              {p.player_name}
            </Box>
            <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.65rem', color: ARCADE_COLORS.orange }}>
              🔥 {p.streak}x
            </Box>
            <Box sx={{
              fontFamily: '"Press Start 2P", monospace', fontSize: '0.7rem',
              color: isTop3 ? medalColor : `${ARCADE_COLORS.white}70`, textAlign: 'right', minWidth: 70,
            }}>
              {p.total_score.toLocaleString()}
            </Box>
          </Box>
        );
      })}
    </Box>

    {questionTotal > 0 && (
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.65rem', color: `${ARCADE_COLORS.white}30`, mb: 1 }}>
          QUESTION PROGRESS
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          {Array.from({ length: questionTotal }).map((_, i) => (
            <Box key={i} sx={{
              width: 24, height: 6, borderRadius: '2px',
              backgroundColor: i < questionIndex ? ARCADE_COLORS.lime : `${ARCADE_COLORS.white}15`,
            }} />
          ))}
        </Box>
      </Box>
    )}
  </Box>
);

// ─── Finished View (player stays here) ────────────────────────────────────────
const FinishedView: React.FC<{ leaderboard: LeaderboardEntry[] }> = ({ leaderboard }) => (
  <Box sx={{ width: '100%', maxWidth: 600, animation: `${fadeIn} 0.5s ease` }}>
    <Box sx={{ textAlign: 'center', mb: 4 }}>
      <Box sx={{
        fontFamily: '"Press Start 2P", monospace', fontSize: '1.2rem',
        color: ARCADE_COLORS.yellow, textShadow: `0 0 30px ${ARCADE_COLORS.yellow}80`, mb: 1,
      }}>
        🏆 GAME OVER 🏆
      </Box>
      <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.7rem', color: `${ARCADE_COLORS.white}40` }}>
        Final Results
      </Box>
    </Box>

    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {leaderboard.map((p, i) => {
        const medalColor = i === 0 ? ARCADE_COLORS.yellow : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : `${ARCADE_COLORS.white}30`;
        const isTop3 = i < 3;
        return (
          <Box key={p.player_id} sx={{
            display: 'flex', alignItems: 'center', gap: 2, p: 2.5, borderRadius: '6px',
            backgroundColor: isTop3 ? `${medalColor}15` : '#08081a',
            border: `2px solid ${isTop3 ? medalColor + '60' : ARCADE_COLORS.white + '08'}`,
            boxShadow: isTop3 ? `0 0 25px ${medalColor}30` : 'none',
          }}>
            <Box sx={{ width: 40, textAlign: 'center', fontFamily: '"Press Start 2P", monospace', fontSize: isTop3 ? '1.2rem' : '0.7rem', color: medalColor }}>
              {i === 0 ? '👑' : `#${p.rank}`}
            </Box>
            <Box sx={{ flex: 1, fontFamily: '"Audiowide", sans-serif', fontSize: '1rem', color: ARCADE_COLORS.white }}>
              {p.player_name}
            </Box>
            <Box sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.8rem', color: isTop3 ? medalColor : `${ARCADE_COLORS.white}70` }}>
              {p.total_score.toLocaleString()}
            </Box>
          </Box>
        );
      })}
    </Box>
  </Box>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const UltimateShowdown: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, connect, disconnect, submitAnswer, isConnected } = useGameWebSocket();

  const [roomCode, setRoomCode] = useState<string>('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const user = getStoredUser();

  // Determine current view
  const getView = useCallback((): string => {
    if (!roomCode) return 'join';
    if (!user?.id) return 'login';
    switch (state.phase) {
      case 'idle':
      case 'waiting':
        return 'waiting';
      case 'countdown':
        return 'countdown';
      case 'question':
        return 'question';
      case 'result':
        return 'result';
      case 'leaderboard':
        return 'leaderboard';
      case 'finished':
        return 'finished';
      default:
        return 'waiting';
    }
  }, [roomCode, user, state.phase]);

  const view = getView();

  // Auto-join from URL param ?code=XXXX when user is already logged in
  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam && user?.id && !roomCode) {
      setRoomCode(codeParam);
      handleJoinRoom(codeParam, user.id, user.firstname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 1: Enter room code → proceed to login or auto-join
  const handleEnterCode = async (code: string) => {
    setJoinError('');
    setRoomCode(code);
    if (user?.id) {
      // Already logged in → join immediately
      handleJoinRoom(code, user.id, user.firstname);
    }
    // Otherwise loginScreen will show
  };

  // Actually join the room via REST + WebSocket
  const handleJoinRoom = async (code: string, userId: number, playerName: string) => {
    setJoinLoading(true);
    setJoinError('');
    try {
      const res = await apiFetch(`/rooms/${code}/join`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, player_name: playerName }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to join');
      }
      connect(code, userId, 'player');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Join failed';
      setJoinError(msg);
      setRoomCode('');
    } finally {
      setJoinLoading(false);
    }
  };

  // Step 2: Login with existing account → then join room
  const handleLogin = async (email: string, playerName: string) => {
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await apiFetch('/users/login', {
        method: 'POST',
        body: JSON.stringify({ email, firstname: playerName }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Login failed');
      }
      const userData = await res.json();
      const userId = userData?.id;
      const firstname = userData?.firstname ?? userData?.first_name ?? playerName;
      const lastname = userData?.lastname ?? userData?.last_name;
      const region = userData?.region ?? userData?.country;
      const countryCode =
        region && region.length === 2
          ? region.toUpperCase()
          : region
            ? COUNTRY_NAME_TO_CODE[region]
            : undefined;
      setStoredUser({ id: userId, firstname, lastname, countryCode });
      if (roomCode) {
        await handleJoinRoom(roomCode, userId, firstname);
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // Register new account → then join room
  const handleRegister = async (firstname: string, lastname: string, email: string, country: string) => {
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await apiFetch('/users/', {
        method: 'POST',
        body: JSON.stringify({ firstname, lastname, email, region: country }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Registration failed');
      }
      const userData = await res.json();
      const userId = userData?.id;
      setStoredUser({ id: userId, firstname, lastname });
      if (roomCode) {
        await handleJoinRoom(roomCode, userId, firstname);
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAnswer = (option: string) => {
    if (!state.question) return;
    submitAnswer(state.question.question_id, option);
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <Box sx={pageBg}>
      {/* Header strip */}
      <Box sx={{ width: '100%', maxWidth: 900, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 2, borderBottom: `1px solid ${ARCADE_COLORS.magenta}25` }}>
          <Box sx={{ width: 4, height: 20, backgroundColor: ARCADE_COLORS.magenta, boxShadow: `0 0 10px ${ARCADE_COLORS.magenta}` }} />
          <Box sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.8rem', color: ARCADE_COLORS.magenta, letterSpacing: '0.15em', textShadow: `0 0 15px ${ARCADE_COLORS.magenta}60` }}>
            ULTIMATE SHOWDOWN
          </Box>
          <Box
            onClick={() => { disconnect(); navigate('/'); }}
            sx={{
              ml: 'auto', cursor: 'pointer',
              fontFamily: '"Courier New", monospace', fontSize: '0.7rem',
              color: `${ARCADE_COLORS.white}40`,
              '&:hover': { color: ARCADE_COLORS.red },
              transition: 'color 0.2s',
            }}
          >
            ← EXIT
          </Box>
          {roomCode && (
            <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.65rem', color: `${ARCADE_COLORS.white}30` }}>
              Room: {roomCode}
            </Box>
          )}
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ width: '100%', maxWidth: 900, display: 'flex', justifyContent: 'center' }}>
        {view === 'join' && (
          <JoinScreen
            onJoin={handleEnterCode}
            loading={joinLoading}
            error={joinError}
            onHostLogin={() => navigate('/final/admin')}
          />
        )}
        {view === 'login' && (
          <LoginScreen
            onLogin={handleLogin}
            onRegister={handleRegister}
            loading={loginLoading}
            error={loginError}
          />
        )}
        {view === 'waiting' && (
          <WaitingRoom
            roomCode={roomCode}
            playerCount={state.playerCount}
            players={state.players}
            isConnected={isConnected}
          />
        )}
        {view === 'countdown' && (
          <CountdownView value={state.countdownValue} />
        )}
        {view === 'question' && state.question && (
          <QuestionView
            question={state.question}
            timeRemaining={state.timeRemaining}
            isPaused={state.isPaused}
            onAnswer={handleAnswer}
          />
        )}
        {view === 'result' && state.result && state.question && (
          <ResultView
            result={state.result}
            question={state.question}
          />
        )}
        {view === 'leaderboard' && (
          <LeaderboardView
            leaderboard={state.leaderboard}
            questionTotal={state.question?.total ?? 10}
            questionIndex={state.question?.number ?? 0}
          />
        )}
        {view === 'finished' && (
          <FinishedView leaderboard={state.leaderboard} />
        )}
      </Box>
    </Box>
  );
};

export default UltimateShowdown;
