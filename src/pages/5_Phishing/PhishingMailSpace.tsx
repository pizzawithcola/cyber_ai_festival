import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Target, Mission } from './phishingData';
import { demoEmails } from './phishingData';
import { 
  Box, 
  TextField, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  IconButton,
  Divider,
  styled,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { 
  FormatBold, 
  FormatItalic, 
  FormatUnderlined, 
  Send,
} from '@mui/icons-material';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TurndownService from 'turndown';
import { keyframes } from '@mui/material';
import { apiFetch } from '../../services/api';
import { ArcadeButton, ArcadeTypography } from '../../components/ui';
import { ARCADE_COLORS, GRID_COLOR } from '../../theme/theme';

// ─── Round timer ─────────────────────────────────────────────────────────────
// A round is a single submission, capped at 8 minutes from the moment the editor
// page opens. The deadline is persisted in sessionStorage so refreshing the tab
// cannot hand out extra time.
const GAME_DURATION_MS = 8 * 60 * 1000;
const DEADLINE_KEY = 'phishing_deadline';
const AUTO_SUBMIT_MAX_ATTEMPTS = 3;
const AUTO_SUBMIT_RETRY_DELAY_MS = 3000;
// How long "TIME'S UP" holds the screen before the analysing view takes over.
const TIME_UP_HOLD_MS = 2500;
// Clock colour thresholds: orange under 4 minutes, red under 1 minute.
const CLOCK_WARN_MS = 4 * 60 * 1000;
const CLOCK_CRITICAL_MS = 1 * 60 * 1000;

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const formatClock = (ms: number): string => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

// Neon pulse animation for Benchmark button
const neonPulse = keyframes`
  0%, 100% {
    boxShadow: 0 0 4px ${ARCADE_COLORS.lime}60, 0 0 8px ${ARCADE_COLORS.lime}30;
    borderColor: ${ARCADE_COLORS.lime}60;
  }
  50% {
    boxShadow: 0 0 12px ${ARCADE_COLORS.lime}, 0 0 24px ${ARCADE_COLORS.lime}60;
    borderColor: ${ARCADE_COLORS.lime};
  }
`;

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
});

turndown.addRule('underline', {
  filter: ['u'],
  replacement: (content) => `<u>${content}</u>`,
});

turndown.addRule('coloredText', {
  filter: (node) => {
    return (
      node.nodeName === 'SPAN' &&
      !!(node as HTMLElement).style?.color
    );
  },
  replacement: (content, node) => {
    const color = (node as HTMLElement).style.color;
    return `<span style="color: ${color}">${content}</span>`;
  },
});

interface JudgeReply {
  total_score: number;
  score_details: Record<string, [number, string]>;
  /** 结构化逐项得分（新增：报告逐条展示用；兼容旧版缺失） */
  item_scores?: Record<string, number>;
  /** 加分项的参考区间（仅展示，不参与计算） */
  bonus_ranges?: Record<string, [number, number]>;
}

/**
 * 解析 LLM 评分返回（G4-01）：
 * - 容错：允许回复里夹带前后缀文字（截取首个 { 到末个 } 再解析）
 * - 校验：必须含合法 total_score 与非空 score_details，否则视为失败
 * 返回 null 表示响应不可用，调用方应提示用户重试（草稿已存入 sessionStorage，不会丢失）。
 */
