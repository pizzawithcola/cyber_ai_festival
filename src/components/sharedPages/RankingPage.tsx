import React, { useState, useEffect } from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
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
  email: string;
  region: string;
  score: number;
}

interface RankingData {
  score_type: string;
  total_entries: number;
  rankings: RankingEntry[];
}

const GAME_TO_SCORE_TYPE: Record<string, string> = {
  hallucinate: 'game1',
  datashadows: 'game2',
  retaildemolition: 'game3',
  phishing: 'game4',
  final: 'game5',
};

const SCORE_TYPE_LABELS: Record<string, string> = {
  game1: 'AI HALLUCINATION',
  game2: 'DATA SHADOWS',
  game3: 'RETAIL DEMOLITION',
  game4: 'PHISHING ATTACK',
  game5: 'FINAL SHOWDOWN',
  total: 'TOTAL SCORE',
};

// Game-specific theme colors
const GAME_THEME_COLORS: Record<string, string> = {
  game1: ARCADE_COLORS.magenta,
  game2: ARCADE_COLORS.cyan,
  game3: ARCADE_COLORS.yellow,
  game4: ARCADE_COLORS.lime,
  game5: ARCADE_COLORS.orange,
  total: ARCADE_COLORS.cyan,
};

const scanlineAnim = keyframes`
  0% { top: -10%; }
  100% { top: 110%; }
`;

const countryCodeToFlag = (code: string) => {
  const country = COUNTRIES.find((c) => c.name === code);
  const countryCode = country ? country.code : code;
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
  return { text: `${rank}TH`, color: '' }; // color set dynamically
};

