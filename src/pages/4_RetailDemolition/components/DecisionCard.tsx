import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Clock, Shield, Eye, Brain } from 'lucide-react';

interface Decision {
  site: {
    isMalicious: boolean;
    isVerified: boolean;
    name: string;
  };
  timeTaken: number;
  decisionType: 'intentional' | 'educational' | 'manual_exploration';
  context: 'agentic_mode' | 'manual_mode' | 'learning_phase';
  scoreImpact: number;
  timestamp: number;
}

interface DecisionCardProps {
  decision: Decision;
  index: number;
}

const DecisionCard: React.FC<DecisionCardProps> = ({ decision, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getDecisionIcon = () => {
    if (decision.decisionType === 'educational') {
      return <Eye className="text-blue-400" size={16} />;
    }
    if (decision.decisionType === 'manual_exploration') {
      return <Brain className="text-purple-400" size={16} />;
    }
    if (decision.site.isMalicious) {
      return <AlertTriangle className="text-red-400" size={16} />;
    }
    if (decision.site.isVerified) {
      return <CheckCircle className="text-green-400" size={16} />;
    }
    return <Shield className="text-yellow-400" size={16} />;
  };

  const getDecisionColor = () => {
    if (decision.decisionType === 'educational') {
      return 'border-blue-800/30 bg-blue-900/20';
    }
    if (decision.decisionType === 'manual_exploration') {
      return 'border-purple-800/30 bg-purple-900/20';
    }
    if (decision.site.isMalicious) {
      return 'border-red-800/30 bg-red-900/20';
    }
    if (decision.site.isVerified) {
      return 'border-green-800/30 bg-green-900/20';
    }
    return 'border-yellow-800/30 bg-yellow-900/20';
  };

  const getDecisionLabel = () => {
    if (decision.decisionType === 'educational') {
      return 'Educational Exploration';
    }
    if (decision.decisionType === 'manual_exploration') {
      return 'Manual Inspection';
    }
    if (decision.site.isMalicious) {
      return 'Risky Choice';
    }
    if (decision.site.isVerified) {
      return 'Safe Choice';
    }
    return 'Unverified Choice';
  };

  const getSecurityFeedback = () => {
    if (decision.decisionType === 'educational') {
      return `Good job exploring this malicious site for learning! This educational click helps you understand security risks without affecting your score.`;
    }
    if (decision.decisionType === 'manual_exploration') {
      return `Excellent manual inspection! You took the initiative to verify this site manually, which shows good security awareness.`;
    }
    if (decision.site.isMalicious) {
      return `This malicious site could have compromised your payment information. Look for verified badges and be wary of unusually low prices.`;
    }
    if (decision.site.isVerified) {
      return `Great choice! Verified retailers offer better protection against fraud and prompt injection attacks.`;
    }
    return `Unverified sites require extra caution. Always verify site authenticity before making purchases.`;
  };

  const getTimeFeedback = () => {
    if (decision.timeTaken < 3) {
      return 'You decided very quickly. Consider taking more time to verify site authenticity.';
    }
    if (decision.timeTaken > 12) {
      return 'You took your time, which is good for security but may affect shopping efficiency.';
    }
    return 'Good decision timing - balanced between security and efficiency.';
  };

  return (
    <div className={`border rounded-xl p-4 cursor-pointer transition-all ${getDecisionColor()}`}>
      <div 
        className="flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            {getDecisionIcon()}
            <span className="font-bold text-white truncate">{decision.site.name}</span>
          </div>
          <div className="mt-1 inline-flex text-xs px-2 py-1 rounded-full bg-slate-700/50 text-slate-300 max-w-full">
            {getDecisionLabel()}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 pl-3">
          <div className="text-right shrink-0">
            <div className={`text-sm font-bold ${
              decision.scoreImpact === 0 ? 'text-slate-400' : 
              decision.scoreImpact < 0 ? 'text-red-400' : 'text-green-400'
            }`}>
              {decision.scoreImpact === 0 ? 'No impact' : 
               decision.scoreImpact < 0 ? `${decision.scoreImpact} pts` : `+${decision.scoreImpact} pts`}
            </div>
            <div className="text-xs text-slate-400">{decision.timeTaken.toFixed(1)}s</div>
          </div>
          {isExpanded ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3 border-t border-slate-700/50 pt-4">
          <div className="flex items-start gap-2">
            <Shield className="text-indigo-400 mt-1" size={14} />
            <div>
              <div className="font-bold text-indigo-400 text-sm mb-1">Security Analysis</div>
              <div className="text-sm text-slate-300 leading-relaxed">
                {getSecurityFeedback()}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock className="text-yellow-400 mt-1" size={14} />
            <div>
              <div className="font-bold text-yellow-400 text-sm mb-1">Decision Timing</div>
              <div className="text-sm text-slate-300 leading-relaxed">
                {getTimeFeedback()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400">Context:</span>
              <span className="ml-2 text-slate-300 capitalize">
                {decision.context.replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Type:</span>
              <span className="ml-2 text-slate-300 capitalize">
                {decision.decisionType.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Decision #{index + 1} • {new Date(decision.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default DecisionCard;
