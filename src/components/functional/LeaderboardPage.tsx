import React, { useState, useEffect } from 'react';
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
  email: string;
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
  { key: 'game1', label: 'DEEPFAKE' },
  { key: 'game2', label: 'HALLUCINATE' },
  { key: 'game3', label: 'DATA SHADOWS' },
  { key: 'game4', label: 'RETAIL' },
  { key: 'game5', label: 'PHISHING' },
];

// Each game has its own theme color
const SCORE_TYPE_COLORS: Record<string, string> = {
  total: ARCADE_COLORS.cyan,
  game1: ARCADE_COLORS.magenta,
  game2: ARCADE_COLORS.magenta,
  game3: ARCADE_COLORS.cyan,
  game4: ARCADE_COLORS.yellow,
  game5: ARCADE_COLORS.lime,
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
  return { text: `${rank}TH`, color: `${ARCADE_COLORS.white}80` };
};

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoreType, setScoreType] = useState('total');
  const user = getStoredUser();

  // Dynamic theme color based on selected game
  const themeColor = SCORE_TYPE_COLORS[scoreType] || ARCADE_COLORS.cyan;

  const pulseGlow = keyframes`
    0%, 100% { box-shadow: 0 0 8px ${themeColor}30; }
    50% { box-shadow: 0 0 16px ${themeColor}60; }
  `;

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true);
        // Fetch more than 10 to find current user's rank
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
      {/* Title */}
      <Box sx={{ textAlign: 'center', mt: 4, mb: 3 }}>
        <ArcadeTypography font="pressstart2p" sx={{ color: themeColor, fontSize: '1.1rem' }}>
          HIGH SCORES
        </ArcadeTypography>
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
          color="cyan"
          variant="outline"
          onClick={() => {
            const storedUser = getStoredUser();
            if (storedUser?.id) {
              sessionStorage.removeItem(`phishing_session_highscore_${storedUser.id}`);
            }
            sessionStorage.removeItem('phishing_attempt_count');
            navigate('/');
          }}
          sx={{ fontFamily: '"Electrolize", sans-serif', letterSpacing: '1px' }}
        >
          BACK TO HOME
        </ArcadeButton>
      </Box>
    </Box>
  );
};

export default LeaderboardPage;