const parseJudgeReply = (reply: unknown): JudgeReply | null => {
  const tryParse = (text: string): unknown => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  let parsed: unknown = reply;
  if (typeof reply === 'string') {
    parsed = tryParse(reply);
    if (!parsed) {
      const start = reply.indexOf('{');
      const end = reply.lastIndexOf('}');
      if (start !== -1 && end > start) parsed = tryParse(reply.slice(start, end + 1));
    }
  }
  if (!parsed || typeof parsed !== 'object') return null;

  const candidate = parsed as { total_score?: unknown; score_details?: unknown; item_scores?: unknown; bonus_ranges?: unknown };
  const total = candidate.total_score;
  if (typeof total !== 'number' || !Number.isFinite(total)) return null;

  const details = candidate.score_details;
  if (!details || typeof details !== 'object' || Object.keys(details).length === 0) return null;

  // 逐项得分（"1.1"~"4.5"）：仅接受合法键与有限数值
  const rawItems = candidate.item_scores;
  let itemScores: Record<string, number> | undefined;
  if (rawItems && typeof rawItems === 'object') {
    const entries = Object.entries(rawItems as Record<string, unknown>)
      .map(([key, value]) => [key, Number(value)] as const)
      .filter(([key, value]) => /^\d\.\d$/.test(key) && Number.isFinite(value));
    if (entries.length > 0) itemScores = Object.fromEntries(entries);
  }

  // 加分项参考区间（"1.3": [6, 8]）：仅接受 [lo, hi] 两个有限数值
  const rawRanges = candidate.bonus_ranges;
  let bonusRanges: Record<string, [number, number]> | undefined;
  if (rawRanges && typeof rawRanges === 'object') {
    const entries = Object.entries(rawRanges as Record<string, unknown>)
      .map(([key, value]) => {
        if (!/^\d\.\d$/.test(key) || !Array.isArray(value) || value.length < 2) return null;
        const lo = Number(value[0]);
        const hi = Number(value[1]);
        if (!Number.isFinite(lo) || !Number.isFinite(hi)) return null;
        return [key, [lo, hi] as [number, number]] as const;
      })
      .filter((entry): entry is readonly [string, [number, number]] => entry !== null);
    if (entries.length > 0) bonusRanges = Object.fromEntries(entries);
  }

  return {
    total_score: total,
    score_details: details as Record<string, [number, string]>,
    ...(itemScores ? { item_scores: itemScores } : {}),
    ...(bonusRanges ? { bonus_ranges: bonusRanges } : {}),
  };
};

const StyledTextField = styled(TextField)(() => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#0d0d20',
    color: ARCADE_COLORS.white,
    fontFamily: '"Electrolize", sans-serif',
    fontSize: '0.85rem',
    '& fieldset': {
      borderColor: GRID_COLOR,
    },
    '&:hover fieldset': {
      borderColor: ARCADE_COLORS.lime,
    },
    '&.Mui-focused fieldset': {
      borderColor: ARCADE_COLORS.lime,
    },
    '& input': {
      color: ARCADE_COLORS.white,
    },
    '& input::placeholder': {
      color: `${ARCADE_COLORS.white}60`,
      opacity: 1,
    },
  },
}));

interface PhishingMailSpaceProps {
  target: Target;
  mission: Mission;
}

