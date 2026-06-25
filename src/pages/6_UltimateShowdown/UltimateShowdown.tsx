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
import QRCode from '../../components/functional/QRCode';
import { useGameWebSocket } from '../../hooks/useGameWebSocket';
import type { QuestionData, ResultData, LeaderboardEntry, PlayerEntry } from '../../hooks/useGameWebSocket';
import { getStoredUser } from '../../utils/userStorage';
import { apiFetch } from '../../services/api';
import { ARCADE_COLORS, GRID_COLOR } from '../../theme/theme';

// ─── Animations ───────────────────────────────────────────────────────────────
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
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

// ─── Lobby View ───────────────────────────────────────────────────────────────
const LobbyView: React.FC<{
  roomCode: string;
  playerCount: number;
  players: PlayerEntry[];
  isAdmin: boolean;
  onStart: () => void;
  isConnected: boolean;
}> = ({ roomCode, playerCount, players, isAdmin, onStart, isConnected }) => {
  const joinUrl = `${window.location.origin}/final?code=${roomCode}`;

  return (
    <Box sx={{ width: '100%', maxWidth: 700, textAlign: 'center' }}>
      {/* Game Code */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.7rem', color: `${ARCADE_COLORS.white}40`, letterSpacing: '0.2em', mb: 1 }}>
          JOIN WITH CODE
        </Box>
        <Box sx={{
          display: 'inline-block',
          px: 5, py: 2.5,
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '2.5rem', fontWeight: 900,
          letterSpacing: '0.3em',
          color: ARCADE_COLORS.yellow,
          textShadow: `0 0 30px ${ARCADE_COLORS.yellow}80`,
          border: `2px solid ${ARCADE_COLORS.yellow}40`,
          backgroundColor: `${ARCADE_COLORS.yellow}08`,
          borderRadius: '4px',
        }}>
          {roomCode}
        </Box>
      </Box>

      {/* QR Code */}
      <Box sx={{ mb: 3 }}>
        <QRCode value={joinUrl} size={180} />
        <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.55rem', color: `${ARCADE_COLORS.white}30`, mt: 1 }}>
          Scan to join
        </Box>
      </Box>

      {/* Player count */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 4 }}>
        <Box sx={{
          width: 10, height: 10, borderRadius: '50%',
          backgroundColor: isConnected ? ARCADE_COLORS.lime : ARCADE_COLORS.red,
          boxShadow: `0 0 8px ${isConnected ? ARCADE_COLORS.lime : ARCADE_COLORS.red}`,
          animation: isConnected ? 'pulse 1.5s ease-in-out infinite' : 'none',
          '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
        }} />
        <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.85rem', color: ARCADE_COLORS.lime }}>
          <Box component="span" sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '1.4rem', mr: 1 }}>{playerCount}</Box>
          {playerCount === 0 ? 'Waiting for players...' : 'players connected'}
        </Box>
      </Box>

      {/* Players grid */}
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

      {/* Start button (admin only) */}
      {isAdmin && (
        <Box
          onClick={playerCount > 0 ? onStart : undefined}
          sx={{
            px: 5, py: 1.8, display: 'inline-block',
            fontFamily: '"Press Start 2P", monospace', fontSize: '0.75rem',
            letterSpacing: '0.15em', cursor: playerCount > 0 ? 'pointer' : 'not-allowed',
            border: `2px solid ${playerCount > 0 ? ARCADE_COLORS.lime : '#3a3a5a'}`,
            color: playerCount > 0 ? ARCADE_COLORS.lime : '#3a3a5a',
            backgroundColor: playerCount > 0 ? `${ARCADE_COLORS.lime}15` : 'transparent',
            boxShadow: playerCount > 0 ? `0 0 20px ${ARCADE_COLORS.lime}40` : 'none',
            borderRadius: '4px',
            opacity: playerCount > 0 ? 1 : 0.4,
            transition: 'all 0.15s',
            '&:hover': playerCount > 0 ? {
              backgroundColor: `${ARCADE_COLORS.lime}25`,
              boxShadow: `0 0 30px ${ARCADE_COLORS.lime}60`,
            } : {},
          }}
        >
          ▶ START GAME
        </Box>
      )}
    </Box>
  );
};

