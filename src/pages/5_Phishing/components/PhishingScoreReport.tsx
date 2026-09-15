import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { ArcadeTypography } from '../../../components/ui';
import { ARCADE_COLORS, GRID_COLOR } from '../../../theme/theme';
import {
  BASELINE_TOTAL,
  DIMENSION_MAX,
  TOTAL_MAX,
  getGradeBand,
  scoreGreen,
  toneColor,
  verdictTone,
  type DimensionReport,
  type ItemVerdict,
  type RubricTier,
} from '../scoringRubric';

interface PhishingScoreReportProps {
  total: number;
  dimensions: DimensionReport[];
  focus: ItemVerdict[];
  /** 备用评估：后端未返回逐项数据时提示一句 */
  itemDataMissing?: boolean;
}

const statusOf = (score: number | undefined, max: number): 'full' | 'partial' | 'missing' | 'unknown' => {
  if (score === undefined) return 'unknown';
  if (score >= max) return 'full';
  if (score > 0) return 'partial';
  return 'missing';
};

const STATUS_STYLE: Record<string, { token: string; text: string }> = {
  full: { token: '✓', text: 'Got it' },
  partial: { token: '±', text: 'Partial' },
  missing: { token: '✗', text: 'Missed' },
  unknown: { token: '·', text: 'Not rated' },
};

/** 项级别标签（底线必达，加分项自由裁量） */
const TIER_TAG: Record<RubricTier, string> = { core: 'CORE', standard: 'STD', bonus: 'BONUS' };
const TIER_COLOR: Record<RubricTier, string> = {
  core: ARCADE_COLORS.white,
  standard: `${ARCADE_COLORS.white}c0`,
  bonus: `${ARCADE_COLORS.white}78`,
};

/** 单项语义色：✓ 亮绿 · ± 橙 · ✗ 红 · 未评估 灰绿（alpha 用于高亮底色） */
const verdictColor = (score: number | undefined, max: number, alpha = 1) =>
  toneColor(verdictTone(score, max), alpha);

const Panel: React.FC<{ children: React.ReactNode; sx?: object }> = ({ children, sx = {} }) => (
  <Box
    sx={{
      border: `2px solid ${GRID_COLOR}`,
      backgroundColor: 'rgba(10, 10, 26, 0.92)',
      position: 'relative',
      ...sx,
    }}
  >
    {children}
  </Box>
);

/** 单行细则：✓/±/✗ · 编号 · 层级 + 标签 · 得分（加分项带参考区间） */
const Row: React.FC<{ verdict: ItemVerdict; highlight?: boolean }> = ({ verdict, highlight = false }) => {
  const { item, score, range } = verdict;
  const status = statusOf(score, item.max);
  const style = STATUS_STYLE[status];
  const color = verdictColor(score, item.max);
  const points = score === undefined ? '—' : `${score}`;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '16px 26px 1fr auto',
        alignItems: 'baseline',
        columnGap: 0.75,
        py: 0.45,
        borderTop: `1px solid ${GRID_COLOR}`,
        backgroundColor: highlight ? verdictColor(score, item.max, 0.12) : 'transparent',
      }}
    >
      <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.58rem', color }} title={style.text}>
        {style.token}
      </Typography>
      <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.48rem', color: `${ARCADE_COLORS.white}50` }}>
        {item.id}
      </Typography>
      <Typography
        sx={{
          fontFamily: '"Electrolize", sans-serif',
          fontSize: '0.78rem',
          color: ARCADE_COLORS.white,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={`${TIER_TAG[item.tier]} ${item.max} pts — ${item.label}: ${item.hint}`}
      >
        <Box component="span" sx={{ color: TIER_COLOR[item.tier], mr: 0.6 }}>
          {TIER_TAG[item.tier]}
        </Box>
        {item.label}
      </Typography>
      <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.5rem', color, whiteSpace: 'nowrap' }}>
        {points}/{item.max}
        {range && (
          <Box component="span" sx={{ ml: 0.4, color: `${ARCADE_COLORS.white}45`, fontSize: '0.42rem' }}>
            ({range[0]}–{range[1]})
          </Box>
        )}
      </Typography>
    </Box>
  );
};

