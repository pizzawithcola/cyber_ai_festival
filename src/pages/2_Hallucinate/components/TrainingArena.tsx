import React, { useEffect, useMemo, useState } from 'react';
import { Typography, Box, Card, CardContent, CardHeader, Button, Chip, LinearProgress, Paper, Grid, Divider, Stack } from '@mui/material';
import { Flag as FlagIcon, Celebration as CelebrationIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon } from '@mui/icons-material';

import { PANEL_BODY_BACKGROUND, panelCardSx, panelHeaderSx } from '../hallucinateUi';
import { BOSS_TYPES, NORMALIZED_SENTENCE_POOL } from './training/data';
import { ChapterComplete } from './training/ChapterComplete';
import { ResultsPanel } from './training/ResultsPanel';
import { evidenceChecklistForSentence, shuffle } from './training/utils';
import { type ResultPage, type ResultPitfalls, type SentenceItem } from './training/types';

/** =========================================================
 *  TRAINING ARENA (A/B game)
 *  ========================================================= */

const animationCss = `
@keyframes shake {
  0% { transform: translateX(0); }
  20% { transform: translateX(-7px); }
  40% { transform: translateX(7px); }
  60% { transform: translateX(-6px); }
  80% { transform: translateX(6px); }
  100% { transform: translateX(0); }
}
@keyframes pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.14); }
  100% { transform: scale(1); }
}
@keyframes pulseRing {
  0% { box-shadow: 0 0 0 0 rgba(255,87,87,0.55); }
  100% { box-shadow: 0 0 0 16px rgba(255,87,87,0); }
}
@keyframes flashRed {
  0% { background-color: rgba(255, 0, 0, 0.00); }
  35% { background-color: rgba(255, 0, 0, 0.12); }
  100% { background-color: rgba(255, 0, 0, 0.00); }
}
@keyframes bossBoom {
  0% { transform: scale(0.98); filter: saturate(1); }
  35% { transform: scale(1.02); filter: saturate(1.4); }
  100% { transform: scale(1); filter: saturate(1); }
}
@keyframes fadeRise {
  0% { opacity: 0; transform: translateY(16px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes gentlePulse {
  0% { box-shadow: 0 14px 30px rgba(120, 194, 255, 0.16); }
  50% { box-shadow: 0 18px 36px rgba(151, 133, 255, 0.22); }
  100% { box-shadow: 0 14px 30px rgba(120, 194, 255, 0.16); }
}
`;

