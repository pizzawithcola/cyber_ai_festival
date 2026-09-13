import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { ArcadeTypography } from '../../../components/ui';
import { ARCADE_COLORS, GRID_COLOR } from '../../../theme/theme';
import {
  DIMENSION_MAX,
  ITEM_MAX,
  TOTAL_MAX,
  getGradeBand,
  scoreGreen,
  toneColor,
  verdictTone,
  type DimensionReport,
  type ItemVerdict,
} from '../scoringRubric';

interface PhishingScoreReportProps {
  total: number;
  dimensions: DimensionReport[];
  focus: ItemVerdict[];
  /** 备用评估：后端未返回逐项数据时提示一句 */
  itemDataMissing?: boolean;
}

const statusOf = (score: number | undefined): 'full' | 'partial' | 'missing' | 'unknown' => {
  if (score === undefined) return 'unknown';
  if (score >= ITEM_MAX) return 'full';
  if (score > 0) return 'partial';
  return 'missing';
};

const STATUS_STYLE: Record<string, { token: string; text: string }> = {
  full: { token: '✓', text: 'Got it' },
  partial: { token: '±', text: 'Partial' },
  missing: { token: '✗', text: 'Missed' },
  unknown: { token: '·', text: 'Not rated' },
};

/** 单项语义色：✓ 亮绿 · ± 橙 · ✗ 红 · 未评估 灰绿（alpha 用于高亮底色） */
const verdictColor = (score: number | undefined, alpha = 1) => toneColor(verdictTone(score), alpha);

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

/** 单行细则：✓/±/✗ · 编号 · 标签 · 得分 */
const Row: React.FC<{ verdict: ItemVerdict; highlight?: boolean }> = ({ verdict, highlight = false }) => {
  const status = statusOf(verdict.score);
  const style = STATUS_STYLE[status];
  const color = verdictColor(verdict.score);
  const points = verdict.score === undefined ? '—' : `${verdict.score}`;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '16px 26px 1fr auto',
        alignItems: 'baseline',
        columnGap: 0.75,
        py: 0.45,
        borderTop: `1px solid ${GRID_COLOR}`,
        backgroundColor: highlight ? verdictColor(verdict.score, 0.12) : 'transparent',
      }}
    >
      <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.58rem', color }} title={style.text}>
        {style.token}
      </Typography>
      <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.48rem', color: `${ARCADE_COLORS.white}50` }}>
        {verdict.item.id}
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
        title={`${verdict.item.label} — ${verdict.item.hint}`}
      >
        {verdict.item.label}
      </Typography>
      <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.5rem', color, whiteSpace: 'nowrap' }}>
        {points}/{ITEM_MAX}
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
            <LinearProgress
              variant="determinate"
              value={ratio * 100}
              sx={{
                mt: 2,
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.08)',
                '& .MuiLinearProgress-bar': { backgroundColor: accent, borderRadius: 4 },
              }}
            />
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
                const style = STATUS_STYLE[statusOf(v.score)];
                return (
                  <Box key={v.item.id} sx={{ display: 'grid', gridTemplateColumns: '16px 1fr', columnGap: 0.75, py: 0.5 }}>
                    <Typography sx={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.58rem', color: verdictColor(v.score) }}>{style.token}</Typography>
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

      {itemDataMissing && (
        <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.78rem', color: `${ARCADE_COLORS.white}60`, textAlign: 'center' }}>
          Per-item verdicts weren’t included this round — showing dimension scores only.
        </Typography>
      )}

      {/* ── 卡片 2–5：四个维度（每个维度自带 5 条细则，一行一条） ─────────── */}
      {/* 固定 2×2：避免 auto-fit 在中等宽度塔成 3+1 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        {dimensions.map((dim) => {
          const dimRatio = dim.score / DIMENSION_MAX;
          const color = scoreGreen(dimRatio);
          const filled = dim.verdicts.filter((v) => statusOf(v.score) === 'full').length;
          const partial = dim.verdicts.filter((v) => statusOf(v.score) === 'partial').length;

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
                  {filled} of 5 full{partial > 0 ? ` · ${partial} partial` : ''}
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
