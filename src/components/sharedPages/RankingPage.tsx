import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, styled, useTheme } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { getStoredUser } from '../../utils/userStorage';
import { COUNTRIES } from '../common/Countries';

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
  'deepfake': 'game1',
  'hallucinate': 'game2',
  'datashadows': 'game3',
  'retaildemolition': 'game4',
  'phishing': 'game5',
};

const SCORE_TYPE_LABELS: Record<string, string> = {
  'game1': 'DeepFake',
  'game2': 'AI Hallucination',
  'game3': 'Data Shadows',
  'game4': 'Retail Demolition',
  'game5': 'Phishing Defense',
  'total': 'Total Score',
};

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

const RankingPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { game } = useParams<{ game: string }>();
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);

  // Determine score type based on game parameter or default to 'total'
  const scoreType = (game && GAME_TO_SCORE_TYPE[game]) || 'total';
  const rankingTitle = SCORE_TYPE_LABELS[scoreType] || 'Global Rankings';

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8848/rankings/${scoreType}?limit=10`);
        
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

  const countryCodeToFlag = (code: string) => {
    const country = COUNTRIES.find(c => c.name === code);
    const countryCode = country ? country.code : code;
    return countryCode
      .toUpperCase()
      .split('')
      .map(c => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
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

  return (
    <Box sx={{ height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
        <Box sx={{ maxWidth: 800, width: '100%' }}>
          <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4, fontWeight: 700 }}>
            🏆 {rankingTitle} Leaderboard 🏆
          </Typography>
          
          {loading ? (
            <Typography sx={{ textAlign: 'center', py: 4, fontSize: '1.2rem' }}>Loading rankings...</Typography>
          ) : rankingData && rankingData.rankings.length > 0 ? (
            <TableContainer component={Paper} sx={{ mb: 4 }}>
              <Table sx={{ minWidth: 650 }} aria-label="ranking table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '1.3rem' }}>Rank</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '1.3rem' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '1.3rem' }}>Region</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '1.3rem', textAlign: 'right' }}>Score</TableCell>
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
                          <MedalComponent>
                            {getMedalEmoji(entry.rank)}
                          </MedalComponent>
                        </TableCell>
                        <TableCell sx={{ fontSize: '1.3rem', fontWeight: entry.rank <= 3 ? 600 : 400 }}>
                          {entry.firstname} {entry.lastname}
                        </TableCell>
                        <TableCell sx={{ fontSize: '2rem' }}>
                          {countryCodeToFlag(entry.region)}
                        </TableCell>
                        <TableCell sx={{ fontSize: '1.3rem', fontWeight: 600, textAlign: 'right' }}>
                          {entry.score.toFixed(1)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ textAlign: 'center', py: 4, fontSize: '1.2rem' }}>No rankings available yet.</Typography>
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
                console.log('[RankingPage] Cleared session data');
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

export default RankingPage;