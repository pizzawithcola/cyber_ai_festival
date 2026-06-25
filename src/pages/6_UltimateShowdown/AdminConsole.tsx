import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Snackbar, Alert } from '@mui/material';
import { RefreshCw } from 'lucide-react';
import { ArcadeButton } from '../../components/ui';
import { apiFetch } from '../../services/api';
import { getAdminToken } from '../../utils/userStorage';
import { ARCADE_COLORS, GRID_COLOR } from '../../theme/theme';

interface PlayerInfo {
  id: number; user_id: number; player_name: string; total_score: number; streak: number;
}

interface RoomItem {
  room_code: string; status: string; player_count: number;
  question_count: number; current_question: number; created_at: string;
  players: PlayerInfo[];
}

type SnackState = { open: boolean; message: string; severity: 'success' | 'error' | 'warning' };

const cardSx = {
  backgroundColor: '#0a0a1a',
  border: '2px solid #2a2a4a',
  borderRadius: '8px',
};

const AdminConsole: React.FC = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [actionRoom, setActionRoom] = useState<string | null>(null);
  const [snack, setSnack] = useState<SnackState>({ open: false, message: '', severity: 'success' });

  const fetchRooms = async () => {
    try {
      const res = await apiFetch('/rooms/');
      if (res.ok) setRooms(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    // Check admin auth
    const token = getAdminToken();
    if (!token) {
      navigate('/admin');
      return;
    }
    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateRoom = async () => {
    setCreating(true);
    try {
      const res = await apiFetch('/rooms/', {
        method: 'POST',
        body: JSON.stringify({ question_count: 10 }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setSnack({ open: true, message: `Room ${data.room_code} created`, severity: 'success' });
      fetchRooms();
    } catch {
      setSnack({ open: true, message: 'Failed to create room', severity: 'error' });
    } finally { setCreating(false); }
  };

  const handlePause = async (code: string) => {
    setActionRoom(code);
    try {
      await apiFetch(`/rooms/${code}/pause`, { method: 'POST' });
      setSnack({ open: true, message: `Room ${code} paused`, severity: 'success' });
      fetchRooms();
    } catch {
      setSnack({ open: true, message: 'Failed to pause', severity: 'error' });
    } finally { setActionRoom(null); }
  };

  const handleResume = async (code: string) => {
    setActionRoom(code);
    try {
      await apiFetch(`/rooms/${code}/resume`, { method: 'POST' });
      setSnack({ open: true, message: `Room ${code} resumed`, severity: 'success' });
      fetchRooms();
    } catch {
      setSnack({ open: true, message: 'Failed to resume', severity: 'error' });
    } finally { setActionRoom(null); }
  };

  const handleEnd = async (code: string) => {
    setActionRoom(code);
    try {
      await apiFetch(`/rooms/${code}/end`, { method: 'POST' });
      setSnack({ open: true, message: `Room ${code} ended`, severity: 'success' });
      fetchRooms();
    } catch {
      setSnack({ open: true, message: 'Failed to end', severity: 'error' });
    } finally { setActionRoom(null); }
  };

  const handleOpenRoom = (code: string) => {
    navigate(`/final?code=${code}&admin=1`);
  };

  return (
    <Box sx={{
      width: '100%', minHeight: '100vh',
      backgroundColor: '#050510',
      backgroundImage: `
        repeating-linear-gradient(0deg, transparent, transparent 2px, ${GRID_COLOR}50 2px, ${GRID_COLOR}50 4px),
        repeating-linear-gradient(90deg, transparent, transparent 2px, ${GRID_COLOR}50 2px, ${GRID_COLOR}50 4px)
      `,
      backgroundSize: '40px 40px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      p: 3, boxSizing: 'border-box',
    }}>
      {/* Header */}
      <Box sx={{ width: '100%', maxWidth: 960, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 2, borderBottom: `1px solid ${ARCADE_COLORS.orange}25` }}>
          <Box sx={{ width: 4, height: 20, backgroundColor: ARCADE_COLORS.orange, boxShadow: `0 0 10px ${ARCADE_COLORS.orange}` }} />
          <Box sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.8rem', color: ARCADE_COLORS.orange, letterSpacing: '0.15em', textShadow: `0 0 15px ${ARCADE_COLORS.orange}60` }}>
            GAME CONSOLE
          </Box>
          <Box
            onClick={() => navigate('/admin')}
            sx={{ ml: 'auto', cursor: 'pointer', fontFamily: '"Courier New", monospace', fontSize: '0.7rem', color: `${ARCADE_COLORS.white}40`, '&:hover': { color: ARCADE_COLORS.red }, transition: 'color 0.2s' }}
          >
            ← DASHBOARD
          </Box>
        </Box>
      </Box>

      {/* Toolbar */}
      <Box sx={{ width: '100%', maxWidth: 960, display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <ArcadeButton
          color="orange"
          variant="filled"
          size="md"
          glowing
          onClick={handleCreateRoom}
          disabled={creating}
        >
          {creating ? 'CREATING...' : '+ NEW ROOM'}
        </ArcadeButton>
        <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.7rem', color: `${ARCADE_COLORS.white}30` }}>
          {rooms.length} room{rooms.length !== 1 ? 's' : ''}
        </Box>
        <Box
          onClick={fetchRooms}
          sx={{ ml: 'auto', cursor: 'pointer', color: `${ARCADE_COLORS.white}30`, '&:hover': { color: ARCADE_COLORS.cyan }, transition: 'color 0.2s' }}
        >
          <RefreshCw size={18} />
        </Box>
      </Box>

      {/* Room List */}
      {loading ? (
        <Box sx={{ py: 8 }}>
          <CircularProgress size={32} sx={{ color: ARCADE_COLORS.orange }} />
        </Box>
      ) : rooms.length === 0 ? (
        <Box sx={{ ...cardSx, p: 6, textAlign: 'center', width: '100%', maxWidth: 960 }}>
          <Box sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.7rem', color: `${ARCADE_COLORS.white}20`, mb: 2 }}>
            NO ACTIVE ROOMS
          </Box>
          <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.65rem', color: `${ARCADE_COLORS.white}20` }}>
            Create a new room to get started.
          </Box>
        </Box>
      ) : (
        <Box sx={{ width: '100%', maxWidth: 960, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {rooms.map(room => {
            const statusColor = room.status === 'playing' ? ARCADE_COLORS.lime : room.status === 'paused' ? ARCADE_COLORS.yellow : room.status === 'finished' ? ARCADE_COLORS.red : '#5a5a7a';
            return (
              <Box key={room.room_code} sx={{ ...cardSx, p: 3 }}>
                {/* Room header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{
                    fontFamily: '"Press Start 2P", monospace', fontSize: '1.2rem',
                    color: ARCADE_COLORS.orange, letterSpacing: '0.2em',
                    px: 2, py: 0.5, border: `1px solid ${ARCADE_COLORS.orange}30`, borderRadius: '4px',
                    backgroundColor: `${ARCADE_COLORS.orange}08`,
                  }}>
                    {room.room_code}
                  </Box>
                  <Box sx={{
                    px: 1.5, py: 0.4, borderRadius: '3px',
                    fontFamily: '"Courier New", monospace', fontSize: '0.6rem', fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: statusColor, border: `1px solid ${statusColor}30`, backgroundColor: `${statusColor}10`,
                  }}>
                    {room.status}
                  </Box>
                  <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.7rem', color: `${ARCADE_COLORS.white}50` }}>
                    {room.player_count} / 5 players
                  </Box>
                  {room.status === 'playing' && (
                    <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.7rem', color: `${ARCADE_COLORS.white}40` }}>
                      Q{room.current_question}/{room.question_count}
                    </Box>
                  )}
                </Box>

                {/* Player list */}
                {room.players.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {[...room.players].sort((a, b) => b.total_score - a.total_score).map((p, i) => (
                      <Box key={p.id} sx={{
                        display: 'flex', alignItems: 'center', gap: 1,
                        px: 2, py: 0.8, borderRadius: '4px',
                        border: `1px solid ${i === 0 ? ARCADE_COLORS.orange : '#2a2a4a'}`,
                        backgroundColor: i === 0 ? `${ARCADE_COLORS.orange}08` : '#08081a',
                      }}>
                        <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.6rem', color: `${ARCADE_COLORS.white}30`, width: 18 }}>
                          #{i + 1}
                        </Box>
                        <Box sx={{ fontFamily: '"Audiowide", sans-serif', fontSize: '0.8rem', color: ARCADE_COLORS.white }}>
                          {p.player_name}
                        </Box>
                        <Box sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.6rem', color: i === 0 ? ARCADE_COLORS.orange : `${ARCADE_COLORS.white}60` }}>
                          {p.total_score.toLocaleString()}
                        </Box>
                        {p.streak > 0 && (
                          <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.6rem', color: ARCADE_COLORS.orange }}>
                            🔥{p.streak}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.65rem', color: `${ARCADE_COLORS.white}20`, mb: 2 }}>
                    Waiting for players...
                  </Box>
                )}

                {/* Actions */}
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <ArcadeButton color="orange" variant="outline" size="sm" onClick={() => handleOpenRoom(room.room_code)}>
                    OPEN ROOM
                  </ArcadeButton>
                  {room.status === 'playing' && (
                    <>
                      <ArcadeButton
                        color="yellow" variant="outline" size="sm"
                        onClick={() => handlePause(room.room_code)}
                        disabled={actionRoom === room.room_code}
                      >
                        {actionRoom === room.room_code ? '...' : 'PAUSE'}
                      </ArcadeButton>
                      <ArcadeButton
                        color="red" variant="outline" size="sm"
                        onClick={() => handleEnd(room.room_code)}
                        disabled={actionRoom === room.room_code}
                      >
                        {actionRoom === room.room_code ? '...' : 'END'}
                      </ArcadeButton>
                    </>
                  )}
                  {room.status === 'paused' && (
                    <ArcadeButton
                      color="lime" variant="outline" size="sm"
                      onClick={() => handleResume(room.room_code)}
                      disabled={actionRoom === room.room_code}
                    >
                      {actionRoom === room.room_code ? '...' : 'RESUME'}
                    </ArcadeButton>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setSnack(p => ({ ...p, open: false }))} severity={snack.severity} variant="filled">
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminConsole;
