import React, { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { ArcadeTypography } from '../../../components/ui';
import { ARCADE_COLORS } from '../../../theme/theme';
import ArcadePanel from './ui/ArcadePanel';

interface GameSummaryProps {
  score: number;
  decisions: unknown[];
  scoreEvents: Array<{ change: number; reason: string; meta: Record<string, unknown>; timestamp: number }>;
  manualStepCount: number;
}

const SectionHeader: React.FC<{ title: string; accent?: keyof typeof ARCADE_COLORS }> = ({ title, accent = 'yellow' }) => (
  <div className="flex items-center gap-2 mb-3">
    <ArcadeTypography arcadeColor={accent} arcadeSize="xs" font="pressstart2p" sx={{ fontSize: '0.7rem' }}>
      {title}
    </ArcadeTypography>
  </div>
);

interface ScoreItem {
  label: string;
  earned: number;
  max: number;
}

interface ScoreBlock {
  label: string;
  earned: number;
  max: number;
  items: ScoreItem[];
}

const GameSummary: React.FC<GameSummaryProps> = ({ score, scoreEvents }) => {
  // 单卡片四模块分数展览（总分 = Education 10 + Manual 30 + Agent 30 + Quiz 20 = 90 设计）
  const blocks = useMemo<ScoreBlock[]>(() => {
    const events = (scoreEvents || []) as Array<{ change: number; reason: string; meta: Record<string, unknown>; timestamp: number }>;
    const ev = (reason: string) => events.find(e => e.reason === reason);
    const sumOf = (reasons: string[]) => events.filter(e => reasons.includes(e.reason)).reduce((s, e) => s + e.change, 0);

    const edu = ev('education_cards_complete')?.change ?? 0;
    const purchase = ev('manual_purchase_success')?.change ?? 0;
    const flagCorrect = ev('flagged_malicious_listing')?.change ?? 0;
    const stop = ev('emergency_stop')?.change ?? 0;
    const q1 = ev('quiz_correct_1')?.change ?? 0;
    const q2 = ev('quiz_correct_2')?.change ?? 0;

    return [
      {
        label: 'Education',
        earned: edu,
        max: 20,
        items: [{ label: 'Complete the Education Cards', earned: edu, max: 20 }],
      },
      {
        label: 'Manual Shopping',
        earned: sumOf(['manual_purchase_success', 'flagged_malicious_listing']),
        max: 30,
        items: [
          { label: 'Purchase an item successfully', earned: purchase, max: 30 },
          { label: 'Bonus: correctly reported a suspicious item', earned: flagCorrect, max: 10 },
        ],
      },
      {
        label: 'Agent Mode',
        earned: stop,
        max: 30,
        items: [{ label: 'Reaction on credit card incident', earned: stop, max: 30 }],
      },
      {
        label: 'Quiz',
        earned: q1 + q2,
        max: 20,
        items: [
          { label: 'Quiz 1: Who bears responsibility?', earned: q1, max: 10 },
          { label: 'Quiz 2: Fraud alert response', earned: q2, max: 10 },
        ],
      },
    ];
  }, [scoreEvents]);

  const getRank = (): { name: string; color: keyof typeof ARCADE_COLORS } => {
    if (score >= 90) return { name: 'SECURITY EXPERT', color: 'lime' };
    if (score >= 70) return { name: 'SECURITY AWARE', color: 'cyan' };
    if (score >= 50) return { name: 'SECURITY CONSCIOUS', color: 'yellow' };
    if (score >= 30) return { name: 'SECURITY RISK', color: 'orange' };
    return { name: 'SECURITY VULNERABLE', color: 'red' };
  };

  const rank = getRank();

  return (
    <div className="space-y-4 pb-4 relative z-[2]">
      {/* Score & Rank */}
      <ArcadePanel accent={rank.color} sx={{ p: 3, textAlign: 'center' }}>
        <Trophy size={44} style={{ color: ARCADE_COLORS.yellow, margin: '0 auto 12px' }} />
        <div
          className="inline-block mb-3 px-3 py-1"
          style={{
            border: `2px solid ${ARCADE_COLORS[rank.color]}`,
            boxShadow: `0 0 12px ${ARCADE_COLORS[rank.color]}60`,
          }}
        >
          <ArcadeTypography arcadeColor={rank.color} arcadeSize="xs" font="pressstart2p" sx={{ fontSize: '0.7rem' }}>
            {rank.name}
          </ArcadeTypography>
        </div>
        <div>
          <ArcadeTypography
            arcadeColor={rank.color}
            arcadeSize="xl"
            font="pressstart2p"
            sx={{ fontSize: '2.5rem', lineHeight: 1 }}
          >
            {score}
          </ArcadeTypography>
          <ArcadeTypography arcadeColor="white" arcadeSize="md" font="pressstart2p" glow={false} sx={{ fontSize: '1rem' }}>
            /100
          </ArcadeTypography>
        </div>
      </ArcadePanel>

      {/* 单卡片四模块分数总结 */}
      <ArcadePanel accent="yellow" sx={{ p: 3 }}>
        <SectionHeader title="SCORE BREAKDOWN" />
        <div>
          {blocks.map((block) => (
            <div key={block.label} className="py-3 border-t border-white/10 first:border-t-0">
              {/* 模块行：左侧标签 / 右侧总分（与下方细则间距 16px） */}
              <div className="flex items-baseline justify-between mb-4">
                <ArcadeTypography arcadeColor="yellow" arcadeSize="sm" font="pressstart2p" sx={{ fontSize: '0.72rem' }}>
                  {block.label}
                </ArcadeTypography>
                <ArcadeTypography arcadeColor="white" arcadeSize="lg" font="pressstart2p" glow={false} sx={{ fontSize: '1.4rem', lineHeight: 1 }}>
                  {block.earned}
                  <span style={{ fontSize: '0.8rem', color: `${ARCADE_COLORS.white}70` }}> / {block.max}</span>
                </ArcadeTypography>
              </div>

              {/* 明细行：数字与左侧文字同样式同大小，格式 xx/xx */}
              {block.items.map((item) => (
                <div key={item.label} className="flex items-baseline justify-between gap-3 py-1">
                  <ArcadeTypography arcadeColor="white" arcadeSize="sm" font="electrolize" glow={false} sx={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
                    {item.label}
                  </ArcadeTypography>
                  <ArcadeTypography
                    arcadeColor={item.earned >= 0 ? 'white' : 'red'}
                    arcadeSize="sm"
                    font="electrolize"
                    glow={false}
                    sx={{ fontSize: '0.85rem', lineHeight: 1.4, flexShrink: 0 }}
                  >
                    {item.earned}/{item.max}
                  </ArcadeTypography>
                </div>
              ))}
            </div>
          ))}
        </div>
      </ArcadePanel>

      {/* Key Takeaways */}
      <ArcadePanel accent="yellow" sx={{ p: 3 }}>
        <SectionHeader title="KEY TAKEAWAYS" />
        <div className="space-y-3">
          {[
            'AI agents can be hijacked by malware hidden in websites',
            'Always verify retailer authenticity before letting agents make purchases',
            'Human-in-the-loop confirmation is a critical safety checkpoint',
            'Security is a shared responsibility: users, developers, platforms, and attackers all play a role',
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-3">
              <span style={{ color: ARCADE_COLORS.yellow, marginTop: 4, flexShrink: 0 }}>▸</span>
              <ArcadeTypography arcadeColor="white" arcadeSize="sm" font="electrolize" glow={false} sx={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                {text}
              </ArcadeTypography>
            </div>
          ))}
        </div>
      </ArcadePanel>
    </div>
  );
};

export default GameSummary;
