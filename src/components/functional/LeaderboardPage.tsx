import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getStoredUser } from '../../utils/userStorage';
import { COUNTRIES } from '../common/Countries';
import { apiFetch } from '../../services/api';
import { ArcadeButton, ArcadeTypography } from '../ui';
import { ARCADE_COLORS, GRID_COLOR } from '../../theme/theme';

interface RankingEntry {
  rank: number;
  user_id: number;
  firstname: string;
  lastname: string;
  nickname?: string;
  region: string;
  score: number;
}

interface RankingData {
  score_type: string;
  total_entries: number;
  rankings: RankingEntry[];
}

const SCORE_TYPES = [
  { key: 'total', label: 'TOTAL' },
  { key: 'game1', label: 'HALLUCINATE' },
  { key: 'game2', label: 'DATA SHADOWS' },
  { key: 'game3', label: 'RETAIL' },
  { key: 'game4', label: 'PHISHING' },
  { key: 'game5', label: 'FINAL' },
];

// Auto-rotation interval for the leaderboard display (ms)
const ROTATION_INTERVAL_MS = 5000;

// Each game has its own theme color
const SCORE_TYPE_COLORS: Record<string, string> = {
  total: ARCADE_COLORS.cyan,
  game1: ARCADE_COLORS.magenta,
  game2: ARCADE_COLORS.cyan,
  game3: ARCADE_COLORS.yellow,
  game4: ARCADE_COLORS.lime,
  game5: ARCADE_COLORS.orange,
};

const scanlineAnim = keyframes`
  0% { top: -10%; }
  100% { top: 110%; }
`;

const countryCodeToFlag = (code: string | null | undefined): string => {
  // Guard against missing/empty region (backend `region` can be null)
  if (!code) return '🌐';
  const country = COUNTRIES.find((c) => c.name === code);
  const countryCode = country ? country.code : code;
  // Only convert valid 2-letter country codes; fallback for unknown values
  if (countryCode.length !== 2) return '🌐';
  return countryCode
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
};

