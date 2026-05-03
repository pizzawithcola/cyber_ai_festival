import React, { useMemo } from 'react';
import { Trophy, AlertTriangle, Shield, Target, Eye } from 'lucide-react';
import DecisionCard from './DecisionCard';

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

  const getRank = () => {
    if (score >= 90) return { name: 'Security Expert', color: 'text-green-400', bg: 'bg-green-900/20' };
    if (score >= 70) return { name: 'Security Aware', color: 'text-blue-400', bg: 'bg-blue-900/20' };
    if (score >= 50) return { name: 'Security Conscious', color: 'text-yellow-400', bg: 'bg-yellow-900/20' };
    if (score >= 30) return { name: 'Security Risk', color: 'text-orange-400', bg: 'bg-orange-900/20' };
    return { name: 'Security Vulnerable', color: 'text-red-400', bg: 'bg-red-900/20' };
  };

  const rank = getRank();

  // Analysis data available for future use
  // const agentDecisions = decisions.filter(d => d.context === 'agentic_mode');

  return (
    <div className="space-y-4 pb-4">
      {/* Score & Rank */}
      <div className="bg-[#12121a] border-2 border-indigo-700/40 rounded-2xl p-6 text-center shadow-[0_0_30px_rgba(99,102,241,0.15)]">
        <Trophy size={48} className="text-yellow-400 mx-auto mb-3" />
        <div className={`font-arcade inline-block px-4 py-2 rounded-lg ${rank.bg} ${rank.color} text-[10px] mb-3 tracking-wider`}>
          {rank.name.toUpperCase()}
        </div>
        <div className="font-arcade text-[32px] text-white">{score}<span className="text-slate-500 text-[20px]">/100</span></div>
      </div>

      {/* Manual vs Agent Comparison */}
      <div className="bg-[#12121a] border border-slate-800 rounded-2xl p-5">
        <h3 className="font-arcade text-[12px] text-white mb-4 flex items-center gap-2">
          <Target size={16} className="text-indigo-400" /> MANUAL VS AGENT
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <div className="font-arcade text-[8px] text-slate-400 mb-2">MANUAL</div>
            <div className="font-terminal text-[28px] text-white leading-none">{manualStepCount}<span className="text-[16px] text-slate-500"> steps</span></div>
            <div className="font-terminal text-[16px] text-slate-400 leading-tight mt-1">You controlled every decision</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <div className="font-arcade text-[8px] text-slate-400 mb-2">AGENT</div>
            <div className="font-terminal text-[28px] text-white leading-none">1<span className="text-[16px] text-slate-500"> click</span></div>
            <div className="font-terminal text-[16px] text-slate-400 leading-tight mt-1">Agent made all decisions</div>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      {deductionEvents.length > 0 && (
        <div className="bg-[#12121a] border border-slate-800 rounded-2xl p-5">
          <h3 className="font-arcade text-[12px] text-white mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400" /> DEDUCTIONS
          </h3>
          <div className="space-y-2">
            {deductionEvents.map((e) => (
              <div key={e.timestamp} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="font-terminal text-[18px] leading-snug text-slate-200">{formatScoreReason(e.reason, e.meta as { siteName?: string })}</div>
                <div className="font-arcade text-[12px] text-red-400 shrink-0">{e.change}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decisions */}
      {decisions.length > 0 && (
        <div className="bg-[#12121a] border border-slate-800 rounded-2xl p-5">
          <h3 className="font-arcade text-[12px] text-white mb-4 flex items-center gap-2">
            <Eye size={16} className="text-indigo-400" /> DECISION LOG
          </h3>
          <div className="space-y-2">
            {decisions.map((decision, index) => (
              <DecisionCard key={decision.timestamp} decision={decision} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Key Takeaways */}
      <div className="bg-[#12121a] border border-slate-800 rounded-2xl p-5">
        <h3 className="font-arcade text-[12px] text-white mb-4 flex items-center gap-2">
          <Shield size={16} className="text-indigo-400" /> KEY TAKEAWAYS
        </h3>
        <div className="space-y-3 font-terminal text-[18px] leading-snug text-slate-200">
          <div className="flex items-start gap-3">
            <div className="text-indigo-400 mt-1 shrink-0">▸</div>
            AI agents can be hijacked through invisible prompt injection in websites
          </div>
          <div className="flex items-start gap-3">
            <div className="text-indigo-400 mt-1 shrink-0">▸</div>
            Always verify retailer authenticity before letting agents make purchases
          </div>
          <div className="flex items-start gap-3">
            <div className="text-indigo-400 mt-1 shrink-0">▸</div>
            Human-in-the-loop confirmation is a critical safety checkpoint
          </div>
          <div className="flex items-start gap-3">
            <div className="text-indigo-400 mt-1 shrink-0">▸</div>
            Security is a shared responsibility: users, developers, platforms, and attackers all play a role
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSummary;
