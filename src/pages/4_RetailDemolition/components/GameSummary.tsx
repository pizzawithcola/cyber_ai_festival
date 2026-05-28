import React, { useMemo } from 'react';
import { Trophy, AlertTriangle, Shield, Target, Eye } from 'lucide-react';
import DecisionCard from './DecisionCard';
import { ArcadeTypography } from '../../../components/ui';
import { ARCADE_COLORS } from '../../../theme/theme';
import ArcadePanel from './ui/ArcadePanel';

interface Decision {
  site: { isMalicious: boolean; isVerified: boolean; name: string };
  timeTaken: number;
  decisionType: 'intentional' | 'educational' | 'manual_exploration';
  context: 'agentic_mode' | 'manual_mode';
  scoreImpact: number;
  timestamp: number;
}

interface GameSummaryProps {
  score: number;
  decisions: Decision[];
  scoreEvents: Array<{ change: number; reason: string; meta: Record<string, unknown>; timestamp: number }>;
  manualStepCount: number;
}

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; accent?: keyof typeof ARCADE_COLORS }> = ({
  icon,
  title,
  accent = 'yellow',
}) => (
  <div className="flex items-center gap-2 mb-4">
    <span style={{ color: ARCADE_COLORS[accent], display: 'inline-flex' }}>{icon}</span>
    <ArcadeTypography arcadeColor={accent} arcadeSize="xs" font="pressstart2p" sx={{ fontSize: '0.7rem' }}>
      {title}
    </ArcadeTypography>
  </div>
);

const GameSummary: React.FC<GameSummaryProps> = ({ score, decisions, scoreEvents, manualStepCount }) => {
  const deductionEvents = useMemo(() => {
    return (scoreEvents || [])
      .filter(e => typeof e?.change === 'number' && e.change < 0)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [scoreEvents]);

  const formatScoreReason = (reason: string, meta?: { siteName?: string }) => {
    const map: Record<string, string> = {
      selected_malicious_site: `Selected malicious retailer${meta?.siteName ? `: ${meta.siteName}` : ''}`,
      slow_malicious_decision: `Hesitated on malicious retailer`,
      very_slow_malicious_decision: `Very slow decision on malicious retailer`,
      too_fast_decision: `Decided too quickly${meta?.siteName ? ` on ${meta.siteName}` : ''}`,
      rubber_stamped_confirmation: `Rubber-stamped agent confirmation`,
      skipped_inspection: 'Skipped post-incident inspection (never viewed page source)',
      quiz_answer_attacker: 'Quiz: chose "The Malicious Site"',
      quiz_answer_developer: 'Quiz: chose "The AI Developer"',
      quiz_answer_platform: 'Quiz: chose "The Browser/Platform"',
      quiz_answer_user: 'Quiz: chose "The Consumer (You)"',
      quiz_answer_unknown: 'Quiz: unexpected answer',
    };
    return map[reason] || reason;
  };

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

      {/* Manual vs Agent */}
      <ArcadePanel accent="yellow" sx={{ p: 3 }}>
        <SectionHeader icon={<Target size={14} />} title="MANUAL VS AGENT" accent="yellow" />
        <div className="grid grid-cols-2 gap-3">
          <div style={{ border: `1px solid ${ARCADE_COLORS.yellow}40`, padding: 12 }}>
            <ArcadeTypography arcadeColor="yellow" arcadeSize="xs" font="pressstart2p" sx={{ display: 'block', mb: 1, fontSize: '0.55rem' }}>
              MANUAL
            </ArcadeTypography>
            <ArcadeTypography arcadeColor="white" arcadeSize="lg" font="electrolize" glow={false} sx={{ display: 'block', fontSize: '2rem', lineHeight: 1 }}>
              {manualStepCount}
              <span style={{ fontSize: '1rem', color: `${ARCADE_COLORS.white}80`, marginLeft: 6 }}>steps</span>
            </ArcadeTypography>
            <ArcadeTypography arcadeColor="white" arcadeSize="sm" font="electrolize" glow={false} sx={{ display: 'block', fontSize: '0.8rem', lineHeight: 1.4, mt: 0.5, opacity: 0.75 }}>
              You controlled every decision
            </ArcadeTypography>
          </div>
          <div style={{ border: `1px solid ${ARCADE_COLORS.yellow}40`, padding: 12 }}>
            <ArcadeTypography arcadeColor="yellow" arcadeSize="xs" font="pressstart2p" sx={{ display: 'block', mb: 1, fontSize: '0.55rem' }}>
              AGENT
            </ArcadeTypography>
            <ArcadeTypography arcadeColor="white" arcadeSize="lg" font="electrolize" glow={false} sx={{ display: 'block', fontSize: '2rem', lineHeight: 1 }}>
              1
              <span style={{ fontSize: '1rem', color: `${ARCADE_COLORS.white}80`, marginLeft: 6 }}>click</span>
            </ArcadeTypography>
            <ArcadeTypography arcadeColor="white" arcadeSize="sm" font="electrolize" glow={false} sx={{ display: 'block', fontSize: '0.8rem', lineHeight: 1.4, mt: 0.5, opacity: 0.75 }}>
              Agent made all decisions
            </ArcadeTypography>
          </div>
        </div>
      </ArcadePanel>

      {/* Score Breakdown */}
      {deductionEvents.length > 0 && (
        <ArcadePanel accent="red" sx={{ p: 3 }}>
          <SectionHeader icon={<AlertTriangle size={14} />} title="DEDUCTIONS" accent="red" />
          <div className="space-y-2">
            {deductionEvents.map((e) => (
              <div
                key={e.timestamp}
                className="flex items-start justify-between gap-3 p-3"
                style={{ border: `1px solid ${ARCADE_COLORS.red}30`, background: `${ARCADE_COLORS.red}08` }}
              >
                <ArcadeTypography arcadeColor="white" arcadeSize="sm" font="electrolize" glow={false} sx={{ fontSize: '0.85rem', lineHeight: 1.45 }}>
                  {formatScoreReason(e.reason, e.meta as { siteName?: string })}
                </ArcadeTypography>
                <ArcadeTypography arcadeColor="red" arcadeSize="sm" font="pressstart2p" sx={{ fontSize: '0.75rem', flexShrink: 0 }}>
                  {e.change}
                </ArcadeTypography>
              </div>
            ))}
          </div>
        </ArcadePanel>
      )}

      {/* Decisions */}
      {decisions.length > 0 && (
        <ArcadePanel accent="yellow" sx={{ p: 3 }}>
          <SectionHeader icon={<Eye size={14} />} title="DECISION LOG" accent="yellow" />
          <div className="space-y-2">
            {decisions.map((decision, index) => (
              <DecisionCard key={decision.timestamp} decision={decision} index={index} />
            ))}
          </div>
        </ArcadePanel>
      )}

      {/* Key Takeaways */}
      <ArcadePanel accent="yellow" sx={{ p: 3 }}>
        <SectionHeader icon={<Shield size={14} />} title="KEY TAKEAWAYS" accent="yellow" />
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
