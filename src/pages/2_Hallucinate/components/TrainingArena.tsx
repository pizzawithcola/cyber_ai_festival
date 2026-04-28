import React, { useEffect, useMemo, useState } from 'react';
import { Typography, Box, Button, Chip, Collapse, LinearProgress, Slider, Stack, Avatar } from '@mui/material';
import { Flag as FlagIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon } from '@mui/icons-material';

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
@keyframes cardBreath {
  0% { transform: translateY(0); text-shadow: 0 0 10px rgba(0,255,217,0.08); }
  50% { transform: translateY(-2px); text-shadow: 0 0 18px rgba(0,255,217,0.15); }
  100% { transform: translateY(0); text-shadow: 0 0 10px rgba(0,255,217,0.08); }
}
`;

const trainingIntroSlides = [
  {
    label: 'Training boot',
    title: 'Keep the chat open.',
    body: 'The next part works like the scenario you just finished: one AI message at a time, one decision at a time.',
    prompt: 'Your job is to decide whether the output should be trusted as-is.',
  },
  {
    label: 'Decision mode',
    title: 'Flag or pass.',
    body: 'Flag confident claims that need verification. Pass answers that stay cautious, checkable, and honest about uncertainty.',
    prompt: 'Do not reward a sentence just because it sounds polished.',
  },
  {
    label: 'Confidence wager',
    title: 'Set your confidence.',
    body: 'Before each call, choose how strongly you trust your judgment. Higher confidence multiplies your reward when you are right and your penalty when you are wrong.',
    prompt: 'If you are not sure, keep the slider low.',
  },
  {
    label: 'Final cue',
    title: 'Watch for the trap.',
    body: 'Risky answers often invent sources, overstate facts, ignore missing context, or follow a misleading prompt too eagerly.',
    prompt: 'Start when you are ready.',
  },
];

const READABLE_FONT = "'Space Grotesk', 'Helvetica Neue', Arial, sans-serif !important";
const BASE_CORRECT_POINTS = 20;
const BASE_WRONG_PENALTY = 12;
const CONFIDENCE_LEVELS = [
  { value: 1, label: 'Low', multiplier: 1 },
  { value: 2, label: 'Med', multiplier: 1.5 },
  { value: 3, label: 'High', multiplier: 2 },
];
const getConfidenceMeta = (value = 2) =>
  CONFIDENCE_LEVELS.find((level) => level.value === value) ?? CONFIDENCE_LEVELS[1];
const getScoreDelta = (isCorrect: boolean, confidenceValue: number) => {
  const multiplier = getConfidenceMeta(confidenceValue).multiplier;
  const basePoints = isCorrect ? BASE_CORRECT_POINTS : -BASE_WRONG_PENALTY;
  return Math.round(basePoints * multiplier);
};

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
  const [introStep, setIntroStep] = useState(autoStart ? trainingIntroSlides.length : 0);

  const [sentences, setSentences] = useState<SentenceItem[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [passed, setPassed] = useState<Record<string, boolean>>({});
  const [resolved, setResolved] = useState<Record<string, 'correct' | 'wrong' | undefined>>({});
  const [confidenceById, setConfidenceById] = useState<Record<string, number>>({});
  const [scoreDeltaById, setScoreDeltaById] = useState<Record<string, number>>({});
  const [score, setScore] = useState(0);

  const [shake, setShake] = useState(false);

  const [bossId, setBossId] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  const [showResults, setShowResults] = useState(false);
  const [resultPage, setResultPage] = useState<ResultPage>('summary');
  const [isNavigatingToRanking, setIsNavigatingToRanking] = useState(false);
  const [expandedDetailId, setExpandedDetailId] = useState<string | null>(null);
  const isIntroMode = !autoStart && !isRunning && !showResults && introStep < trainingIntroSlides.length;
  const activeIntro = trainingIntroSlides[introStep] ?? trainingIntroSlides[0];

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
    setConfidenceById(Object.fromEntries(pick.map((card) => [card.id, 2])));
    setScoreDeltaById({});
    setScore(0);
    setResultPage('summary');
    setExpandedDetailId(null);

    const bossCandidates = pick.filter((s) => s.isPitfall && !!s.type && BOSS_TYPES.has(s.type));
    const crit = pick.filter((s) => s.isPitfall && s.severity === 'critical');
    const anyPit = pick.filter((s) => s.isPitfall);

    // Boss is a hidden "most dangerous" pitfall: prefer curated boss candidates, then critical pitfalls, then any pitfall.
    const pool = bossCandidates.length ? bossCandidates : crit.length ? crit : anyPit;
    const bossPick = pool[Math.floor(Math.random() * Math.max(1, pool.length))];
    setBossId(bossPick?.id ?? null);

    setFlash(false);
  };

  const advanceIntro = () => {
    if (introStep < trainingIntroSlides.length - 1) {
      setIntroStep((step) => step + 1);
      return;
    }

    setIntroStep(trainingIntroSlides.length);
    initRound();
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
    setExpandedDetailId(null);
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
      const isCorrect = card.isPitfall;
      const confidenceValue = confidenceById[card.id] ?? 2;
      const scoreDelta = getScoreDelta(isCorrect, confidenceValue);
      setSelected(nextSelected);
      setResolved((r) => ({ ...r, [card.id]: isCorrect ? 'correct' : 'wrong' }));
      setScoreDeltaById((current) => ({ ...current, [card.id]: scoreDelta }));
      setScore((current) => current + scoreDelta);
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

    const isCorrect = !card.isPitfall;
    const confidenceValue = confidenceById[card.id] ?? 2;
    const scoreDelta = getScoreDelta(isCorrect, confidenceValue);

    setPassed((prev) => ({ ...prev, [card.id]: true }));
    setResolved((r) => ({ ...r, [card.id]: isCorrect ? 'correct' : 'wrong' }));
    setScoreDeltaById((current) => ({ ...current, [card.id]: scoreDelta }));
    setScore((current) => current + scoreDelta);
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
  const accuracy = sentences.length === 0 ? 0 : Math.round(((resultPitfalls.correct.length + resultPitfalls.correctPass.length) / sentences.length) * 100);
  const activeCard = sentences[currentCardIndex];
  const activeConfidenceValue = activeCard ? confidenceById[activeCard.id] ?? 2 : 2;
  const activeConfidenceMeta = getConfidenceMeta(activeConfidenceValue);
  const activeScoreDelta = activeCard ? scoreDeltaById[activeCard.id] : undefined;
  const activeDecision = activeCard
    ? selected[activeCard.id]
      ? 'flag'
      : passed[activeCard.id]
      ? 'pass'
      : undefined
    : undefined;
  const activeDecisionLabel = activeDecision === 'flag' ? 'Flag this output' : activeDecision === 'pass' ? 'Pass this output' : '';
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
  const totalJourneySteps = trainingIntroSlides.length + Math.max(sentences.length, 5);
  const completedJourneySteps = isIntroMode
    ? introStep + 1
    : trainingIntroSlides.length + answeredCount;
  const progressPct = Math.min(100, (completedJourneySteps / totalJourneySteps) * 100);
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

  const renderBubble = ({
    role,
    children,
    tone = 'assistant',
  }: {
    role: 'assistant' | 'user';
    children: React.ReactNode;
    tone?: 'assistant' | 'user' | 'success' | 'warning';
  }) => {
    const isUser = role === 'user';
    const backgroundByTone = {
      assistant: 'linear-gradient(180deg, rgba(12, 20, 42, 0.92), rgba(7, 12, 28, 0.88))',
      user: 'linear-gradient(135deg, rgba(0, 255, 217, 0.18), rgba(46, 227, 255, 0.1))',
      success: 'linear-gradient(180deg, rgba(45, 176, 104, 0.16), rgba(12, 28, 26, 0.88))',
      warning: 'linear-gradient(180deg, rgba(255, 95, 122, 0.16), rgba(34, 16, 28, 0.88))',
    };

    return (
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: isUser ? 'row-reverse' : 'row',
          alignItems: 'flex-end',
          gap: { xs: 0.8, sm: 1.1 },
        }}
      >
        <Avatar
          sx={{
            width: { xs: 30, sm: 34 },
            height: { xs: 30, sm: 34 },
            fontSize: { xs: '0.72rem', sm: '0.78rem' },
            fontWeight: 900,
            bgcolor: isUser ? 'rgba(0, 255, 217, 0.9)' : 'rgba(255, 46, 147, 0.9)',
            color: '#031017',
            flexShrink: 0,
          }}
        >
          {isUser ? 'U' : 'AI'}
        </Avatar>
        <Box
          sx={{
            width: isUser ? { xs: '72%', sm: '54%' } : { xs: '88%', sm: '76%' },
            maxWidth: isUser ? 520 : 700,
            px: { xs: 1.8, sm: 2.2 },
            py: { xs: 1.55, sm: 1.85 },
            borderRadius: isUser ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
            background: backgroundByTone[tone],
            boxShadow: '0 16px 34px rgba(0,0,0,0.2)',
            textAlign: 'left',
            backdropFilter: 'blur(10px)',
          }}
        >
          {children}
        </Box>
      </Box>
    );
  };

  const renderImmediateFeedback = () => {
    if (!activeCard || !activeFeedbackKind) return null;

    const isCorrectFeedback = activeFeedbackKind === 'correct' || activeFeedbackKind === 'correctPass';
    const statusLabel = isCorrectFeedback ? 'Correct' : 'Incorrect';
    const statusIcon = isCorrectFeedback ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : <CancelIcon sx={{ fontSize: 16 }} />;
    const statusColor = isCorrectFeedback ? '#49d17d' : activeFeedbackKind === 'missed' ? '#ff8a65' : '#ff5f7a';
    const statusBackground = isCorrectFeedback ? 'rgba(73, 209, 125, 0.14)' : activeFeedbackKind === 'missed' ? 'rgba(255, 138, 101, 0.16)' : 'rgba(255, 95, 122, 0.14)';
    const confidenceValue = confidenceById[activeCard.id] ?? 2;
    const confidenceMeta = getConfidenceMeta(confidenceValue);
    const scoreDelta = scoreDeltaById[activeCard.id] ?? 0;

    const shortReason =
      activeFeedbackKind === 'correct'
        ? 'Good catch: this answer needs verification before it can be trusted.'
        : activeFeedbackKind === 'missed'
        ? 'This should be flagged: it makes a claim that needs checking.'
        : activeFeedbackKind === 'falsePos'
        ? 'This one is cautious enough to pass.'
        : 'Good pass: it points toward checking sources instead of inventing details.';

    const detailReason =
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
    const isDetailOpen = expandedDetailId === activeCard.id;

    return renderBubble({
      role: 'assistant',
      tone: isCorrectFeedback ? 'success' : 'warning',
      children: (
        <Stack spacing={1.2}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Chip
              icon={statusIcon}
              label={statusLabel}
              size="small"
              sx={{
                alignSelf: 'flex-start',
                fontWeight: 900,
                color: statusColor,
                backgroundColor: statusBackground,
                '& .MuiChip-label': {
                  px: 0.8,
                },
              }}
            />
            <Chip
              label={`${scoreDelta >= 0 ? '+' : ''}${scoreDelta} pts`}
              size="small"
              sx={{
                alignSelf: 'flex-start',
                fontWeight: 900,
                color: statusColor,
                backgroundColor: statusBackground,
              }}
            />
            <Chip
              label={`${confidenceMeta.label} x${confidenceMeta.multiplier}`}
              size="small"
              sx={{
                alignSelf: 'flex-start',
                fontWeight: 900,
                color: '#d6ecff',
                backgroundColor: 'rgba(214, 236, 255, 0.12)',
              }}
            />
          </Stack>
          <Typography variant="body2" sx={{ color: isCorrectFeedback ? '#ddffea' : '#ffd9df', lineHeight: 1.7, fontSize: { xs: '0.96rem', sm: '1rem' } }}>
            {shortReason}
          </Typography>
          <Box>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setExpandedDetailId((current) => (current === activeCard.id ? null : activeCard.id))}
              sx={{
                color: `${statusColor} !important`,
                borderColor: `${statusColor} !important`,
                fontWeight: 900,
                fontSize: '0.75rem',
                px: 1.2,
                animation: 'none !important',
              }}
            >
              {isDetailOpen ? 'Hide details' : 'Reveal details'}
            </Button>
          </Box>
          <Collapse in={isDetailOpen}>
            <Stack spacing={0.8}>
              {detailReason && (
                <Typography variant="body2" sx={{ color: isCorrectFeedback ? '#ddffea' : '#ffd9df', lineHeight: 1.7, fontSize: { xs: '0.92rem', sm: '0.96rem' } }}>
                  {detailReason}
                </Typography>
              )}
              {showChecklist && (
                <Stack spacing={0.45}>
                  {evidenceChecklistForSentence(activeCard).map((line) => (
                    <Typography
                      key={line}
                      variant="caption"
                      sx={{ color: isCorrectFeedback ? '#d9fff0' : '#ffe1e6', lineHeight: 1.5, display: 'block' }}
                    >
                      {line}
                    </Typography>
                  ))}
                </Stack>
              )}
            </Stack>
          </Collapse>
          <Box sx={{ pt: 0.4 }}>
            <Button variant="contained" onClick={handleAdvanceFromFeedback} sx={{ fontWeight: 900 }}>
              {currentCardIndex >= sentences.length - 1 ? 'Finish round' : 'Next card'}
            </Button>
          </Box>
        </Stack>
      ),
    });
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
    <Box
      sx={{
        width: '100%',
        maxWidth: 920,
        mx: 'auto',
        minHeight: 'calc(100vh - 150px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 1.2, md: 2 },
        py: { xs: 3.5, md: 5 },
        animation: shake ? 'shake 280ms ease-out' : 'fadeRise 420ms ease-out',
        ...(flash ? { animation: 'flashRed 520ms ease-out' } : null),
      }}
    >
      <style>{animationCss}</style>

      <Stack spacing={2.2} sx={{ width: '100%', textAlign: 'center', alignItems: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: 520, mx: 'auto' }}>
          {!showResults && (
            <>
              <Typography
                variant="h5"
                sx={{
                  color: '#ffffff',
                  fontWeight: 900,
                  display: 'block',
                  mb: 0.75,
                  fontSize: { xs: '0.92rem', sm: '1.1rem', md: '1.28rem' },
                  lineHeight: 1.55,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  textShadow: '0 3px 0 rgba(0,0,0,0.45), 0 0 18px rgba(0,255,217,0.22)',
                }}
              >
                Hallucination Training Game
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(228, 241, 255, 0.78)',
                  fontWeight: 900,
                  display: 'block',
                  mb: 0.9,
                  fontSize: { xs: '0.6rem', sm: '0.68rem' },
                  fontFamily: "'Press Start 2P', 'VT323', monospace",
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {isIntroMode ? `Training boot ${introStep + 1} / ${trainingIntroSlides.length}` : `Card ${currentCardIndex + 1} / ${sentences.length || 5}`}
              </Typography>
            </>
          )}
          <LinearProgress
            variant="determinate"
            value={progressPct}
            sx={{
              height: 5,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 999,
                background: 'linear-gradient(90deg, rgba(0,255,217,0.98), rgba(91,46,255,0.96))',
              },
            }}
          />
        </Box>

        <Box
          sx={{
            width: '100%',
            maxWidth: 920,
            mx: 'auto',
            minHeight: { xs: 430, md: 520 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
                {isIntroMode && (
                  <Stack spacing={1.8} sx={{ width: '100%', alignItems: 'stretch', animation: 'fadeRise 360ms ease-out' }}>
                    {renderBubble({
                      role: 'assistant',
                      children: (
                        <Stack spacing={1.2}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#00ffd9',
                              fontWeight: 900,
                              textTransform: 'uppercase',
                              letterSpacing: '0.1em',
                            }}
                          >
                            {activeIntro.label}
                          </Typography>
                          <Typography
                            variant="h5"
                            sx={{
                              color: '#ffffff',
                              fontWeight: 900,
                              lineHeight: 1.55,
                              textTransform: 'uppercase',
                              textShadow: '0 0 16px rgba(0,255,217,0.18)',
                            }}
                          >
                            {activeIntro.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'rgba(228, 241, 255, 0.88)',
                              lineHeight: 1.8,
                              fontSize: { xs: '0.88rem', sm: '0.96rem' },
                            }}
                          >
                            {activeIntro.body}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'rgba(228, 241, 255, 0.7)',
                              lineHeight: 1.7,
                              display: 'block',
                            }}
                          >
                            {activeIntro.prompt}
                          </Typography>
                        </Stack>
                      ),
                    })}

                    <Box
                      sx={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        pt: 0.35,
                      }}
                    >
                      <Stack spacing={1} alignItems="flex-end" sx={{ width: { xs: '88%', sm: 'auto' } }}>
                        <Stack direction="row" spacing={0.7} sx={{ justifyContent: 'flex-end' }}>
                          {trainingIntroSlides.map((slide, index) => (
                            <Box
                              key={slide.label}
                              sx={{
                                width: index === introStep ? 24 : 8,
                                height: 8,
                                borderRadius: 999,
                                backgroundColor: index === introStep ? '#00ffd9' : 'rgba(228, 241, 255, 0.24)',
                                transition: 'width 220ms ease, background-color 220ms ease',
                              }}
                            />
                          ))}
                        </Stack>
                        <Button
                          size="large"
                          variant="contained"
                          onClick={advanceIntro}
                          sx={{
                            fontWeight: 900,
                            minHeight: 48,
                            minWidth: { xs: '100%', sm: 180 },
                            borderRadius: 2.5,
                            fontSize: '0.78rem',
                          }}
                        >
                          {introStep < trainingIntroSlides.length - 1 ? 'Next cue' : 'Start cards'}
                        </Button>
                      </Stack>
                    </Box>
                  </Stack>
                )}

                {isRunning && activeCard && (
                  <Stack spacing={1.8} sx={{ width: '100%', alignItems: 'stretch', animation: 'fadeRise 360ms ease-out' }}>
                    <Box
                      sx={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                      }}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          maxWidth: 720,
                          px: { xs: 1.4, sm: 2 },
                          py: 1.2,
                          borderRadius: 3,
                          background: 'linear-gradient(180deg, rgba(11, 18, 36, 0.92), rgba(8, 13, 28, 0.88))',
                          border: '1px solid rgba(0, 255, 217, 0.16)',
                          boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
                        }}
                      >
                        <Stack spacing={0.8}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                            <Typography variant="caption" sx={{ color: '#00ffd9', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                              Confidence wager
                            </Typography>
                            <Stack direction="row" spacing={0.8} sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              <Chip label={`${activeConfidenceMeta.label} x${activeConfidenceMeta.multiplier}`} size="small" sx={{ fontWeight: 900, color: '#07101d', backgroundColor: '#00ffd9' }} />
                              <Chip label={`Right +${getScoreDelta(true, activeConfidenceValue)}`} size="small" sx={{ fontWeight: 900, color: '#d8ffea', backgroundColor: 'rgba(73, 209, 125, 0.16)' }} />
                              <Chip label={`Wrong ${getScoreDelta(false, activeConfidenceValue)}`} size="small" sx={{ fontWeight: 900, color: '#ffd9df', backgroundColor: 'rgba(255, 95, 122, 0.14)' }} />
                            </Stack>
                          </Stack>
                          <Slider
                            value={activeConfidenceValue}
                            min={1}
                            max={3}
                            step={1}
                            marks={CONFIDENCE_LEVELS.map((level) => ({ value: level.value, label: level.label }))}
                            onChange={(_, value) => {
                              if (Array.isArray(value)) return;
                              setConfidenceById((current) => ({ ...current, [activeCard.id]: value }));
                            }}
                            disabled={isCardAnswered}
                            sx={{
                              color: '#00ffd9',
                              px: 0.5,
                              '& .MuiSlider-markLabel': {
                                color: 'rgba(228, 241, 255, 0.76)',
                                fontSize: '0.72rem',
                                fontFamily: READABLE_FONT,
                              },
                              '& .MuiSlider-thumb': {
                                width: 18,
                                height: 18,
                                boxShadow: '0 0 0 6px rgba(0, 255, 217, 0.08)',
                              },
                              '& .MuiSlider-rail': {
                                opacity: 0.24,
                              },
                            }}
                          />
                          <Typography variant="caption" sx={{ color: 'rgba(228, 241, 255, 0.72)', lineHeight: 1.65 }}>
                            高 confidence 答对赚更多，答错也会扣更多，先押注再判断。
                          </Typography>
                        </Stack>
                      </Box>
                    </Box>

                    {renderBubble({
                      role: 'assistant',
                      children: (
                        <Typography
                          variant="body2"
                          sx={{
                            lineHeight: 1.72,
                            fontWeight: 800,
                            color: '#f2fbff',
                            textShadow: '0 1px 0 rgba(0,0,0,0.28)',
                            fontSize: { xs: '1rem', sm: '1.06rem', md: '1.1rem' },
                          }}
                        >
                          {activeCard.text}
                        </Typography>
                      ),
                    })}

                    {!isCardAnswered ? (
                      <Box
                        sx={{
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'flex-end',
                          pt: 0.35,
                        }}
                      >
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={1}
                          alignItems="stretch"
                          sx={{ width: { xs: '88%', sm: 'auto' }, maxWidth: { xs: '88%', sm: 'none' } }}
                        >
                          <Button
                            size="large"
                            variant="contained"
                            startIcon={<FlagIcon />}
                            onClick={handleFlashFlag}
                            sx={{
                              fontWeight: 900,
                              minHeight: 48,
                              minWidth: { xs: '100%', sm: 132 },
                              borderRadius: 2.5,
                              fontSize: '0.9rem',
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
                            sx={{
                              fontWeight: 900,
                              minHeight: 48,
                              minWidth: { xs: '100%', sm: 132 },
                              borderRadius: 2.5,
                              fontSize: '0.9rem',
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
                      </Box>
                    ) : (
                      <>
                        {renderBubble({
                          role: 'user',
                          tone: 'user',
                          children: (
                            <Stack spacing={0.5}>
                              <Typography variant="body2" sx={{ color: '#eaffff', fontWeight: 900 }}>
                                {activeDecisionLabel}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(228, 241, 255, 0.76)' }}>
                                Confidence: {activeConfidenceMeta.label} x{activeConfidenceMeta.multiplier}
                              </Typography>
                            </Stack>
                          ),
                        })}

                        {renderImmediateFeedback()}
                      </>
                    )}
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
        </Box>
      </Stack>
    </Box>
  );
}
