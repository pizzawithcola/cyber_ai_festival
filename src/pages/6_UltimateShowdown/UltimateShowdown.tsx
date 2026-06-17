import React, { useState } from 'react';
import { Box, LinearProgress } from '@mui/material';
import { ARCADE_COLORS, GRID_COLOR } from '../../theme/theme';

// ─── Mock Data (placeholder) ─────────────────────────────────────────────────
const MOCK_QUESTION = {
  number: 1,
  total: 10,
  text: 'Which AI technique is used to generate realistic fake images of people?',
  timeLimit: 20,
  options: [
    { id: 'A', label: 'Reinforcement Learning', color: ARCADE_COLORS.red,     icon: '▲' },
    { id: 'B', label: 'Generative Adversarial Networks (GAN)', color: ARCADE_COLORS.cyan,    icon: '◆' },
    { id: 'C', label: 'Decision Trees',         color: ARCADE_COLORS.yellow,  icon: '●' },
    { id: 'D', label: 'Linear Regression',      color: ARCADE_COLORS.lime,    icon: '■' },
  ],
};

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'PLAYER_01', score: 9450, streak: 5 },
  { rank: 2, name: 'PLAYER_07', score: 8800, streak: 3 },
  { rank: 3, name: 'PLAYER_13', score: 8200, streak: 4 },
  { rank: 4, name: 'PLAYER_22', score: 7600, streak: 2 },
  { rank: 5, name: 'PLAYER_05', score: 7100, streak: 1 },
];

// ─── Sub-views ────────────────────────────────────────────────────────────────
type View = 'lobby' | 'question' | 'result' | 'leaderboard';

// ─── Shared bg ────────────────────────────────────────────────────────────────
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

// ─── NavBar ───────────────────────────────────────────────────────────────────
const NavBar: React.FC<{ view: View; onSwitch: (v: View) => void }> = ({ view, onSwitch }) => {
  const tabs: { v: View; label: string }[] = [
    { v: 'lobby',       label: 'LOBBY'       },
    { v: 'question',    label: 'QUESTION'    },
    { v: 'result',      label: 'RESULT'      },
    { v: 'leaderboard', label: 'LEADERBOARD' },
  ];
  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 4 }}>
      {tabs.map(t => (
        <Box key={t.v} onClick={() => onSwitch(t.v)} sx={{
          px: 2, py: 0.8,
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '0.5rem',
          letterSpacing: '0.1em',
          cursor: 'pointer',
          border: `1px solid ${view === t.v ? ARCADE_COLORS.magenta : `${ARCADE_COLORS.white}20`}`,
          color: view === t.v ? ARCADE_COLORS.magenta : `${ARCADE_COLORS.white}40`,
          backgroundColor: view === t.v ? `${ARCADE_COLORS.magenta}15` : 'transparent',
          boxShadow: view === t.v ? `0 0 10px ${ARCADE_COLORS.magenta}40` : 'none',
          transition: 'all 0.15s',
          borderRadius: '2px',
          '&:hover': { color: ARCADE_COLORS.magenta, borderColor: `${ARCADE_COLORS.magenta}60` },
        }}>
          {t.label}
        </Box>
      ))}
      <Box sx={{ ml: 'auto', px: 1.5, py: 0.8, fontFamily: '"Courier New", monospace', fontSize: '0.6rem', color: `${ARCADE_COLORS.white}30`, border: `1px solid ${ARCADE_COLORS.white}10`, borderRadius: '2px' }}>
        PLACEHOLDER VIEW
      </Box>
    </Box>
  );
};

