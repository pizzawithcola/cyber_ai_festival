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
import { apiFetch } from '../../services/api';
import { ArcadeButton, ArcadeTypography } from '../../components/ui';
import { ARCADE_COLORS, GRID_COLOR } from '../../theme/theme';

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
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'warning' }>({ open: false, message: '', severity: 'success' });

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

  const handleSend = useCallback(async () => {
    if (!editor) return;
    setIsLoading(true);
    
    try {
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

      const draft = {
        senderEmail,
        recipient,
        subject,
        content: editor.getHTML(),
      };
      sessionStorage.setItem(getDraftKey(target.id), JSON.stringify(draft));

      const reply = typeof data.reply === 'string' ? JSON.parse(data.reply) : data.reply;
      
      // Get current attempt count from sessionStorage
      const attemptCount = parseInt(sessionStorage.getItem('phishing_attempt_count') || '0', 10);
      
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
      setIsLoading(false);
    }
  }, [editor, senderEmail, recipient, subject, navigate, getDraftKey, target.id, mission, target.name, target.email, target.department, target.position, target.hobbies, target.personality]);

  const handleColorChange = useCallback((color: string) => {
    if (!editor) return;
    if (color === 'unset') {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(color).run();
    }
  }, [editor]);

  const currentColor = editor?.getAttributes('textStyle')?.color || 'unset';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, p: 2, overflow: 'hidden' }}>
      <ArcadeTypography font="audiowide" arcadeColor="lime" arcadeSize="md" sx={{ mb: 1 }}>
        PHISHING EMAIL EDITOR
      </ArcadeTypography>
      
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
              onClick={handleSend}
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
              }}
              sx={{ height: 36, mr: 1, fontFamily: '"Electrolize", sans-serif', letterSpacing: '0.5px' }}
            >
              Demo
            </ArcadeButton>
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
    </Box>
  );
};

export default PhishingMailSpace;