const PhishingMailSpace: React.FC<PhishingMailSpaceProps> = ({ target, mission }) => {
  const navigate = useNavigate();
  
  const [senderEmail, setSenderEmail] = useState('');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'warning' | 'error' }>({ open: false, message: '', severity: 'success' });
    const [benchmarkDialogOpen, setBenchmarkDialogOpen] = useState(false);
  
    // Get current attempt count from sessionStorage
    const attemptCount = parseInt(sessionStorage.getItem('phishing_attempt_count') || '0', 10);
    // Show Benchmark only on the 3rd attempt (attemptCount === 2 means 2 attempts completed, this is the 3rd)
    const shouldShowBenchmark = attemptCount === 2;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Underline,
      TextStyle,
      Color,
    ],
    content: '',
    editorProps: {
      attributes: {
        style: `
          outline: none;
          height: 100%;
          font-family: inherit;
          font-size: 14px;
          color: #e0e0e0;
          padding: 12px;
        `,
      },
    },
  });

  const prevTargetId = useRef(target.id);

  // ─── Round timer state ────────────────────────────────────────────────────────
  // Created once per round and persisted, so refreshing reuses the original clock.
  const [deadline] = useState<number>(() => {
    const saved = Number(sessionStorage.getItem(DEADLINE_KEY) || 0);
    if (saved > Date.now()) return saved;
    const next = Date.now() + GAME_DURATION_MS;
    sessionStorage.setItem(DEADLINE_KEY, String(next));
    return next;
  });
  const [remainingMs, setRemainingMs] = useState<number>(() => deadline - Date.now());
  // Raised the instant the clock hits zero so the TIME'S UP card can hold the
  // screen while the auto-submit spins up.
  const [timeUp, setTimeUp] = useState(false);

  // Synchronous guard. `isLoading` is React state and updates asynchronously, so it
  // cannot stop the timer and a manual click from submitting twice in one tick.
  const submittingRef = useRef(false);

  useEffect(() => {
    if (prevTargetId.current !== target.id) {
      prevTargetId.current = target.id;
      setSenderEmail('');
      setRecipient('');
      setSubject('');
      editor?.commands.clearContent();
    }
  }, [target.id, editor]);

  const getDraftKey = useCallback((id: number) => `phishing_draft_${id}`, []);

  const handleSaveDraft = useCallback(() => {
    if (!editor) return;
    const draft = {
      senderEmail,
      recipient,
      subject,
      content: editor.getHTML(),
    };
    sessionStorage.setItem(getDraftKey(target.id), JSON.stringify(draft));
    setSnackbar({ open: true, message: 'Draft saved!', severity: 'success' });
  }, [editor, senderEmail, recipient, subject, target.id, getDraftKey]);

  const handleLoadDraft = useCallback(() => {
    if (!editor) return;
    const raw = sessionStorage.getItem(getDraftKey(target.id));
    if (!raw) {
      setSnackbar({ open: true, message: 'No draft found for this target.', severity: 'warning' });
      return;
    }
    const draft = JSON.parse(raw) as {
      senderEmail: string;
      recipient: string;
      subject: string;
      content: string;
    };
    setSenderEmail(draft.senderEmail);
    setRecipient(draft.recipient);
    setSubject(draft.subject);
    editor.commands.setContent(draft.content);
    setSnackbar({ open: true, message: 'Draft loaded!', severity: 'success' });
  }, [editor, target.id, getDraftKey]);

  // Ask the scoring service for a verdict, or null when the response was not
  // usable. The draft is persisted before the call so a failure never loses work.
  const requestScore = useCallback(async () => {
    if (!editor) return null;
    const html = editor.getHTML();
    const markdown = turndown.turndown(html);

    const prompt = `From: ${senderEmail}\nTo: ${recipient}\nSubject: ${subject}\n\n${markdown}`;

    console.log('=== Email Sent ===');
    console.log('Prompt:', prompt);

    const targetInformation = {
      name: target.name,
      email: target.email,
      department: target.department,
      position: target.position,
      hobbies: target.hobbies,
      personality: target.personality,
      mission: {
        title: mission.title,
        description: mission.description,
        targetLink: mission.targetLink,
        difficulty: mission.difficulty,
        hint: mission.hint,
      },
    };

    sessionStorage.setItem(getDraftKey(target.id), JSON.stringify({
      senderEmail,
      recipient,
      subject,
      content: html,
    }));

    const res = await apiFetch('/llm/chat', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        model: 'deepseek-chat',
        target_information: targetInformation,
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    console.log('LLM Response:', data);

    return parseJudgeReply(data.reply);
  }, [editor, senderEmail, recipient, subject, getDraftKey, target.id, target.name, target.email, target.department, target.position, target.hobbies, target.personality, mission.title, mission.description, mission.targetLink, mission.difficulty, mission.hint]);

  const handleSend = useCallback(async (opts?: { auto?: boolean }) => {
    if (!editor || submittingRef.current) return;
    submittingRef.current = true;
    setIsLoading(true);

    const attemptCount = parseInt(sessionStorage.getItem('phishing_attempt_count') || '0', 10);

    try {
      if (opts?.auto) {
        // The clock ran out: an attempt must always be recorded, so keep retrying
        // instead of leaving the player on a page whose time is already up.
        for (let attempt = 1; attempt <= AUTO_SUBMIT_MAX_ATTEMPTS; attempt++) {
          try {
            const reply = await requestScore();
            if (reply) {
              navigate('/phishing/score', { state: { reply, attemptCount } });
              return;
            }
          } catch (err) {
            console.error(`[phishing] auto-submit attempt ${attempt} failed:`, err);
          }
          if (attempt < AUTO_SUBMIT_MAX_ATTEMPTS) await sleep(AUTO_SUBMIT_RETRY_DELAY_MS);
        }
        // Scoring never came back. Fall back to a zeroed report so the round is
        // still closed out and the player is not stranded.
        console.warn('[phishing] auto-submit exhausted retries; recording a zero score');
        navigate('/phishing/score', {
          state: { reply: { total_score: 0, score_details: {} }, attemptCount, autoFailed: true },
        });
        return;
      }

      const reply = await requestScore();
      if (!reply) {
        // 评分服务返回不可解析/字段缺失：不跳转、不清空草稿，提示用户重试
        setSnackbar({
          open: true,
          message: 'Scoring service returned an invalid response. Please try again.',
          severity: 'error',
        });
        return;
      }

      navigate('/phishing/score', {
        state: {
          reply,
          attemptCount
        }
      });
    } catch (err) {
      console.error('Failed to send:', err);
      alert(`Failed to send email: ${err}`);
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  }, [editor, requestScore, navigate]);

  // The interval below must always call the newest handleSend, otherwise the
  // auto-submit would capture the first render's empty fields.
  const sendRef = useRef(handleSend);
  useEffect(() => { sendRef.current = handleSend; }, [handleSend]);

  // Tick against an absolute deadline rather than decrementing a counter, because
  // browsers throttle timers in background tabs and a counter would drift.
  useEffect(() => {
    let holdTimer = 0;
    const tick = () => {
      const left = deadline - Date.now();
      setRemainingMs(left);
      if (left <= 0) {
        window.clearInterval(timer);
        setTimeUp(true);
        // Hold on the TIME'S UP card for a beat, then hand over to the analysing
        // view so the two screens never render at the same time.
        holdTimer = window.setTimeout(() => { void sendRef.current({ auto: true }); }, TIME_UP_HOLD_MS);
      }
    };
    const timer = window.setInterval(tick, 1000);
    tick();
    return () => {
      window.clearInterval(timer);
      if (holdTimer) window.clearTimeout(holdTimer);
    };
  }, [deadline]);

  const handleColorChange = useCallback((color: string) => {
    if (!editor) return;
    if (color === 'unset') {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(color).run();
    }
  }, [editor]);

  const currentColor = editor?.getAttributes('textStyle')?.color || 'unset';

  // Green normally, orange under 10s, red under 5s.
  const clockColor = remainingMs <= CLOCK_CRITICAL_MS
    ? ARCADE_COLORS.red
    : remainingMs <= CLOCK_WARN_MS
      ? ARCADE_COLORS.orange
      : ARCADE_COLORS.lime;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, p: 2, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <ArcadeTypography font="audiowide" arcadeColor="lime" arcadeSize="md">
          PHISHING EMAIL EDITOR
        </ArcadeTypography>
        <Box
          component="span"
          aria-label="time remaining"
          sx={{
            flexShrink: 0,
            whiteSpace: 'nowrap',
            fontFamily: '"Courier New", monospace',
            fontWeight: 700,
            fontSize: '1.05rem',
            letterSpacing: '0.08em',
            color: clockColor,
            textShadow: `0 0 8px ${clockColor}80`,
            transition: 'color 0.3s ease',
          }}
        >
          TIME LEFT {formatClock(remainingMs)}
        </Box>
      </Box>

      {/* Time's up — full-screen takeover, then the analysing view replaces it. */}
      {timeUp && !isLoading && (
        <Box sx={{
          position: 'fixed', inset: 0, zIndex: 70,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(5,5,16,0.95)',
          animation: `${fadeIn} 0.2s ease`,
        }}>
          <Box sx={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: { xs: '1.6rem', md: '3rem' },
            letterSpacing: '0.15em',
            color: ARCADE_COLORS.lime,
            textShadow: `0 0 30px ${ARCADE_COLORS.lime}, 0 0 60px ${ARCADE_COLORS.lime}80`,
            animation: 'timeUpPulse 0.7s ease-in-out infinite',
            '@keyframes timeUpPulse': {
              '0%, 100%': { opacity: 1, transform: 'scale(1)' },
              '50%': { opacity: 0.55, transform: 'scale(1.04)' },
            },
          }}>
            TIME'S UP
          </Box>
          <Box sx={{
            mt: 3,
            fontFamily: '"Audiowide", sans-serif',
            fontSize: '0.95rem',
            letterSpacing: '0.2em',
            color: ARCADE_COLORS.lime,
            textShadow: `0 0 12px ${ARCADE_COLORS.lime}70`,
          }}>
            SUBMITTING YOUR ATTEMPT
          </Box>
        </Box>
      )}
      
      {isLoading ? (
        <Box 
          sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${ARCADE_COLORS.lime}40`,
            backgroundColor: 'rgba(5, 5, 15, 0.98)',
            borderRadius: 1,
            gap: 2,
            boxShadow: `0 0 12px ${ARCADE_COLORS.lime}20`,
            position: 'relative',
            overflow: 'hidden',
            /* Scanline overlay */
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.03) 2px, rgba(0,255,0,0.03) 4px)',
              pointerEvents: 'none',
            },
          }}
        >
          {/* Retro loading bars */}
          <Box sx={{ display: 'flex', gap: '3px', mb: 2 }}>
            {[...Array(8)].map((_, i) => (
              <Box
                key={i}
                sx={{
                  width: 6,
                  height: 24,
                  backgroundColor: ARCADE_COLORS.lime,
                  opacity: 0.3,
                  animation: `barPulse 1.2s ease-in-out ${i * 0.15}s infinite`,
                  '@keyframes barPulse': {
                    '0%, 100%': { opacity: 0.2, transform: 'scaleY(0.6)' },
                    '50%': { opacity: 1, transform: 'scaleY(1)' },
                  },
                }}
              />
            ))}
          </Box>
          
          {/* Main text - blinking */}
          <ArcadeTypography font="electrolize" arcadeColor="lime" arcadeSize="sm" sx={{ 
            animation: 'textBlink 1.5s step-end infinite',
            '@keyframes textBlink': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.4 },
            },
          }}>
            {'> ANALYZING...'}
          </ArcadeTypography>
          
          {/* Progress dots */}
          <Typography sx={{ 
            fontFamily: '"Press Start 2P", monospace', 
            fontSize: '0.6rem', 
            color: `${ARCADE_COLORS.lime}80`,
            letterSpacing: '2px',
            mt: 1,
          }}>
            {'[██████░░░░]'}
          </Typography>
        </Box>
      ) : (
        <Box 
          sx={{ 
            flex: 1, 
            minHeight: 0,
            display: 'flex', 
            flexDirection: 'column',
            border: `1px solid ${ARCADE_COLORS.lime}30`,
            backgroundColor: 'rgba(10, 10, 26, 0.95)',
            borderRadius: 1,
            overflow: 'hidden',
            boxShadow: `0 0 8px ${ARCADE_COLORS.lime}15`,
          }}
        >
          {/* From / To / Subject + Send */}
          <Box sx={{ p: 2, borderBottom: `1px solid ${ARCADE_COLORS.lime}20`, display: 'flex', flexDirection: 'row', gap: 1 }}>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant='subtitle2' sx={{ fontWeight: 500, color: `${ARCADE_COLORS.white}80`, minWidth: 60, fontFamily: '"Electrolize", sans-serif' }}>From:</Typography>
                <StyledTextField
                  fullWidth
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  variant='outlined'
                  size='small'
                  placeholder='Enter sender email address'
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant='subtitle2' sx={{ fontWeight: 500, color: `${ARCADE_COLORS.white}80`, minWidth: 60, fontFamily: '"Electrolize", sans-serif' }}>To:</Typography>
                <StyledTextField
                  fullWidth
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  variant='outlined'
                  size='small'
                  placeholder='Enter recipient email address'
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant='subtitle2' sx={{ fontWeight: 500, color: `${ARCADE_COLORS.white}80`, minWidth: 60, fontFamily: '"Electrolize", sans-serif' }}>Subject:</Typography>
                <StyledTextField
                  fullWidth
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  variant='outlined'
                  size='small'
                  placeholder='Enter email subject'
                />
              </Box>
            </Box>
            <ArcadeButton
              color="lime"
              onClick={() => void handleSend()}
              sx={{
                width: 60,
                minWidth: 50,
                height: 'auto',
                alignSelf: 'stretch',
                fontFamily: '"Electrolize", sans-serif',
                letterSpacing: '0.5px',
              }}
            >
              <Send />
            </ArcadeButton>
          </Box>
          
          {/* 格式化工具栏 */}
          <Box sx={{ p: 1, borderBottom: `1px solid ${ARCADE_COLORS.lime}20`, display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <IconButton 
              size='small' 
              onClick={() => editor?.chain().focus().toggleBold().run()}
              sx={{ 
                borderRadius: 1,
                backgroundColor: editor?.isActive('bold') ? ARCADE_COLORS.lime : 'transparent',
                color: editor?.isActive('bold') ? '#000' : `${ARCADE_COLORS.white}80`,
                '&:hover': {
                  backgroundColor: editor?.isActive('bold') ? ARCADE_COLORS.lime : 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <FormatBold />
            </IconButton>
            
            <IconButton 
              size='small' 
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              sx={{ 
                borderRadius: 1,
                backgroundColor: editor?.isActive('italic') ? ARCADE_COLORS.lime : 'transparent',
                color: editor?.isActive('italic') ? '#000' : `${ARCADE_COLORS.white}80`,
                '&:hover': {
                  backgroundColor: editor?.isActive('italic') ? ARCADE_COLORS.lime : 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <FormatItalic />
            </IconButton>
            
            <IconButton 
              size='small' 
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              sx={{ 
                borderRadius: 1,
                backgroundColor: editor?.isActive('underline') ? ARCADE_COLORS.lime : 'transparent',
                color: editor?.isActive('underline') ? '#000' : `${ARCADE_COLORS.white}80`,
                '&:hover': {
                  backgroundColor: editor?.isActive('underline') ? ARCADE_COLORS.lime : 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <FormatUnderlined />
            </IconButton>
            
            <Divider orientation='vertical' flexItem sx={{ mx: 1, borderColor: GRID_COLOR }} />
            
            <FormControl size='small' sx={{ minWidth: 120, '& .MuiOutlinedInput-root': { color: ARCADE_COLORS.white, fontFamily: '"Electrolize", sans-serif', fontSize: '0.8rem', '& fieldset': { borderColor: GRID_COLOR }, '&:hover fieldset': { borderColor: ARCADE_COLORS.lime } }, '& .MuiInputLabel-root': { color: `${ARCADE_COLORS.white}60` } }}>
              <InputLabel>Text Color</InputLabel>
              <Select
                value={currentColor}
                label='Text Color'
                onChange={(e) => handleColorChange(e.target.value as string)}
                sx={{ color: ARCADE_COLORS.white, '& .MuiSvgIcon-root': { color: `${ARCADE_COLORS.white}60` } }}
              >
                <MenuItem value='unset'>Default</MenuItem>
                <MenuItem value='#dc2626'>Red</MenuItem>
                <MenuItem value='#2563eb'>Blue</MenuItem>
                <MenuItem value='#059669'>Green</MenuItem>
                <MenuItem value='#d97706'>Orange</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ flex: 1 }} />

            {shouldShowBenchmark && (
            <Box
              sx={{
                mr: 1,
                animation: `${neonPulse} 2s ease-in-out infinite`,
                border: `2px solid ${ARCADE_COLORS.lime}60`,
                borderRadius: '4px',
              }}
            >
              <ArcadeButton
                color="lime"
                size="sm"
                onClick={() => setBenchmarkDialogOpen(true)}
                sx={{ height: 36, fontFamily: '"Electrolize", sans-serif', letterSpacing: '0.5px' }}
              >
                Benchmark
              </ArcadeButton>
            </Box>
            )}
            <ArcadeButton
              color="white"
              variant="ghost"
              size="sm"
              onClick={handleSaveDraft}
              sx={{ height: 36, fontFamily: '"Electrolize", sans-serif', letterSpacing: '0.5px', border: `2px solid ${ARCADE_COLORS.white}30`, '&:hover': { borderColor: `${ARCADE_COLORS.lime}80` } }}
            >
              Save Draft
            </ArcadeButton>
            <ArcadeButton
              color="white"
              variant="ghost"
              size="sm"
              onClick={handleLoadDraft}
              sx={{ height: 36, ml: 1, fontFamily: '"Electrolize", sans-serif', letterSpacing: '0.5px', border: `2px solid ${ARCADE_COLORS.white}30`, '&:hover': { borderColor: `${ARCADE_COLORS.lime}80` } }}
            >
              Load Draft
            </ArcadeButton>
          </Box>
          
          {/* 富文本编辑器 */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflow: 'auto',
              cursor: 'text',
              '& .tiptap': {
                height: '100%',
                outline: 'none',
                p: { margin: '0 0 0.5em 0' },
                'p:last-child': { marginBottom: 0 },
              },
              '& .tiptap p.is-editor-empty:first-child::before': {
                content: 'attr(data-placeholder)',
                color: `${ARCADE_COLORS.white}40`,
                pointerEvents: 'none',
                float: 'left',
                height: 0,
              },
            }}
            onClick={() => editor?.chain().focus().run()}
          >
            <EditorContent
              editor={editor}
              style={{ height: '100%' }}
            />
          </Box>
          
        </Box>

      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant='filled'
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Benchmark Confirmation Dialog */}
      <Dialog
        open={benchmarkDialogOpen}
        onClose={() => setBenchmarkDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#0d0d20',
            border: `2px solid ${ARCADE_COLORS.lime}80`,
            borderRadius: 0,
            boxShadow: `0 0 20px ${ARCADE_COLORS.lime}30`,
            maxWidth: 420,
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: '"Electrolize", sans-serif', color: ARCADE_COLORS.lime, fontSize: '1rem' }}>
          ⚠ Benchmark Mode
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: '"Electrolize", sans-serif', color: ARCADE_COLORS.white, fontSize: '0.85rem', lineHeight: 1.6 }}>
            This is your 3rd and final attempt. If you use the benchmark, your score for this round will NOT be recorded as your official result. Would you like to see the benchmark email?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <ArcadeButton
            color="white"
            variant="ghost"
            size="sm"
            onClick={() => setBenchmarkDialogOpen(false)}
            sx={{ fontFamily: '"Electrolize", sans-serif', letterSpacing: '0.5px', border: `2px solid ${ARCADE_COLORS.white}30` }}
          >
            Cancel
          </ArcadeButton>
          <ArcadeButton
            color="lime"
            size="sm"
            onClick={() => {
              const demo = demoEmails.find(d => d.targetId === target.id);
              if (demo) {
                setSenderEmail(demo.senderEmail);
                setRecipient(demo.recipient);
                setSubject(demo.subject);
                editor?.commands.setContent(demo.content);
              }
              sessionStorage.setItem('phishing_is_benchmark', 'true');
              setBenchmarkDialogOpen(false);
            }}
            sx={{ fontFamily: '"Electrolize", sans-serif', letterSpacing: '0.5px' }}
          >
            Confirm
          </ArcadeButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PhishingMailSpace;
