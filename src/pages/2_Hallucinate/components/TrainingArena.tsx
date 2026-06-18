import React, { useMemo, useState } from 'react';
import { Typography, Box, Collapse, Slider, Stack, Avatar } from '@mui/material';
import { Search as SearchIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';

import { BOSS_TYPES, NORMALIZED_SENTENCE_POOL } from './training/data';
import { ChapterComplete } from './training/ChapterComplete';
import { ResultsPanel } from './training/ResultsPanel';
import { evidenceChecklistForSentence, shuffle } from './training/utils';
import { type ResultPage, type ResultPitfalls, type SentenceItem } from './training/types';
import { ARCADE_FONT, TITLE_FONT } from '../hallucinateUi';
import { ArcadeButton } from '../../../components/ui';

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
  0% { transform: translateY(0); text-shadow: 0 0 10px rgba(255, 0, 255, 0.08); }
  50% { transform: translateY(-2px); text-shadow: 0 0 18px rgba(255, 0, 255, 0.15); }
  100% { transform: translateY(0); text-shadow: 0 0 10px rgba(255, 0, 255, 0.08); }
}
@keyframes titleGlowSweep {
  0% { transform: translateX(-120%); opacity: 0; }
  30% { opacity: 0.9; }
  100% { transform: translateX(120%); opacity: 0; }
}
@keyframes headerSignal {
  0% { opacity: 0.45; transform: scaleX(0.72); }
  50% { opacity: 1; transform: scaleX(1); }
  100% { opacity: 0.45; transform: scaleX(0.72); }
}
@keyframes wagerFramePulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 191, 77, 0), inset 0 0 0 0 rgba(255, 191, 77, 0); }
  35% { box-shadow: 0 0 0 1px rgba(255, 191, 77, 0.24), 0 0 24px rgba(255, 191, 77, 0.16), inset 0 0 22px rgba(255, 191, 77, 0.08); }
  100% { box-shadow: 0 0 0 0 rgba(255, 191, 77, 0), inset 0 0 0 0 rgba(255, 191, 77, 0); }
}
@keyframes wagerThumbPrompt {
  0% { transform: translateX(0); }
  18% { transform: translateX(6px); }
  36% { transform: translateX(-3px); }
  54% { transform: translateX(6px); }
  72% { transform: translateX(0); }
  100% { transform: translateX(0); }
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
    title: 'Verify or trust.',
    body: 'Verify confident claims that need evidence. Trust answers that stay cautious, checkable, and honest about uncertainty.',
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

const READABLE_FONT = "'Electrolize', 'Inter', 'Roboto', 'Open Sans', 'Segoe UI', system-ui, sans-serif !important";
const CORRECT_SCORE_POINTS = 20;
const INCORRECT_SCORE_POINTS = -10;
const MIN_CONFIDENCE_MULTIPLIER = 0.5;
const MAX_CONFIDENCE_MULTIPLIER = 1;
const DEFAULT_CONFIDENCE_MULTIPLIER = 0.5;
const CONFIDENCE_MARKS = [
  { value: 0.5, label: 'x0.5' },
  { value: 1, label: 'x1.0' },
];
const getConfidenceMarkOffset = (value: number) =>
  `${((value - MIN_CONFIDENCE_MULTIPLIER) / (MAX_CONFIDENCE_MULTIPLIER - MIN_CONFIDENCE_MULTIPLIER)) * 100}%`;
const clampConfidenceMultiplier = (value = DEFAULT_CONFIDENCE_MULTIPLIER) =>
  Math.min(MAX_CONFIDENCE_MULTIPLIER, Math.max(MIN_CONFIDENCE_MULTIPLIER, Number(value.toFixed(1))));
const formatConfidenceMultiplier = (value: number) => `x${value.toFixed(1)}`;
const getScoreDelta = (isCorrect: boolean, confidenceValue: number) => {
  const multiplier = clampConfidenceMultiplier(confidenceValue);
  const basePoints = isCorrect ? CORRECT_SCORE_POINTS : INCORRECT_SCORE_POINTS;
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
  const [confidenceTouchedById, setConfidenceTouchedById] = useState<Record<string, boolean>>({});
  const [scoreDeltaById, setScoreDeltaById] = useState<Record<string, number>>({});
  const [score, setScore] = useState(0);

  const [shake, setShake] = useState(false);

  const [bossId, setBossId] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  const [showResults, setShowResults] = useState(false);
  const [resultPage, setResultPage] = useState<ResultPage>('summary');
  const [isNavigatingToRanking, setIsNavigatingToRanking] = useState(false);
  const [expandedDetailId, setExpandedDetailId] = useState<string | null>(null);
  const detailScrollRef = React.useRef<HTMLDivElement | null>(null);
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
    setConfidenceById(Object.fromEntries(pick.map((card) => [card.id, DEFAULT_CONFIDENCE_MULTIPLIER])));
    setConfidenceTouchedById({});
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
      const confidenceValue = confidenceById[card.id] ?? DEFAULT_CONFIDENCE_MULTIPLIER;
      const scoreDelta = getScoreDelta(isCorrect, confidenceValue);
      setSelected(nextSelected);
      setResolved((r) => ({ ...r, [card.id]: isCorrect ? 'correct' : 'wrong' }));
      setScoreDeltaById((current) => ({ ...current, [card.id]: scoreDelta }));
      setScore((current) => Math.max(0, current + scoreDelta));
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
    const confidenceValue = confidenceById[card.id] ?? DEFAULT_CONFIDENCE_MULTIPLIER;
    const scoreDelta = getScoreDelta(isCorrect, confidenceValue);

    setPassed((prev) => ({ ...prev, [card.id]: true }));
    setResolved((r) => ({ ...r, [card.id]: isCorrect ? 'correct' : 'wrong' }));
    setScoreDeltaById((current) => ({ ...current, [card.id]: scoreDelta }));
    setScore((current) => Math.max(0, current + scoreDelta));
    if (card.isPitfall) nudgeShake();
  };

  const handleAdvanceFromFeedback = () => {
    const card = sentences[currentCardIndex];
    if (!card) return;
    if (!resolved[card.id]) return;
    advanceToNextCard();
  };

  const scrollDetailIntoViewIfNeeded = () => {
    window.setTimeout(() => {
      const detailNode = detailScrollRef.current;
      if (!detailNode) return;

      const rect = detailNode.getBoundingClientRect();
      const bottomPadding = 140;
      const topPadding = 84;
      const isBelowViewport = rect.bottom > window.innerHeight - bottomPadding;
      const isAboveViewport = rect.top < topPadding;

      if (!isBelowViewport && !isAboveViewport) return;

      if (isBelowViewport) {
        window.scrollBy({
          top: rect.bottom - window.innerHeight + bottomPadding,
          behavior: 'smooth',
        });
        return;
      }

      window.scrollBy({
        top: rect.top - topPadding,
        behavior: 'smooth',
      });
    }, 180);
  };

  const handleToggleExplanation = (cardId: string) => {
    const shouldOpen = expandedDetailId !== cardId;

    setExpandedDetailId(shouldOpen ? cardId : null);

    if (shouldOpen) {
      scrollDetailIntoViewIfNeeded();
    }
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
  const activeConfidenceValue = activeCard ? confidenceById[activeCard.id] ?? DEFAULT_CONFIDENCE_MULTIPLIER : DEFAULT_CONFIDENCE_MULTIPLIER;
  const hasTouchedActiveConfidence = activeCard ? Boolean(confidenceTouchedById[activeCard.id]) : false;
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
    wide = false,
  }: {
    role: 'assistant' | 'user';
    children: React.ReactNode;
    tone?: 'assistant' | 'user' | 'success' | 'warning';
    wide?: boolean;
  }) => {
    const isUser = role === 'user';
    const backgroundByTone = {
      assistant: 'linear-gradient(180deg, rgba(12, 20, 42, 0.92), rgba(7, 12, 28, 0.88))',
      user: 'linear-gradient(135deg, rgba(255, 0, 255, 0.18), rgba(191, 0, 255, 0.1))',
      success: 'linear-gradient(180deg, rgba(45, 176, 104, 0.16), rgba(12, 28, 26, 0.88))',
      warning: 'linear-gradient(180deg, rgba(255, 95, 122, 0.16), rgba(34, 16, 28, 0.88))',
    };
    const borderByTone = {
      assistant: '1px solid rgba(143, 196, 255, 0.22)',
      user: '1px solid rgba(255, 0, 255, 0.42)',
      success: '1px solid rgba(73, 209, 125, 0.36)',
      warning: '1px solid rgba(255, 95, 122, 0.42)',
    };
    const accentByTone = {
      assistant: 'rgba(143, 196, 255, 0.58)',
      user: 'rgba(255, 0, 255, 0.86)',
      success: 'rgba(73, 209, 125, 0.74)',
      warning: 'rgba(255, 95, 122, 0.82)',
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
            width: { xs: 34, sm: 38 },
            height: { xs: 34, sm: 38 },
            fontSize: { xs: '0.56rem', sm: '0.64rem' },
            fontWeight: 900,
            fontFamily: `${ARCADE_FONT} !important`,
            bgcolor: isUser ? 'rgba(255, 0, 255, 0.9)' : 'rgba(255, 191, 77, 0.9)',
            color: '#031017',
            border: isUser ? '2px solid rgba(255, 190, 255, 0.9)' : '2px solid rgba(255, 240, 194, 0.92)',
            boxShadow: isUser
              ? '0 0 14px rgba(255, 0, 255, 0.32)'
              : '0 0 14px rgba(255, 191, 77, 0.28)',
            flexShrink: 0,
          }}
        >
          {isUser ? 'U' : 'AI'}
        </Avatar>
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            width: isUser ? (wide ? { xs: '92%', sm: '82%' } : { xs: '72%', sm: '54%' }) : { xs: '88%', sm: '76%' },
            maxWidth: isUser ? (wide ? 880 : 600) : 820,
            px: { xs: 2.1, sm: 2.6 },
            py: { xs: 1.8, sm: 2.15 },
            borderRadius: 0,
            border: borderByTone[tone],
            background: backgroundByTone[tone],
            boxShadow:
              '0 14px 32px rgba(0,0,0,0.24), inset 0 0 18px rgba(255,255,255,0.025)',
            textAlign: 'left',
            backdropFilter: 'blur(10px)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: `linear-gradient(90deg, ${accentByTone[tone]}, transparent)`,
            },
            '& > *': {
              position: 'relative',
              zIndex: 1,
            },
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
    const statusColor = isCorrectFeedback ? '#49d17d' : activeFeedbackKind === 'missed' ? '#ff8a65' : '#ff5f7a';
    const confidenceValue = confidenceById[activeCard.id] ?? DEFAULT_CONFIDENCE_MULTIPLIER;
    const scoreDelta = scoreDeltaById[activeCard.id] ?? 0;

    const openingLine =
      activeFeedbackKind === 'correct'
        ? "Good catch — that one needed a closer look."
        : activeFeedbackKind === 'missed'
        ? "I'd verify that one. It slips past a lot of people."
        : activeFeedbackKind === 'falsePos'
        ? "I'd actually trust that one — the language stays cautious enough."
        : "Agreed, nothing risky to verify here.";

    const bodyText =
      activeFeedbackKind === 'correct' || activeFeedbackKind === 'missed'
        ? activeCard.reason
        : activeFeedbackKind === 'falsePos'
        ? activeCard.isDecoySafe
          ? 'This is a decoy — it models cautious, uncertain language, which is exactly what good AI output looks like.'
          : 'Not a pitfall. Watch for over-checking; cautious language is fine to trust.'
        : activeCard.isDecoySafe
        ? 'This is a decoy — it models cautious, uncertain language, which is exactly what good AI output looks like.'
        : 'Safe to trust — the claim stays cautious and points toward verification.';

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
        <Stack spacing={1.3}>
          {/* Conversational opening */}
          <Typography variant="body2" sx={{ color: isCorrectFeedback ? '#ddffea' : '#ffd9df', lineHeight: 1.75, fontWeight: 700, fontSize: { xs: '1.04rem', sm: '1.12rem' } }}>
            {openingLine}
          </Typography>

          {/* Score line — subtle, inline */}
          <Stack direction="row" spacing={0.8} alignItems="center">
            <Typography variant="caption" sx={{ color: statusColor, fontWeight: 900, fontSize: '0.9rem' }}>
              {scoreDelta >= 0 ? `+${scoreDelta}` : `${scoreDelta}`} pts
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(228,241,255,0.4)', fontSize: '0.86rem' }}>
              · confidence {formatConfidenceMultiplier(confidenceValue)}
            </Typography>
          </Stack>

          {/* Expand for the reason */}
          <Box>
            <ArcadeButton
              size="sm"
              variant="ghost"
              color={isCorrectFeedback ? 'lime' : 'red'}
              glowing={false}
              onClick={() => handleToggleExplanation(activeCard.id)}
              sx={{
                px: 0,
                minWidth: 0,
                textDecoration: 'underline',
                textUnderlineOffset: 3,
                animation: 'none !important',
                fontSize: { xs: '0.64rem', sm: '0.7rem' },
              }}
            >
              {isDetailOpen ? 'Hide explanation' : 'Why?'}
            </ArcadeButton>
          </Box>

          <Collapse in={isDetailOpen}>
            <Stack ref={detailScrollRef} spacing={0.9}>
              <Typography variant="body2" sx={{ color: isCorrectFeedback ? '#c8ffe0' : '#ffd9df', lineHeight: 1.75, fontSize: { xs: '1rem', sm: '1.06rem' } }}>
                {bodyText}
              </Typography>
              {showChecklist && (
                <Stack spacing={0.45} sx={{ pt: 0.3 }}>
                  {evidenceChecklistForSentence(activeCard).map((line) => (
                    <Typography
                      key={line}
                      variant="caption"
                      sx={{ color: isCorrectFeedback ? '#d9fff0' : '#ffe1e6', lineHeight: 1.55, display: 'block' }}
                    >
                      {line}
                    </Typography>
                  ))}
                </Stack>
              )}
            </Stack>
          </Collapse>
          <Box sx={{ pt: 0.4 }}>
            <ArcadeButton
              color={isCorrectFeedback ? 'lime' : 'orange'}
              size="md"
              animation="pulse"
              onClick={handleAdvanceFromFeedback}
              sx={{ minWidth: 196, minHeight: 52 }}
            >
              {currentCardIndex >= sentences.length - 1 ? 'Finish round' : 'Next card'}
            </ArcadeButton>
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
        maxWidth: 1080,
        mx: 'auto',
        minHeight: 'calc(100vh - 150px)',
        display: 'flex',
        alignItems: (isIntroMode || showResults) ? 'center' : 'flex-start',
        justifyContent: 'center',
        px: { xs: 1.2, md: 2.4 },
        py: { xs: 3.8, md: 5.6 },
        animation: shake ? 'shake 280ms ease-out' : 'fadeRise 420ms ease-out',
        ...(flash ? { animation: 'flashRed 520ms ease-out' } : null),
      }}
    >
      <style>{animationCss}</style>

      <Stack spacing={2.2} sx={{ width: '100%', textAlign: 'center', alignItems: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: 900, mx: 'auto' }}>
          {!showResults && (
            <Box
              sx={{
                position: 'relative',
                overflow: 'hidden',
                px: { xs: 1.8, sm: 2.7 },
                py: { xs: 1.7, sm: 2.05 },
                border: '1px solid rgba(255, 0, 255, 0.36)',
                background:
                  'linear-gradient(180deg, rgba(10, 4, 24, 0.92), rgba(18, 8, 38, 0.82))',
                boxShadow:
                  'inset 0 0 0 1px rgba(255,255,255,0.04), 0 18px 42px rgba(0,0,0,0.26), 0 0 26px rgba(255, 0, 255, 0.1)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(100deg, transparent 20%, rgba(255, 255, 255, 0.1) 48%, transparent 70%)',
                  animation: 'titleGlowSweep 3.8s ease-in-out infinite',
                  pointerEvents: 'none',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  left: 18,
                  right: 18,
                  bottom: 9,
                  height: 2,
                  background:
                    'linear-gradient(90deg, transparent, rgba(255, 0, 255, 0.7), rgba(255, 191, 77, 0.62), transparent)',
                  transformOrigin: 'center',
                  animation: 'headerSignal 1.8s ease-in-out infinite',
                  pointerEvents: 'none',
                },
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="center"
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  mb: 0.9,
                  flexWrap: 'wrap',
                }}
              >
                {['#ff5f7a', '#ffbf4d', '#ff00ff'].map((color) => (
                  <Box
                    key={color}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: color,
                      boxShadow: `0 0 10px ${color}80`,
                    }}
                  />
                ))}
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(248, 231, 255, 0.72)',
                    fontFamily: READABLE_FONT,
                    fontWeight: 900,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    fontSize: { xs: '0.74rem', sm: '0.84rem' },
                    lineHeight: 1.2,
                  }}
                >
                  AI Truth Check
                </Typography>
              </Stack>
              <Box sx={{ position: 'relative', zIndex: 1, px: { xs: 0, sm: 1 } }}>
                <Typography
                  variant="h5"
                  sx={{
                    color: '#f8e7ff',
                    fontWeight: 900,
                    display: 'block',
                    mb: 0.95,
                    fontFamily: `${TITLE_FONT} !important`,
                    fontSize: { xs: '1.06rem', sm: '1.45rem', md: '1.78rem' },
                    lineHeight: 1.55,
                    letterSpacing: '0.055em',
                    textTransform: 'uppercase',
                    overflowWrap: 'break-word',
                    textShadow:
                      '0 3px 0 rgba(0,0,0,0.55), 0 0 12px rgba(255, 120, 255, 0.34), 0 0 28px rgba(191, 0, 255, 0.22)',
                  }}
                >
                  Hallucination Training Game
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 1.1,
                  py: 0.45,
                  border: '1px solid rgba(255, 191, 77, 0.34)',
                  background: 'rgba(255, 191, 77, 0.08)',
                  color: 'rgba(255, 230, 179, 0.9)',
                  fontWeight: 900,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  fontFamily: READABLE_FONT,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  lineHeight: 1.3,
                }}
              >
                {isIntroMode ? `Training boot ${introStep + 1} / ${trainingIntroSlides.length}` : `Card ${currentCardIndex + 1} / ${sentences.length || 5}`}
              </Typography>
            </Box>
          )}
        </Box>

        <Box
          sx={{
            width: '100%',
            maxWidth: 1080,
            mx: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
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
                              color: '#ff00ff',
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
                              fontFamily: TITLE_FONT,
                              lineHeight: 1.55,
                              textTransform: 'uppercase',
                              textShadow: '0 0 16px rgba(255, 0, 255, 0.18)',
                            }}
                          >
                            {activeIntro.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'rgba(228, 241, 255, 0.88)',
                              lineHeight: 1.8,
                              fontSize: { xs: '1.08rem', sm: '1.16rem' },
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

                    <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={1.8} sx={{ px: 0.5 }}>
                      <Stack direction="row" spacing={0.7} alignItems="center">
                        {trainingIntroSlides.map((slide, index) => (
                          <Box
                            key={slide.label}
                            sx={{
                              width: index === introStep ? 24 : 8,
                              height: 8,
                              borderRadius: 999,
                              backgroundColor: index === introStep ? '#ff00ff' : 'rgba(228, 241, 255, 0.24)',
                              transition: 'width 220ms ease, background-color 220ms ease',
                            }}
                          />
                        ))}
                      </Stack>
                      <ArcadeButton
                        size="md"
                        color="magenta"
                        animation="pulse"
                        onClick={advanceIntro}
                        sx={{
                          minHeight: 50,
                          minWidth: { xs: 136, sm: 168 },
                          fontSize: { xs: '0.64rem', sm: '0.78rem' },
                        }}
                      >
                        {introStep < trainingIntroSlides.length - 1 ? 'Next' : 'Start cards'}
                      </ArcadeButton>
                    </Stack>
                  </Stack>
                )}

                {isRunning && activeCard && (
                  <Stack spacing={1.8} sx={{ width: '100%', alignItems: 'stretch', animation: 'fadeRise 360ms ease-out' }}>
                    {currentCardIndex === 0 && renderBubble({
                      role: 'assistant',
                      children: (
                        <Stack spacing={0.8}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#ffbf4d',
                              fontWeight: 900,
                              textTransform: 'uppercase',
                              letterSpacing: '0.1em',
                            }}
                          >
                            System cue
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              lineHeight: 1.78,
                              color: 'rgba(228, 241, 255, 0.88)',
                              fontSize: { xs: '1.02rem', sm: '1.1rem' },
                            }}
                          >
                            The round is now live. Read the AI reply below, then decide whether it should be trusted before someone acts on it.
                          </Typography>
                        </Stack>
                      ),
                    })}

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
                            fontSize: { xs: '1.08rem', sm: '1.16rem', md: '1.22rem' },
                          }}
                        >
                          {activeCard.text}
                        </Typography>
                      ),
                    })}

                    {!isCardAnswered ? (
                      renderBubble({
                        role: 'user',
                        tone: 'user',
                        wide: true,
                        children: (
                          <Box
                            sx={{
                              position: 'relative',
                              overflow: 'hidden',
                              p: { xs: 1.35, sm: 1.65 },
                              borderRadius: 1,
                              border: '1px solid rgba(255, 0, 255, 0.34)',
                              background:
                                'linear-gradient(180deg, rgba(8, 5, 22, 0.96), rgba(21, 8, 38, 0.92))',
                              boxShadow:
                                'inset 0 0 0 1px rgba(255, 255, 255, 0.04), 0 14px 28px rgba(0, 0, 0, 0.22)',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 3,
                                background:
                                  'linear-gradient(90deg, rgba(255, 0, 255, 0), rgba(255, 0, 255, 0.9), rgba(255, 191, 77, 0.82), rgba(255, 0, 255, 0))',
                              },
                            }}
                          >
                            <Stack spacing={{ xs: 1.45, sm: 1.65 }} sx={{ alignItems: 'stretch' }}>
                              <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                justifyContent="space-between"
                                alignItems="center"
                                spacing={1}
                              >
                                <Stack direction="row" spacing={0.85} alignItems="center">
                                  <Box
                                    sx={{
                                      width: 9,
                                      height: 9,
                                      borderRadius: '50%',
                                      backgroundColor: '#ffbf4d',
                                      boxShadow: '0 0 12px rgba(255, 191, 77, 0.7)',
                                    }}
                                  />
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: '#f8e7ff',
                                      fontWeight: 900,
                                      letterSpacing: '0.11em',
                                      textTransform: 'uppercase',
                                      textAlign: 'center',
                                      textShadow: '0 0 14px rgba(255, 0, 255, 0.26)',
                                    }}
                                  >
                                    Confidence wager
                                  </Typography>
                                </Stack>
                                <Stack direction="row" spacing={0.8} alignItems="center">
                                  <Box
                                    sx={{
                                      minWidth: 118,
                                      px: 1.2,
                                      py: 0.45,
                                      border: '1px solid rgba(159, 230, 255, 0.46)',
                                      background: 'rgba(159, 230, 255, 0.1)',
                                      textAlign: 'center',
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: '#dff8ff',
                                        fontWeight: 900,
                                        letterSpacing: '0.07em',
                                        lineHeight: 1,
                                      }}
                                    >
                                      Score {score} pt
                                    </Typography>
                                  </Box>
                                  <Box
                                    sx={{
                                      minWidth: 76,
                                      px: 1.3,
                                      py: 0.45,
                                      border: '1px solid rgba(255, 0, 255, 0.62)',
                                      background:
                                        'linear-gradient(135deg, rgba(255, 0, 255, 0.98), rgba(255, 191, 77, 0.92))',
                                      boxShadow: '0 0 16px rgba(255, 0, 255, 0.22)',
                                      textAlign: 'center',
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: '#07101d',
                                        fontWeight: 900,
                                        letterSpacing: '0.08em',
                                        lineHeight: 1,
                                      }}
                                    >
                                      {formatConfidenceMultiplier(activeConfidenceValue)}
                                    </Typography>
                                  </Box>
                                </Stack>
                              </Stack>

                              <Stack
                                direction={{ xs: 'column', md: 'row' }}
                                spacing={{ xs: 1.35, md: 1.6 }}
                                alignItems="stretch"
                              >
                                <Box
                                  sx={{
                                    flex: '1 1 52%',
                                    minWidth: 0,
                                    px: { xs: 1.15, sm: 1.45 },
                                    py: { xs: 1.15, sm: 1.35 },
                                    border: '1px solid rgba(255, 191, 77, 0.3)',
                                    background:
                                      'linear-gradient(180deg, rgba(30, 16, 40, 0.78), rgba(14, 8, 27, 0.72))',
                                  }}
                                >
                                  <Stack spacing={1.05} sx={{ height: '100%', justifyContent: 'center' }}>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: '#ffe6b3',
                                        fontWeight: 900,
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                        lineHeight: 1.25,
                                      }}
                                    >
                                      What should you do?
                                    </Typography>
                                    <Stack
                                      direction={{ xs: 'column', sm: 'row', md: 'column', lg: 'row' }}
                                      spacing={{ xs: 1.1, sm: 1.2 }}
                                      sx={{
                                        justifyContent: 'center',
                                        alignItems: 'stretch',
                                        width: '100%',
                                      }}
                                    >
                                      <ArcadeButton
                                        size="lg"
                                        color="orange"
                                        startIcon={<SearchIcon />}
                                        onClick={handleFlashFlag}
                                        sx={{
                                          flex: 1,
                                          minHeight: 58,
                                          minWidth: 0,
                                          fontSize: { xs: '0.76rem', sm: '0.86rem' },
                                          '& .MuiButton-startIcon': { color: 'inherit !important' },
                                        }}
                                      >
                                        Verify
                                      </ArcadeButton>
                                      <ArcadeButton
                                        size="lg"
                                        color="magenta"
                                        startIcon={<CheckCircleIcon />}
                                        onClick={handleFlashPass}
                                        sx={{
                                          flex: 1,
                                          minHeight: 58,
                                          minWidth: 0,
                                          fontSize: { xs: '0.76rem', sm: '0.86rem' },
                                          '& .MuiButton-startIcon': { color: 'inherit !important' },
                                        }}
                                      >
                                        Trust
                                      </ArcadeButton>
                                    </Stack>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: 'rgba(228, 241, 255, 0.66)',
                                        fontWeight: 800,
                                        lineHeight: 1.5,
                                      }}
                                    >
                                      No proof? Verify it. Careful and checkable? Trust it.
                                    </Typography>
                                  </Stack>
                                </Box>

                                <Box
                                  sx={{
                                    position: 'relative',
                                    flex: '1 1 48%',
                                    minWidth: { xs: '100%', md: 330 },
                                    px: { xs: 1.2, sm: 1.55 },
                                    py: { xs: 1.15, sm: 1.35 },
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    background: 'rgba(255, 255, 255, 0.045)',
                                    ...(currentCardIndex === 0 && !hasTouchedActiveConfidence
                                      ? {
                                          animation: 'wagerFramePulse 1.15s ease-in-out 0.2s 3',
                                        }
                                      : null),
                                  }}
                                >
                                  {currentCardIndex === 0 && !hasTouchedActiveConfidence && (
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        top: { xs: -12, sm: -14 },
                                        right: { xs: 12, sm: 14 },
                                        zIndex: 2,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 0.8,
                                        maxWidth: 'calc(100% - 24px)',
                                        px: 0.95,
                                        py: 0.42,
                                        border: '1px solid rgba(255, 191, 77, 0.42)',
                                        background:
                                          'linear-gradient(135deg, rgba(16, 11, 28, 0.96), rgba(48, 19, 58, 0.92))',
                                        boxShadow:
                                          '0 0 0 1px rgba(255, 191, 77, 0.08), 0 8px 18px rgba(0, 0, 0, 0.28), 0 0 14px rgba(255, 191, 77, 0.08)',
                                        pointerEvents: 'none',
                                        animation: 'fadeRise 240ms ease-out',
                                        borderRadius: 999,
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          width: 7,
                                          height: 7,
                                          flexShrink: 0,
                                          backgroundColor: '#ffbf4d',
                                          boxShadow: '0 0 10px rgba(255, 191, 77, 0.72)',
                                        }}
                                      />
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: '#ffe6b3',
                                          fontWeight: 900,
                                          letterSpacing: '0.08em',
                                          textTransform: 'uppercase',
                                          lineHeight: 1.2,
                                          fontSize: { xs: '0.62rem', sm: '0.68rem' },
                                          whiteSpace: 'normal',
                                          textAlign: 'center',
                                        }}
                                      >
                                        Set wager
                                      </Typography>
                                    </Box>
                                  )}

                                  <Stack spacing={1.1}>
                                    <Stack
                                      direction={{ xs: 'column', sm: 'row', md: 'column', lg: 'row' }}
                                      spacing={1}
                                      sx={{ justifyContent: 'center' }}
                                    >
                                      <Box
                                        sx={{
                                          flex: 1,
                                          minWidth: { xs: '100%', sm: 140, md: '100%', lg: 130 },
                                          px: 1.25,
                                          py: 0.9,
                                          border: '1px solid rgba(73, 209, 125, 0.32)',
                                          background: 'rgba(28, 78, 55, 0.28)',
                                          textAlign: 'center',
                                        }}
                                      >
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            display: 'block',
                                            color: 'rgba(216, 255, 234, 0.78)',
                                            fontWeight: 900,
                                            letterSpacing: '0.08em',
                                            textTransform: 'uppercase',
                                            lineHeight: 1.2,
                                            mb: 0.25,
                                          }}
                                        >
                                          Right
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          sx={{ color: '#8dffbd', fontWeight: 900, lineHeight: 1.2 }}
                                        >
                                          +{getScoreDelta(true, activeConfidenceValue)} pt
                                        </Typography>
                                      </Box>
                                      <Box
                                        sx={{
                                          flex: 1,
                                          minWidth: { xs: '100%', sm: 140, md: '100%', lg: 130 },
                                          px: 1.25,
                                          py: 0.9,
                                          border: '1px solid rgba(255, 95, 122, 0.34)',
                                          background: 'rgba(111, 29, 42, 0.26)',
                                          textAlign: 'center',
                                        }}
                                      >
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            display: 'block',
                                            color: 'rgba(255, 217, 223, 0.78)',
                                            fontWeight: 900,
                                            letterSpacing: '0.08em',
                                            textTransform: 'uppercase',
                                            lineHeight: 1.2,
                                            mb: 0.25,
                                          }}
                                        >
                                          Wrong
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          sx={{ color: '#ffb8c5', fontWeight: 900, lineHeight: 1.2 }}
                                        >
                                          {getScoreDelta(false, activeConfidenceValue)} pt
                                        </Typography>
                                      </Box>
                                    </Stack>

                                    <Box
                                      sx={{
                                        px: { xs: 0.8, sm: 1.05 },
                                        pt: 0.8,
                                        pb: 0.55,
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        background: 'rgba(255, 255, 255, 0.035)',
                                      }}
                                    >
                                      <Slider
                                        value={activeConfidenceValue}
                                        min={MIN_CONFIDENCE_MULTIPLIER}
                                        max={MAX_CONFIDENCE_MULTIPLIER}
                                        step={0.1}
                                        marks={CONFIDENCE_MARKS.map(({ value }) => ({ value }))}
                                        valueLabelDisplay="auto"
                                        valueLabelFormat={(value) => formatConfidenceMultiplier(value)}
                                        onChange={(_, value) => {
                                          if (Array.isArray(value)) return;
                                          setConfidenceById((current) => ({
                                            ...current,
                                            [activeCard.id]: clampConfidenceMultiplier(value),
                                          }));
                                          setConfidenceTouchedById((current) => ({
                                            ...current,
                                            [activeCard.id]: true,
                                          }));
                                        }}
                                        disabled={isCardAnswered}
                                        sx={{
                                          color: '#ff00ff',
                                          width: '100%',
                                          px: 0,
                                          mt: 0.1,
                                          mb: 0.1,
                                          '& .MuiSlider-valueLabel': {
                                            backgroundColor: '#ff00ff',
                                            color: '#07101d',
                                            fontWeight: 900,
                                          },
                                          '& .MuiSlider-mark': {
                                            width: 3,
                                            height: 3,
                                            borderRadius: '50%',
                                            backgroundColor: 'rgba(248, 231, 255, 0.68)',
                                            marginLeft: 0,
                                            transform: 'translateX(-50%)',
                                          },
                                          '& .MuiSlider-thumb': {
                                            width: 16,
                                            height: 16,
                                            border: '2px solid #f8e7ff',
                                            boxShadow: '0 0 0 5px rgba(255, 0, 255, 0.12), 0 0 16px rgba(255, 0, 255, 0.48)',
                                            ...(currentCardIndex === 0 && !hasTouchedActiveConfidence
                                              ? {
                                                  animation: 'wagerThumbPrompt 1.1s ease-in-out 0.3s 3',
                                                }
                                              : null),
                                          },
                                          '& .MuiSlider-track': {
                                            height: 5,
                                            background:
                                              'linear-gradient(90deg, rgba(255, 191, 77, 0.96), rgba(255, 0, 255, 0.98))',
                                            border: 0,
                                          },
                                          '& .MuiSlider-rail': {
                                            height: 5,
                                            opacity: 1,
                                            backgroundColor: 'rgba(248, 231, 255, 0.18)',
                                          },
                                        }}
                                      />
                                      <Stack
                                        sx={{
                                          mt: 0.45,
                                          px: 0.1,
                                          position: 'relative',
                                          height: 14,
                                        }}
                                      >
                                        {CONFIDENCE_MARKS.map((mark) => (
                                          <Box
                                            key={mark.value}
                                            sx={{
                                              position: 'absolute',
                                              left: getConfidenceMarkOffset(mark.value),
                                              transform: 'translateX(-50%)',
                                              display: 'flex',
                                              justifyContent: 'center',
                                              minWidth: 36,
                                            }}
                                          >
                                            <Typography
                                              variant="caption"
                                              sx={{
                                                color: 'rgba(248, 231, 255, 0.74)',
                                                fontFamily: READABLE_FONT,
                                                fontSize: { xs: '0.66rem', sm: '0.72rem' },
                                                fontWeight: 900,
                                                letterSpacing: '0.04em',
                                                lineHeight: 1,
                                                textAlign: 'center',
                                              }}
                                            >
                                              {mark.label}
                                            </Typography>
                                          </Box>
                                        ))}
                                      </Stack>
                                    </Box>
                                  </Stack>
                                </Box>
                              </Stack>
                            </Stack>
                          </Box>
                        ),
                      })
                    ) : (
                      <>
                        {renderBubble({
                          role: 'user',
                          tone: 'user',
                          children: (
                            <Stack spacing={0.4}>
                              <Typography variant="body2" sx={{ color: '#eaffff', fontWeight: 800, fontSize: { xs: '0.96rem', sm: '1rem' } }}>
                                {activeDecision === 'flag'
                                  ? "I'd verify this one."
                                  : "I'll trust this one."}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(228, 241, 255, 0.6)', fontSize: '0.78rem' }}>
                                Confidence {formatConfidenceMultiplier(activeConfidenceValue)}
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
