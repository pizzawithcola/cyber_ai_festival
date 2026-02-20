import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Target, Mission } from './phishingData';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  IconButton,
  Divider,
  styled,
  useTheme
} from '@mui/material';
import { 
  FormatBold, 
  FormatItalic, 
  FormatUnderlined, 
  Send 
} from '@mui/icons-material';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TurndownService from 'turndown';

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

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: theme.palette.divider,
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
}));

interface PhishingMailSpaceProps {
  target: Target;
  mission: Mission;
}

const PhishingMailSpace: React.FC<PhishingMailSpaceProps> = ({ target, mission }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [senderEmail, setSenderEmail] = useState('');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');

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
          color: ${theme.palette.text.primary};
          padding: 12px;
        `,
      },
    },
  });

  const handleSend = useCallback(async () => {
    if (!editor) return;
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

    try {
      const res = await fetch('http://localhost:8848/llm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: 'deepseek-chat',
          target_information: targetInformation,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      console.log('LLM Response:', data);

      const reply = typeof data.reply === 'string' ? JSON.parse(data.reply) : data.reply;
      navigate('/phishing/score', { state: { reply } });
    } catch (err) {
      console.error('Failed to send:', err);
      alert(`Failed to send email: ${err}`);
    }
  }, [editor, senderEmail, recipient, subject, navigate]);

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
      <Typography variant='h6' gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
        PHISHING EMAIL EDITOR
      </Typography>
      
      <Paper 
        sx={{ 
          flex: 1, 
          minHeight: 0,
          display: 'flex', 
          flexDirection: 'column',
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          overflow: 'hidden'
        }}
      >
        {/* From / To / Subject + Send */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'row', gap: 1 }}>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant='subtitle2' sx={{ fontWeight: 500, color: '#666666', minWidth: 60 }}>From:</Typography>
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
              <Typography variant='subtitle2' sx={{ fontWeight: 500, color: '#666666', minWidth: 60 }}>To:</Typography>
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
              <Typography variant='subtitle2' sx={{ fontWeight: 500, color: '#666666', minWidth: 60 }}>Subject:</Typography>
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
          <Button
            variant='contained'
            color='primary'
            onClick={handleSend}
            sx={{
              width: 60,
              minWidth: 50,
              height: 'auto',
              alignSelf: 'stretch',
              backgroundColor: '#1976d2',
              '&:hover': { backgroundColor: '#1565c0' },
            }}
          >
            <Send />
          </Button>
        </Box>
        
        {/* 格式化工具栏 */}
        <Box sx={{ p: 1, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <IconButton 
            size='small' 
            onClick={() => editor?.chain().focus().toggleBold().run()}
            sx={{ 
              borderRadius: 1,
              backgroundColor: editor?.isActive('bold') ? '#1976d2' : 'transparent',
              color: editor?.isActive('bold') ? '#ffffff' : '#666666',
              '&:hover': {
                backgroundColor: editor?.isActive('bold') ? '#1565c0' : '#f5f5f5'
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
              backgroundColor: editor?.isActive('italic') ? '#1976d2' : 'transparent',
              color: editor?.isActive('italic') ? '#ffffff' : '#666666',
              '&:hover': {
                backgroundColor: editor?.isActive('italic') ? '#1565c0' : '#f5f5f5'
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
              backgroundColor: editor?.isActive('underline') ? '#1976d2' : 'transparent',
              color: editor?.isActive('underline') ? '#ffffff' : '#666666',
              '&:hover': {
                backgroundColor: editor?.isActive('underline') ? '#1565c0' : '#f5f5f5'
              }
            }}
          >
            <FormatUnderlined />
          </IconButton>
          
          <Divider orientation='vertical' flexItem sx={{ mx: 1 }} />
          
          <FormControl size='small' sx={{ minWidth: 120 }}>
            <InputLabel>Text Color</InputLabel>
            <Select
              value={currentColor}
              label='Text Color'
              onChange={(e) => handleColorChange(e.target.value as string)}
            >
              <MenuItem value='unset'>Default</MenuItem>
              <MenuItem value='#dc2626'>Red</MenuItem>
              <MenuItem value='#2563eb'>Blue</MenuItem>
              <MenuItem value='#059669'>Green</MenuItem>
              <MenuItem value='#d97706'>Orange</MenuItem>
            </Select>
          </FormControl>
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
              color: theme.palette.text.disabled,
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
        
      </Paper>
    </Box>
  );
};

export default PhishingMailSpace;