export function TrainingArena({
  autoStart = false,
  onViewRanking,
  onExitToScenarios,
}: {
  autoStart?: boolean;
  onViewRanking?: (score: number) => Promise<void> | void;
  onExitToScenarios?: () => void;
}) {
  const [isRunning, setIsRunning] = useState(false);

  const [sentences, setSentences] = useState<SentenceItem[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [passed, setPassed] = useState<Record<string, boolean>>({});
  const [resolved, setResolved] = useState<Record<string, 'correct' | 'wrong' | undefined>>({});
  const [score, setScore] = useState(0);

  const [shake, setShake] = useState(false);

  const [bossId, setBossId] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  const [showResults, setShowResults] = useState(false);
  const [resultPage, setResultPage] = useState<ResultPage>('summary');
  const [isNavigatingToRanking, setIsNavigatingToRanking] = useState(false);

  const initRound = () => {
    setShowResults(false);
    setIsRunning(true);
    setCurrentCardIndex(0);

    const count = 5;

    // Make Boss strictly more dangerous than other (non-boss) pitfalls:
    // include exactly ONE "boss-tier" pitfall type per round when possible.
    const allPitfalls = shuffle(NORMALIZED_SENTENCE_POOL.filter((x) => x.isPitfall));
    const bossTierPitfalls = allPitfalls.filter((s) => !!s.type && BOSS_TYPES.has(s.type));
    const nonBossPitfalls = allPitfalls.filter((s) => !s.type || !BOSS_TYPES.has(s.type));

    const pitCount = 3;
    const bossTierPick = bossTierPitfalls.length ? [bossTierPitfalls[0]] : [];
    const remainingPitfalls = nonBossPitfalls.slice(0, Math.max(0, pitCount - bossTierPick.length));
    const pitfalls = shuffle([...bossTierPick, ...remainingPitfalls]);
    const safe = shuffle(NORMALIZED_SENTENCE_POOL.filter((x) => !x.isPitfall && !x.isDecoySafe));
    const decoys = shuffle(NORMALIZED_SENTENCE_POOL.filter((x) => x.isDecoySafe));

    const decoyCount = 1;
    const safeCount = Math.max(0, count - pitCount - decoyCount);

    const pick = shuffle([...pitfalls.slice(0, pitCount), ...decoys.slice(0, decoyCount), ...safe.slice(0, safeCount)]);

    setSentences(pick);
    setSelected({});
    setPassed({});
    setResolved({});
    setScore(0);
    setResultPage('summary');

    const bossCandidates = pick.filter((s) => s.isPitfall && !!s.type && BOSS_TYPES.has(s.type));
    const crit = pick.filter((s) => s.isPitfall && s.severity === 'critical');
    const anyPit = pick.filter((s) => s.isPitfall);

    // Boss is a hidden "most dangerous" pitfall: prefer curated boss candidates, then critical pitfalls, then any pitfall.
    const pool = bossCandidates.length ? bossCandidates : crit.length ? crit : anyPit;
    const bossPick = pool[Math.floor(Math.random() * Math.max(1, pool.length))];
    setBossId(bossPick?.id ?? null);

    setFlash(false);
  };

  React.useLayoutEffect(() => {
    if (!autoStart) return;
    initRound();
    // Only auto-start once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endRound = React.useCallback(() => {
    setIsRunning(false);

    const flaggedIds = new Set(Object.entries(selected).filter(([, v]) => v).map(([k]) => k));
    const missedBoss = bossId ? !flaggedIds.has(bossId) : false;

    if (missedBoss) {
      setFlash(true);
      setShake(true);
      window.setTimeout(() => setShake(false), 320);
      window.setTimeout(() => setFlash(false), 520);
    }

    setShowResults(true);
    setResultPage('summary');
  }, [bossId, selected]);

  const nudgeShake = () => {
    setShake(true);
    window.setTimeout(() => setShake(false), 280);
  };

  const advanceToNextCard = () => {
    if (currentCardIndex >= sentences.length - 1) {
      endRound();
      return;
    }
    setCurrentCardIndex((idx) => idx + 1);
  };

  const handleFlashFlag = () => {
    if (!isRunning) return;
    const card = sentences[currentCardIndex];
    if (!card) return;
    if (resolved[card.id]) return;

    const flagged = selected[card.id];
    const nextSelected = flagged ? selected : { ...selected, [card.id]: true };
    if (!flagged) {
      setSelected(nextSelected);
      setResolved((r) => ({ ...r, [card.id]: card.isPitfall ? 'correct' : 'wrong' }));
      if (!card.isPitfall) nudgeShake();
    }

    setPassed((prev) => {
      if (!prev[card.id]) return prev;
      const next = { ...prev };
      delete next[card.id];
      return next;
    });
  };

  const handleFlashPass = () => {
    if (!isRunning) return;
    const card = sentences[currentCardIndex];
    if (!card) return;
    if (resolved[card.id]) return;

    setPassed((prev) => ({ ...prev, [card.id]: true }));
    setResolved((r) => ({ ...r, [card.id]: card.isPitfall ? 'wrong' : 'correct' }));
    if (card.isPitfall) nudgeShake();
  };

  const handleAdvanceFromFeedback = () => {
    const card = sentences[currentCardIndex];
    if (!card) return;
    if (!resolved[card.id]) return;
    advanceToNextCard();
  };

  const resultPitfalls = useMemo<ResultPitfalls>(() => {
    const pitfalls = sentences.filter((s) => s.isPitfall);
    const flaggedIds = new Set(Object.entries(selected).filter(([, v]) => v).map(([k]) => k));
    const passedIds = new Set(Object.entries(passed).filter(([, v]) => v).map(([k]) => k));
    const missed = pitfalls.filter((p) => !flaggedIds.has(p.id));
    const correct = pitfalls.filter((p) => flaggedIds.has(p.id));
    const falsePos = sentences.filter((s) => !s.isPitfall && flaggedIds.has(s.id));
    const correctPass = sentences.filter((s) => !s.isPitfall && passedIds.has(s.id));
    const unanswered = sentences.filter((s) => !flaggedIds.has(s.id) && !passedIds.has(s.id));
    return { pitfalls, missed, correct, falsePos, correctPass, unanswered };
  }, [sentences, selected, passed]);

  const answeredCount = useMemo(() => {
    const ids = new Set(Object.entries(selected).filter(([, v]) => v).map(([k]) => k));
    Object.entries(passed).forEach(([id, v]) => {
      if (v) ids.add(id);
    });
    return ids.size;
  }, [selected, passed]);
  useEffect(() => {
    const correctCount = Object.values(resolved).filter((status) => status === 'correct').length;
    setScore(correctCount * 20);
  }, [resolved]);
  const accuracy = sentences.length === 0 ? 0 : Math.round(((resultPitfalls.correct.length + resultPitfalls.correctPass.length) / sentences.length) * 100);
  const activeCard = sentences[currentCardIndex];
  const activeDecision = activeCard
    ? selected[activeCard.id]
      ? 'flag'
      : passed[activeCard.id]
      ? 'pass'
      : undefined
    : undefined;
  const activeFeedbackKind = !activeCard || !activeDecision
    ? undefined
    : activeCard.isPitfall
    ? activeDecision === 'flag'
      ? 'correct'
      : 'missed'
    : activeDecision === 'flag'
    ? 'falsePos'
    : 'correctPass';
  const isCardAnswered = Boolean(activeFeedbackKind);
  const progressPct = sentences.length === 0 ? 0 : (answeredCount / sentences.length) * 100;
  const feedback = accuracy >= 80 ? 'Well done' : accuracy < 40 ? 'Almost there' : 'Keep going';
  const feedbackDetail =
    accuracy >= 80
      ? 'Strong accuracy. You are consistently catching high-risk lines.'
      : accuracy < 40
      ? 'Good start. Focus on exact numbers, citations, and “first-ever” claims.'
      : 'Solid progress. Tighten checks on scope and evidence cues.';
  const feedbackColor = accuracy >= 80 ? '#2ecc71' : accuracy < 40 ? '#ffb74d' : '#00c2ff';

  const handleViewRanking = async () => {
    if (!onViewRanking || isNavigatingToRanking) return;

    setIsNavigatingToRanking(true);

    try {
      await onViewRanking(score);
    } finally {
      setIsNavigatingToRanking(false);
    }
  };

  const renderImmediateFeedback = () => {
    if (!activeCard || !activeFeedbackKind) return null;

    const isCorrectFeedback = activeFeedbackKind === 'correct' || activeFeedbackKind === 'correctPass';
    const statusLabel = isCorrectFeedback ? 'Correct' : 'Incorrect';
    const statusIcon = isCorrectFeedback ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : <CancelIcon sx={{ fontSize: 16 }} />;
    const statusColor = isCorrectFeedback ? '#49d17d' : activeFeedbackKind === 'missed' ? '#ff8a65' : '#ff5f7a';
    const statusBackground = isCorrectFeedback ? 'rgba(73, 209, 125, 0.14)' : activeFeedbackKind === 'missed' ? 'rgba(255, 138, 101, 0.16)' : 'rgba(255, 95, 122, 0.14)';

    const heading =
      activeFeedbackKind === 'correct'
        ? 'Correct pitfalls you flagged'
        : activeFeedbackKind === 'missed'
        ? 'Missed pitfalls'
        : activeFeedbackKind === 'falsePos'
        ? 'False positives'
        : 'Safe pass';

    const reasonText =
      activeFeedbackKind === 'correct' || activeFeedbackKind === 'missed'
        ? activeCard.reason
        : activeFeedbackKind === 'falsePos'
        ? activeCard.isDecoySafe
          ? 'Decoy (safe) - cautious language is good.'
          : 'Not a pitfall. Avoid over-flagging.'
        : activeCard.isDecoySafe
        ? 'Decoy (safe) - cautious language is good.'
        : 'Safe pass - claim stays cautious and checkable.';

    const showChecklist =
      activeFeedbackKind === 'correct' ||
      activeFeedbackKind === 'missed' ||
      activeFeedbackKind === 'correctPass' ||
      (activeFeedbackKind === 'falsePos' && activeCard.isDecoySafe);

    const paperBorder =
      activeFeedbackKind === 'missed'
        ? `2px solid ${activeCard.severity === 'critical' ? '#f44336' : '#ff9800'}`
        : activeFeedbackKind === 'falsePos' && activeCard.isDecoySafe
        ? '2px solid #00bcd4'
        : isCorrectFeedback
        ? '1px solid rgba(73, 209, 125, 0.34)'
        : '1px solid rgba(255, 95, 122, 0.34)';

    return (
      <Box sx={{ mt: 1.5 }}>
        <Divider sx={{ mb: 1.25 }} />
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Chip
            icon={statusIcon}
            label={statusLabel}
            sx={{
              fontWeight: 900,
              color: statusColor,
              backgroundColor: statusBackground,
              border: `1px solid ${statusColor}`,
            }}
          />
          <Typography variant="subtitle1" sx={{ fontWeight: 900, fontSize: { xs: '1.05rem', sm: '1.12rem' }, color: statusColor }}>
            {heading}
          </Typography>
        </Stack>
        <Paper
          sx={{
            p: 1.2,
            border: paperBorder,
            background: isCorrectFeedback
              ? 'linear-gradient(180deg, rgba(10, 30, 24, 0.92), rgba(10, 20, 26, 0.94))'
              : 'linear-gradient(180deg, rgba(42, 18, 24, 0.92), rgba(22, 14, 24, 0.94))',
            boxShadow: isCorrectFeedback
              ? '0 0 14px rgba(73, 209, 125, 0.1)'
              : '0 0 14px rgba(255, 95, 122, 0.1)',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 900,
              color: isCorrectFeedback ? '#effff5' : '#fff0f3',
              letterSpacing: '0.2px',
              backgroundColor: isCorrectFeedback ? 'rgba(73, 209, 125, 0.1)' : 'rgba(255, 95, 122, 0.1)',
              border: `1px solid ${isCorrectFeedback ? 'rgba(73, 209, 125, 0.35)' : 'rgba(255, 95, 122, 0.35)'}`,
              borderRadius: 1,
              px: 1,
              py: 0.4,
              display: 'inline-block',
              fontFamily: activeCard.type === 'CITATION_FABRICATION' ? "'VT323', 'Courier New', monospace" : undefined,
            }}
          >
            {activeCard.text}
          </Typography>
          <Box
            sx={{
              mt: 0.9,
              p: 0.9,
              borderRadius: 1,
              border: `1px solid ${isCorrectFeedback ? 'rgba(73, 209, 125, 0.25)' : 'rgba(255, 95, 122, 0.22)'}`,
              backgroundColor: isCorrectFeedback ? 'rgba(73, 209, 125, 0.06)' : 'rgba(255, 95, 122, 0.06)',
            }}
          >
            {reasonText && (
              <Typography variant="caption" sx={{ color: isCorrectFeedback ? '#ddffea' : '#ffd9df', display: 'block', lineHeight: 1.4 }}>
                {reasonText}
              </Typography>
            )}
            {showChecklist && (
              <Stack spacing={0.25} sx={{ mt: reasonText ? 0.5 : 0 }}>
                {evidenceChecklistForSentence(activeCard).map((line) => (
                  <Typography key={line} variant="caption" sx={{ color: isCorrectFeedback ? '#d9fff0' : '#ffe1e6', lineHeight: 1.5, display: 'block' }}>
                    - {line}
                  </Typography>
                ))}
              </Stack>
            )}
          </Box>
        </Paper>
        <Box sx={{ mt: 1.25, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={handleAdvanceFromFeedback} sx={{ fontWeight: 900 }}>
            {currentCardIndex >= sentences.length - 1 ? 'Finish round' : 'Next card'}
          </Button>
        </Box>
      </Box>
    );
  };


  if (showResults && resultPage === 'complete') {
    return (
      <ChapterComplete
        onReviewResults={() => setResultPage('summary')}
        onViewRanking={onViewRanking ? handleViewRanking : undefined}
        isNavigatingToRanking={isNavigatingToRanking}
        onStartFromBeginning={onExitToScenarios}
      />
    );
  }

  return (
    <Card sx={{ ...panelCardSx, animation: 'fadeRise 420ms ease-out' }}>
      <style>{animationCss}</style>

      <CardHeader
        title={
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    mb: 0.9,
                    px: 1,
                    py: 0.45,
                    borderRadius: 999,
                    border: '1px solid rgba(0,255,217,0.22)',
                    background: 'rgba(0,255,217,0.08)',
                    color: '#c8fbff',
                    fontFamily: "'Press Start 2P', 'VT323', monospace",
                    letterSpacing: '0.06em',
                  }}
                >
                  Arena Console
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 900,
                    mb: 0.25,
                    color: '#fff',
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.45)',
                  }}
                >
                  🎴 Flash Card Training Game
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  icon={<CelebrationIcon />}
                  label={showResults ? 'Round complete' : 'In progress'}
                  sx={{
                    color: '#fff',
                    backgroundColor: showResults ? 'rgba(46,204,113,0.28)' : 'rgba(0, 255, 217, 0.16)',
                    fontWeight: 900,
                    border: '1px solid rgba(0, 255, 217, 0.3)',
                    boxShadow: '0 0 14px rgba(0,255,217,0.12)',
                  }}
                />
              </Stack>
            </Box>

            <LinearProgress
              variant="determinate"
              value={progressPct}
              sx={{
                mt: 1.25,
                height: 8,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.16)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, rgba(0,255,217,0.98), rgba(91,46,255,0.96))',
                  boxShadow: '0 0 16px rgba(0,255,217,0.4)',
                },
              }}
            />
          </Box>
        }
        sx={{
          ...panelHeaderSx,
          background:
            'linear-gradient(135deg, rgba(20, 26, 52, 0.98) 0%, rgba(33, 18, 66, 0.96) 58%, rgba(10, 70, 88, 0.94) 100%)',
          borderBottom: '1px solid rgba(0, 255, 217, 0.28)',
        }}
      />

      <Divider />

      <CardContent
        sx={{
          p: 2.5,
          background: PANEL_BODY_BACKGROUND,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 16,
            border: '1px solid rgba(0,255,217,0.08)',
            borderRadius: 3,
            pointerEvents: 'none',
          },
        }}
      >
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12 }}>
            <Card
              sx={{
                boxShadow: '0 0 0 1px rgba(0,255,217,0.16), 0 18px 40px rgba(5, 10, 22, 0.4)',
                border: '1px solid rgba(0,255,217,0.22)',
                background: 'linear-gradient(180deg, rgba(11, 16, 34, 0.98), rgba(7, 10, 24, 0.98))',
                animation: shake ? 'shake 280ms ease-out' : 'none',
                ...(flash ? { animation: 'flashRed 520ms ease-out' } : null),
                transition: 'transform 240ms ease, box-shadow 240ms ease',
                overflow: 'hidden',
              }}
            >
              <CardHeader
                title={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 900,
                        fontSize: { xs: '1.2rem', sm: '1.3rem' },
                        color: '#f6fbff',
                        textShadow: '0 0 12px rgba(0,255,217,0.18)',
                      }}
                    >
                      🧩 AI Output
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(209, 239, 255, 0.72)', fontFamily: "'Press Start 2P', 'VT323', monospace" }}>
                      Analyze. Decide. Advance.
                    </Typography>
                  </Box>
                }
                sx={{
                  background:
                    'linear-gradient(135deg, rgba(10,18,40,0.96) 0%, rgba(18,20,54,0.96) 60%, rgba(8,48,64,0.92) 100%) !important',
                }}
              />
              <Divider />

              <CardContent
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  background: 'linear-gradient(180deg, rgba(10, 16, 34, 0.94), rgba(8, 12, 26, 0.96))',
                }}
              >
                {!isRunning && !showResults && (
                  <Box />
                )}

                {isRunning && activeCard && (
                  <Stack spacing={1.25}>
                    <Paper
                      sx={{
                        p: 1.6,
                        border: '2px solid rgba(46, 227, 255, 0.65)',
                        borderRadius: 3,
                        background:
                          'linear-gradient(180deg, rgba(14, 28, 58, 0.98), rgba(16, 22, 44, 0.98))',
                        boxShadow:
                          'inset 0 1px 0 rgba(255,255,255,0.08), 0 0 18px rgba(46,227,255,0.12), 0 16px 30px rgba(0,0,0,0.18)',
                        animation: 'fadeRise 360ms ease-out',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, mb: 1.2 }}>
                        <Chip
                          label={`Card ${currentCardIndex + 1} / ${sentences.length}`}
                          sx={{
                            fontWeight: 900,
                            color: '#dff8ff',
                            backgroundColor: 'rgba(0,255,217,0.12)',
                            border: '1px solid rgba(0,255,217,0.28)',
                          }}
                        />
                        <Chip
                          label={activeCard.isPitfall ? 'Threat Signal' : 'Safe Signal'}
                          sx={{
                            fontWeight: 900,
                            color: activeCard.isPitfall ? '#ffd5e8' : '#d7fff0',
                            backgroundColor: activeCard.isPitfall ? 'rgba(255,46,147,0.12)' : 'rgba(46,204,113,0.12)',
                            border: activeCard.isPitfall ? '1px solid rgba(255,46,147,0.28)' : '1px solid rgba(46,204,113,0.28)',
                          }}
                        />
                      </Box>

                      <Typography
                        variant="body1"
                        sx={{
                          lineHeight: 1.8,
                          fontWeight: 900,
                          color: '#f2fbff',
                          mb: 1.5,
                          animation: 'fadeRise 260ms ease-out',
                          textShadow: '0 1px 0 rgba(0,0,0,0.32)',
                        }}
                      >
                        {activeCard.text}
                      </Typography>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="stretch">
                        <Button
                          size="large"
                          variant="contained"
                          startIcon={<FlagIcon />}
                          onClick={handleFlashFlag}
                          disabled={isCardAnswered}
                          sx={{
                            fontWeight: 900,
                            background: 'linear-gradient(135deg, #ff6b6b 0%, #ff2e93 100%)',
                            boxShadow: '0 12px 28px rgba(255, 46, 147, 0.28)',
                            transition: 'transform 220ms ease, box-shadow 220ms ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 16px 34px rgba(255, 46, 147, 0.38)',
                            },
                          }}
                        >
                          Flag
                        </Button>
                        <Button
                          size="large"
                          variant="contained"
                          startIcon={<CheckCircleIcon />}
                          onClick={handleFlashPass}
                          disabled={isCardAnswered}
                          sx={{
                            fontWeight: 900,
                            background: 'linear-gradient(135deg, #00ffd9 0%, #2ee3ff 100%)',
                            boxShadow: '0 12px 28px rgba(0, 255, 217, 0.24)',
                            transition: 'transform 220ms ease, box-shadow 220ms ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 16px 34px rgba(0, 255, 217, 0.34)',
                            },
                          }}
                        >
                          Pass
                        </Button>
                      </Stack>

                      {isCardAnswered && renderImmediateFeedback()}
                    </Paper>
                  </Stack>
                )}

                {showResults && resultPage !== 'complete' && (
                  <ResultsPanel
                    resultPage={resultPage}
                    score={score}
                    accuracy={accuracy}
                    totalQuestionsAnswered={answeredCount}
                    feedback={feedback}
                    feedbackDetail={feedbackDetail}
                    feedbackColor={feedbackColor}
                    onNext={() => setResultPage('complete')}
                  />
                )}

              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