const getRankDisplay = (rank: number) => {
  if (rank === 1) return { text: '1ST', color: '#FFD700' };
  if (rank === 2) return { text: '2ND', color: '#C0C0C0' };
  if (rank === 3) return { text: '3RD', color: '#CD7F32' };
  return { text: `${rank}TH`, color: `${ARCADE_COLORS.white}80` };
};

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [rankingCache, setRankingCache] = useState<Record<string, RankingData | null>>({});
  const [loading, setLoading] = useState(true);
  const [scoreType, setScoreType] = useState('total');
  const [rotationEnabled, setRotationEnabled] = useState(true);
  const rotationTimerRef = useRef<number | null>(null);
  const user = getStoredUser();

  // Dynamic theme color based on selected game
  const themeColor = SCORE_TYPE_COLORS[scoreType] || ARCADE_COLORS.cyan;

  // Auto-rotate through score types every 5s while enabled
  useEffect(() => {
    if (!rotationEnabled) return;
    rotationTimerRef.current = window.setInterval(() => {
      setScoreType((prev) => {
        const idx = SCORE_TYPES.findIndex((t) => t.key === prev);
        const next = SCORE_TYPES[(idx + 1) % SCORE_TYPES.length];
        return next.key;
      });
    }, ROTATION_INTERVAL_MS);
    return () => {
      if (rotationTimerRef.current !== null) {
        window.clearInterval(rotationTimerRef.current);
        rotationTimerRef.current = null;
      }
    };
  }, [rotationEnabled]);

  const pulseGlow = keyframes`
    0%, 100% { box-shadow: 0 0 8px ${themeColor}30; }
    50% { box-shadow: 0 0 16px ${themeColor}60; }
  `;

  // Fetch ALL score types once and cache them — rotation just switches views, no reload
  useEffect(() => {
    let cancelled = false;

    const fetchAllRankings = async () => {
      try {
        const entries = await Promise.all(
          SCORE_TYPES.map(async (t) => {
            try {
              // Fetch more than 10 to find current user's rank
              const response = await apiFetch(`/rankings/${t.key}?limit=50`);
              if (!response.ok) throw new Error(`HTTP ${response.status}`);
              const data: RankingData = await response.json();
              return [t.key, data] as const;
            } catch (err) {
              console.error(`Failed to fetch rankings (${t.key}):`, err);
              return [t.key, null] as const;
            }
          })
        );
        if (cancelled) return;
        setRankingCache(Object.fromEntries(entries));
      } catch (err) {
        console.error('Failed to fetch rankings:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAllRankings();
    return () => {
      cancelled = true;
    };
  }, []);

  // Read current type from cache — no refetch when scoreType changes
  const rankingData = rankingCache[scoreType] ?? null;

  // Determine what to display
  const top10 = rankingData?.rankings.slice(0, 10) || [];
  const currentUserId = user?.id;
  const userInTop10 = top10.some((e) => e.user_id === currentUserId);
  const userEntry = rankingData?.rankings.find((e) => e.user_id === currentUserId);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: ARCADE_COLORS.dark,
        backgroundImage: `
          linear-gradient(90deg, ${GRID_COLOR} 1px, transparent 1px),
          linear-gradient(180deg, ${GRID_COLOR} 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        overflow: 'auto',
        position: 'relative',
        /* Scanline */
        '&::before': {
          content: '""',
          position: 'fixed',
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, transparent, ${themeColor}40, transparent)`,
          animation: `${scanlineAnim} 4s linear infinite`,
          zIndex: 10,
          pointerEvents: 'none',
        },
      }}
    >
      {/* Title + compact auto-rotate toggle */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mt: 4, mb: 3, flexWrap: 'wrap' }}>
        <ArcadeTypography font="pressstart2p" sx={{ color: themeColor, fontSize: '1.1rem' }}>
          LEADERBOARD
        </ArcadeTypography>
        <Box
          role="switch"
          aria-checked={rotationEnabled}
          title={rotationEnabled ? 'Auto rotate: ON' : 'Auto rotate: OFF'}
          tabIndex={0}
          onClick={() => setRotationEnabled((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setRotationEnabled((v) => !v);
            }
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            cursor: 'pointer',
            userSelect: 'none',
            p: 0.5,
            border: `1px solid ${rotationEnabled ? themeColor : `${ARCADE_COLORS.white}25`}`,
            backgroundColor: rotationEnabled ? `${themeColor}12` : 'transparent',
            boxShadow: rotationEnabled ? `0 0 10px ${themeColor}35` : 'none',
            borderRadius: 0,
            transition: 'all 0.25s ease',
            '&:hover': { borderColor: themeColor },
            '&:focus-visible': { outline: `2px solid ${themeColor}`, outlineOffset: 2 },
          }}
        >
          {/* Switch track */}
          <Box
            sx={{
              width: 30,
              height: 14,
              borderRadius: 7,
              border: `1px solid ${rotationEnabled ? themeColor : `${ARCADE_COLORS.white}25`}`,
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              position: 'relative',
            }}
          >
            {/* Switch knob */}
            <Box
              sx={{
                position: 'absolute',
                top: 1,
                left: rotationEnabled ? 15 : 1,
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: rotationEnabled ? themeColor : `${ARCADE_COLORS.white}40`,
                boxShadow: rotationEnabled ? `0 0 6px ${themeColor}` : 'none',
                transition: 'left 0.2s ease, background-color 0.2s ease',
              }}
            />
          </Box>
          {/* Label: show AUTO only when rotation is ON */}
          {rotationEnabled && (
            <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.45rem', color: themeColor }}>
              AUTO
            </Typography>
          )}
        </Box>
      </Box>

      {/* Game Selector */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, mb: 4, px: 2 }}>
        {SCORE_TYPES.map((type) => (
          <Box
            key={type.key}
            onClick={() => setScoreType(type.key)}
            sx={{
              px: 2,
              py: 0.75,
              cursor: 'pointer',
              fontFamily: '"Electrolize", sans-serif',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '1px',
              border: `1px solid ${scoreType === type.key ? themeColor : `${ARCADE_COLORS.white}30`}`,
              color: scoreType === type.key ? themeColor : `${ARCADE_COLORS.white}80`,
              backgroundColor: scoreType === type.key ? `${themeColor}15` : 'transparent',
              borderRadius: 0,
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: themeColor,
                color: themeColor,
              },
            }}
          >
            {type.label}
          </Box>
        ))}
      </Box>

      {/* Leaderboard Container */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 700,
          px: 2,
          pb: 4,
        }}
      >
        <Box
          sx={{
            border: `2px solid ${themeColor}40`,
            backgroundColor: 'rgba(5, 5, 20, 0.95)',
            animation: `${pulseGlow} 3s ease-in-out infinite`,
            position: 'relative',
            overflow: 'hidden',
            /* Inner scanlines */
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${themeColor}03 2px, ${themeColor}03 4px)`,
              pointerEvents: 'none',
            },
          }}
        >
          {/* Table Header */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '70px 1fr 60px 90px',
              px: 2,
              py: 1.5,
              borderBottom: `1px solid ${themeColor}30`,
              backgroundColor: `${themeColor}08`,
            }}
          >
            <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem', color: themeColor }}>
              RANK
            </Typography>
            <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem', color: themeColor }}>
              NAME
            </Typography>
            <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem', color: themeColor, textAlign: 'center' }}>
              REG
            </Typography>
            <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem', color: themeColor, textAlign: 'right' }}>
              SCORE
            </Typography>
          </Box>

          {/* Rows */}
          {loading ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <ArcadeTypography font="electrolize" sx={{ color: themeColor, fontSize: '0.9rem' }}>
                {'> LOADING...'}
              </ArcadeTypography>
            </Box>
          ) : top10.length > 0 ? (
            <>
              {top10.map((entry) => {
                const rankInfo = getRankDisplay(entry.rank);
                const isCurrentUser = entry.user_id === currentUserId;
                return (
                  <Box
                    key={entry.user_id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '70px 1fr 60px 90px',
                      px: 2,
                      py: 1.25,
                      borderBottom: `1px solid ${GRID_COLOR}`,
                      backgroundColor: isCurrentUser ? `${themeColor}12` : 'transparent',
                      position: 'relative',
                      zIndex: 1,
                      '&:hover': {
                        backgroundColor: `${themeColor}08`,
                      },
                    }}
                  >
                    <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.6rem', color: rankInfo.color, alignSelf: 'center' }}>
                      {rankInfo.text}
                    </Typography>
                    <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.9rem', color: isCurrentUser ? themeColor : ARCADE_COLORS.white, fontWeight: isCurrentUser ? 700 : 400, alignSelf: 'center' }}>
                      {entry.firstname} {entry.lastname} {isCurrentUser ? '◄' : ''}
                    </Typography>
                    <Typography sx={{ fontSize: '1.2rem', textAlign: 'center', alignSelf: 'center' }}>
                      {countryCodeToFlag(entry.region)}
                    </Typography>
                    <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.95rem', fontWeight: 700, color: rankInfo.color, textAlign: 'right', alignSelf: 'center' }}>
                      {entry.score.toFixed(1)}
                    </Typography>
                  </Box>
                );
              })}

              {/* If user is NOT in top 10, show separator and user's rank */}
              {!userInTop10 && userEntry && (
                <>
                  <Box sx={{ py: 1, textAlign: 'center', borderBottom: `1px solid ${GRID_COLOR}` }}>
                    <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.6rem', color: `${ARCADE_COLORS.white}40`, letterSpacing: '4px' }}>
                      {'· · ·'}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '70px 1fr 60px 90px',
                      px: 2,
                      py: 1.25,
                      backgroundColor: `${themeColor}12`,
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.6rem', color: themeColor, alignSelf: 'center' }}>
                      {getRankDisplay(userEntry.rank).text}
                    </Typography>
                    <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.9rem', color: themeColor, fontWeight: 700, alignSelf: 'center' }}>
                      {userEntry.firstname} {userEntry.lastname} ◄
                    </Typography>
                    <Typography sx={{ fontSize: '1.2rem', textAlign: 'center', alignSelf: 'center' }}>
                      {countryCodeToFlag(userEntry.region)}
                    </Typography>
                    <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.95rem', fontWeight: 700, color: themeColor, textAlign: 'right', alignSelf: 'center' }}>
                      {userEntry.score.toFixed(1)}
                    </Typography>
                  </Box>
                </>
              )}
            </>
          ) : (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography sx={{ fontFamily: '"Electrolize", sans-serif', color: `${ARCADE_COLORS.white}60` }}>
                No rankings available yet.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Back Button */}
      <Box sx={{ pb: 4 }}>
        <ArcadeButton
          color="white"
          variant="outline"
          onClick={() => {
            const storedUser = getStoredUser();
            if (storedUser?.id) {
              sessionStorage.removeItem(`phishing_session_highscore_${storedUser.id}`);
            }
            sessionStorage.removeItem('phishing_attempt_count');
            navigate('/');
          }}
          sx={{
            fontFamily: '"Electrolize", sans-serif',
            letterSpacing: '1px',
            borderColor: `${themeColor}80`,
            color: themeColor,
            '&:hover': { borderColor: themeColor, backgroundColor: `${themeColor}15` },
          }}
        >
          BACK TO HOME
        </ArcadeButton>
      </Box>
    </Box>
  );
};

export default LeaderboardPage;
