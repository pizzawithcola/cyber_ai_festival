import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  TableSortLabel,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { ArrowUpward, Search, LockOutlined, Castle, Pause, PlayArrow } from '@mui/icons-material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getAdminToken, setAdminToken, clearAdminToken } from '../../utils/userStorage';
import { COUNTRIES } from '../common/Countries';
import { apiFetch } from '../../services/api';
import { API_URL } from '../../services/api';

// ─── Sci-Fi Design Tokens ─────────────────────────────────────────────────────
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
  white:    '#e8f4ff',
  dim:      '#4a7a9b',
  fontTitle:  '"Orbitron", "Electrolize", sans-serif',
  fontBody:   '"Electrolize", "Courier New", monospace',
  fontMono:   '"Courier New", monospace',
  // font scale
  fsTitle:  '1.1rem',
  fsHead:   '0.75rem',
  fsLabel:  '0.65rem',
  fsBody:   '0.8rem',
  fsMono:   '0.78rem',
  fsSmall:  '0.65rem',
};

// ─── Reusable clip-path panel style ──────────────────────────────────────────
const hudPanel = (color = SF.cyan) => ({
  backgroundColor: SF.panel,
  border: `1px solid ${color}30`,
  position: 'relative' as const,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '1px',
    background: `linear-gradient(90deg, transparent, ${color}80, transparent)`,
  },
});

// ─── Score colour helper ──────────────────────────────────────────────────────
const scoreColor = (score: number, max = 100) => {
  const pct = score / max;
  if (pct >= 0.8) return SF.lime;
  if (pct >= 0.6) return SF.yellow;
  return SF.red;
};

// ─── Sci-Fi Button ────────────────────────────────────────────────────────────
const SFButton: React.FC<{
  color?: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  startIcon?: React.ReactNode;
  variant?: 'outline' | 'filled';
}> = ({ color = SF.cyan, onClick, disabled, children, startIcon, variant = 'outline' }) => (
  <Box
    component="button"
    onClick={onClick}
    disabled={disabled}
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.75,
      px: 1.5,
      py: 0.6,
      fontFamily: SF.fontTitle,
      fontSize: '0.58rem',
      fontWeight: 700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      borderRadius: '4px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      border: `1px solid ${disabled ? `${color}30` : `${color}70`}`,
      backgroundColor: variant === 'filled' ? (disabled ? `${color}20` : `${color}25`) : 'transparent',
      color: disabled ? `${color}40` : color,
      transition: 'all 0.15s ease',
      '&:hover:not(:disabled)': {
        backgroundColor: `${color}20`,
        borderColor: color,
        boxShadow: `0 0 12px ${color}40`,
      },
      '&:active:not(:disabled)': { transform: 'translateY(1px)' },
    }}
  >
    {startIcon && <Box sx={{ display: 'flex', alignItems: 'center', '& svg': { fontSize: '1rem !important' } }}>{startIcon}</Box>}
    {children}
  </Box>
);

