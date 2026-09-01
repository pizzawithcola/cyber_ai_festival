import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete, Refresh, Quiz } from '@mui/icons-material';
import { apiFetch } from '../../services/api';
import { useClickSound } from '../../hooks/useClickSound';

// ─── Sci-Fi Design Tokens (consistent with AdminPage) ─────────────────────────
const SF = {
  bg: '#030812',
  panel: '#06101f',
  panelAlt: '#040d18',
  border: '#1a3a5c',
  cyan: '#00d4ff',
  lime: '#00ff88',
  red: '#ff3355',
  yellow: '#ffd700',
  white: '#e8f4ff',
  dim: '#4a7a9b',
  fontTitle: '"Orbitron", "Electrolize", sans-serif',
  fontBody: '"Electrolize", "Courier New", monospace',
  fontMono: '"Courier New", monospace',
};

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
      justifyContent: 'center',
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

const sfInputSx = {
  '& .MuiOutlinedInput-root': {
    fontFamily: SF.fontBody,
    fontSize: '0.9rem',
    color: SF.white,
    '& fieldset': { borderColor: `${SF.cyan}30` },
    '&:hover fieldset': { borderColor: `${SF.cyan}70` },
    '&.Mui-focused fieldset': { borderColor: SF.cyan, boxShadow: `0 0 8px ${SF.cyan}30` },
  },
  '& .MuiInputLabel-root': {
    fontFamily: SF.fontBody,
    fontSize: '0.78rem',
    color: `${SF.white}50`,
    '&.Mui-focused': { color: SF.cyan },
  },
  '& input': { color: SF.white },
  '& textarea': { color: SF.white },
};

interface Question {
  id: number;
  text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  time_limit: number;
  category: string | null;
  score: number;
}

const EMPTY_FORM = {
  text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_option: 'A',
  time_limit: 20,
  category: 'general',
  score: 1000,
};

const OPTION_KEYS: Array<keyof Pick<Question, 'option_a' | 'option_b' | 'option_c' | 'option_d'>> = [
  'option_a', 'option_b', 'option_c', 'option_d',
];

const correctColor = (opt: string, correct: string) => (opt === correct ? SF.lime : SF.white);

interface QuestionBankDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Question bank management — a floating long dialog listing all questions.
 * Opened from the "QUESTION BANK" button in the Admin Panel's Final Rooms section.
 */
