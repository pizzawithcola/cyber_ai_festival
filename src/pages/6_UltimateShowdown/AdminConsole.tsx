import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, LinearProgress, Snackbar, Alert, keyframes } from '@mui/material';
import { Trophy, Pause, Play, XCircle } from 'lucide-react';
import { ArcadeButton } from '../../components/ui';
import QRCode from '../../components/functional/QRCode';
import { BonusIntroView } from './BonusIntro';
import { apiFetch } from '../../services/api';
import { getAdminToken } from '../../utils/userStorage';
import { loadBalance, DEFAULT_BALANCE, BALANCE_TOTAL } from './gameCategories';
import { useGameWebSocket } from '../../hooks/useGameWebSocket';
import type { QuestionData, ResultData, LeaderboardEntry, PlayerEntry } from '../../hooks/useGameWebSocket';
import { ARCADE_COLORS, GRID_COLOR } from '../../theme/theme';
import { useClickSound } from '../../hooks/useClickSound';

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

type SnackState = { open: boolean; message: string; severity: 'success' | 'error' | 'warning' };

// sessionStorage key that remembers the live room across Admin-console refreshes,
// so the admin can reconnect (and server replays current state) instead of desyncing.
const ADMIN_ROOM_KEY = 'ultimate_admin_room_code';

// ─── BGM 曲目映射（仅 Admin 端播放）──────────────────────────────────────
const BGM_SOURCES: Record<string, string> = {
  lobby: '/audio/final_wait_room.mp3', // Waiting room (before the game starts)
  game: '/audio/final_bgm.mp3',        // Game: countdown + answering + score reveal + per-question board
  podium: '/audio/final_podium.ogg',   // Final overall results only
};

// ─── Idle View ────────────────────────────────────────────────────────────────
const IdleView: React.FC<{ onCreateRoom: () => void; creating: boolean }> = ({ onCreateRoom, creating }) => (
  <Box sx={{ textAlign: 'center', animation: `${fadeIn} 0.5s ease` }}>
    <Box sx={{ mb: 4 }}>
      <Box sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '1.2rem', color: ARCADE_COLORS.orange, textShadow: `0 0 20px ${ARCADE_COLORS.orange}60`, letterSpacing: '0.1em' }}>
        GAME CONSOLE
      </Box>
      <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.7rem', color: `${ARCADE_COLORS.white}40`, mt: 1 }}>
        Host a real-time quiz competition
      </Box>
    </Box>
    <ArcadeButton color="orange" variant="filled" size="md" glowing onClick={onCreateRoom} disabled={creating}>
      {creating ? 'CREATING...' : '+ START NEW GAME'}
    </ArcadeButton>
  </Box>
);

// ─── Lobby View ───────────────────────────────────────────────────────────────
const LobbyView: React.FC<{
  roomCode: string; playerCount: number; players: PlayerEntry[];
  onStart: () => void; isConnected: boolean;
}> = ({ roomCode, playerCount, players, onStart, isConnected }) => {
  const joinUrl = `${window.location.origin}/final?code=${roomCode}`;
  return (
    <Box sx={{ width: '100%', maxWidth: 700, textAlign: 'center', animation: `${fadeIn} 0.5s ease` }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.7rem', color: `${ARCADE_COLORS.white}40`, letterSpacing: '0.2em', mb: 1 }}>
          JOIN WITH CODE
        </Box>
        <Box sx={{
          display: 'inline-block', px: 5, py: 2.5,
          fontFamily: '"Press Start 2P", monospace', fontSize: '2.5rem', fontWeight: 900,
          letterSpacing: '0.3em', color: ARCADE_COLORS.yellow,
          textShadow: `0 0 30px ${ARCADE_COLORS.yellow}80`,
          border: `2px solid ${ARCADE_COLORS.yellow}40`, backgroundColor: `${ARCADE_COLORS.yellow}08`, borderRadius: '4px',
        }}>
          {roomCode}
        </Box>
      </Box>
      <Box sx={{ mb: 3 }}>
        <QRCode value={joinUrl} size={180} />
        <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.55rem', color: `${ARCADE_COLORS.white}30`, mt: 1 }}>Scan to join</Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 4 }}>
        <Box sx={{
          width: 10, height: 10, borderRadius: '50%',
          backgroundColor: isConnected ? ARCADE_COLORS.lime : ARCADE_COLORS.red,
          boxShadow: `0 0 8px ${isConnected ? ARCADE_COLORS.lime : ARCADE_COLORS.red}`,
        }} />
        <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.85rem', color: ARCADE_COLORS.lime }}>
          <Box component="span" sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '1.4rem', mr: 1 }}>{playerCount}</Box>
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
      <Box onClick={playerCount > 0 ? onStart : undefined} sx={{
        px: 5, py: 1.8, display: 'inline-block',
        fontFamily: '"Press Start 2P", monospace', fontSize: '0.75rem', letterSpacing: '0.15em',
        cursor: playerCount > 0 ? 'pointer' : 'not-allowed',
        border: `2px solid ${playerCount > 0 ? ARCADE_COLORS.lime : '#3a3a5a'}`,
        color: playerCount > 0 ? ARCADE_COLORS.lime : '#3a3a5a',
        backgroundColor: playerCount > 0 ? `${ARCADE_COLORS.lime}15` : 'transparent',
        boxShadow: playerCount > 0 ? `0 0 20px ${ARCADE_COLORS.lime}40` : 'none',
        borderRadius: '4px', opacity: playerCount > 0 ? 1 : 0.4, transition: 'all 0.15s',
        '&:hover': playerCount > 0 ? { backgroundColor: `${ARCADE_COLORS.lime}25`, boxShadow: `0 0 30px ${ARCADE_COLORS.lime}60` } : {},
      }}>
        ▶ START GAME
      </Box>
    </Box>
  );
};

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

