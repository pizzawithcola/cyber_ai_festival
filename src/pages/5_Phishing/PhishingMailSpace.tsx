import React, { useState } from 'react';
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

const PhishingMailSpace: React.FC = () => {
  const theme = useTheme();
  
  const [senderEmail, setSenderEmail] = useState('security@update-company.com');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textColor, setTextColor] = useState('#000000');

  const handleSend = () => {
    // 这里可以添加发送逻辑
    console.log('Sending email:', { senderEmail, recipient, subject, content });
    alert('Email sent successfully!');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
      <Typography variant='h6' gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
        📧 EMAIL DRAFT EDITOR
      </Typography>
      
      <Paper 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper
        }}
      >
        {/* 发件人邮箱 */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 500, color: '#666666' }}>
            From:
          </Typography>
          <StyledTextField
            fullWidth
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            variant='outlined'
            size='small'
            placeholder='Enter sender email address'
          />
        </Box>
        
        {/* 收件人 */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 500, color: '#666666' }}>
            To:
          </Typography>
          <StyledTextField
            fullWidth
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            variant='outlined'
            size='small'
            placeholder='Enter recipient email address'
          />
        </Box>
        
        {/* 邮件标题 */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 500, color: '#666666' }}>
            Subject:
          </Typography>
          <StyledTextField
            fullWidth
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            variant='outlined'
            size='small'
            placeholder='Enter email subject'
          />
        </Box>
        
        {/* 格式化工具栏 */}
        <Box sx={{ p: 1, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', gap: 0.5 }}>
          <IconButton 
            size='small' 
            onClick={() => setIsBold(!isBold)}
            sx={{ 
              backgroundColor: isBold ? '#1976d2' : 'transparent',
              color: isBold ? '#ffffff' : '#666666',
              '&:hover': {
                backgroundColor: isBold ? '#1565c0' : '#f5f5f5'
              }
            }}
          >
            <FormatBold />
          </IconButton>
          
          <IconButton 
            size='small' 
            onClick={() => setIsItalic(!isItalic)}
            sx={{ 
              backgroundColor: isItalic ? '#1976d2' : 'transparent',
              color: isItalic ? '#ffffff' : '#666666',
              '&:hover': {
                backgroundColor: isItalic ? '#1565c0' : '#f5f5f5'
              }
            }}
          >
            <FormatItalic />
          </IconButton>
          
          <IconButton 
            size='small' 
            onClick={() => setIsUnderline(!isUnderline)}
            sx={{ 
              backgroundColor: isUnderline ? '#1976d2' : 'transparent',
              color: isUnderline ? '#ffffff' : '#666666',
              '&:hover': {
                backgroundColor: isUnderline ? '#1565c0' : '#f5f5f5'
              }
            }}
          >
            <FormatUnderlined />
          </IconButton>
          
          <Divider orientation='vertical' flexItem sx={{ mx: 1 }} />
          
          <FormControl size='small' sx={{ minWidth: 120 }}>
            <InputLabel>Text Color</InputLabel>
            <Select
              value={textColor}
              label='Text Color'
              onChange={(e) => setTextColor(e.target.value as string)}
            >
              <MenuItem value='#ffffff'>White</MenuItem>
              <MenuItem value='#dc2626'>Red</MenuItem>
              <MenuItem value='#2563eb'>Blue</MenuItem>
              <MenuItem value='#059669'>Green</MenuItem>
              <MenuItem value='#d97706'>Orange</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        {/* 邮件正文 */}
        <Box sx={{ flexGrow: 1, p: 2 }}>
          <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 500, color: '#666666' }}>
            Message:
          </Typography>
          <textarea
            style={{
              width: '100%',
              height: '100%',
              minHeight: '200px',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '4px',
              padding: '12px',
              fontFamily: 'inherit',
              fontSize: '14px',
              fontWeight: isBold ? 'bold' : 'normal',
              fontStyle: isItalic ? 'italic' : 'normal',
              textDecoration: isUnderline ? 'underline' : 'none',
              color: textColor,
              resize: 'vertical',
              backgroundColor: theme.palette.background.paper
            }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder='Enter your email message here...'
          />
        </Box>
        
        {/* 发送按钮 */}
        <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant='contained' 
            color='primary'
            onClick={handleSend}
            startIcon={<Send />}
            sx={{ 
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1565c0'
              }
            }}
          >
            Send Email
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default PhishingMailSpace;
