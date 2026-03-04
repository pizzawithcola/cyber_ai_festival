import React, { useEffect, useMemo, useState } from 'react';
import { Typography, Box, Card, CardContent, CardHeader, Button, Chip, LinearProgress, Paper, Grid, Divider, Stack } from '@mui/material';
import { Flag as FlagIcon, Timer as TimerIcon, Celebration as CelebrationIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';

import { NEON_BLUE, PRIMARY_HEADER_GRADIENT, PANEL_BODY_BACKGROUND, panelCardSx, panelHeaderSx } from '../hallucinateUi';
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
`;

export function TrainingArena({
  autoStart = false,
  onExitToScenarios,
}: {
  autoStart?: boolean;
  onExitToScenarios?: () => void;
}) {
  const roundSeconds = 40;

  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(roundSeconds);

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

  const initRound = () => {
    setShowResults(false);
    setIsRunning(true);
    setTimeLeft(roundSeconds);
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

  useEffect(() => {
    if (!isRunning) return;
    const t = window.setInterval(() => {
      setTimeLeft((v) => {
        if (v <= 1) {
          window.clearInterval(t);
          endRound();
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [endRound, isRunning]);

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

  const headerGradient = PRIMARY_HEADER_GRADIENT;
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

  const renderImmediateFeedback = () => {
    if (!activeCard || !activeFeedbackKind) return null;

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
        : '1px solid rgba(0, 255, 217, 0.25)';

    return (
      <Box sx={{ mt: 1.5 }}>
        <Divider sx={{ mb: 1.25 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1, fontSize: { xs: '1.05rem', sm: '1.12rem' } }}>
          {heading}
        </Typography>
        <Paper sx={{ p: 1.2, border: paperBorder }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 900,
              color: '#eaffff',
              letterSpacing: '0.2px',
              backgroundColor: 'rgba(0, 255, 217, 0.08)',
              border: '1px solid rgba(0, 255, 217, 0.35)',
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
              border: '1px solid rgba(91, 46, 255, 0.35)',
              backgroundColor: 'rgba(91, 46, 255, 0.08)',
            }}
          >
            {reasonText && (
              <Typography variant="caption" sx={{ color: '#cdd9ff', display: 'block', lineHeight: 1.4 }}>
                {reasonText}
              </Typography>
            )}
            {showChecklist && (
              <Stack spacing={0.25} sx={{ mt: reasonText ? 0.5 : 0 }}>
                {evidenceChecklistForSentence(activeCard).map((line) => (
                  <Typography key={line} variant="caption" sx={{ color: '#c7d3ff', lineHeight: 1.5, display: 'block' }}>
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
        onStartFromBeginning={onExitToScenarios}
      />
    );
  }

  return (
    <Card sx={panelCardSx}>
      <style>{animationCss}</style>

      <CardHeader
        title={
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.25, color: '#fff' }}>
                  🎴 Flash Card Training Game
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <Chip icon={<TimerIcon />} label={`${timeLeft}s`} sx={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.25)', fontWeight: 900 }} />
                <Chip
                  icon={<CelebrationIcon />}
                  label={showResults ? 'Round complete' : 'In progress'}
                  sx={{
                    color: '#fff',
                    backgroundColor: showResults ? 'rgba(46,204,113,0.28)' : 'rgba(0, 255, 217, 0.22)',
                    fontWeight: 900,
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
                backgroundColor: 'rgba(255,255,255,0.22)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.92)',
                },
              }}
            />
          </Box>
        }
        sx={{ ...panelHeaderSx, background: headerGradient }}
      />

      <Divider />

      <CardContent sx={{ p: 2.5, background: PANEL_BODY_BACKGROUND }}>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12 }}>
            <Card
              sx={{
                boxShadow: 0,
                border: '1px solid #e9e9e9',
                backgroundColor: '#fff',
                animation: shake ? 'shake 280ms ease-out' : 'none',
                ...(flash ? { animation: 'flashRed 520ms ease-out' } : null),
              }}
            >
              <CardHeader
                title={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, fontSize: { xs: '1.2rem', sm: '1.3rem' } }}>
                      🧩 AI Output
                    </Typography>
                  </Box>
                }
              />
              <Divider />

              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {!isRunning && !showResults && (
                  <Box />
                )}

                {isRunning && activeCard && (
                  <Stack spacing={1.25}>
                    <Paper sx={{ p: 1.2, border: `2px solid ${NEON_BLUE}`, borderRadius: 2, backgroundColor: 'rgba(0, 255, 217, 0.08)' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, mb: 1.2 }}>
                        <Chip label={`Card ${currentCardIndex + 1} / ${sentences.length}`} sx={{ fontWeight: 900, backgroundColor: '#eef2ff' }} />
                      </Box>

                      <Typography variant="body1" sx={{ lineHeight: 1.8, fontWeight: 900, color: '#2b314d', mb: 1.5 }}>
                        {activeCard.text}
                      </Typography>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="stretch">
                        <Button
                          size="large"
                          variant="contained"
                          startIcon={<FlagIcon />}
                          onClick={handleFlashFlag}
                          disabled={isCardAnswered}
                          sx={{ fontWeight: 900, background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5253 100%)' }}
                        >
                          Flag
                        </Button>
                        <Button
                          size="large"
                          variant="contained"
                          startIcon={<CheckCircleIcon />}
                          onClick={handleFlashPass}
                          disabled={isCardAnswered}
                          sx={{ fontWeight: 900, background: 'linear-gradient(135deg, #2ecc71 0%, #1abc9c 100%)' }}
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