// ─── Question Control Panel ───────────────────────────────────────────────────
const QuestionControlPanel: React.FC<{
  question: QuestionData; timeRemaining: number; answeredCount: number; playerCount: number;
  isPaused: boolean; onPause: () => void; onResume: () => void; onEnd: () => void;
}> = ({ question, timeRemaining, answeredCount, playerCount, isPaused, onPause, onResume, onEnd }) => {
  const progress = timeRemaining / question.time_limit;
  return (
    <Box sx={{ width: '100%', maxWidth: 800 }}>
      {/* Top bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.75rem', color: `${ARCADE_COLORS.white}50` }}>
            Q {question.number} / {question.total}
          </Box>
          {question.multiplier && question.multiplier > 1 && (
            <Box sx={{
              fontFamily: '"Press Start 2P", monospace', fontSize: '0.6rem', px: 1.5, py: 0.5,
              color: '#050510', backgroundColor: ARCADE_COLORS.yellow,
              borderRadius: '4px', boxShadow: `0 0 12px ${ARCADE_COLORS.yellow}70`,
            }}>
              ×{question.multiplier} BONUS
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            fontFamily: '"Press Start 2P", monospace', fontSize: '1.2rem',
            color: progress > 0.4 ? ARCADE_COLORS.lime : progress > 0.2 ? ARCADE_COLORS.yellow : ARCADE_COLORS.red,
            textShadow: `0 0 10px currentColor`,
          }}>
            {timeRemaining}
          </Box>
          <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.65rem', color: `${ARCADE_COLORS.white}40` }}>SEC</Box>
        </Box>
      </Box>
      <LinearProgress variant="determinate" value={progress * 100} sx={{
        mb: 3, height: 6, borderRadius: 0, backgroundColor: `${ARCADE_COLORS.white}15`,
        '& .MuiLinearProgress-bar': {
          backgroundColor: progress > 0.4 ? ARCADE_COLORS.lime : progress > 0.2 ? ARCADE_COLORS.yellow : ARCADE_COLORS.red,
          borderRadius: 0, transition: isPaused ? 'none' : 'width 1s linear',
        },
      }} />
      {/* Question card */}
      <Box sx={{ ...cardSx, mb: 3, textAlign: 'center', borderColor: `${ARCADE_COLORS.cyan}40`, boxShadow: `0 0 30px ${ARCADE_COLORS.cyan}15` }}>
        <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.65rem', color: `${ARCADE_COLORS.cyan}60`, letterSpacing: '0.2em', mb: 1.5 }}>
          QUESTION {question.number}
        </Box>
        <Box sx={{ fontFamily: '"Audiowide", sans-serif', fontSize: '1.1rem', color: ARCADE_COLORS.white, lineHeight: 1.6 }}>
          {question.text}
        </Box>
      </Box>
      {/* Answered counter */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Box sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.8rem', color: ARCADE_COLORS.cyan }}>
          {answeredCount} / {playerCount}
        </Box>
        <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.65rem', color: `${ARCADE_COLORS.white}40`, mt: 0.5 }}>
          PLAYERS ANSWERED
        </Box>
      </Box>
      {/* Pause overlay */}
      {isPaused && (
        <Box sx={{
          textAlign: 'center', mb: 3, py: 2,
          backgroundColor: `${ARCADE_COLORS.yellow}15`, border: `2px solid ${ARCADE_COLORS.yellow}60`,
          borderRadius: '6px',
        }}>
          <Box sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '1rem', color: ARCADE_COLORS.yellow, textShadow: `0 0 15px ${ARCADE_COLORS.yellow}60` }}>
            ⏸ PAUSED
          </Box>
        </Box>
      )}
      {/* Control buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        {isPaused ? (
          <ArcadeButton color="lime" variant="filled" size="sm" glowing onClick={onResume}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Play size={16} /> RESUME</Box>
          </ArcadeButton>
        ) : (
          <ArcadeButton color="yellow" variant="outline" size="sm" onClick={onPause}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Pause size={16} /> PAUSE</Box>
          </ArcadeButton>
        )}
        <ArcadeButton color="red" variant="outline" size="sm" onClick={onEnd}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><XCircle size={16} /> END GAME</Box>
        </ArcadeButton>
      </Box>
    </Box>
  );
};

// ─── Result View (Admin) ──────────────────────────────────────────────────────
const AdminResultView: React.FC<{ result: ResultData; question: QuestionData; leaderboard: LeaderboardEntry[] }> = ({ result, question, leaderboard }) => (
  <Box sx={{ width: '100%', maxWidth: 720, animation: `${fadeIn} 0.5s ease` }}>
    {/* Correct answer */}
    <Box sx={{ textAlign: 'center', mb: 3 }}>
      <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.65rem', color: `${ARCADE_COLORS.white}40`, letterSpacing: '0.2em', mb: 1 }}>CORRECT ANSWER</Box>
      <Box sx={{
        display: 'inline-block', px: 4, py: 1.5,
        fontFamily: '"Press Start 2P", monospace', fontSize: '0.9rem',
        color: ARCADE_COLORS.lime, border: `2px solid ${ARCADE_COLORS.lime}60`,
        backgroundColor: `${ARCADE_COLORS.lime}15`, borderRadius: '6px',
        textShadow: `0 0 15px ${ARCADE_COLORS.lime}60`,
      }}>
        {result.correct_option}
      </Box>
      {/* The answer text itself, so the room can read what was right */}
      {(() => {
        const correctOpt = question.options.find(o => o.id === result.correct_option);
        if (!correctOpt) return null;
        return (
          <Box sx={{ mt: 1.5, fontFamily: '"Audiowide", sans-serif', fontSize: '1rem', color: ARCADE_COLORS.lime, lineHeight: 1.5 }}>
            {correctOpt.icon} {correctOpt.label}
          </Box>
        );
      })()}
    </Box>
    {/* Options with the correct one highlighted — mirrors the player screen */}
    <Box sx={{ mb: 3 }}>
      <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.6rem', color: `${ARCADE_COLORS.white}40`, letterSpacing: '0.15em', mb: 1.5 }}>OPTIONS</Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {question.options.map(opt => {
          const isCorrectOpt = opt.id === result.correct_option;
          return (
            <Box key={opt.id} sx={{
              display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: '6px',
              border: `2px solid ${isCorrectOpt ? ARCADE_COLORS.lime : `${opt.color}20`}`,
              backgroundColor: isCorrectOpt ? `${ARCADE_COLORS.lime}10` : `${opt.color}08`,
              boxShadow: isCorrectOpt ? `0 0 10px ${ARCADE_COLORS.lime}25` : 'none',
            }}>
              <Box sx={{
                width: 32, height: 32, flexShrink: 0, borderRadius: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: '"Press Start 2P", monospace', fontSize: '0.7rem',
                color: opt.color, backgroundColor: `${opt.color}15`,
              }}>
                {opt.icon}
              </Box>
              <Box sx={{ flex: 1, fontFamily: '"Audiowide", sans-serif', fontSize: '0.85rem', color: ARCADE_COLORS.white }}>
                {opt.label}
              </Box>
              {isCorrectOpt && (
                <Box sx={{
                  fontFamily: '"Press Start 2P", monospace', fontSize: '0.5rem', color: ARCADE_COLORS.lime,
                  px: 1, py: 0.5, backgroundColor: `${ARCADE_COLORS.lime}15`, borderRadius: '4px',
                }}>
                  ✓ CORRECT
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
    {/* Mini leaderboard */}
    {leaderboard.length > 0 && (
      <Box>
        <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.6rem', color: `${ARCADE_COLORS.white}40`, letterSpacing: '0.15em', mb: 1.5 }}>CURRENT STANDINGS</Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {leaderboard.map((p, i) => {
            const medalColor = i === 0 ? ARCADE_COLORS.yellow : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : `${ARCADE_COLORS.white}30`;
            return (
              <Box key={p.player_id} sx={{
                display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: '4px',
                backgroundColor: i < 3 ? `${medalColor}08` : '#08081a',
                border: `1px solid ${i < 3 ? medalColor + '30' : ARCADE_COLORS.white + '08'}`,
              }}>
                <Box sx={{ width: 28, textAlign: 'center', fontFamily: '"Press Start 2P", monospace', fontSize: '0.6rem', color: medalColor }}>
                  {i === 0 ? '👑' : `#${p.rank}`}
                </Box>
                <Box sx={{ flex: 1, fontFamily: '"Audiowide", sans-serif', fontSize: '0.8rem', color: ARCADE_COLORS.white }}>{p.player_name}</Box>
                {p.streak > 0 && <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.6rem', color: ARCADE_COLORS.orange }}>🔥{p.streak}</Box>}
                <Box sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.6rem', color: medalColor }}>{p.total_score.toLocaleString()}</Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    )}
  </Box>
);

// ─── Reading View (Admin — question + read-time countdown) ─────────────────
const AdminReadingView: React.FC<{ question: QuestionData; timeRemaining: number }> = ({ question, timeRemaining }) => (
  <Box sx={{ width: '100%', maxWidth: 720, textAlign: 'center', animation: `${fadeIn} 0.3s ease` }}>
    <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.65rem', color: `${ARCADE_COLORS.cyan}60`, letterSpacing: '0.2em', mb: 1.5 }}>
      QUESTION {question.number} / {question.total}
      {question.multiplier && question.multiplier > 1 ? `  ·  ×${question.multiplier} BONUS` : ''}
    </Box>
    <Box sx={{
      p: 4, mb: 3, borderRadius: '8px',
      border: `2px solid ${ARCADE_COLORS.cyan}40`,
      backgroundColor: `${ARCADE_COLORS.cyan}08`,
      boxShadow: `0 0 30px ${ARCADE_COLORS.cyan}15`,
    }}>
      <Box sx={{ fontFamily: '"Audiowide", sans-serif', fontSize: '1.5rem', color: ARCADE_COLORS.white, lineHeight: 1.6 }}>
        {question.text}
      </Box>
    </Box>
    <Box sx={{
      fontFamily: '"Press Start 2P", monospace', fontSize: '4rem',
      color: ARCADE_COLORS.cyan, textShadow: `0 0 40px ${ARCADE_COLORS.cyan}70`, lineHeight: 1.1,
    }}>
      {timeRemaining}
    </Box>
    <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.7rem', color: `${ARCADE_COLORS.white}40`, letterSpacing: '0.25em', mt: 1.5 }}>
      READ TIME — ANSWERS OPEN AFTER THE COUNTDOWN
    </Box>
  </Box>
);

// ─── Leaderboard View ─────────────────────────────────────────────────────────
const LeaderboardView: React.FC<{ leaderboard: LeaderboardEntry[]; questionTotal: number; questionIndex: number }> = ({ leaderboard, questionTotal, questionIndex }) => (
  <Box sx={{ width: '100%', maxWidth: 600, animation: `${fadeIn} 0.5s ease` }}>
    <Box sx={{ textAlign: 'center', mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <Trophy size={28} color={ARCADE_COLORS.yellow} />
        <Box sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.9rem', color: ARCADE_COLORS.yellow, textShadow: `0 0 20px ${ARCADE_COLORS.yellow}60`, letterSpacing: '0.1em' }}>
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
            display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '6px',
            backgroundColor: isTop3 ? `${medalColor}10` : '#08081a',
            border: `1px solid ${isTop3 ? medalColor + '40' : ARCADE_COLORS.white + '08'}`,
            boxShadow: isTop3 ? `0 0 15px ${medalColor}20` : 'none',
          }}>
            <Box sx={{ width: 36, textAlign: 'center', fontFamily: '"Press Start 2P", monospace', fontSize: isTop3 ? '1rem' : '0.65rem', color: medalColor }}>
              {i === 0 ? '👑' : `#${p.rank}`}
            </Box>
            <Box sx={{ flex: 1, fontFamily: '"Audiowide", sans-serif', fontSize: '0.9rem', color: ARCADE_COLORS.white }}>{p.player_name}</Box>
            <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.65rem', color: ARCADE_COLORS.orange }}>🔥 {p.streak}x</Box>
            <Box sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.7rem', color: isTop3 ? medalColor : `${ARCADE_COLORS.white}70`, textAlign: 'right', minWidth: 70 }}>
              {p.total_score.toLocaleString()}
            </Box>
          </Box>
        );
      })}
    </Box>
    {questionTotal > 0 && (
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.65rem', color: `${ARCADE_COLORS.white}30`, mb: 1 }}>QUESTION PROGRESS</Box>
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          {Array.from({ length: questionTotal }).map((_, i) => (
            <Box key={i} sx={{ width: 24, height: 6, borderRadius: '2px', backgroundColor: i < questionIndex ? ARCADE_COLORS.lime : `${ARCADE_COLORS.white}15` }} />
          ))}
        </Box>
      </Box>
    )}
  </Box>
);

// ─── Finished View ────────────────────────────────────────────────────────────
const FinishedView: React.FC<{ leaderboard: LeaderboardEntry[]; onNewGame: () => void }> = ({ leaderboard, onNewGame }) => (
  <Box sx={{ width: '100%', maxWidth: 600, animation: `${fadeIn} 0.5s ease` }}>
    <Box sx={{ textAlign: 'center', mb: 4 }}>
      <Box sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '1.2rem', color: ARCADE_COLORS.yellow, textShadow: `0 0 30px ${ARCADE_COLORS.yellow}80`, mb: 1 }}>
        🏆 GAME OVER 🏆
      </Box>
      <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.7rem', color: `${ARCADE_COLORS.white}40` }}>Final Results</Box>
    </Box>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4 }}>
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
            <Box sx={{ flex: 1, fontFamily: '"Audiowide", sans-serif', fontSize: '1rem', color: ARCADE_COLORS.white }}>{p.player_name}</Box>
            <Box sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.8rem', color: isTop3 ? medalColor : `${ARCADE_COLORS.white}70` }}>
              {p.total_score.toLocaleString()}
            </Box>
          </Box>
        );
      })}
    </Box>
    <Box sx={{ textAlign: 'center' }}>
      <ArcadeButton color="orange" variant="filled" size="md" glowing onClick={onNewGame}>
        + START NEW GAME
      </ArcadeButton>
    </Box>
  </Box>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminConsole: React.FC = () => {
  useClickSound();
  const navigate = useNavigate();
  const { state, connect, disconnect, startGame, pauseGame, resumeGame, isConnected } = useGameWebSocket();
  const [roomCode, setRoomCode] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [snack, setSnack] = useState<SnackState>({ open: false, message: '', severity: 'success' });
  // Two-step guard for the destructive "delete this room" action
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Auth check：无 token 跳回登录页，并携带 redirect 让登录后自动回到控制台
  useEffect(() => {
    const token = getAdminToken();
    if (!token) { navigate('/admin?redirect=/final/admin'); return; }
  }, [navigate]);

  // 刷新后恢复仍在进行中的房间：重新连上 admin WS，服务器会重放当前状态快照
  const didRestoreRef = useRef(false);
  useEffect(() => {
    if (!getAdminToken()) return;
    if (didRestoreRef.current) return;
    const saved = sessionStorage.getItem(ADMIN_ROOM_KEY);
    if (saved) {
      didRestoreRef.current = true;
      setRoomCode(saved);
      connect(saved, 1, 'admin');
    }
  }, [connect, navigate]);

  // ─── BGM playback（三段音乐按阶段切换，仅 Admin 端播放）──────────────────
  const bgmRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  // 初始化三个音频对象（loop + 音量）
  useEffect(() => {
    Object.entries(BGM_SOURCES).forEach(([key, src]) => {
      const audio = new Audio(src);
      audio.loop = true;
      audio.volume = 0.4;
      bgmRefs.current[key] = audio;
    });

    return () => {
      Object.values(bgmRefs.current).forEach((a) => {
        if (a) {
          a.pause();
          a.src = '';
        }
      });
      bgmRefs.current = {};
    };
  }, []);

  // Three stages only:
  //   1. waiting room  -> idle / waiting
  //   2. game          -> countdown, question, per-question score reveal (result)
  //                       AND the per-question leaderboard, which is still part
  //                       of the game loop (broadcast after every single question)
  //   3. final results -> finished (the overall standings at the very end)
  const activeBgmKey = (() => {
    if (!roomCode) return null;
    switch (state.phase) {
      case 'idle':
      case 'waiting':
        return 'lobby';
      case 'countdown':
      case 'question':
      case 'result':
      case 'leaderboard':
        return 'game';
      case 'finished':
        return 'podium';
      default:
        return null;
    }
  })();

  // 阶段变化时切换曲目（播放目标、暂停其他）
  useEffect(() => {
    Object.entries(bgmRefs.current).forEach(([key, audio]) => {
      if (!audio) return;
      if (key === activeBgmKey) {
        if (audio.paused) audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    });
  }, [activeBgmKey]);

  // 用户交互重试播放（处理浏览器 autoplay 限制）
  useEffect(() => {
    const retryPlay = () => {
      Object.entries(bgmRefs.current).forEach(([key, audio]) => {
        if (audio && key === activeBgmKey && audio.paused) {
          audio.play().catch(() => {});
        }
      });
    };
    document.addEventListener('click', retryPlay);
    document.addEventListener('keydown', retryPlay);
    return () => {
      document.removeEventListener('click', retryPlay);
      document.removeEventListener('keydown', retryPlay);
    };
  }, [activeBgmKey]);

  const handleCreateRoom = async () => {
    setCreating(true);
    try {
      // Use the admin-configured per-category balance; default to the 7-question
      // layout (5 theme ×1 + bonus ×2) when the admin never customized it.
      const balance = loadBalance() ?? DEFAULT_BALANCE;
      const body = { question_count: BALANCE_TOTAL, balance };
      const res = await apiFetch('/rooms/', { method: 'POST', body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to create room');
      const data = await res.json();
      setRoomCode(data.room_code);
      sessionStorage.setItem(ADMIN_ROOM_KEY, data.room_code);
      connect(data.room_code, 1, 'admin'); // admin user_id=1
    } catch {
      setSnack({ open: true, message: 'Failed to create room', severity: 'error' });
    } finally { setCreating(false); }
  };

  const handleStartGame = () => { startGame(BALANCE_TOTAL); };
  const handlePause = async () => {
    try {
      await apiFetch(`/rooms/${roomCode}/pause`, { method: 'POST' });
      pauseGame();
    } catch { setSnack({ open: true, message: 'Failed to pause', severity: 'error' }); }
  };
  const handleResume = async () => {
    try {
      await apiFetch(`/rooms/${roomCode}/resume`, { method: 'POST' });
      resumeGame();
    } catch { setSnack({ open: true, message: 'Failed to resume', severity: 'error' }); }
  };
  const handleEnd = async () => {
    if (roomCode) {
      try {
        await apiFetch(`/rooms/${roomCode}/end`, { method: 'POST' });
      } catch { /* ignore */ }
    }
  };
  const handleNewGame = () => {
    disconnect();
    setRoomCode('');
    sessionStorage.removeItem(ADMIN_ROOM_KEY);
  };

  // Delete the current room (and everyone/answers inside it). Two-step: the
  // first tap arms the button, a second tap within 4s actually deletes.
  const handleDeleteRoom = async () => {
    if (!roomCode || deleting) return;
    if (!deleteArmed) {
      setDeleteArmed(true);
      window.setTimeout(() => setDeleteArmed(false), 4000);
      return;
    }
    setDeleting(true);
    const code = roomCode;
    try {
      const res = await apiFetch(`/rooms/${code}`, { method: 'DELETE' });
      // CloudFront rewrites unknown API paths to index.html with a 200, so a
      // non-JSON body has to be treated as a failure, not a successful delete.
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        throw new Error(`Delete failed (HTTP ${res.status})`);
      }
      disconnect();
      sessionStorage.removeItem(ADMIN_ROOM_KEY);
      setRoomCode('');
      setDeleteArmed(false);
      setSnack({ open: true, message: `Room ${code} deleted`, severity: 'success' });
      navigate('/admin');
    } catch (e) {
      setSnack({
        open: true,
        message: e instanceof Error ? e.message : 'Failed to delete room',
        severity: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Determine view
  const getView = () => {
    if (!roomCode) return 'idle';
    switch (state.phase) {
      case 'idle': case 'waiting': return 'lobby';
      case 'countdown': return 'countdown';
      case 'bonus': return 'bonus';
      case 'reading': return 'reading';
      case 'question': return 'question';
      case 'result': return 'result';
      case 'leaderboard': return 'leaderboard';
      case 'finished': return 'finished';
      default: return 'lobby';
    }
  };
  const view = getView();

  return (
    <Box sx={pageBg}>
      {/* Header */}
      <Box sx={{ width: '100%', maxWidth: 900, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 2, borderBottom: `1px solid ${ARCADE_COLORS.orange}25` }}>
          <Box sx={{ width: 4, height: 20, backgroundColor: ARCADE_COLORS.orange, boxShadow: `0 0 10px ${ARCADE_COLORS.orange}` }} />
          <Box sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.8rem', color: ARCADE_COLORS.orange, letterSpacing: '0.15em', textShadow: `0 0 15px ${ARCADE_COLORS.orange}60` }}>
            GAME CONSOLE
          </Box>
          <Box onClick={() => { disconnect(); sessionStorage.removeItem(ADMIN_ROOM_KEY); navigate('/admin'); }} sx={{ ml: 'auto', cursor: 'pointer', fontFamily: '"Courier New", monospace', fontSize: '0.7rem', color: `${ARCADE_COLORS.white}40`, '&:hover': { color: ARCADE_COLORS.red }, transition: 'color 0.2s' }}>
            ← DASHBOARD
          </Box>
          {roomCode && (
            <Box
              component="button"
              onClick={handleDeleteRoom}
              disabled={deleting}
              sx={{
                background: 'none',
                border: 'none',
                p: 0,
                cursor: deleting ? 'wait' : 'pointer',
                fontFamily: '"Courier New", monospace',
                fontSize: '0.7rem',
                letterSpacing: '0.1em',
                color: deleteArmed ? ARCADE_COLORS.red : `${ARCADE_COLORS.red}60`,
                opacity: deleting ? 0.6 : 1,
                transition: 'color 0.2s',
                '&:hover': { color: ARCADE_COLORS.red },
              }}
            >
              {deleting ? 'DELETING…' : deleteArmed ? 'SURE? TAP AGAIN' : 'DELETE ROOM'}
            </Box>
          )}
          {roomCode && <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.65rem', color: `${ARCADE_COLORS.white}30` }}>Room: {roomCode}</Box>}
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ width: '100%', maxWidth: 900, display: 'flex', justifyContent: 'center' }}>
        {view === 'idle' && (
          <IdleView onCreateRoom={handleCreateRoom} creating={creating} />
        )}
        {view === 'lobby' && (
          <LobbyView roomCode={roomCode} playerCount={state.playerCount} players={state.players} onStart={handleStartGame} isConnected={isConnected} />
        )}
        {view === 'countdown' && <CountdownView value={state.countdownValue} />}
        {view === 'bonus' && <BonusIntroView multiplier={state.bonusMultiplier} />}
        {view === 'reading' && state.question && (
          <AdminReadingView question={state.question} timeRemaining={state.timeRemaining} />
        )}
        {view === 'question' && state.question && (
          <QuestionControlPanel
            question={state.question} timeRemaining={state.timeRemaining}
            answeredCount={state.answeredCount} playerCount={state.playerCount}
            isPaused={state.isPaused} onPause={handlePause} onResume={handleResume} onEnd={handleEnd}
          />
        )}
        {view === 'result' && state.result && state.question && (
          <AdminResultView result={state.result} question={state.question} leaderboard={state.leaderboard} />
        )}
        {view === 'leaderboard' && (
          <LeaderboardView
            leaderboard={state.leaderboard}
            questionTotal={state.question?.total ?? 10}
            questionIndex={state.question?.number ?? 0}
          />
        )}
        {view === 'finished' && <FinishedView leaderboard={state.leaderboard} onNewGame={handleNewGame} />}
      </Box>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setSnack(p => ({ ...p, open: false }))} severity={snack.severity} variant="filled">{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminConsole;
