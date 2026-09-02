import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  { key: 'game2', label: 'DATA' },
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

  // Two-column layout when (landscape) AND (the top-10 list, rendered as ONE column,
  // would overflow the scroll container — i.e. exactly when a vertical scrollbar appears).
  // No fixed-height guess: we measure the real single-column list height via a hidden
  // measurement copy, so any content/font/row change stays accurate.
  const [twoColumns, setTwoColumns] = useState(false);
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  const listBoxRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);

  const computeColumns = useCallback(() => {
    const root = scrollRootRef.current;
    const measureEl = measureRef.current;
    const listBox = listBoxRef.current;
    if (!root || !measureEl || !listBox) return;
    // Single-column list height measured from the hidden copy (stable, layout-free).
    const singleListH = measureEl.offsetHeight;
    // Where the list starts inside the scroll container (root is `position:relative`,
    // so it is listBox's offsetParent; unaffected by twoColumns).
    const listTop = listBox.offsetTop;
    // Fixed space BELOW the list (leaderboard container bottom padding + BACK button).
    // back.offsetTop always sits right after the list container, so this value is the
    // same in both layouts — a true constant that doesn't depend on twoColumns.
    const flowChildren = (Array.from(root.children) as HTMLElement[]).filter((el) => {
      const cs = getComputedStyle(el);
      return cs.position !== 'fixed' && cs.visibility !== 'hidden';
    });
    const backEl = flowChildren[flowChildren.length - 1];
    const belowGap = backEl
      ? backEl.offsetTop - (listTop + listBox.offsetHeight) + backEl.offsetHeight
      : 0;
    // Total vertical space a SINGLE column needs (fixed content above + list + below).
    const singleColumnNeed = listTop + singleListH + belowGap;
    const wouldOverflow = singleColumnNeed > root.clientHeight + 4; // a vertical scrollbar would appear
    const isLandscape = window.innerWidth > window.innerHeight;
    setTwoColumns(isLandscape && wouldOverflow);
  }, []);

  useEffect(() => {
    computeColumns();
    const onResize = () => computeColumns();
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(() => computeColumns());
    const root = scrollRootRef.current;
    if (root) ro.observe(root);
    return () => {
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, [computeColumns]);

  // After rankings load/change, the hidden measure (and rows) change too — re-evaluate next frame.
  useEffect(() => {
    const raf = requestAnimationFrame(() => computeColumns());
    return () => cancelAnimationFrame(raf);
  }, [rankingCache, loading, computeColumns]);

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

  // Renders a bordered panel: column header + the given rows. Used for the main
  // list, for each two-column half, and for the hidden single-column measure.
  const renderColumn = (columnEntries: RankingEntry[]) => {
    const columnHeader = (
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
        <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem', color: themeColor }}>RANK</Typography>
        <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem', color: themeColor }}>NAME</Typography>
        <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem', color: themeColor, textAlign: 'center' }}>REG</Typography>
        <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem', color: themeColor, textAlign: 'right' }}>SCORE</Typography>
      </Box>
    );

    const columnRows = columnEntries.map((entry) => {
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
            '&:hover': { backgroundColor: `${themeColor}08` },
          }}
        >
          <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.6rem', color: rankInfo.color, alignSelf: 'center' }}>
            {rankInfo.text}
          </Typography>
          <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.9rem', color: isCurrentUser ? themeColor : ARCADE_COLORS.white, fontWeight: isCurrentUser ? 700 : 400, alignSelf: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
    });

    return (
      <Box
        sx={{
          flex: twoColumns ? 1 : 'none',
          width: twoColumns ? '50%' : '100%',
          border: `2px solid ${themeColor}40`,
          backgroundColor: 'rgba(5, 5, 20, 0.95)',
          animation: `${pulseGlow} 3s ease-in-out infinite`,
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${themeColor}03 2px, ${themeColor}03 4px)`,
            pointerEvents: 'none',
          },
        }}
      >
        {columnHeader}
        {columnRows}
      </Box>
    );
  };

  // Separator + current-user row (shown under the list in single-column mode when
  // the user is outside top-10; also included in the hidden single-column measure).
  const renderUserRankBlock = (entry: RankingEntry) => (
    <Box
      sx={{
        width: '100%',
        border: `2px solid ${themeColor}40`,
        backgroundColor: 'rgba(5, 5, 20, 0.95)',
        animation: `${pulseGlow} 3s ease-in-out infinite`,
        position: 'relative',
        overflow: 'hidden',
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${themeColor}03 2px, ${themeColor}03 4px)`,
          pointerEvents: 'none',
        },
      }}
    >
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
          {getRankDisplay(entry.rank).text}
        </Typography>
        <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.9rem', color: themeColor, fontWeight: 700, alignSelf: 'center' }}>
          {entry.firstname} {entry.lastname} ◄
        </Typography>
        <Typography sx={{ fontSize: '1.2rem', textAlign: 'center', alignSelf: 'center' }}>
          {countryCodeToFlag(entry.region)}
        </Typography>
        <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.95rem', fontWeight: 700, color: themeColor, textAlign: 'right', alignSelf: 'center' }}>
          {entry.score.toFixed(1)}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box
      ref={scrollRootRef}
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
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.95, mb: 4, px: 2, transform: 'scale(0.95)' }}>
        {SCORE_TYPES.map((type) => (
          <Box
            key={type.key}
            onClick={() => setScoreType(type.key)}
            sx={{
              px: 1.9,
              py: 0.71,
              cursor: 'pointer',
              fontFamily: '"Electrolize", sans-serif',
              fontSize: '0.71rem',
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
          maxWidth: twoColumns ? 1200 : 700,
          px: 2,
          pb: 4,
        }}
      >
        <Box
          ref={listBoxRef}
          sx={{
            display: 'flex',
            gap: twoColumns ? 3 : 0,
            flexDirection: twoColumns ? 'row' : 'column',
            alignItems: twoColumns ? 'flex-start' : 'stretch',
          }}
        >
          {(() => {
            if (loading) {
              return (
                <Box sx={{ py: 6, textAlign: 'center', width: '100%', border: `2px solid ${themeColor}40`, backgroundColor: 'rgba(5, 5, 20, 0.95)', animation: `${pulseGlow} 3s ease-in-out infinite`, position: 'relative' }}>
                  <ArcadeTypography font="electrolize" sx={{ color: themeColor, fontSize: '0.9rem' }}>
                    {'> LOADING...'}
                  </ArcadeTypography>
                </Box>
              );
            }

            if (top10.length === 0) {
              return (
                <Box sx={{ py: 6, textAlign: 'center', width: '100%', border: `2px solid ${themeColor}40`, backgroundColor: 'rgba(5, 5, 20, 0.95)', position: 'relative' }}>
                  <Typography sx={{ fontFamily: '"Electrolize", sans-serif', color: `${ARCADE_COLORS.white}60` }}>
                    No rankings available yet.
                  </Typography>
                </Box>
              );
            }

            if (twoColumns) {
              // Split 1-10 into two columns of 5
              return (
                <>
                  {renderColumn(top10.slice(0, 5))}
                  {renderColumn(top10.slice(5, 10))}
                </>
              );
            }

            // Single column: full 10 + optional user rank row
            return renderColumn(top10);
          })()}

          {/* If user is NOT in top 10 (single-column mode), show separator + user rank */}
          {!twoColumns && !userInTop10 && userEntry && top10.length > 0 && renderUserRankBlock(userEntry)}
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

      {/* Hidden single-column measure: decides two-column layout from REAL overflow
          (would a vertical scrollbar appear?) instead of a fixed height guess.
          Rendered offscreen — it takes no layout/scroll space. */}
      {!loading && top10.length > 0 && (
        <Box
          ref={measureRef}
          aria-hidden
          sx={{
            position: 'fixed',
            left: -99999,
            top: 0,
            visibility: 'hidden',
            pointerEvents: 'none',
            zIndex: -1,
          }}
        >
          {renderColumn(top10)}
          {!userInTop10 && userEntry && renderUserRankBlock(userEntry)}
        </Box>
      )}
    </Box>
  );
};

export default LeaderboardPage;
