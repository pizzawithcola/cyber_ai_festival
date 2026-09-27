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
      <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.705rem', color }} title={style.text}>
        {style.token}
      </Typography>
      <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.605rem', color: `${ARCADE_COLORS.white}50` }}>
        {item.id}
      </Typography>
      <Typography
        sx={{
          fontFamily: '"Electrolize", sans-serif',
          fontSize: '0.905rem',
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
      <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.625rem', color, whiteSpace: 'nowrap' }}>
        {points}/{item.max}
        {range && (
          <Box component="span" sx={{ ml: 0.4, color: `${ARCADE_COLORS.white}45`, fontSize: '0.545rem' }}>
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%', height: '100%' }}>
      {/* ── 卡片 1：左=总分与评价 ｜ 右=三条最该改进的点（跨两列，一行一张） ── */}
      <Panel sx={{ flexShrink: 0, px: 3, pt: 0.5, pb: 3, borderColor: scoreGreen(ratio, 0.45), boxShadow: `0 0 24px ${scoreGreen(ratio, 0.14)}` }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' },
            gap: { xs: 2.5, md: 3 },
          }}
        >
          {/* 左：总分 + 评价 + 进度条 */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <ArcadeTypography font="electrolize" arcadeSize="xl" sx={{ color: accent }}>
                {total}
              </ArcadeTypography>
              <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '1.125rem', color: `${ARCADE_COLORS.white}60` }}>
                / {TOTAL_MAX}
              </Typography>
            </Box>
            <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.885rem', color: accent, mt: 0.5 }}>
              {band.label}
            </Typography>

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
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              borderTop: { xs: `1px solid ${GRID_COLOR}`, md: 'none' },
              borderLeft: { md: `1px solid ${GRID_COLOR}` },
              pt: { xs: 2, md: 0 },
              pl: { md: 3 },
            }}
          >
            <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.745rem', color: scoreGreen(1), mb: 0.75 }}>
              ▶ FOCUS NEXT
            </Typography>

            {focus.length === 0 ? (
              <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.945rem', color: `${ARCADE_COLORS.white}80` }}>
                Nothing major left to fix — clean run.
              </Typography>
            ) : (
              focus.map((v) => {
                const style = STATUS_STYLE[statusOf(v.score, v.item.max)];
                return (
                  <Box key={v.item.id} sx={{ display: 'grid', gridTemplateColumns: '16px 1fr', columnGap: 0.75, py: 0.5 }}>
                    <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.705rem', color: verdictColor(v.score, v.item.max) }}>{style.token}</Typography>
                    <Typography
                      sx={{
                        fontFamily: '"Electrolize", sans-serif',
                        fontSize: '0.945rem',
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

      {itemDataMissing && (
        <Typography sx={{ flexShrink: 0, fontFamily: '"Electrolize", sans-serif', fontSize: '0.905rem', color: `${ARCADE_COLORS.white}60`, textAlign: 'center' }}>
          Per-item verdicts weren’t included this round — showing dimension scores only.
        </Typography>
      )}

      {/* ── 卡片 2–5：四个维度（每个维度自带 3 条细则，一行一条） ─────────── */}
      {/* 填满剩余高度，保持 2×2 */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' }, gridAutoRows: '1fr', gap: 2.5 }}>
        {dimensions.map((dim) => {
          const dimRatio = dim.score / DIMENSION_MAX;
          const color = scoreGreen(dimRatio);

          return (
            <Panel key={dim.key} sx={{ p: 3, borderColor: scoreGreen(dimRatio, 0.3), display: 'flex', flexDirection: 'column' }}>
              {/* 维度头：名称 / 定位 / 分数 */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.725rem', color: ARCADE_COLORS.white }}>
                    {dim.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: '"Electrolize", sans-serif',
                      fontSize: '0.845rem',
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
                <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontWeight: 700, fontSize: '1.325rem', color, whiteSpace: 'nowrap' }}>
                  {dim.score}
                  <Box component="span" sx={{ fontSize: '0.875rem', color: `${ARCADE_COLORS.white}50` }}> / {DIMENSION_MAX}</Box>
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