const QuestionBankDialog: React.FC<QuestionBankDialogProps> = ({ open, onClose }) => {
  useClickSound();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/questions/');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setQuestions(await res.json());
    } catch (err) {
      console.error('Failed to load questions:', err);
      setSnack({ open: true, message: 'Failed to load questions.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load fresh data every time the dialog opens
  useEffect(() => {
    if (open) loadQuestions();
  }, [open, loadQuestions]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (q: Question) => {
    setEditingId(q.id);
    setForm({
      text: q.text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option,
      time_limit: q.time_limit,
      category: q.category ?? 'general',
      score: q.score,
    });
    setFormOpen(true);
  };

  const setField = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.text.trim() || OPTION_KEYS.some((k) => !form[k].trim())) {
      setSnack({ open: true, message: 'Please fill in the question stem and all 4 options.', severity: 'error' });
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        text: form.text.trim(),
        correct_option: form.correct_option.toUpperCase(),
        category: form.category.trim() || 'general',
        time_limit: Number(form.time_limit) || 20,
        score: Number(form.score) || 0,
      };
      if (editingId === null) {
        const res = await apiFetch('/questions/', { method: 'POST', body: JSON.stringify(body) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setSnack({ open: true, message: 'Question created!', severity: 'success' });
      } else {
        const res = await apiFetch(`/questions/${editingId}`, { method: 'PUT', body: JSON.stringify(body) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setSnack({ open: true, message: 'Question updated!', severity: 'success' });
      }
      setFormOpen(false);
      await loadQuestions();
    } catch (err) {
      console.error('Failed to save question:', err);
      setSnack({ open: true, message: 'Failed to save question.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/questions/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDeleteTarget(null);
      setSnack({ open: true, message: 'Question deleted.', severity: 'success' });
      await loadQuestions();
    } catch (err) {
      console.error('Failed to delete question:', err);
      setSnack({ open: true, message: 'Failed to delete question.', severity: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: SF.panel,
          border: `1px solid ${SF.lime}40`,
          backgroundImage: 'none',
          height: '88vh',
        },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ borderBottom: `1px solid ${SF.lime}25`, py: 2, px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Quiz sx={{ fontSize: 20, color: SF.lime }} />
            <Box sx={{ fontFamily: SF.fontTitle, fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.2em', color: SF.lime, textTransform: 'uppercase' }}>
              QUESTION BANK
            </Box>
            <Box sx={{ fontFamily: SF.fontBody, fontSize: '0.85rem', color: SF.dim }}>({questions.length})</Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <SFButton color={SF.lime} variant="filled" onClick={openCreate} startIcon={<Add />}>ADD QUESTION</SFButton>
            <SFButton color={SF.cyan} onClick={() => loadQuestions()} startIcon={<Refresh />}>REFRESH</SFButton>
          </Box>
        </Box>
      </DialogTitle>

      {/* Scrollable body: all questions */}
      <DialogContent sx={{ p: 0, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
            <CircularProgress size={28} sx={{ color: SF.lime }} />
          </Box>
        ) : questions.length === 0 ? (
          <Box sx={{ py: 12, textAlign: 'center' }}>
            <Typography sx={{ fontFamily: SF.fontBody, color: `${SF.white}50` }}>No questions yet. Add your first one!</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['ID', 'QUESTION', 'OPTIONS', 'ANSWER', 'SCORE', 'TIME', 'CATEGORY', 'ACTIONS'].map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        fontFamily: SF.fontTitle, fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.15em',
                        color: SF.lime, backgroundColor: SF.panelAlt, borderBottom: `1px solid ${SF.lime}30`,
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {questions.map((q) => (
                  <TableRow key={q.id} sx={{ '&:hover': { backgroundColor: `${SF.lime}06` } }}>
                    <TableCell sx={{ fontFamily: SF.fontMono, fontSize: '0.7rem', color: SF.dim, borderBottom: `1px solid ${SF.border}40` }}>
                      #{q.id}
                    </TableCell>
                    <TableCell sx={{ fontFamily: SF.fontBody, fontSize: '0.75rem', color: SF.white, maxWidth: 320, borderBottom: `1px solid ${SF.border}40` }}>
                      {q.text}
                    </TableCell>
                    <TableCell sx={{ fontFamily: SF.fontMono, fontSize: '0.65rem', color: `${SF.white}70`, borderBottom: `1px solid ${SF.border}40` }}>
                      {['A', 'B', 'C', 'D'].map((opt) => (
                        <Box key={opt} sx={{ color: correctColor(opt, q.correct_option) }}>
                          <b>{opt}.</b> {q[`option_${opt.toLowerCase()}` as keyof Question]}
                        </Box>
                      ))}
                    </TableCell>
                    <TableCell sx={{ fontFamily: SF.fontTitle, fontSize: '0.7rem', color: SF.lime, borderBottom: `1px solid ${SF.border}40` }}>
                      {q.correct_option}
                    </TableCell>
                    <TableCell sx={{ fontFamily: SF.fontMono, fontSize: '0.75rem', color: SF.yellow, borderBottom: `1px solid ${SF.border}40` }}>
                      {q.score}
                    </TableCell>
                    <TableCell sx={{ fontFamily: SF.fontMono, fontSize: '0.7rem', color: `${SF.white}70`, borderBottom: `1px solid ${SF.border}40` }}>
                      {q.time_limit}s
                    </TableCell>
                    <TableCell sx={{ fontFamily: SF.fontMono, fontSize: '0.65rem', color: `${SF.white}50`, borderBottom: `1px solid ${SF.border}40` }}>
                      {q.category}
                    </TableCell>
                    <TableCell sx={{ borderBottom: `1px solid ${SF.border}40` }}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <SFButton color={SF.cyan} onClick={() => openEdit(q)} startIcon={<Edit />}>EDIT</SFButton>
                        <SFButton color={SF.red} onClick={() => setDeleteTarget(q)} startIcon={<Delete />}>DEL</SFButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, borderTop: `1px solid ${SF.lime}15`, backgroundColor: SF.panelAlt }}>
        <SFButton color={SF.dim} onClick={onClose}>CLOSE</SFButton>
      </DialogActions>

      {/* Create/Edit nested dialog */}
      <Dialog open={formOpen} onClose={() => !saving && setFormOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: SF.panel, border: `1px solid ${SF.lime}40`, backgroundImage: 'none' } }}>
        <DialogTitle sx={{ fontFamily: SF.fontTitle, fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.15em', color: SF.lime, textTransform: 'uppercase' }}>
          {editingId === null ? '+ ADD QUESTION' : `EDIT QUESTION #${editingId}`}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 2 }}>
          <TextField
            label="Question Stem"
            multiline
            minRows={2}
            fullWidth
            value={form.text}
            onChange={(e) => setField('text', e.target.value)}
            sx={sfInputSx}
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            {OPTION_KEYS.map((k, i) => (
              <TextField
                key={k}
                label={`Option ${String.fromCharCode(65 + i)}`}
                fullWidth
                value={form[k]}
                onChange={(e) => setField(k, e.target.value)}
                sx={sfInputSx}
              />
            ))}
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ fontFamily: SF.fontBody, fontSize: '0.78rem', color: `${SF.white}50` }}>Correct</InputLabel>
              <Select
                value={form.correct_option}
                label="Correct"
                onChange={(e) => setField('correct_option', e.target.value)}
                sx={{
                  fontFamily: SF.fontBody, fontSize: '0.9rem', color: SF.lime,
                  '& fieldset': { borderColor: `${SF.cyan}30` },
                  '& .MuiSelect-icon': { color: SF.cyan },
                }}
              >
                {['A', 'B', 'C', 'D'].map((o) => (
                  <MenuItem key={o} value={o}>{o}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Score (points)"
              type="number"
              fullWidth
              value={form.score}
              onChange={(e) => setField('score', Number(e.target.value))}
              inputProps={{ min: 0, step: 100 }}
              sx={sfInputSx}
            />
            <TextField
              label="Time (sec)"
              type="number"
              fullWidth
              value={form.time_limit}
              onChange={(e) => setField('time_limit', Number(e.target.value))}
              inputProps={{ min: 1, max: 120 }}
              sx={sfInputSx}
            />
          </Box>
          <TextField
            label="Category"
            fullWidth
            value={form.category}
            onChange={(e) => setField('category', e.target.value)}
            sx={sfInputSx}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <SFButton color={SF.red} onClick={() => setFormOpen(false)} disabled={saving}>CANCEL</SFButton>
          <SFButton color={SF.lime} variant="filled" onClick={handleSave} disabled={saving}>
            {saving ? 'SAVING...' : 'SAVE'}
          </SFButton>
        </DialogActions>
      </Dialog>

      {/* Delete confirm nested dialog */}
      <Dialog open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { backgroundColor: SF.panel, border: `1px solid ${SF.red}40`, backgroundImage: 'none' } }}>
        <DialogTitle sx={{ fontFamily: SF.fontTitle, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', color: SF.red, textTransform: 'uppercase' }}>
          DELETE QUESTION?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: SF.fontBody, fontSize: '0.85rem', color: SF.white }}>
            Are you sure you want to delete question #{deleteTarget?.id}?
          </Typography>
          <Typography sx={{ fontFamily: SF.fontBody, fontSize: '0.75rem', color: `${SF.white}60`, mt: 1, fontStyle: 'italic' }}>
            "{deleteTarget?.text}"
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <SFButton color={SF.cyan} onClick={() => setDeleteTarget(null)} disabled={deleting}>CANCEL</SFButton>
          <SFButton color={SF.red} variant="filled" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'DELETING...' : 'DELETE'}
          </SFButton>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setSnack((p) => ({ ...p, open: false }))} severity={snack.severity} variant="filled">
          {snack.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default QuestionBankDialog;