const PhishingScoreReport: React.FC<PhishingScoreReportProps> = ({ total, dimensions, focus, itemDataMissing }) => {
  const band = getGradeBand(total);
  const ratio = Math.max(0, Math.min(1, total / TOTAL_MAX));
  /** 全页唯一绿色来源：分数越高，绿越亮 */
  const accent = scoreGreen(ratio);

  // 底线（60）与加分（40）分开统计，对应方案里的及格线设计
  const allVerdicts = dimensions.flatMap((d) => d.verdicts);
  const sumOf = (pred: (v: ItemVerdict) => boolean) =>
    Math.round(allVerdicts.filter(pred).reduce((sum, v) => sum + (v.score ?? 0), 0) * 10) / 10;
  const baselineScore = sumOf((v) => v.item.tier !== 'bonus');
  const bonusScore = sumOf((v) => v.item.tier === 'bonus');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* ── 卡片 1：左=总分与评价 ｜ 右=三条最该改进的点 ─────────────────── */}
      <Panel sx={{ p: 3, borderColor: scoreGreen(ratio, 0.45), boxShadow: `0 0 24px ${scoreGreen(ratio, 0.14)}` }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(240px, 1fr) minmax(300px, 1.05fr)' },
            gap: { xs: 2.5, md: 3 },
          }}
        >
          {/* 左：总分 + 评价 + 进度条 */}
          <Box>
            <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.58rem', color: `${ARCADE_COLORS.white}70`, letterSpacing: '2px' }}>
              YOUR SCORE
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.75 }}>
              <ArcadeTypography font="electrolize" arcadeSize="xl" sx={{ color: accent }}>
                {total}
              </ArcadeTypography>
              <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '1rem', color: `${ARCADE_COLORS.white}60` }}>
                / {TOTAL_MAX}
              </Typography>
            </Box>
            <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.76rem', color: accent, mt: 1 }}>
              {band.label}
            </Typography>
            <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.9rem', color: `${ARCADE_COLORS.white}95`, mt: 0.5 }}>
              {band.blurb}
            </Typography>

            {/* 底线 vs 加分：底线 60 全达标即及格 */}
            <Box sx={{ display: 'flex', gap: 2, mt: 1.25, flexWrap: 'wrap' }}>
              <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.5rem', color: `${ARCADE_COLORS.white}70` }}>
                BASELINE {baselineScore}/{BASELINE_TOTAL}
              </Typography>
              <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.5rem', color: `${ARCADE_COLORS.white}50` }}>
                BONUS {bonusScore}/{TOTAL_MAX - BASELINE_TOTAL}
              </Typography>
            </Box>

            <Box sx={{ position: 'relative', mt: 1.25 }}>
              <LinearProgress
                variant="determinate"
                value={ratio * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  '& .MuiLinearProgress-bar': { backgroundColor: accent, borderRadius: 4 },
                }}
              />
              {/* 及格线：60 分刻度 */}
              <Box
                sx={{
                  position: 'absolute',
                  left: `${(BASELINE_TOTAL / TOTAL_MAX) * 100}%`,
                  top: -3,
                  height: 14,
                  width: '2px',
                  backgroundColor: `${ARCADE_COLORS.white}70`,
                }}
              />
            </Box>
          </Box>

          {/* 右：FOCUS NEXT —— 每条一行 */}
          <Box
            sx={{
              borderTop: { xs: `1px solid ${GRID_COLOR}`, md: 'none' },
              borderLeft: { md: `1px solid ${GRID_COLOR}` },
              pt: { xs: 2, md: 0 },
              pl: { md: 3 },
            }}
          >
            <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.62rem', color: scoreGreen(1) }}>
              ▶ FOCUS NEXT
            </Typography>
            <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.78rem', color: `${ARCADE_COLORS.white}65`, mt: 0.5, mb: 0.75 }}>
              Three quickest wins for your next attempt
            </Typography>

            {focus.length === 0 ? (
              <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.82rem', color: `${ARCADE_COLORS.white}80` }}>
                Nothing major left to fix — clean run.
              </Typography>
            ) : (
              focus.map((v) => {
                const style = STATUS_STYLE[statusOf(v.score, v.item.max)];
                return (
                  <Box key={v.item.id} sx={{ display: 'grid', gridTemplateColumns: '16px 1fr', columnGap: 0.75, py: 0.5 }}>
                    <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.58rem', color: verdictColor(v.score, v.item.max) }}>{style.token}</Typography>
                    <Typography
                      sx={{
                        fontFamily: '"Electrolize", sans-serif',
                        fontSize: '0.82rem',
                        color: ARCADE_COLORS.white,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={`${v.item.label} — ${v.item.hint}`}
                    >
                      {v.item.label}
                      <Box component="span" sx={{ color: `${ARCADE_COLORS.white}60` }}> — {v.item.hint}</Box>
                    </Typography>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>
      </Panel>

      {/* 图例：核心底线 / 标准底线 / 加分项 */}
      <Typography
        sx={{
          fontFamily: '"Electrolize", sans-serif',
          fontSize: '0.72rem',
          color: `${ARCADE_COLORS.white}55`,
          textAlign: 'center',
          mt: -0.5,
        }}
      >
        CORE 10 + STANDARD 5 are required (60 = pass) · BONUS 10 each is scored 0–10
      </Typography>

      {itemDataMissing && (
        <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.78rem', color: `${ARCADE_COLORS.white}60`, textAlign: 'center' }}>
          Per-item verdicts weren’t included this round — showing dimension scores only.
        </Typography>
      )}

      {/* ── 卡片 2–5：四个维度（每个维度自带 3 条细则，一行一条） ─────────── */}
      {/* 固定 2×2：避免 auto-fit 在中等宽度塔成 3+1 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        {dimensions.map((dim) => {
          const dimRatio = dim.score / DIMENSION_MAX;
          const color = scoreGreen(dimRatio);
          // 底线达标数（核心 + 标准）+ 加分得分
          const baselines = dim.verdicts.filter((v) => v.item.tier !== 'bonus');
          const met = baselines.filter((v) => (v.score ?? 0) >= v.item.max).length;
          const bonusVerdict = dim.verdicts.find((v) => v.item.tier === 'bonus');
          const bonusPoints = bonusVerdict?.score;

          return (
            <Panel key={dim.key} sx={{ p: 2, borderColor: scoreGreen(dimRatio, 0.3), display: 'flex', flexDirection: 'column' }}>
              {/* 维度头：名称 / 定位 / 分数 */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.6rem', color: ARCADE_COLORS.white }}>
                    {dim.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: '"Electrolize", sans-serif',
                      fontSize: '0.72rem',
                      color: `${ARCADE_COLORS.white}60`,
                      mt: 0.25,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={dim.tagline}
                  >
                    {dim.tagline}
                  </Typography>
                </Box>
                <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontWeight: 700, fontSize: '1.2rem', color, whiteSpace: 'nowrap' }}>
                  {dim.score}
                  <Box component="span" sx={{ fontSize: '0.75rem', color: `${ARCADE_COLORS.white}50` }}> / {DIMENSION_MAX}</Box>
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={Math.max(0, Math.min(1, dimRatio)) * 100}
                sx={{
                  mt: 1,
                  mb: 0.75,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  '& .MuiLinearProgress-bar': { backgroundColor: color, borderRadius: 3 },
                }}
              />

              {/* 一行摘要：命中数 + 模型点评（超长省略，hover 看全文） */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.72rem', color: `${ARCADE_COLORS.white}60`, whiteSpace: 'nowrap' }}>
                  Baseline {met}/{baselines.length} met
                  {bonusVerdict ? ` · Bonus ${bonusPoints ?? '—'}/${bonusVerdict.item.max}` : ''}
                </Typography>
                {dim.reason && (
                  <Typography
                    sx={{
                      fontFamily: '"Electrolize", sans-serif',
                      fontSize: '0.7rem',
                      color: `${ARCADE_COLORS.white}55`,
                      fontStyle: 'italic',
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={dim.reason}
                  >
                    {dim.reason}
                  </Typography>
                )}
              </Box>

              {/* 该维度的 5 条细则 */}
              <Box sx={{ mt: 0.5 }}>
                {dim.verdicts.map((v) => (
                  <Row key={v.item.id} verdict={v} highlight={focus.some((f) => f.item.id === v.item.id)} />
                ))}
              </Box>
            </Panel>
          );
        })}
      </Box>
    </Box>
  );
};

export default PhishingScoreReport;
