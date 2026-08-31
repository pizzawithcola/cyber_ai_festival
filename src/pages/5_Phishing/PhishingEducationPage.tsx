import React, { useState } from 'react';
import { Box, Container, keyframes, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MatrixRainBackground from '../../components/common/MatrixRainBackground';
import { ArcadeButton, ArcadeTypography } from '../../components/ui';
import { ARCADE_COLORS } from '../../theme/theme';
import { useClickSound } from '../../hooks/useClickSound';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const texts = [
  "Phishing is the art of using fake emails to impersonate trusted brands, colleagues, or friends.",
  "Today, nearly half of UK businesses are still falling victim to these digital traps.",
  "And in many cases, the attacker's big breakthrough is an employee clicking like 'sure, why not' on a fake login page.",
  "Today, you aren't the target, you are the attacker.",
  "Craft the ultimate lure and see if our employees bite the bait."
];

const targets = [
  { name: 'Alex Johnson', role: 'Senior Security Analyst', weakness: 'Fear of account lockout' },
  { name: 'Sarah Collins', role: 'Social Media Coordinator', weakness: 'Excitement & FOMO' },
  { name: 'Emily Parker', role: 'Junior Financial Analyst', weakness: 'Authority pressure' },
];

const PhishingEducationPage: React.FC = () => {
  useClickSound();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'education' | 'brief'>('education');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const handleNext = () => {
    if (currentTextIndex < texts.length - 1) {
      setCurrentTextIndex((prev) => prev + 1);
    } else {
      setPhase('brief');
    }
  };

  const handlePrev = () => {
    if (phase === 'brief') {
      setPhase('education');
      setCurrentTextIndex(texts.length - 1);
      return;
    }
    if (currentTextIndex > 0) {
      setCurrentTextIndex((prev) => prev - 1);
    }
  };

  // Highlight numbers with arcade color
  const highlightNumbers = (text: string) => {
    const parts = text.split(/(\d+(?:,\d{3})*(?:\.\d+)?)/g);
    return parts.map((part, index) => {
      if (/^\d+(?:,\d{3})*(?:\.\d+)?$/.test(part)) {
        return (
          <Box
            key={index}
            component="span"
            sx={{
              color: ARCADE_COLORS.yellow,
              textShadow: `0 0 8px ${ARCADE_COLORS.yellow}80`,
              fontWeight: 700,
            }}
          >
            {part}
          </Box>
        );
      }
      return part;
    });
  };

  return (
    <MatrixRainBackground>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'transparent',
          position: 'relative',
          flexDirection: 'column',
        }}
      >
        {/* ============ Education Phase ============ */}
        {phase === 'education' && (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <Container maxWidth="lg" sx={{ width: '100%' }}>
              <Box
                sx={{
                  textAlign: 'center',
                  px: 3,
                  minHeight: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {texts.map((text, index) => (
                  <Box
                    key={index}
                    sx={{
                      opacity: index === currentTextIndex ? 1 : 0,
                      transition: 'opacity 0.4s ease-in-out',
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      pointerEvents: 'none',
                      animation: index === currentTextIndex ? `${fadeIn} 0.4s ease-out` : 'none',
                    }}
                  >
                    <ArcadeTypography
                      font="electrolize"
                      arcadeSize="lg"
                      component="p"
                      sx={{
                        color: 'transparent',
                        lineHeight: 1.8,
                        background: `repeating-linear-gradient(
                          0deg,
                          ${ARCADE_COLORS.white} 0px,
                          ${ARCADE_COLORS.white} 3px,
                          ${ARCADE_COLORS.white}B0 3px,
                          ${ARCADE_COLORS.white}B0 6px
                        )`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: `0 0 12px ${ARCADE_COLORS.lime}50, 0 0 24px ${ARCADE_COLORS.lime}20`,
                        filter: 'drop-shadow(0 0 4px rgba(57, 100, 57, 0.3))',
                      }}
                    >
                      {highlightNumbers(text)}
                    </ArcadeTypography>
                  </Box>
                ))}
              </Box>
            </Container>
          </Box>
        )}

        {/* ============ Mission Brief Phase ============ */}
        {phase === 'brief' && (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', overflowY: 'auto' }}>
            <Container maxWidth="lg" sx={{ width: '100%' }}>
            <Box sx={{ px: 3, py: 2 }}>
              <ArcadeTypography
                arcadeColor="lime"
                arcadeSize="md"
                font="pressstart2p"
                sx={{ textAlign: 'center', mb: 4, fontSize: { xs: '1.2rem', md: '1.6rem' }, textShadow: `0 0 16px ${ARCADE_COLORS.lime}60` }}
              >
                MISSION BRIEF
              </ArcadeTypography>

              {/* 背景 + 3 个目标（同一容器） */}
              <Box
                sx={{
                  border: `1px solid ${ARCADE_COLORS.lime}40`,
                  borderRadius: '4px',
                  px: 2.5,
                  py: 2,
                  mb: 3,
                  backgroundColor: 'rgba(10, 10, 26, 0.85)',
                  boxShadow: `0 0 16px ${ARCADE_COLORS.lime}15, inset 0 0 16px ${ARCADE_COLORS.lime}06`,
                }}
              >
                <ArcadeTypography
                  font="electrolize"
                  arcadeSize="sm"
                  component="p"
                  sx={{ lineHeight: 1.7, color: `${ARCADE_COLORS.white}E0`, fontSize: { xs: '0.85rem', md: '0.95rem' }, mb: 1.5 }}
                >
                  You are the mastermind behind this phishing attack.
                  <Box component="span" sx={{ display: 'block', mt: 0.5, fontWeight: 700, color: ARCADE_COLORS.white }}>
                    Goal: Choose any employee, study their background, and craft a highly compelling phishing email that makes them click the target link.
                  </Box>
                </ArcadeTypography>

                <Box sx={{ borderTop: `1px solid ${ARCADE_COLORS.lime}20`, pt: 1 }}>
                  {targets.map((t, i) => (
                    <Box
                      key={t.name}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        py: 1,
                        ...(i > 0 ? { borderTop: `1px solid ${ARCADE_COLORS.lime}15` } : {}),
                      }}
                    >
                      <ArcadeTypography font="electrolize" arcadeSize="sm" sx={{ fontSize: '0.9rem', color: ARCADE_COLORS.white, lineHeight: 1.4 }}>
                        {t.name}
                        <Box component="span" sx={{ color: `${ARCADE_COLORS.white}70`, fontSize: '0.78rem' }}> · {t.role}</Box>
                      </ArcadeTypography>
                      <Box sx={{ flexShrink: 0, px: 1.5, py: 0.5, border: `1px solid ${ARCADE_COLORS.yellow}50`, borderRadius: 999 }}>
                        <ArcadeTypography font="electrolize" arcadeSize="xs" sx={{ fontSize: '0.72rem', color: ARCADE_COLORS.yellow }}>
                          {t.weakness}
                        </ArcadeTypography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* 玩法 */}
              <Box
                sx={{
                  border: `1px solid ${ARCADE_COLORS.lime}30`,
                  borderLeft: `3px solid ${ARCADE_COLORS.lime}`,
                  borderRadius: '4px',
                  p: 2.5,
                  mb: 3,
                  backgroundColor: 'rgba(10, 10, 26, 0.7)',
                }}
              >
                <ArcadeTypography font="pressstart2p" arcadeSize="md" sx={{ fontSize: { xs: '0.95rem', md: '1.1rem' }, color: ARCADE_COLORS.lime, mb: 1.5, letterSpacing: '0.08em' }}>
                  HOW TO PLAY
                </ArcadeTypography>
                <Stack spacing={1.2}>
                  {[
                    'Read each target\'s profile — department, personality, and hobbies',
                    'Write a tailored phishing email exploiting their weakness',
                    'Use urgency, authority, or excitement to make them click',
                    'A successful click means the attack succeeded',
                  ].map((line, i) => (
                    <ArcadeTypography key={i} font="electrolize" arcadeSize="md" sx={{ fontSize: { xs: '0.95rem', md: '1.05rem' }, lineHeight: 1.5, color: `${ARCADE_COLORS.white}E0` }}>
                      <Box component="span" sx={{ color: ARCADE_COLORS.lime, mr: 1 }}>▸</Box>
                      {line}
                    </ArcadeTypography>
                  ))}
                </Stack>
              </Box>
            </Box>
            </Container>
          </Box>
        )}

        {/* ============ Navigation ============ */}
        <Box
          sx={{
            width: '100%',
            maxWidth: 960,
            px: 3,
            pb: 6,
            mt: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <ArcadeButton
            color="lime"
            variant="outline"
            size="lg"
            onClick={handlePrev}
            disabled={phase === 'education' && currentTextIndex === 0}
            startIcon={<ChevronLeft size={18} />}
          >
            BACK
          </ArcadeButton>

          {/* 进度圆点（居中，与其他游戏统一） */}
          {phase === 'education' ? (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {texts.map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    width: index === currentTextIndex ? 24 : 8,
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: index <= currentTextIndex ? ARCADE_COLORS.lime : `${ARCADE_COLORS.lime}30`,
                    boxShadow: index <= currentTextIndex ? `0 0 6px ${ARCADE_COLORS.lime}` : 'none',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </Box>
          ) : (
            <Box />
          )}

          {phase === 'education' ? (
            <ArcadeButton
              color="lime"
              variant="filled"
              size="lg"
              onClick={handleNext}
              endIcon={<ChevronRight size={18} />}
            >
              NEXT
            </ArcadeButton>
          ) : (
            <ArcadeButton
              color="lime"
              variant="filled"
              size="lg"
              animation="pulse"
              onClick={() => navigate('/phishing')}
              endIcon={<ChevronRight size={18} />}
            >
              START MISSION
            </ArcadeButton>
          )}
        </Box>
      </Box>
    </MatrixRainBackground>
  );
};

export default PhishingEducationPage;
