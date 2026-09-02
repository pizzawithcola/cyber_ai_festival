import React, { useState } from 'react';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';

// ─── Sci-Fi Design Tokens (consistent with AdminPage) ─────────────────────────
const SF = {
  bg:       '#030812',
  panel:    '#06101f',
  panelAlt: '#040d18',
  border:   '#1a3a5c',
  cyan:     '#00d4ff',
  lime:     '#00ff88',
  red:      '#ff3355',
  yellow:   '#ffd700',
  magenta:  '#cc44ff',
  orange:   '#ff8000',
  white:    '#e8f4ff',
  dim:      '#4a7a9b',
  fontTitle:  '"Orbitron", "Electrolize", sans-serif',
  fontBody:   '"Electrolize", "Courier New", monospace',
  fontMono:   '"Courier New", monospace',
};

// ─── Game rule data (5 games: 4 theme + Ultimate Showdown) ───────────────────
interface RuleItem {
  label: string;
  detail?: string;
  points: string; // e.g. "+20", "-10", "max 5"
}

interface RuleBlock {
  label: string;
  max?: string;          // e.g. "20"
  items: RuleItem[];
}

interface GameRules {
  key: string;
  name: string;
  tagline: string;
  accent: string;
  total: string;         // total score display
  note?: string;
  blocks: RuleBlock[];
}

const GAMES: GameRules[] = [
  {
    key: 'hallucinate',
    name: 'HALLUCINATE',
    tagline: 'Spot AI hallucinations & rate your confidence',
    accent: SF.magenta,
    total: '/100',
    note: 'Score = judgement × confidence. Confidence ranges 50%–100%.',
    blocks: [
      {
        label: 'Judgement Accuracy',
        items: [
          { label: 'Correctly flag / pass a line', points: '+20 × conf' },
          { label: 'Wrong judgement', points: '-10 × conf' },
          { label: 'Confidence multiplier', points: '0.5× – 1.0×' },
          { label: 'Overall accuracy rating', points: '0–100' },
        ],
      },
    ],
  },
  {
    key: 'datashadows',
    name: 'DATA SHADOWS',
    tagline: 'How much of your data shadow do you protect?',
    accent: SF.cyan,
    total: '/100',
    note: 'Privacy score from 5 modules, capped at 100.',
    blocks: [
      {
        label: 'Terms & Education',
        max: '20',
        items: [
          { label: 'Read all terms', points: '+5' },
          { label: 'Paid attention (3s+ per slide)', points: '+5' },
          { label: 'Read all education cards', points: '+10' },
        ],
      },
      {
        label: 'Details Reviewed',
        max: '15',
        items: [
          { label: 'Open each explanation', points: '+3 each' },
        ],
      },
      {
        label: 'Consent Refused',
        max: '35',
        items: [
          { label: 'Opt out of each data sharing', points: '+7 each' },
        ],
      },
      {
        label: 'Non-Essential Data Guarded',
        max: '30',
        items: [
          { label: 'Skip each non-essential survey question', points: '+5 each' },
        ],
      },
    ],
  },
  {
    key: 'retail',
    name: 'RETAIL DEMOLITION',
    tagline: 'Manual vs agentic shopping — catch the malicious site',
    accent: SF.yellow,
    total: 'cap 100',
    note: 'Theory max 110 → capped at 100.',
    blocks: [
      {
        label: 'Education',
        max: '20',
        items: [
          { label: 'Complete education cards', points: '+20' },
        ],
      },
      {
        label: 'Manual Shopping',
        max: '30',
        items: [
          { label: 'Complete a manual purchase', points: '+30' },
          { label: 'Bonus: correctly report a suspicious item', points: '+10' },
        ],
      },
      {
        label: 'Agent Mode',
        max: '30',
        items: [
          { label: 'Stop incident within 2s', points: '+30' },
          { label: 'Every 200ms slower', points: '−1' },
        ],
      },
      {
        label: 'Quiz',
        max: '20',
        items: [
          { label: 'Quiz 1 — responsibility', points: '+10' },
          { label: 'Quiz 2 — fraud response', points: '+10' },
        ],
      },
    ],
  },
  {
    key: 'phishing',
    name: 'PHISHING',
    tagline: 'Rate phishing emails across 5 telltale categories',
    accent: SF.lime,
    total: '/100',
    blocks: [
      {
        label: 'Detection Categories',
        items: [
          { label: 'Personalization', points: 'max 20' },
          { label: 'Persuasion & Urgency', points: 'max 20' },
          { label: 'Sender Credibility', points: 'max 20' },
          { label: 'Call to Action', points: 'max 20' },
          { label: 'Technical Quality', points: 'max 20' },
        ],
      },
    ],
  },
  {
    key: 'ultimate',
    name: 'ULTIMATE SHOWDOWN',
    tagline: 'Live 12-question arena — 10 normal + 2 bonus',
    accent: SF.orange,
    total: 'max 15,000',
    note: '12 questions: 5 categories ×2 + bonus ×2 (last two = ×2 and ×3).',
    blocks: [
      {
        label: 'Normal Questions',
        max: '1000 each',
        items: [
          { label: 'Base for correct answer', points: '+500' },
          { label: 'Speed bonus (instant answer)', points: '+500' },
          { label: 'Every second slower (20s limit)', points: '−25' },
          { label: 'Wrong answer', points: '+0' },
        ],
      },
      {
        label: 'Bonus Questions (×2 / ×3)',
        items: [
          { label: 'Score is computed first, then multiplied', points: '×2 / ×3' },
          { label: 'Always the final two questions', points: '—' },
        ],
      },
    ],
  },
];