const RankingPage: React.FC = () => {
  const navigate = useNavigate();
  const { game } = useParams<{ game: string }>();
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const user = getStoredUser();

  const scoreType = (game && GAME_TO_SCORE_TYPE[game]) || 'total';
  const rankingTitle = SCORE_TYPE_LABELS[scoreType] || 'RANKINGS';
  const themeColor = GAME_THEME_COLORS[scoreType] || ARCADE_COLORS.cyan;

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true);
        const response = await apiFetch(`/rankings/${scoreType}?limit=50`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data: RankingData = await response.json();
        setRankingData(data);
      } catch (err) {
        console.error('Failed to fetch rankings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, [scoreType]);

  const top10 = rankingData?.rankings.slice(0, 10) || [];
  const currentUserId = user?.id;
  const userEntry = rankingData?.rankings.find((e) => e.user_id === currentUserId);
  const userRank = userEntry?.rank || 0;
  const totalEntries = rankingData?.total_entries || 0;

  // Display logic:
  // - User in top 10: show top 10 with highlight
  // - User rank 11-12: extend list to include them
  // - User rank 13+: show top 10, then "...", then neighbors + user + rank badge
  const userInExtended = userRank >= 11 && userRank <= 12;
  const userFarOut = userRank >= 13;

  // For extended display (rank 11-12), show up to their rank
  const displayList = userInExtended
    ? rankingData?.rankings.slice(0, userRank) || top10
    : top10;

  // For far-out users, find neighbors
  const allRankings = rankingData?.rankings || [];
  const userIndex = allRankings.findIndex((e) => e.user_id === currentUserId);
  const prevNeighbor = userFarOut && userIndex > 0 ? allRankings[userIndex - 1] : null;
  const nextNeighbor = userFarOut && userIndex >= 0 && userIndex < allRankings.length - 1 ? allRankings[userIndex + 1] : null;

  // Percentile calculation
  const percentile = userRank > 0 && totalEntries > 0
    ? ((userRank / totalEntries) * 100)
    : null;
  const isTop20 = percentile !== null && percentile <= 20;
  const rankBadge = isTop20 ? `TOP ${percentile.toFixed(1)}%` : (totalEntries > 0 ? `${userRank}/${totalEntries}` : '');

  const pulseGlow = keyframes`
    0%, 100% { box-shadow: 0 0 8px ${themeColor}30; }
    50% { box-shadow: 0 0 16px ${themeColor}60; }
  `;

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
      {/* Title */}
      <Box sx={{ textAlign: 'center', mt: 4, mb: 4 }}>
        <ArcadeTypography font="pressstart2p" sx={{ color: themeColor, fontSize: '1.1rem' }}>
          {rankingTitle}
        </ArcadeTypography>
        <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.5rem', color: `${themeColor}60`, mt: 1 }}>
          LEADERBOARD
        </Typography>
      </Box>

      {/* Leaderboard Container */}
      <Box sx={{ width: '100%', maxWidth: 700, px: 2, pb: 4 }}>
        <Box
          sx={{
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
            <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem', color: themeColor }}>RANK</Typography>
            <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem', color: themeColor }}>NAME</Typography>
            <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem', color: themeColor, textAlign: 'center' }}>REG</Typography>
            <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem', color: themeColor, textAlign: 'right' }}>SCORE</Typography>
          </Box>

          {/* Rows */}
          {loading ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <ArcadeTypography font="electrolize" sx={{ color: themeColor, fontSize: '0.9rem' }}>
                {'> LOADING...'}
              </ArcadeTypography>
            </Box>
          ) : displayList.length > 0 ? (
            <>
              {displayList.map((entry) => {
                const rankInfo = getRankDisplay(entry.rank);
                const rankColor = rankInfo.color || `${themeColor}80`;
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
                    <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.6rem', color: rankColor, alignSelf: 'center' }}>
                      {rankInfo.text}
                    </Typography>
                    <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.9rem', color: isCurrentUser ? themeColor : ARCADE_COLORS.white, fontWeight: isCurrentUser ? 700 : 400, alignSelf: 'center' }}>
                      {entry.firstname} {entry.lastname} {isCurrentUser ? '◄' : ''}
                    </Typography>
                    <Typography sx={{ fontSize: '1.2rem', textAlign: 'center', alignSelf: 'center' }}>
                      {countryCodeToFlag(entry.region)}
                    </Typography>
                    <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.95rem', fontWeight: 700, color: rankColor, textAlign: 'right', alignSelf: 'center' }}>
                      {entry.score.toFixed(1)}
                    </Typography>
                  </Box>
                );
              })}

              {/* Far-out user (rank 13+): show separator + neighbors + user + percentile */}
              {userFarOut && userEntry && (
                <>
                  <Box sx={{ py: 1, textAlign: 'center', borderBottom: `1px solid ${GRID_COLOR}` }}>
                    <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.6rem', color: `${ARCADE_COLORS.white}40`, letterSpacing: '4px' }}>
                      {'· · ·'}
                    </Typography>
                  </Box>

                  {/* Previous neighbor */}
                  {prevNeighbor && (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '70px 1fr 60px 90px',
                        px: 2,
                        py: 1.25,
                        borderBottom: `1px solid ${GRID_COLOR}`,
                        position: 'relative',
                        zIndex: 1,
                      }}
                    >
                      <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.6rem', color: `${themeColor}80`, alignSelf: 'center' }}>
                        {getRankDisplay(prevNeighbor.rank).text}
                      </Typography>
                      <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.9rem', color: ARCADE_COLORS.white, alignSelf: 'center' }}>
                        {prevNeighbor.firstname} {prevNeighbor.lastname}
                      </Typography>
                      <Typography sx={{ fontSize: '1.2rem', textAlign: 'center', alignSelf: 'center' }}>
                        {countryCodeToFlag(prevNeighbor.region)}
                      </Typography>
                      <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.95rem', fontWeight: 700, color: `${themeColor}80`, textAlign: 'right', alignSelf: 'center' }}>
                        {prevNeighbor.score.toFixed(1)}
                      </Typography>
                    </Box>
                  )}

                  {/* Current user row */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '70px 1fr 60px 90px',
                      px: 2,
                      py: 1.25,
                      backgroundColor: `${themeColor}12`,
                      borderBottom: `1px solid ${GRID_COLOR}`,
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.6rem', color: themeColor, alignSelf: 'center' }}>
                      {getRankDisplay(userEntry.rank).text}
                    </Typography>
                    <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.9rem', color: themeColor, fontWeight: 700, alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 1 }}>
                      {userEntry.firstname} {userEntry.lastname} ◄
                      {rankBadge && (
                        <Box component="span" sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.45rem', color: themeColor, border: `1px solid ${themeColor}60`, borderRadius: '3px', px: 0.75, py: 0.25 }}>
                          {rankBadge}
                        </Box>
                      )}
                    </Typography>
                    <Typography sx={{ fontSize: '1.2rem', textAlign: 'center', alignSelf: 'center' }}>
                      {countryCodeToFlag(userEntry.region)}
                    </Typography>
                    <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.95rem', fontWeight: 700, color: themeColor, textAlign: 'right', alignSelf: 'center' }}>
                      {userEntry.score.toFixed(1)}
                    </Typography>
                  </Box>

                  {/* Next neighbor */}
                  {nextNeighbor && (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '70px 1fr 60px 90px',
                        px: 2,
                        py: 1.25,
                        borderBottom: `1px solid ${GRID_COLOR}`,
                        position: 'relative',
                        zIndex: 1,
                      }}
                    >
                      <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.6rem', color: `${themeColor}80`, alignSelf: 'center' }}>
                        {getRankDisplay(nextNeighbor.rank).text}
                      </Typography>
                      <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.9rem', color: ARCADE_COLORS.white, alignSelf: 'center' }}>
                        {nextNeighbor.firstname} {nextNeighbor.lastname}
                      </Typography>
                      <Typography sx={{ fontSize: '1.2rem', textAlign: 'center', alignSelf: 'center' }}>
                        {countryCodeToFlag(nextNeighbor.region)}
                      </Typography>
                      <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.95rem', fontWeight: 700, color: `${themeColor}80`, textAlign: 'right', alignSelf: 'center' }}>
                        {nextNeighbor.score.toFixed(1)}
                      </Typography>
                    </Box>
                  )}
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

export default RankingPage;
