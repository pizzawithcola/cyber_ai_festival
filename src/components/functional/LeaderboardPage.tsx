import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  styled,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getStoredUser } from '../../utils/userStorage';
import { COUNTRIES } from '../common/Countries';
import { apiFetch } from '../../services/api';
import Header from '../common/Header';

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
  { key: 'total', label: 'Total Score' },
  { key: 'game1', label: 'DeepFake' },
  { key: 'game2', label: 'AI Hallucination' },
  { key: 'game3', label: 'Data Shadows' },
  { key: 'game4', label: 'Retail Demolition' },
  { key: 'game5', label: 'Phishing Attack' },
];

const MedalCell = styled(TableCell)({
  fontWeight: 'bold',
  fontSize: '1.5rem',
  borderBottom: 'none',
});

const GoldMedal = styled(MedalCell)({
  color: '#FFD700',
  textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
});

const SilverMedal = styled(MedalCell)({
  color: '#C0C0C0',
  textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
});

const BronzeMedal = styled(MedalCell)({
  color: '#CD7F32',
  textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
});

const LeaderboardPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoreType, setScoreType] = useState('total');
  const user = getStoredUser();

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true);
        const response = await apiFetch(`/rankings/${scoreType}?limit=10`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

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

  const handleScoreTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newScoreType: string
  ) => {
    if (newScoreType !== null) {
      setScoreType(newScoreType);
    }
  };

  const countryCodeToFlag = (code: string) => {
    const country = COUNTRIES.find((c) => c.name === code);
    const countryCode = country ? country.code : code;
    return countryCode
      .toUpperCase()
      .split('')
      .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
      .join('');
  };

  const getMedalStyle = (rank: number) => {
    if (rank === 1) return GoldMedal;
    if (rank === 2) return SilverMedal;
    if (rank === 3) return BronzeMedal;
    return MedalCell;
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const currentLabel = SCORE_TYPES.find((t) => t.key === scoreType)?.label || 'Leaderboard';

  return (
    <Box sx={{ height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      <Header
        title="Leaderboard"
        firstname={user?.firstname}
        lastname={user?.lastname}
      />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
        <Box sx={{ maxWidth: 900, width: '100%' }}>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ textAlign: 'center', mb: 3, fontWeight: 700 }}
          >
            🏆 {currentLabel} Leaderboard 🏆
          </Typography>

          {/* Score Type Switch */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <ToggleButtonGroup
              value={scoreType}
              exclusive
              onChange={handleScoreTypeChange}
              aria-label="score type"
              size="small"
              sx={{
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 0.5,
              }}
            >
              {SCORE_TYPES.map((type) => (
                <ToggleButton
                  key={type.key}
                  value={type.key}
                  aria-label={type.label}
                  sx={{
                    px: 2,
                    py: 1,
                    fontWeight: 600,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.primary.main,
                      color: 'white',
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                      },
                    },
                  }}
                >
                  {type.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {loading ? (
            <Typography sx={{ textAlign: 'center', py: 4, fontSize: '1.2rem' }}>
              Loading rankings...
            </Typography>
          ) : rankingData && rankingData.rankings.length > 0 ? (
            <TableContainer component={Paper} sx={{ mb: 4 }}>
              <Table sx={{ minWidth: 650 }} aria-label="ranking table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '1.3rem' }}>Rank</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '1.3rem' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '1.3rem' }}>Region</TableCell>
                    <TableCell
                      sx={{ fontWeight: 'bold', fontSize: '1.3rem', textAlign: 'right' }}
                    >
                      Score
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rankingData.rankings.map((entry) => {
                    const MedalComponent = getMedalStyle(entry.rank);
                    return (
                      <TableRow
                        key={entry.user_id}
                        sx={{
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <TableCell className="medal-cell" component="th" scope="row">
                          <MedalComponent>{getMedalEmoji(entry.rank)}</MedalComponent>
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: '1.3rem',
                            fontWeight: entry.rank <= 3 ? 600 : 400,
                          }}
                        >
                          {entry.firstname} {entry.lastname}
                        </TableCell>
                        <TableCell sx={{ fontSize: '2rem' }}>
                          {countryCodeToFlag(entry.region)}
                        </TableCell>
                        <TableCell
                          sx={{ fontSize: '1.3rem', fontWeight: 600, textAlign: 'right' }}
                        >
                          {entry.score.toFixed(1)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ textAlign: 'center', py: 4, fontSize: '1.2rem' }}>
              No rankings available yet.
            </Typography>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => {
                // Clear all session data when going back to home
                const storedUser = getStoredUser();
                if (storedUser?.id) {
                  sessionStorage.removeItem(`phishing_session_highscore_${storedUser.id}`);
                }
                sessionStorage.removeItem('phishing_attempt_count');
                navigate('/');
              }}
              sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
            >
              Back to Home
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LeaderboardPage;