const GameCard: React.FC<{ game: GameRules }> = ({ game }) => (
  <Box
    sx={{
      backgroundColor: SF.panel,
      border: `1px solid ${game.accent}40`,
      position: 'relative',
      borderRadius: '4px',
      overflow: 'hidden',
      '&::before': {
        content: '""', position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `linear-gradient(${game.accent}08, transparent 40%)`,
      },
    }}
  >
    {/* Header */}
    <Box
      sx={{
        px: 3, py: 2.5,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${game.accent}30`,
        backgroundColor: `${game.accent}10`,
        gap: 2, flexWrap: 'wrap',
      }}
    >
      <Box>
        <Box sx={{ fontFamily: SF.fontTitle, fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.18em', color: game.accent }}>
          {game.name}
        </Box>
        <Box sx={{ fontFamily: SF.fontBody, fontSize: '0.85rem', color: `${SF.white}70`, mt: 0.5 }}>
          {game.tagline}
        </Box>
      </Box>
      <Box sx={{ textAlign: 'right' }}>
        <Box sx={{ fontFamily: SF.fontMono, fontSize: '1.3rem', color: game.accent, lineHeight: 1 }}>
          {game.total}
        </Box>
        <Box sx={{ fontFamily: SF.fontBody, fontSize: '0.7rem', color: `${SF.white}50`, letterSpacing: '0.15em' }}>
          TOTAL SCORE
        </Box>
      </Box>
    </Box>

    {/* Blocks */}
    <Box sx={{ p: 3 }}>
      {game.note && (
        <Box sx={{
          fontFamily: SF.fontBody, fontSize: '0.8rem', color: `${game.accent}90`,
          mb: 2, pb: 2, borderBottom: `1px dashed ${game.accent}25`,
        }}>
          ⓘ {game.note}
        </Box>
      )}

      {game.blocks.map((block, bi) => (
        <Box key={bi} sx={{ mb: block.max ? 3 : 2, '&:last-child': { mb: 0 } }}>
          {/* Block header */}
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1.5 }}>
            <Box sx={{
              fontFamily: SF.fontTitle, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', color: SF.white,
            }}>
              {block.label}
            </Box>
            {block.max && (
              <Box sx={{ fontFamily: SF.fontMono, fontSize: '0.85rem', color: `${SF.white}70` }}>
                max {block.max}
              </Box>
            )}
          </Box>

          {/* Items */}
          <Box sx={{
            backgroundColor: SF.panelAlt,
            border: `1px solid ${SF.border}50`,
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            {block.items.map((item, ii) => (
              <Box
                key={ii}
                sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 2, px: 2, py: 1.2,
                  borderBottom: ii < block.items.length - 1 ? `1px solid ${SF.border}30` : 'none',
                }}
              >
                <Box sx={{ fontFamily: SF.fontBody, fontSize: '0.85rem', color: `${SF.white}85` }}>
                  {item.label}
                </Box>
                <Box
                  sx={{
                    fontFamily: SF.fontMono, fontSize: '0.82rem', color: game.accent,
                    flexShrink: 0,
                    px: 1, py: 0.2,
                    backgroundColor: `${game.accent}12`,
                    border: `1px solid ${game.accent}35`,
                    borderRadius: '3px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.points}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  </Box>
);

const ScoringSystem: React.FC = () => {
  const [gameKey, setGameKey] = useState<string>('hallucinate');
  const active = GAMES.find((g) => g.key === gameKey) ?? GAMES[0];

  return (
    <Box>
      {/* Game switcher */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <ToggleButtonGroup
          value={gameKey}
          exclusive
          onChange={(_, v) => v && setGameKey(v)}
          sx={{
            '& .MuiToggleButton-root': {
              fontFamily: SF.fontTitle,
              fontSize: '0.66rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              px: 2,
              py: 0.8,
              color: SF.dim,
              borderColor: `${SF.cyan}25`,
              '&:hover': { color: `${SF.cyan}80`, borderColor: `${SF.cyan}50` },
              '&.Mui-selected': {
                color: active.accent,
                backgroundColor: `${active.accent}15`,
                borderColor: active.accent,
              },
            },
          }}
        >
          {GAMES.map((g) => (
            <ToggleButton key={g.key} value={g.key}>{g.name}</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Active game card */}
      <GameCard game={active} />
    </Box>
  );
};

export default ScoringSystem;