// ─── Question View ────────────────────────────────────────────────────────────
const QuestionView: React.FC<{
  question: QuestionData;
  timeRemaining: number;
  onAnswer: (option: string) => void;
  isPlayer: boolean;
}> = ({ question, timeRemaining, onAnswer, isPlayer }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const progress = timeRemaining / question.time_limit;

  const handleSelect = (optionId: string) => {
    if (!isPlayer || selected) return;
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
          transition: 'width 1s linear',
        },
      }} />

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

      {/* Answer options */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        {question.options.map(opt => (
          <Box
            key={opt.id}
            onClick={() => handleSelect(opt.id)}
            sx={{
              p: 2.5, cursor: isPlayer && !selected ? 'pointer' : 'default', borderRadius: '6px',
              display: 'flex', alignItems: 'center', gap: 2,
              backgroundColor: selected === opt.id ? `${ARCADE_COLORS[opt.color as keyof typeof ARCADE_COLORS] || opt.color}25` : `${ARCADE_COLORS[opt.color as keyof typeof ARCADE_COLORS] || opt.color}10`,
              border: `2px solid ${selected === opt.id ? (ARCADE_COLORS[opt.color as keyof typeof ARCADE_COLORS] || opt.color) : (ARCADE_COLORS[opt.color as keyof typeof ARCADE_COLORS] || opt.color) + '50'}`,
              boxShadow: selected === opt.id ? `0 0 20px ${(ARCADE_COLORS[opt.color as keyof typeof ARCADE_COLORS] || opt.color)}50` : 'none',
              transition: 'all 0.15s',
              opacity: selected && selected !== opt.id ? 0.5 : 1,
              '&:hover': isPlayer && !selected ? {
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

    {/* Progress indicator */}
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
  </Box>
);

// ─── Join Screen ──────────────────────────────────────────────────────────────
const JoinScreen: React.FC<{
  onJoin: (code: string) => void;
  loading: boolean;
  error: string;
  onAdminLogin: () => void;
}> = ({ onJoin, loading, error, onAdminLogin }) => {
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
        onClick={onAdminLogin}
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

// ─── Main Component ───────────────────────────────────────────────────────────
type View = 'join' | 'lobby' | 'question' | 'result' | 'leaderboard' | 'finished';

const UltimateShowdown: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, connect, disconnect, submitAnswer, startGame } = useGameWebSocket();
  const user = getStoredUser();

  const [roomCode, setRoomCode] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Determine view from game state
  const getView = useCallback((): View => {
    if (!roomCode) return 'join';
    switch (state.phase) {
      case 'idle':
      case 'waiting':
        return 'lobby';
      case 'countdown':
        return 'lobby';
      case 'question':
        return 'question';
      case 'result':
        return 'result';
      case 'finished':
        return 'finished';
      default:
        return 'lobby';
    }
  }, [roomCode, state.phase]);

  const view = getView();

  // Check URL for room code
  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam && user?.id) {
      setRoomCode(codeParam);
      handleJoinRoom(codeParam);
    }
    const adminParam = searchParams.get('admin');
    if (adminParam) {
      setIsAdmin(true);
      handleCreateRoom();
    }
  }, []);

  const handleCreateRoom = async () => {
    try {
      const res = await apiFetch('/rooms/', {
        method: 'POST',
        body: JSON.stringify({ question_count: 10 }),
      });
      if (!res.ok) throw new Error('Failed to create room');
      const data = await res.json();
      setRoomCode(data.room_code);
      setIsAdmin(true);
      if (user?.id) {
        connect(data.room_code, user.id, 'admin');
      }
    } catch (err) {
      setJoinError('Failed to create room');
    }
  };

  const handleJoinRoom = async (code: string) => {
    if (!user?.id) {
      setJoinError('Please log in first');
      return;
    }
    setJoinLoading(true);
    setJoinError('');
    try {
      // First join via REST
      const res = await apiFetch(`/rooms/${code}/join`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          player_name: user.firstname,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to join');
      }
      setRoomCode(code);
      // Then connect via WebSocket
      connect(code, user.id, 'player');
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Join failed');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleStartGame = () => {
    startGame(10);
  };

  const handleAnswer = (option: string) => {
    if (!state.question) return;
    submitAnswer(state.question.question_id, option);
  };

  const handleAdminLogin = () => {
    navigate('/final/admin');
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
          {isAdmin && (
            <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.55rem', color: ARCADE_COLORS.orange, border: `1px solid ${ARCADE_COLORS.orange}40`, px: 1.5, py: 0.3, borderRadius: '2px' }}>
              HOST
            </Box>
          )}
          {roomCode && (
            <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.65rem', color: `${ARCADE_COLORS.white}30` }}>
              Room: {roomCode}
            </Box>
          )}
        </Box>
      </Box>

      {/* Tab bar */}
      {view !== 'join' && (
        <Box sx={{ width: '100%', maxWidth: 900, display: 'flex', gap: 1, mb: 4 }}>
          {(['lobby', 'question', 'result', 'finished'] as View[]).map(v => (
            <Box key={v} sx={{
              px: 2, py: 0.8,
              fontFamily: '"Press Start 2P", monospace',
              fontSize: '0.5rem', letterSpacing: '0.1em',
              border: `1px solid ${view === v ? ARCADE_COLORS.magenta : `${ARCADE_COLORS.white}20`}`,
              color: view === v ? ARCADE_COLORS.magenta : `${ARCADE_COLORS.white}40`,
              backgroundColor: view === v ? `${ARCADE_COLORS.magenta}15` : 'transparent',
              boxShadow: view === v ? `0 0 10px ${ARCADE_COLORS.magenta}40` : 'none',
              borderRadius: '2px',
            }}>
              {v === 'finished' ? 'FINAL' : v.toUpperCase()}
            </Box>
          ))}
        </Box>
      )}

      {/* Content */}
      <Box sx={{ width: '100%', maxWidth: 900, display: 'flex', justifyContent: 'center' }}>
        {view === 'join' && (
          <JoinScreen
            onJoin={handleJoinRoom}
            loading={joinLoading}
            error={joinError}
            onAdminLogin={handleAdminLogin}
          />
        )}
        {view === 'lobby' && (
          <LobbyView
            roomCode={roomCode}
            playerCount={state.playerCount}
            players={state.players}
            isAdmin={isAdmin}
            onStart={handleStartGame}
            isConnected={true}
          />
        )}
        {view === 'question' && state.question && (
          <QuestionView
            question={state.question}
            timeRemaining={state.timeRemaining}
            onAnswer={handleAnswer}
            isPlayer={!isAdmin}
          />
        )}
        {view === 'result' && state.result && state.question && (
          <ResultView
            result={state.result}
            question={state.question}
          />
        )}
        {(view === 'finished') && (
          <LeaderboardView
            leaderboard={state.leaderboard}
            questionTotal={state.question?.total ?? 10}
            questionIndex={state.question?.total ?? 10}
          />
        )}
      </Box>
    </Box>
  );
};

export default UltimateShowdown;