// ─── LOBBY VIEW ───────────────────────────────────────────────────────────────
const LobbyView: React.FC = () => (
  <Box sx={{ width: '100%', maxWidth: 700, textAlign: 'center' }}>
    {/* Game Code */}
    <Box sx={{ mb: 4 }}>
      <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.7rem', color: `${ARCADE_COLORS.white}40`, letterSpacing: '0.2em', mb: 1 }}>JOIN WITH CODE</Box>
      <Box sx={{
        display: 'inline-block',
        px: 5, py: 2.5,
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '2.5rem',
        fontWeight: 900,
        letterSpacing: '0.3em',
        color: ARCADE_COLORS.yellow,
        textShadow: `0 0 30px ${ARCADE_COLORS.yellow}80`,
        border: `2px solid ${ARCADE_COLORS.yellow}40`,
        backgroundColor: `${ARCADE_COLORS.yellow}08`,
        borderRadius: '4px',
      }}>
        847291
      </Box>
    </Box>

    {/* Title */}
    <Box sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '1.1rem', color: ARCADE_COLORS.magenta, textShadow: `0 0 20px ${ARCADE_COLORS.magenta}80`, mb: 1, letterSpacing: '0.05em' }}>
      ULTIMATE SHOWDOWN
    </Box>
    <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.8rem', color: `${ARCADE_COLORS.white}50`, mb: 4 }}>
      AI Knowledge Challenge — MENAT AI Festival 2025
    </Box>

    {/* Player count */}
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 5 }}>
      <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: ARCADE_COLORS.lime, boxShadow: `0 0 8px ${ARCADE_COLORS.lime}`, animation: 'pulse 1.5s ease-in-out infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} />
      <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.85rem', color: ARCADE_COLORS.lime }}>
        <Box component="span" sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '1.4rem', mr: 1 }}>24</Box>
        players connected
      </Box>
    </Box>

    {/* Players grid (placeholder avatars) */}
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 5 }}>
      {Array.from({ length: 24 }).map((_, i) => (
        <Box key={i} sx={{
          width: 40, height: 40, borderRadius: '4px',
          backgroundColor: [ARCADE_COLORS.cyan, ARCADE_COLORS.magenta, ARCADE_COLORS.yellow, ARCADE_COLORS.lime, ARCADE_COLORS.red][i % 5] + '30',
          border: `1px solid ${[ARCADE_COLORS.cyan, ARCADE_COLORS.magenta, ARCADE_COLORS.yellow, ARCADE_COLORS.lime, ARCADE_COLORS.red][i % 5]}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Press Start 2P", monospace', fontSize: '0.45rem',
          color: [ARCADE_COLORS.cyan, ARCADE_COLORS.magenta, ARCADE_COLORS.yellow, ARCADE_COLORS.lime, ARCADE_COLORS.red][i % 5],
        }}>
          P{String(i + 1).padStart(2, '0')}
        </Box>
      ))}
    </Box>

    {/* Start button (host only placeholder) */}
    <Box sx={{
      px: 5, py: 1.8, display: 'inline-block',
      fontFamily: '"Press Start 2P", monospace', fontSize: '0.75rem',
      letterSpacing: '0.15em', cursor: 'pointer',
      border: `2px solid ${ARCADE_COLORS.lime}`,
      color: ARCADE_COLORS.lime,
      backgroundColor: `${ARCADE_COLORS.lime}15`,
      boxShadow: `0 0 20px ${ARCADE_COLORS.lime}40`,
      borderRadius: '4px',
      transition: 'all 0.15s',
      '&:hover': { backgroundColor: `${ARCADE_COLORS.lime}25`, boxShadow: `0 0 30px ${ARCADE_COLORS.lime}60` },
    }}>
      ▶ START GAME
    </Box>
  </Box>
);

// ─── QUESTION VIEW ────────────────────────────────────────────────────────────
const QuestionView: React.FC = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const progress = 0.6; // placeholder 60% time remaining

  return (
    <Box sx={{ width: '100%', maxWidth: 860 }}>
      {/* Top bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.75rem', color: `${ARCADE_COLORS.white}50` }}>
          Q {MOCK_QUESTION.number} / {MOCK_QUESTION.total}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '1rem', color: ARCADE_COLORS.yellow, textShadow: `0 0 10px ${ARCADE_COLORS.yellow}60` }}>
            {Math.round(MOCK_QUESTION.timeLimit * progress)}
          </Box>
          <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.65rem', color: `${ARCADE_COLORS.white}40` }}>SEC</Box>
        </Box>
        <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.75rem', color: `${ARCADE_COLORS.white}50` }}>
          24 players
        </Box>
      </Box>

      {/* Timer bar */}
      <LinearProgress variant="determinate" value={progress * 100} sx={{
        mb: 3, height: 6, borderRadius: 0,
        backgroundColor: `${ARCADE_COLORS.white}15`,
        '& .MuiLinearProgress-bar': { backgroundColor: progress > 0.4 ? ARCADE_COLORS.lime : progress > 0.2 ? ARCADE_COLORS.yellow : ARCADE_COLORS.red, borderRadius: 0 },
      }} />

      {/* Question card */}
      <Box sx={{
        p: 4, mb: 3, textAlign: 'center',
        backgroundColor: '#0a0a1a',
        border: `2px solid ${ARCADE_COLORS.cyan}40`,
        borderRadius: '8px',
        boxShadow: `0 0 30px ${ARCADE_COLORS.cyan}15`,
        position: 'relative',
        '&::before': { content: '""', position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px', background: `linear-gradient(90deg, transparent, ${ARCADE_COLORS.cyan}80, transparent)` },
      }}>
        <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.65rem', color: `${ARCADE_COLORS.cyan}60`, letterSpacing: '0.2em', mb: 1.5 }}>QUESTION {MOCK_QUESTION.number}</Box>
        <Box sx={{ fontFamily: '"Audiowide", sans-serif', fontSize: '1.1rem', color: ARCADE_COLORS.white, lineHeight: 1.6, fontWeight: 400 }}>
          {MOCK_QUESTION.text}
        </Box>
      </Box>

      {/* Answer options (2×2 grid) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        {MOCK_QUESTION.options.map(opt => (
          <Box key={opt.id} onClick={() => setSelected(opt.id)} sx={{
            p: 2.5, cursor: 'pointer', borderRadius: '6px',
            display: 'flex', alignItems: 'center', gap: 2,
            backgroundColor: selected === opt.id ? `${opt.color}25` : `${opt.color}10`,
            border: `2px solid ${selected === opt.id ? opt.color : opt.color + '50'}`,
            boxShadow: selected === opt.id ? `0 0 20px ${opt.color}50` : 'none',
            transition: 'all 0.15s',
            '&:hover': { backgroundColor: `${opt.color}20`, borderColor: opt.color, boxShadow: `0 0 15px ${opt.color}40` },
          }}>
            {/* Icon badge */}
            <Box sx={{
              width: 36, height: 36, flexShrink: 0, borderRadius: '4px',
              backgroundColor: opt.color,
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

      {/* Waiting indicator */}
      {selected && (
        <Box sx={{ mt: 3, textAlign: 'center', fontFamily: '"Courier New", monospace', fontSize: '0.7rem', color: `${ARCADE_COLORS.white}40` }}>
          ✓ Answer locked in — waiting for others...
        </Box>
      )}
    </Box>
  );
};

// ─── RESULT VIEW ──────────────────────────────────────────────────────────────
const ResultView: React.FC = () => {
  const correctId = 'B';
  const selected  = 'B'; // placeholder: user got it right

  return (
    <Box sx={{ width: '100%', maxWidth: 720, textAlign: 'center' }}>
      {/* Correct / Wrong banner */}
      <Box sx={{
        py: 3, mb: 4,
        backgroundColor: selected === correctId ? `${ARCADE_COLORS.lime}15` : `${ARCADE_COLORS.red}15`,
        border: `2px solid ${selected === correctId ? ARCADE_COLORS.lime : ARCADE_COLORS.red}`,
        borderRadius: '8px',
        boxShadow: `0 0 30px ${selected === correctId ? ARCADE_COLORS.lime : ARCADE_COLORS.red}30`,
      }}>
        <Box sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '1.2rem', color: selected === correctId ? ARCADE_COLORS.lime : ARCADE_COLORS.red, textShadow: `0 0 20px currentColor`, mb: 1 }}>
          {selected === correctId ? '✓ CORRECT!' : '✗ WRONG!'}
        </Box>
        <Box sx={{ fontFamily: '"Audiowide", sans-serif', fontSize: '0.85rem', color: `${ARCADE_COLORS.white}70` }}>
          The answer was: <Box component="span" sx={{ color: ARCADE_COLORS.lime, fontWeight: 700 }}>Generative Adversarial Networks (GAN)</Box>
        </Box>
      </Box>

      {/* Points earned */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '2.2rem', color: ARCADE_COLORS.yellow, textShadow: `0 0 30px ${ARCADE_COLORS.yellow}80`, lineHeight: 1 }}>
          +1,250
        </Box>
        <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.7rem', color: `${ARCADE_COLORS.white}40`, mt: 0.5, letterSpacing: '0.2em' }}>POINTS EARNED</Box>
      </Box>

      {/* Stats row */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mb: 4 }}>
        {[
          { label: 'CURRENT RANK', value: '#3', color: ARCADE_COLORS.cyan },
          { label: 'STREAK',       value: '4x 🔥', color: ARCADE_COLORS.orange },
          { label: 'TOTAL SCORE',  value: '8,200', color: ARCADE_COLORS.magenta },
        ].map(s => (
          <Box key={s.label} sx={{ textAlign: 'center' }}>
            <Box sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '1rem', color: s.color, textShadow: `0 0 12px ${s.color}60` }}>{s.value}</Box>
            <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.55rem', color: `${ARCADE_COLORS.white}35`, mt: 0.5, letterSpacing: '0.15em' }}>{s.label}</Box>
          </Box>
        ))}
      </Box>

      {/* Answer distribution bar */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.6rem', color: `${ARCADE_COLORS.white}40`, letterSpacing: '0.15em', mb: 1.5, textAlign: 'left' }}>ANSWER DISTRIBUTION</Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {MOCK_QUESTION.options.map(opt => {
            const pct = opt.id === 'B' ? 68 : opt.id === 'A' ? 14 : opt.id === 'C' ? 10 : 8;
            return (
              <Box key={opt.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 28, fontFamily: '"Press Start 2P", monospace', fontSize: '0.5rem', color: opt.color, textAlign: 'center', flexShrink: 0 }}>{opt.icon}</Box>
                <Box sx={{ flex: 1, height: 18, backgroundColor: `${opt.color}15`, borderRadius: '2px', overflow: 'hidden', border: `1px solid ${opt.color}20` }}>
                  <Box sx={{ width: `${pct}%`, height: '100%', backgroundColor: opt.id === correctId ? opt.color : `${opt.color}60`, transition: 'width 0.6s ease' }} />
                </Box>
                <Box sx={{ width: 36, fontFamily: '"Courier New", monospace', fontSize: '0.7rem', color: `${ARCADE_COLORS.white}60`, textAlign: 'right', flexShrink: 0 }}>{pct}%</Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.7rem', color: `${ARCADE_COLORS.white}25`, letterSpacing: '0.1em' }}>
        Next question in 5s...
      </Box>
    </Box>
  );
};

// ─── LEADERBOARD VIEW ─────────────────────────────────────────────────────────
const ShowdownLeaderboard: React.FC = () => (
  <Box sx={{ width: '100%', maxWidth: 600 }}>
    <Box sx={{ textAlign: 'center', mb: 4 }}>
      <Box sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.9rem', color: ARCADE_COLORS.yellow, textShadow: `0 0 20px ${ARCADE_COLORS.yellow}60`, letterSpacing: '0.1em' }}>
        🏆 LIVE RANKINGS
      </Box>
    </Box>

    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {MOCK_LEADERBOARD.map((p, i) => {
        const medalColor = i === 0 ? ARCADE_COLORS.yellow : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : `${ARCADE_COLORS.white}30`;
        const isTop3 = i < 3;
        return (
          <Box key={p.rank} sx={{
            display: 'flex', alignItems: 'center', gap: 2,
            p: 2, borderRadius: '6px',
            backgroundColor: isTop3 ? `${medalColor}10` : '#08081a',
            border: `1px solid ${isTop3 ? medalColor + '40' : ARCADE_COLORS.white + '08'}`,
            boxShadow: isTop3 ? `0 0 15px ${medalColor}20` : 'none',
            transform: isTop3 ? 'none' : 'none',
            transition: 'all 0.2s',
          }}>
            {/* Rank */}
            <Box sx={{ width: 36, textAlign: 'center', fontFamily: '"Press Start 2P", monospace', fontSize: isTop3 ? '1rem' : '0.65rem', color: medalColor, flexShrink: 0 }}>
              {i === 0 ? '👑' : `#${p.rank}`}
            </Box>
            {/* Name */}
            <Box sx={{ flex: 1, fontFamily: '"Audiowide", sans-serif', fontSize: '0.9rem', color: ARCADE_COLORS.white }}>
              {p.name}
            </Box>
            {/* Streak */}
            <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.65rem', color: ARCADE_COLORS.orange }}>
              🔥 {p.streak}x
            </Box>
            {/* Score */}
            <Box sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.7rem', color: isTop3 ? medalColor : `${ARCADE_COLORS.white}70`, textAlign: 'right', minWidth: 70 }}>
              {p.score.toLocaleString()}
            </Box>
          </Box>
        );
      })}
    </Box>

    {/* Progress indicator */}
    <Box sx={{ mt: 4, textAlign: 'center' }}>
      <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.65rem', color: `${ARCADE_COLORS.white}30`, mb: 1 }}>QUESTION PROGRESS</Box>
      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
        {Array.from({ length: MOCK_QUESTION.total }).map((_, i) => (
          <Box key={i} sx={{ width: 24, height: 6, borderRadius: '2px', backgroundColor: i < MOCK_QUESTION.number ? ARCADE_COLORS.lime : `${ARCADE_COLORS.white}15` }} />
        ))}
      </Box>
    </Box>
  </Box>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const UltimateShowdown: React.FC = () => {
  const [view, setView] = useState<View>('lobby');

  return (
    <Box sx={pageBg}>
      {/* Page title strip */}
      <Box sx={{ width: '100%', maxWidth: 900, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 2, borderBottom: `1px solid ${ARCADE_COLORS.magenta}25` }}>
          <Box sx={{ width: 4, height: 20, backgroundColor: ARCADE_COLORS.magenta, boxShadow: `0 0 10px ${ARCADE_COLORS.magenta}` }} />
          <Box sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.8rem', color: ARCADE_COLORS.magenta, letterSpacing: '0.15em', textShadow: `0 0 15px ${ARCADE_COLORS.magenta}60` }}>
            ULTIMATE SHOWDOWN
          </Box>
          <Box sx={{ ml: 'auto', fontFamily: '"Courier New", monospace', fontSize: '0.65rem', color: `${ARCADE_COLORS.white}30` }}>
            AI KNOWLEDGE CHALLENGE
          </Box>
        </Box>
      </Box>

      {/* Nav */}
      <Box sx={{ width: '100%', maxWidth: 900 }}>
        <NavBar view={view} onSwitch={setView} />
      </Box>

      {/* Content */}
      <Box sx={{ width: '100%', maxWidth: 900, display: 'flex', justifyContent: 'center' }}>
        {view === 'lobby'       && <LobbyView />}
        {view === 'question'    && <QuestionView />}
        {view === 'result'      && <ResultView />}
        {view === 'leaderboard' && <ShowdownLeaderboard />}
      </Box>
    </Box>
  );
};

export default UltimateShowdown;