// ─── Section header with decorative line ─────────────────────────────────────
const SFSectionHeader: React.FC<{ label: string; color?: string; right?: React.ReactNode }> = ({ label, color = SF.cyan, right }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ width: 3, height: 14, backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
      <Box sx={{ fontFamily: SF.fontTitle, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.25em', color, textTransform: 'uppercase' }}>
        {label}
      </Box>
      <Box sx={{ flex: 1, minWidth: 40, height: '1px', background: `linear-gradient(90deg, ${color}50, transparent)`, ml: 1 }} />
    </Box>
    {right}
  </Box>
);

// ─── Form input style ─────────────────────────────────────────────────────────
const sfInputSx = {
  '& .MuiOutlinedInput-root': {
    fontFamily: SF.fontBody,
    fontSize: '0.95rem',
    color: SF.white,
    '& fieldset': { borderColor: `${SF.cyan}30` },
    '&:hover fieldset': { borderColor: `${SF.cyan}70` },
    '&.Mui-focused fieldset': { borderColor: SF.cyan, boxShadow: `0 0 8px ${SF.cyan}30` },
  },
  '& .MuiInputLabel-root': {
    fontFamily: SF.fontBody,
    fontSize: '0.8rem',
    color: `${SF.white}50`,
    '&.Mui-focused': { color: SF.cyan },
  },
  '& input': { color: SF.white },
};

// ─── Interfaces ───────────────────────────────────────────────────────────────
const API_ENDPOINTS = [
  { name: 'Health Check',     method: 'GET',  path: '/health',                  needsAuth: false },
  { name: 'Users List',       method: 'GET',  path: '/users/?skip=0&limit=1',   needsAuth: true  },
  { name: 'User Scores',      method: 'GET',  path: '/users/userscores',        needsAuth: true  },
  { name: 'Rankings (Total)', method: 'GET',  path: '/rankings/total?limit=1',  needsAuth: true  },
  { name: 'Rankings (G1)',    method: 'GET',  path: '/rankings/game1?limit=1',  needsAuth: true  },
  { name: 'Rankings (G2)',    method: 'GET',  path: '/rankings/game2?limit=1',  needsAuth: true  },
  { name: 'Rankings (G3)',    method: 'GET',  path: '/rankings/game3?limit=1',  needsAuth: true  },
  { name: 'Rankings (G4)',    method: 'GET',  path: '/rankings/game4?limit=1',  needsAuth: true  },
  { name: 'Rankings (G5)',    method: 'GET',  path: '/rankings/game5?limit=1',  needsAuth: true  },
  { name: 'LLM Chat',         method: 'POST', path: '/llm/chat',                needsAuth: true  },
];

interface ApiStatus { name: string; status: 'idle' | 'loading' | 'normal' | 'error'; latency?: number; error?: string; }
interface UserScore  { id: number; firstname: string; lastname: string; email: string; region: string; role: string; game1_score: number; game2_score: number; game3_score: number; game4_score: number; game5_score: number; total_score: number; }

// ─── Component ────────────────────────────────────────────────────────────────
const AdminPage: React.FC = () => {
  // ─── Auth State ──────────────────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [users, setUsers]                 = useState<UserScore[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [page, setPage]                   = useState(0);
  const [rowsPerPage, setRowsPerPage]     = useState(10);
  const [snackbar, setSnackbar]           = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({ open: false, message: '', severity: 'success' });
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [openEditDialog, setOpenEditDialog]     = useState(false);
  const [openAddDialog, setOpenAddDialog]       = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingUser, setEditingUser]     = useState<UserScore | null>(null);
  const [formData, setFormData]           = useState<Omit<UserScore, 'id' | 'total_score'>>({
    firstname: '', lastname: '', email: '', region: 'United States', role: 'player',
    game1_score: 0, game2_score: 0, game3_score: 0, game4_score: 0, game5_score: 0,
  });
  const [order, setOrder]         = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy]     = useState<string>('id');
  const [searchTerm, setSearchTerm] = useState('');
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>(API_ENDPOINTS.map(ep => ({ name: ep.name, status: 'idle' as const })));
  const [isTestingApis, setIsTestingApis] = useState(false);
  const [activeTab, setActiveTab] = useState<'personnel' | 'rooms' | 'api'>('personnel');

  // ─── Final Rooms state ──────────────────────────────────────────────────────
  interface RoomPlayer {
    id: number; user_id: number; player_name: string; total_score: number; streak: number;
  }
  interface RoomEntry {
    room_code: string; status: string; player_count: number;
    question_count: number; current_question: number; created_at: string;
    players: RoomPlayer[];
  }
  const [rooms, setRooms] = useState<RoomEntry[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsPage, setRoomsPage] = useState(0);
  const [roomsRowsPerPage, setRoomsRowsPerPage] = useState(10);

  // ─── Check token on mount ───────────────────────────────────────────────────
  useEffect(() => {
    const token = getAdminToken();
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // ─── Handle Admin Login ─────────────────────────────────────────────────────
  const handleAdminLogin = async () => {
    if (!loginEmail || !loginName) {
      setLoginError('Please fill in all fields');
      return;
    }
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await apiFetch('/users/admin-login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, firstname: loginName }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Login failed');
      }
      const data = await res.json();
      setAdminToken(data.token);
      setIsAuthenticated(true);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // ─── Handle Logout ──────────────────────────────────────────────────────────
  const handleLogout = () => {
    clearAdminToken();
    setIsAuthenticated(false);
    setUsers([]);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        setLoading(true);
        const res = await apiFetch('/users/userscores');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setUsers(await res.json());
        setError(null);
      } catch (err) {
        setError('Failed to load user scores.');
        setSnackbar({ open: true, message: 'Load error: ' + (err instanceof Error ? err.message : ''), severity: 'error' });
      } finally { setLoading(false); }
    })();
  }, [isAuthenticated]);

  // ─── Fetch Final Rooms ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        setRoomsLoading(true);
        const res = await apiFetch('/rooms/');
        if (res.ok) setRooms(await res.json());
      } catch { /* ignore */ }
      finally { setRoomsLoading(false); }
    })();
    // Poll every 5s
    const interval = setInterval(async () => {
      try {
        const res = await apiFetch('/rooms/');
        if (res.ok) setRooms(await res.json());
      } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // ─── Login Screen (if not authenticated) ────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <Box
        sx={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: SF.bg,
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 39px, ${SF.cyan}08 39px, ${SF.cyan}08 40px),
            repeating-linear-gradient(90deg, transparent, transparent 39px, ${SF.cyan}08 39px, ${SF.cyan}08 40px)
          `,
          p: 3,
        }}
      >
        <Box
          sx={{
            ...hudPanel(SF.cyan),
            width: '100%',
            maxWidth: 400,
            p: 4,
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LockOutlined sx={{ fontSize: 48, color: SF.cyan, mb: 1 }} />
            <Box sx={{ fontFamily: SF.fontTitle, fontSize: '1.2rem', fontWeight: 700, letterSpacing: '0.2em', color: SF.cyan }}>
              ADMIN ACCESS
            </Box>
            <Box sx={{ fontFamily: SF.fontBody, fontSize: '0.8rem', color: SF.dim, mt: 0.5 }}>
              AUTHORIZED PERSONNEL ONLY
            </Box>
          </Box>

          {/* Login Form */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="EMAIL"
              type="email"
              fullWidth
              size="small"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
              sx={sfInputSx}
            />
            <TextField
              label="FIRST NAME"
              fullWidth
              size="small"
              value={loginName}
              onChange={e => setLoginName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
              sx={sfInputSx}
            />
            {loginError && (
              <Box sx={{ fontFamily: SF.fontBody, fontSize: '0.75rem', color: SF.red, textAlign: 'center' }}>
                {loginError}
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2, mt: 3 }}>
              <Box
                component="span"
                onClick={() => navigate('/')}
                sx={{
                  cursor: loginLoading ? 'default' : 'pointer',
                  fontFamily: SF.fontBody,
                  fontSize: '0.85rem',
                  color: loginLoading ? '#555' : SF.cyan,
                  opacity: loginLoading ? 0.5 : 0.8,
                  '&:hover': { opacity: loginLoading ? 0.5 : 1 },
                  transition: 'opacity 0.2s, color 0.2s',
                }}
              >
                ← Back
              </Box>
              <SFButton
                color={SF.cyan}
                variant="filled"
                onClick={handleAdminLogin}
                disabled={loginLoading}
              >
                {loginLoading ? 'AUTHENTICATING...' : 'LOGIN'}
              </SFButton>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  const handleChangePage        = (_: unknown, p: number) => setPage(p);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };
  const handleRequestSort       = (field: string) => { setOrder(orderBy === field && order === 'asc' ? 'desc' : 'asc'); setOrderBy(field); };
  const handleSnackbarClose     = () => setSnackbar(p => ({ ...p, open: false }));
  const handleSelectUser        = (id: number) => setSelectedUsers(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const handleSelectAll         = () => selectedUsers.length === paginatedUsers.length ? setSelectedUsers([]) : setSelectedUsers(paginatedUsers.map(u => u.id));

  const handleAddClick    = () => { setFormData({ firstname: '', lastname: '', email: '', region: 'United States', role: 'player', game1_score: 0, game2_score: 0, game3_score: 0, game4_score: 0, game5_score: 0 }); setOpenAddDialog(true); };
  const handleDeleteClick = () => { if (!selectedUsers.length) { setSnackbar({ open: true, message: 'Select at least one user', severity: 'error' }); return; } setOpenDeleteDialog(true); };
  const handleEditOpen    = (u: UserScore) => { setEditingUser(u); setFormData({ firstname: u.firstname, lastname: u.lastname, email: u.email, region: u.region, role: u.role || 'player', game1_score: u.game1_score, game2_score: u.game2_score, game3_score: u.game3_score, game4_score: u.game4_score, game5_score: u.game5_score }); setOpenEditDialog(true); };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { const { name, value } = e.target; setFormData(p => ({ ...p, [name]: name.includes('_score') ? parseFloat(value) || 0 : value })); };
  const calcTotal         = (d: Omit<UserScore, 'id' | 'total_score'>) => d.game1_score + d.game2_score + d.game3_score + d.game4_score + d.game5_score;

  const validateForm = () => {
    if (!formData.firstname.trim())           { setSnackbar({ open: true, message: 'First name required', severity: 'error' }); return false; }
    if (!formData.lastname.trim())            { setSnackbar({ open: true, message: 'Last name required',  severity: 'error' }); return false; }
    if (!formData.email.trim())               { setSnackbar({ open: true, message: 'Email required',      severity: 'error' }); return false; }
    if (!/\S+@\S+\.\S+/.test(formData.email)){ setSnackbar({ open: true, message: 'Email invalid',        severity: 'error' }); return false; }
    const scores = [formData.game1_score, formData.game2_score, formData.game3_score, formData.game4_score, formData.game5_score];
    if (scores.some(s => isNaN(s) || s < 0 || s > 100)) { setSnackbar({ open: true, message: 'Scores must be 0–100', severity: 'error' }); return false; }
    return true;
  };

  const confirmDelete = async () => {
    try {
      const rs = await Promise.all(selectedUsers.map(id => apiFetch(`/users/${id}`, { method: 'DELETE' })));
      if (rs.some(r => !r.ok)) throw new Error('Some deletes failed');
      setUsers(p => p.filter(u => !selectedUsers.includes(u.id)));
      setSelectedUsers([]);
      setSnackbar({ open: true, message: `${selectedUsers.length} record(s) deleted`, severity: 'success' });
      setOpenDeleteDialog(false);
    } catch (err) {
      setSnackbar({ open: true, message: 'Delete failed: ' + (err instanceof Error ? err.message : ''), severity: 'error' });
      setOpenDeleteDialog(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!validateForm() || !editingUser) return;
    try {
      const ur = await apiFetch(`/users/${editingUser.id}`,  { method: 'PUT', body: JSON.stringify({ firstname: formData.firstname, lastname: formData.lastname, email: formData.email, region: formData.region, role: formData.role }) });
      if (!ur.ok) throw new Error(`User update ${ur.status}`);
      const sr = await apiFetch(`/scores/${editingUser.id}`, { method: 'PUT', body: JSON.stringify({ game1_score: formData.game1_score, game2_score: formData.game2_score, game3_score: formData.game3_score, game4_score: formData.game4_score, game5_score: formData.game5_score }) });
      if (!sr.ok) throw new Error(`Score update ${sr.status}`);
      setUsers(p => p.map(u => u.id === editingUser.id ? { ...u, ...formData, total_score: calcTotal(formData) } : u));
      setSnackbar({ open: true, message: 'Record updated', severity: 'success' });
      setOpenEditDialog(false); setEditingUser(null);
    } catch (err) { setSnackbar({ open: true, message: 'Update failed: ' + (err instanceof Error ? err.message : ''), severity: 'error' }); }
  };

  const handleAddSubmit = async () => {
    if (!validateForm()) return;
    try {
      const ur = await apiFetch('/users', { method: 'POST', body: JSON.stringify({ firstname: formData.firstname, lastname: formData.lastname, email: formData.email, region: formData.region, role: formData.role }) });
      if (!ur.ok) throw new Error(`Create ${ur.status}`);
      const newUser = await ur.json();
      const sr = await apiFetch(`/scores/${newUser.id}`, { method: 'PUT', body: JSON.stringify({ game1_score: formData.game1_score, game2_score: formData.game2_score, game3_score: formData.game3_score, game4_score: formData.game4_score, game5_score: formData.game5_score }) });
      if (!sr.ok) throw new Error(`Score update ${sr.status}`);
      setUsers(p => [...p, { id: newUser.id, ...formData, total_score: calcTotal(formData) }]);
      setSnackbar({ open: true, message: 'Record created', severity: 'success' });
      setOpenAddDialog(false);
    } catch (err) { setSnackbar({ open: true, message: 'Create failed: ' + (err instanceof Error ? err.message : ''), severity: 'error' }); }
  };

  const runApiHealthCheck = async () => {
    setIsTestingApis(true);
    setApiStatuses(API_ENDPOINTS.map(ep => ({ name: ep.name, status: 'loading' as const })));
    const results = await Promise.all(API_ENDPOINTS.map(async ep => {
      const t0 = performance.now();
      try {
        const res = ep.needsAuth
          ? ep.method === 'POST' ? await apiFetch(ep.path, { method: 'POST', body: JSON.stringify({ prompt: 'ping', model: 'deepseek-chat' }) }) : await apiFetch(ep.path)
          : await fetch(`${API_URL}${ep.path}`);
        const lat = Math.round(performance.now() - t0);
        return res.ok ? { name: ep.name, status: 'normal' as const, latency: lat } : { name: ep.name, status: 'error' as const, latency: lat, error: `HTTP ${res.status}` };
      } catch (err) {
        return { name: ep.name, status: 'error' as const, latency: Math.round(performance.now() - t0), error: err instanceof Error ? err.message : 'Unknown' };
      }
    }));
    setApiStatuses(results);
    setIsTestingApis(false);
  };

  // ─── Room Actions ───────────────────────────────────────────────────────
  const handleRoomAction = async (code: string, action: 'pause' | 'resume' | 'end') => {
    try {
      const res = await apiFetch(`/rooms/${code}/${action}`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSnackbar({ open: true, message: `Room ${code}: ${action} successful`, severity: 'success' });
      // Refresh rooms list
      const roomsRes = await apiFetch('/rooms/');
      if (roomsRes.ok) setRooms(await roomsRes.json());
    } catch {
      setSnackbar({ open: true, message: `Room ${code}: ${action} failed`, severity: 'error' });
    }
  };

  const desc = <T,>(a: T, b: T, key: keyof T) => (b[key] < a[key] ? -1 : b[key] > a[key] ? 1 : 0);
  const cmp  = (ord: 'asc' | 'desc', ob: string) => ord === 'desc'
    ? (a: UserScore, b: UserScore) => desc(a, b, ob as keyof UserScore)
    : (a: UserScore, b: UserScore) => -desc(a, b, ob as keyof UserScore);

  const filteredUsers  = users.filter(u => { const s = searchTerm.toLowerCase(); return u.firstname.toLowerCase().includes(s) || u.lastname.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.region.toLowerCase().includes(s); });
  const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const sortedUsers    = [...paginatedUsers].sort(cmp(order, orderBy));
  const uniqueCountries = new Set(users.map(u => u.region).filter(Boolean)).size;
  const paginatedRooms = rooms.slice(roomsPage * roomsRowsPerPage, roomsPage * roomsRowsPerPage + roomsRowsPerPage);

  // ─── shared cell sx ───────────────────────────────────────────────────────
  const thSx = { backgroundColor: '#030e1a', borderBottom: `1px solid ${SF.cyan}25`, py: 1.2, px: 1.5 };
  const tdSx = { borderBottom: `1px solid ${SF.white}06`, py: 0, px: 1.5, height: 46 };

  // ─── dialog panel sx ─────────────────────────────────────────────────────
  const dlgPaper = (accent: string) => ({
    backgroundColor: SF.panel,
    border: `1px solid ${accent}50`,
    borderRadius: '4px',
    boxShadow: `0 0 40px ${accent}20, 0 20px 60px rgba(0,0,0,0.6)`,
    minWidth: 500,
  });

  // ─── shared form ─────────────────────────────────────────────────────────
  const renderFormFields = (accent: string) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ fontFamily: SF.fontTitle, fontSize: '0.75rem', letterSpacing: '0.15em', color: accent, mb: 0.75 }}>FIRST NAME</Box>
          <TextField autoFocus name="firstname" fullWidth variant="outlined" value={formData.firstname} onChange={handleInputChange} sx={sfInputSx} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ fontFamily: SF.fontTitle, fontSize: '0.75rem', letterSpacing: '0.15em', color: accent, mb: 0.75 }}>LAST NAME</Box>
          <TextField name="lastname" fullWidth variant="outlined" value={formData.lastname} onChange={handleInputChange} sx={sfInputSx} />
        </Box>
      </Box>
      <Box>
        <Box sx={{ fontFamily: SF.fontTitle, fontSize: '0.75rem', letterSpacing: '0.15em', color: accent, mb: 0.75 }}>EMAIL ADDRESS</Box>
        <TextField name="email" fullWidth variant="outlined" value={formData.email} onChange={handleInputChange} sx={sfInputSx} />
      </Box>
      <Box>
        <Box sx={{ fontFamily: SF.fontTitle, fontSize: '0.75rem', letterSpacing: '0.15em', color: accent, mb: 0.75 }}>REGION</Box>
        <FormControl fullWidth>
          <Select name="region" value={formData.region} onChange={e => setFormData(p => ({ ...p, region: e.target.value as string }))}
            sx={{ fontFamily: SF.fontBody, fontSize: '0.75rem', color: SF.white, '& .MuiOutlinedInput-notchedOutline': { borderColor: `${SF.cyan}30` }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: `${SF.cyan}70` }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: SF.cyan }, '& .MuiSvgIcon-root': { color: SF.cyan } }}
            MenuProps={{ PaperProps: { sx: { backgroundColor: '#060f1e', border: `1px solid ${SF.cyan}30`, '& .MuiMenuItem-root': { fontFamily: SF.fontBody, fontSize: '0.8rem', color: SF.white, '&:hover': { backgroundColor: `${SF.cyan}15` }, '&.Mui-selected': { backgroundColor: `${SF.cyan}25` } } } } }}
          >
            {COUNTRIES.map(c => <MenuItem key={c.code} value={c.name}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>
      <Box>
        <Box sx={{ fontFamily: SF.fontTitle, fontSize: '0.75rem', letterSpacing: '0.15em', color: accent, mb: 0.75 }}>ROLE</Box>
        <FormControl fullWidth>
          <Select value={formData.role || 'player'} onChange={e => setFormData(p => ({ ...p, role: e.target.value as string }))}
            sx={{ fontFamily: SF.fontBody, fontSize: '0.75rem', color: SF.white, '& .MuiOutlinedInput-notchedOutline': { borderColor: `${SF.cyan}30` }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: `${SF.cyan}70` }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: SF.cyan }, '& .MuiSvgIcon-root': { color: SF.cyan } }}
            MenuProps={{ PaperProps: { sx: { backgroundColor: '#060f1e', border: `1px solid ${SF.cyan}30`, '& .MuiMenuItem-root': { fontFamily: SF.fontBody, fontSize: '0.8rem', color: SF.white, '&:hover': { backgroundColor: `${SF.cyan}15` }, '&.Mui-selected': { backgroundColor: `${SF.cyan}25` } } } } }}
          >
            <MenuItem value="player">Player</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box>
        <Box sx={{ fontFamily: SF.fontTitle, fontSize: '0.75rem', letterSpacing: '0.15em', color: accent, mb: 0.75 }}>GAME SCORES (H=Hallucinate, DS=DataShadows, R=Retail, P=Phishing, F=Final)  <Box component="span" sx={{ color: `${SF.white}30`, fontWeight: 400 }}>(0 – 100)</Box></Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {(['game1_score','game2_score','game3_score','game4_score','game5_score'] as const).map((k, i) => (
            <TextField key={k} name={k} label={`G${i+1}`} type="number" inputProps={{ min:0, max:100, step:0.1 }} value={formData[k]} onChange={handleInputChange} sx={{ ...sfInputSx, width: 80 }} />
          ))}
        </Box>
      </Box>
    </Box>
  );

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: SF.bg, gap: 2 }}>
        <CircularProgress size={32} sx={{ color: SF.cyan }} />
        <Box sx={{ fontFamily: SF.fontTitle, fontSize: '0.75rem', letterSpacing: '0.25em', color: SF.cyan }}>INITIALIZING DATA LINK...</Box>
      </Box>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{
      width: '100%', minHeight: '100vh',
      backgroundColor: SF.bg,
      backgroundImage: `
        radial-gradient(ellipse at 20% 0%, ${SF.cyan}08 0%, transparent 50%),
        radial-gradient(ellipse at 80% 100%, ${SF.magenta}06 0%, transparent 50%),
        repeating-linear-gradient(0deg, transparent, transparent 39px, ${SF.cyan}08 39px, ${SF.cyan}08 40px),
        repeating-linear-gradient(90deg, transparent, transparent 39px, ${SF.cyan}08 39px, ${SF.cyan}08 40px)
      `,
      backgroundSize: '100% 100%, 100% 100%, 40px 40px, 40px 40px',
      p: { xs: 2, md: 3 },
      boxSizing: 'border-box',
    }}>

      {/* ── Top header ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, pb: 2, borderBottom: `1px solid ${SF.cyan}20` }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            {/* HUD corner brackets */}
            <Box sx={{ width: 10, height: 10, borderTop: `2px solid ${SF.cyan}`, borderLeft: `2px solid ${SF.cyan}` }} />
            <Box sx={{ fontFamily: SF.fontTitle, fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.2em', color: SF.cyan, textShadow: `0 0 20px ${SF.cyan}60` }}>
              ADMIN DASHBOARD
            </Box>
            <Box sx={{ width: 10, height: 10, borderTop: `2px solid ${SF.cyan}`, borderRight: `2px solid ${SF.cyan}` }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ fontFamily: SF.fontBody, fontSize: '0.82rem', color: SF.dim, letterSpacing: '0.08em' }}>
              OPERATOR: ADMIN
              <Box component="span" sx={{ mx: 2, color: `${SF.white}20` }}>|</Box>
              FACILITY MANAGEMENT SYSTEM v2.1
            </Box>
            <SFButton color={SF.red} variant="outline" onClick={handleLogout}>
              LOGOUT
            </SFButton>
          </Box>
        </Box>
        <Box sx={{ textAlign: 'right', display: 'flex', gap: 3 }}>
          <Box>
            <Box sx={{ fontFamily: SF.fontTitle, fontSize: '1.4rem', fontWeight: 900, color: SF.cyan, lineHeight: 1 }}>{users.length}</Box>
            <Box sx={{ fontFamily: SF.fontBody, fontSize: '0.75rem', color: SF.dim, letterSpacing: '0.12em' }}>PLAYERS</Box>
          </Box>
          <Box>
            <Box sx={{ fontFamily: SF.fontTitle, fontSize: '1.4rem', fontWeight: 900, color: SF.lime, lineHeight: 1 }}>{uniqueCountries}</Box>
            <Box sx={{ fontFamily: SF.fontBody, fontSize: '0.75rem', color: SF.dim, letterSpacing: '0.12em' }}>COUNTRIES</Box>
          </Box>
        </Box>
      </Box>

      {/* ── Tab Toggle ── */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <ToggleButtonGroup
          value={activeTab}
          exclusive
          onChange={(_, v) => v && setActiveTab(v)}
          sx={{
            '& .MuiToggleButton-root': {
              fontFamily: SF.fontTitle,
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.15em',
              px: 3,
              py: 0.8,
              color: SF.dim,
              borderColor: `${SF.cyan}25`,
              '&:hover': { color: `${SF.cyan}80`, borderColor: `${SF.cyan}50` },
              '&.Mui-selected': {
                color: SF.cyan,
                backgroundColor: `${SF.cyan}12`,
                borderColor: SF.cyan,
              },
            },
          }}
        >
          <ToggleButton value="personnel">PERSONNEL</ToggleButton>
          <ToggleButton value="rooms">FINAL ROOMS</ToggleButton>
          <ToggleButton value="api">API DIAGNOSTICS</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* ── Error ── */}
      {error && (
        <Box sx={{ mb: 2, p: 1.5, border: `1px solid ${SF.red}50`, backgroundColor: `${SF.red}08` }}>
          <Box sx={{ fontFamily: SF.fontBody, fontSize: '0.8rem', color: SF.red }}>{error}</Box>
        </Box>
      )}

      {/* ── Toolbar ── */}
      {activeTab === 'personnel' && (
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search records..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          sx={{
            minWidth: 260,
            '& .MuiOutlinedInput-root': { fontFamily: SF.fontBody, fontSize: '0.92rem', color: SF.white, backgroundColor: `${SF.cyan}05`, '& fieldset': { borderColor: `${SF.white}15` }, '&:hover fieldset': { borderColor: `${SF.cyan}50` }, '&.Mui-focused fieldset': { borderColor: SF.cyan } },
            '& input': { color: SF.white, '&::placeholder': { color: `${SF.white}85`, opacity: 1 } },
          }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: `${SF.cyan}50`, fontSize: '1rem' }} /></InputAdornment> }}
        />
        <SFButton color={SF.cyan} onClick={handleAddClick}>+ NEW RECORD</SFButton>
        <SFButton color={SF.red} onClick={handleDeleteClick} disabled={selectedUsers.length === 0}>
          DELETE {selectedUsers.length > 0 && `(${selectedUsers.length})`}
        </SFButton>
      </Box>
      )}

      {/* ── User Table ── */}
      {activeTab === 'personnel' && (
      <Box sx={{ ...hudPanel(SF.cyan), borderRadius: '4px', overflow: 'hidden', mb: 4 }}>
        <TableContainer>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...thSx, width: 48 }}>
                  <Checkbox size="small"
                    checked={selectedUsers.length > 0 && selectedUsers.length === paginatedUsers.length}
                    indeterminate={selectedUsers.length > 0 && selectedUsers.length < paginatedUsers.length}
                    onChange={handleSelectAll}
                    sx={{ color: `${SF.cyan}40`, '&.Mui-checked': { color: SF.cyan }, '&.MuiCheckbox-indeterminate': { color: SF.cyan }, p: 0 }}
                  />
                </TableCell>
                {[['FIRST NAME','firstname'],['LAST NAME','lastname'],['EMAIL','email'],['REGION','region'],['ROLE','role'],['H/G1','game1_score'],['DS/G2','game2_score'],['R/G3','game3_score'],['P/G4','game4_score'],['F/G5','game5_score'],['TOTAL','total_score']].map(([label, field]) => (
                  <TableCell key={field} sx={thSx}>
                    <TableSortLabel active={orderBy === field} direction={orderBy === field ? order : 'asc'} onClick={() => handleRequestSort(field)} IconComponent={ArrowUpward}
                      sx={{ fontFamily: SF.fontTitle, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', color: `${SF.white}85 !important`, '&.Mui-active': { color: `${SF.cyan} !important` }, '& .MuiTableSortLabel-icon': { color: `${SF.cyan}70 !important`, fontSize: '0.85rem' } }}>
                      {label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedUsers.map(u => (
                <TableRow key={u.id} onDoubleClick={() => handleEditOpen(u)}
                  sx={{ cursor: 'pointer', backgroundColor: selectedUsers.includes(u.id) ? `${SF.cyan}08` : 'transparent', transition: 'background 0.12s', '&:hover': { backgroundColor: `${SF.cyan}0c` } }}>
                  <TableCell sx={{ ...tdSx, width: 48 }}>
                    <Checkbox size="small" checked={selectedUsers.includes(u.id)} onClick={e => { e.stopPropagation(); handleSelectUser(u.id); }}
                      sx={{ color: `${SF.cyan}30`, '&.Mui-checked': { color: SF.cyan }, p: 0 }} />
                  </TableCell>
                  {[u.firstname, u.lastname, u.email, u.region].map((val, i) => (
                    <TableCell key={i} sx={{ ...tdSx, fontFamily: SF.fontBody, fontSize: '0.92rem', color: `${SF.white}85`, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</TableCell>
                  ))}
                  <TableCell sx={{ ...tdSx, fontFamily: SF.fontTitle, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: u.role === 'admin' ? SF.lime : SF.dim, textAlign: 'center' }}>{u.role?.toUpperCase() || 'PLAYER'}</TableCell>
                  {[u.game1_score, u.game2_score, u.game3_score, u.game4_score, u.game5_score].map((s, i) => (
                    <TableCell key={i} sx={{ ...tdSx, fontFamily: SF.fontMono, fontSize: '0.92rem', color: scoreColor(s), textAlign: 'center' }}>{s.toFixed(1)}</TableCell>
                  ))}
                  <TableCell sx={{ ...tdSx, fontFamily: SF.fontTitle, fontSize: '0.82rem', fontWeight: 700, color: scoreColor(u.total_score, 500), textAlign: 'center' }}>
                    {u.total_score.toFixed(1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination rowsPerPageOptions={[5,10,25]} component="div" count={filteredUsers.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: `1px solid ${SF.cyan}15`, backgroundColor: SF.panelAlt, color: SF.dim, fontFamily: SF.fontBody, fontSize: '0.65rem',
            '& .MuiTablePagination-select': { color: SF.cyan, fontFamily: SF.fontBody },
            '& .MuiTablePagination-selectIcon': { color: SF.cyan },
            '& .MuiTablePagination-displayedRows': { fontFamily: SF.fontBody, fontSize: '0.88rem', color: SF.dim },
            '& .MuiIconButton-root': { color: SF.dim, '&:not(.Mui-disabled):hover': { color: SF.cyan } },
          }} />
      </Box>
      )}

      {/* ── API Health Check ── */}
      {activeTab === 'api' && (
      <Box sx={{ mb: 4 }}>
        <SFSectionHeader label="System Diagnostics" color={SF.yellow} right={
          <SFButton color={SF.yellow} onClick={runApiHealthCheck} disabled={isTestingApis} startIcon={<RefreshIcon />}>
            {isTestingApis ? 'SCANNING...' : 'RUN DIAGNOSTIC'}
          </SFButton>
        } />
        <Box sx={{ ...hudPanel(SF.yellow), borderRadius: '4px', overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['SIG','ENDPOINT','METHOD','PATH','LATENCY','STATUS'].map(h => (
                    <TableCell key={h} sx={{ ...thSx, borderBottomColor: `${SF.yellow}25`, fontFamily: SF.fontTitle, fontSize: '0.72rem', letterSpacing: '0.1em', color: `${SF.white}85` }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {API_ENDPOINTS.map((ep, i) => {
                  const s = apiStatuses[i];
                  const dot = s.status === 'normal' ? SF.lime : s.status === 'error' ? SF.red : s.status === 'loading' ? SF.yellow : `${SF.white}20`;
                  return (
                    <TableRow key={ep.name} sx={{ '&:hover': { backgroundColor: `${SF.white}03` } }}>
                      <TableCell sx={tdSx}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: dot, boxShadow: s.status !== 'idle' ? `0 0 8px ${dot}` : 'none', transition: 'all 0.3s' }} />
                      </TableCell>
                      <TableCell sx={{ ...tdSx, fontFamily: SF.fontBody, fontSize: '0.92rem', color: `${SF.white}80` }}>{ep.name}</TableCell>
                      <TableCell sx={tdSx}>
                        <Box component="span" sx={{ px: 1, py: 0.2, fontFamily: SF.fontTitle, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', backgroundColor: ep.method === 'GET' ? `${SF.cyan}15` : `${SF.lime}15`, color: ep.method === 'GET' ? SF.cyan : SF.lime, border: `1px solid ${ep.method === 'GET' ? SF.cyan : SF.lime}30` }}>
                          {ep.method}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ ...tdSx, fontFamily: SF.fontMono, fontSize: '0.85rem', color: SF.dim }}>{ep.path}</TableCell>
                      <TableCell sx={{ ...tdSx, fontFamily: SF.fontMono, fontSize: '0.88rem', color: SF.yellow, textAlign: 'right' }}>
                        {s.latency !== undefined ? `${s.latency}ms` : '—'}
                      </TableCell>
                      <TableCell sx={tdSx}>
                        {s.status === 'loading' ? <CircularProgress size={10} sx={{ color: SF.yellow }} /> :
                         s.status === 'normal'  ? <Box component="span" sx={{ fontFamily: SF.fontBody, fontSize: '0.88rem', color: SF.lime }}>NOMINAL</Box> :
                         s.status === 'error'   ? <Box component="span" sx={{ fontFamily: SF.fontBody, fontSize: '0.88rem', color: SF.red }}>FAULT — {s.error}</Box> :
                         <Box component="span" sx={{ fontFamily: SF.fontBody, fontSize: '0.88rem', color: `${SF.white}85` }}>STANDBY</Box>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
      )}

      {/* ── Final Rooms Section ── */}
      {activeTab === 'rooms' && (
      <Box sx={{ ...hudPanel(SF.cyan), borderRadius: '4px', overflow: 'hidden', mb: 4 }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 3, py: 2.5,
          borderBottom: `1px solid ${SF.cyan}20`,
          backgroundColor: `${SF.cyan}08`,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Castle sx={{ fontSize: 18, color: SF.cyan }} />
            <Box sx={{ fontFamily: SF.fontTitle, fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.15em', color: SF.cyan }}>
              FINAL ROOMS
            </Box>
            <Box sx={{ fontFamily: SF.fontBody, fontSize: '0.85rem', color: SF.dim }}>
              ({rooms.length})
            </Box>
          </Box>
          <SFButton
            color={SF.cyan}
            variant="outline"
            onClick={() => navigate('/final/admin')}
          >
            OPEN CONSOLE
          </SFButton>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...thSx, fontFamily: SF.fontTitle, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', color: `${SF.white}85` }}>ROOM CODE</TableCell>
                <TableCell sx={{ ...thSx, fontFamily: SF.fontTitle, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', color: `${SF.white}85` }}>STATUS</TableCell>
                <TableCell sx={{ ...thSx, fontFamily: SF.fontTitle, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', color: `${SF.white}85` }}>PLAYERS</TableCell>
                <TableCell sx={{ ...thSx, fontFamily: SF.fontTitle, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', color: `${SF.white}85`, textAlign: 'right' }}>CREATED</TableCell>
                <TableCell sx={{ ...thSx, fontFamily: SF.fontTitle, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', color: `${SF.white}85`, textAlign: 'center', width: 100 }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roomsLoading && rooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ ...tdSx, textAlign: 'center', py: 4 }}>
                    <CircularProgress size={24} sx={{ color: SF.cyan }} />
                  </TableCell>
                </TableRow>
              ) : paginatedRooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ ...tdSx, textAlign: 'center', fontFamily: SF.fontBody, fontSize: '0.92rem', color: SF.dim, py: 4 }}>
                    No rooms created yet. Use the admin console to create one.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRooms.map((room) => {
                  const statusColor = room.status === 'playing' ? SF.lime : room.status === 'paused' ? SF.yellow : room.status === 'finished' ? SF.red : SF.dim;
                  return (
                    <TableRow key={room.room_code} sx={{ '&:hover': { backgroundColor: `${SF.cyan}04` } }}>
                      {/* Room Code */}
                      <TableCell sx={{ ...tdSx }}>
                        <Box sx={{
                          display: 'inline-block',
                          fontFamily: '"Courier New", monospace',
                          fontSize: '0.95rem', fontWeight: 700,
                          color: SF.cyan, letterSpacing: '0.15em',
                          px: 1.5, py: 0.3,
                          border: `1px solid ${SF.cyan}30`, borderRadius: '3px',
                          backgroundColor: `${SF.cyan}08`,
                        }}>
                          {room.room_code}
                        </Box>
                      </TableCell>

                      {/* Status */}
                      <TableCell sx={{ ...tdSx }}>
                        <Box sx={{
                          display: 'inline-flex', alignItems: 'center', gap: 1,
                        }}>
                          <Box sx={{
                            width: 8, height: 8, borderRadius: '50%',
                            backgroundColor: statusColor,
                            boxShadow: `0 0 6px ${statusColor}`,
                          }} />
                          <Box sx={{
                            fontFamily: SF.fontBody, fontSize: '0.82rem',
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                            color: statusColor,
                          }}>
                            {room.status}
                          </Box>
                          {room.status === 'playing' && (
                            <Box sx={{ fontFamily: SF.fontBody, fontSize: '0.72rem', color: SF.dim, ml: 0.5 }}>
                              Q{room.current_question}/{room.question_count}
                            </Box>
                          )}
                        </Box>
                      </TableCell>

                      {/* Players */}
                      <TableCell sx={{ ...tdSx, maxWidth: 360 }}>
                        {room.players.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {room.players.map((p, i) => {
                              const colors = [SF.cyan, SF.magenta, SF.lime, SF.yellow, '#ff8000'];
                              const c = colors[i % colors.length];
                              return (
                                <Box key={p.id} sx={{
                                  display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                  px: 1, py: 0.4, borderRadius: '3px',
                                  border: `1px solid ${c}25`,
                                  backgroundColor: `${c}06`,
                                }}>
                                  <Box sx={{ fontFamily: SF.fontBody, fontSize: '0.75rem', color: `${SF.white}80`, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {p.player_name}
                                  </Box>
                                  <Box sx={{ fontFamily: '"Courier New", monospace', fontSize: '0.65rem', fontWeight: 700, color: c }}>
                                    {p.total_score.toLocaleString()}
                                  </Box>
                                  {p.streak > 0 && (
                                    <Box sx={{ fontSize: '0.6rem' }}>🔥{p.streak}</Box>
                                  )}
                                </Box>
                              );
                            })}
                          </Box>
                        ) : (
                          <Box sx={{ fontFamily: SF.fontBody, fontSize: '0.85rem', color: SF.dim }}>—</Box>
                        )}
                      </TableCell>

                      {/* Created */}
                      <TableCell sx={{ ...tdSx, fontFamily: SF.fontMono, fontSize: '0.85rem', color: `${SF.white}85`, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {room.created_at ? new Date(room.created_at).toLocaleTimeString() : '—'}
                      </TableCell>

                      {/* Actions */}
                      <TableCell sx={{ ...tdSx, textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          {room.status === 'playing' && (
                            <>
                              <SFButton color={SF.yellow} variant="outline" onClick={() => handleRoomAction(room.room_code, 'pause')}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Pause sx={{ fontSize: '0.85rem !important' }} />
                                </Box>
                              </SFButton>
                              <SFButton color={SF.red} variant="outline" onClick={() => handleRoomAction(room.room_code, 'end')}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <RefreshIcon sx={{ fontSize: '0.85rem !important' }} />
                                </Box>
                              </SFButton>
                            </>
                          )}
                          {room.status === 'paused' && (
                            <>
                              <SFButton color={SF.lime} variant="outline" onClick={() => handleRoomAction(room.room_code, 'resume')}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <PlayArrow sx={{ fontSize: '0.85rem !important' }} />
                                </Box>
                              </SFButton>
                              <SFButton color={SF.red} variant="outline" onClick={() => handleRoomAction(room.room_code, 'end')}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <RefreshIcon sx={{ fontSize: '0.85rem !important' }} />
                                </Box>
                              </SFButton>
                            </>
                          )}
                          {room.status === 'waiting' && (
                            <SFButton color={SF.red} variant="outline" onClick={() => handleRoomAction(room.room_code, 'end')}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <RefreshIcon sx={{ fontSize: '0.85rem !important' }} /> END
                              </Box>
                            </SFButton>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={rooms.length}
          rowsPerPage={roomsRowsPerPage}
          page={roomsPage}
          onPageChange={(_, p) => setRoomsPage(p)}
          onRowsPerPageChange={(e) => { setRoomsRowsPerPage(parseInt(e.target.value, 10)); setRoomsPage(0); }}
          sx={{
            borderTop: `1px solid ${SF.cyan}15`, backgroundColor: SF.panelAlt, color: SF.dim, fontFamily: SF.fontBody, fontSize: '0.65rem',
            '& .MuiTablePagination-select': { color: SF.cyan, fontFamily: SF.fontBody },
            '& .MuiTablePagination-selectIcon': { color: SF.cyan },
            '& .MuiTablePagination-displayedRows': { fontFamily: SF.fontBody, fontSize: '0.88rem', color: SF.dim },
            '& .MuiIconButton-root': { color: SF.dim, '&:not(.Mui-disabled):hover': { color: SF.cyan } },
          }}
        />
      </Box>
      )}

      {/* ── Delete Dialog ── */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} PaperProps={{ sx: dlgPaper(SF.red) }}>
        <DialogTitle sx={{ borderBottom: `1px solid ${SF.red}25`, py: 2, px: 3 }}>
          <Box sx={{ fontFamily: SF.fontTitle, fontSize: '0.8rem', letterSpacing: '0.2em', color: SF.red }}>⚠ DELETE CONFIRMATION</Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
          <Box sx={{ fontFamily: SF.fontBody, fontSize: '0.8rem', color: `${SF.white}80`, lineHeight: 1.8 }}>
            You are about to permanently delete <Box component="span" sx={{ color: SF.red, fontWeight: 700 }}>{selectedUsers.length}</Box> record(s).
            <br />This operation cannot be reversed.
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1.5 }}>
          <SFButton color={SF.dim} onClick={() => setOpenDeleteDialog(false)}>ABORT</SFButton>
          <SFButton color={SF.red} variant="filled" onClick={confirmDelete}>CONFIRM DELETE</SFButton>
        </DialogActions>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={openEditDialog} onClose={() => { setOpenEditDialog(false); setEditingUser(null); }} PaperProps={{ sx: dlgPaper(SF.cyan) }}>
        <DialogTitle sx={{ borderBottom: `1px solid ${SF.cyan}25`, py: 2, px: 3 }}>
          <Box sx={{ fontFamily: SF.fontTitle, fontSize: '0.8rem', letterSpacing: '0.2em', color: SF.cyan }}>MODIFY RECORD</Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 1, px: 3 }}>{renderFormFields(SF.cyan)}</DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1.5 }}>
          <SFButton color={SF.dim} onClick={() => { setOpenEditDialog(false); setEditingUser(null); }}>CANCEL</SFButton>
          <SFButton color={SF.cyan} variant="filled" onClick={handleEditSubmit}>APPLY CHANGES</SFButton>
        </DialogActions>
      </Dialog>

      {/* ── Add Dialog ── */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} PaperProps={{ sx: dlgPaper(SF.lime) }}>
        <DialogTitle sx={{ borderBottom: `1px solid ${SF.lime}25`, py: 2, px: 3 }}>
          <Box sx={{ fontFamily: SF.fontTitle, fontSize: '0.8rem', letterSpacing: '0.2em', color: SF.lime }}>NEW RECORD</Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 1, px: 3 }}>{renderFormFields(SF.lime)}</DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1.5 }}>
          <SFButton color={SF.dim} onClick={() => setOpenAddDialog(false)}>CANCEL</SFButton>
          <SFButton color={SF.lime} variant="filled" onClick={handleAddSubmit}>CREATE RECORD</SFButton>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} variant="filled" sx={{ fontFamily: SF.fontBody, fontSize: '0.82rem' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminPage;
