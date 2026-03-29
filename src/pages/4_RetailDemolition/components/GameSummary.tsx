import React, { useMemo } from 'react';
import { Trophy, AlertTriangle, CheckCircle, Clock, Shield, Brain, Target, RefreshCw, Eye } from 'lucide-react';
import DecisionCard from './DecisionCard';

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

interface GameSummaryProps {
  score: number;
  logs: any[];
  decisions: Decision[];
  scoreEvents: Array<{ change: number; reason: string; meta: any; timestamp: number }>;
  onRestart: () => void;
}

const GameSummary: React.FC<GameSummaryProps> = ({ score, decisions, scoreEvents, onRestart }) => {

  const deductionEvents = useMemo(() => {
    return (scoreEvents || [])
      .filter(e => typeof e?.change === 'number' && e.change < 0)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [scoreEvents]);

  const formatScoreReason = (reason, meta) => {
    if (reason === 'selected_malicious_site') return `Selected a malicious retailer${meta?.siteName ? `: ${meta.siteName}` : ''}`;
    if (reason === 'slow_malicious_decision') return `Hesitated on malicious retailer${meta?.siteName ? `: ${meta.siteName}` : ''}`;
    if (reason === 'very_slow_malicious_decision') return `Very slow decision on malicious retailer${meta?.siteName ? `: ${meta.siteName}` : ''}`;
    if (reason === 'too_fast_decision') return `Decided too quickly${meta?.siteName ? ` on ${meta.siteName}` : ''}`;
    if (reason === 'skipped_manual_inspection') return 'Skipped manual inspection of malicious sites after the incident';
    if (reason === 'quiz_answer_attacker') return 'Quiz: chose “The Malicious Site” (partial credit)';
    if (reason === 'quiz_answer_developer') return 'Quiz: chose “The AI Developer”';
    if (reason === 'quiz_answer_platform') return 'Quiz: chose “The Browser/Platform”';
    if (reason === 'quiz_answer_user') return 'Quiz: chose “The Consumer (You)”';
    if (reason === 'quiz_answer_unknown') return 'Quiz: unexpected answer';
    return reason;
  };
  const getRank = () => {
    if (score >= 90) return { name: 'Security Expert', color: 'text-green-400', bg: 'bg-green-900/20' };
    if (score >= 70) return { name: 'Security Conscious', color: 'text-blue-400', bg: 'bg-blue-900/20' };
    if (score >= 50) return { name: 'Learning', color: 'text-yellow-400', bg: 'bg-yellow-900/20' };
    return { name: 'Needs Training', color: 'text-red-400', bg: 'bg-red-900/20' };
  };

  const rank = getRank();

  const analyzeDecisions = () => {
    const analysis = {
      riskyChoices: 0,
      maliciousChoices: 0,
      educationalChoices: 0,
      manualExplorationChoices: 0,
      intentionalChoices: 0,
      totalTime: 0,
      avgDecisionTime: 0,
      totalScoreImpact: 0
    };

    decisions.forEach(decision => {
      if (decision.decisionType === 'educational') {
        analysis.educationalChoices++;
      } else if (decision.decisionType === 'manual_exploration') {
        analysis.manualExplorationChoices++;
      } else {
        analysis.intentionalChoices++;
        if (decision.site.isMalicious) {
          analysis.maliciousChoices++;
        } else {
          analysis.riskyChoices++;
        }
      }
      analysis.totalTime += decision.timeTaken;
      analysis.totalScoreImpact += decision.scoreImpact;
    });

    analysis.avgDecisionTime = decisions.length > 0 ? analysis.totalTime / decisions.length : 0;
    return analysis;
  };

  const decisionAnalysis = analyzeDecisions();

  const getSecurityLessons = () => {
    const lessons = [];
    
    // Educational exploration feedback
    if (decisionAnalysis.educationalChoices > 0) {
      lessons.push({
        type: 'success',
        icon: Eye,
        title: 'Educational Exploration',
        text: `Excellent! You explored ${decisionAnalysis.educationalChoices} malicious site${decisionAnalysis.educationalChoices > 1 ? 's' : ''} for learning. This shows you're taking initiative to understand security risks without penalty.`
      });
    }

    // Manual exploration feedback
    if (decisionAnalysis.manualExplorationChoices > 0) {
      lessons.push({
        type: 'success',
        icon: Brain,
        title: 'Manual Security Inspection',
        text: `Great job performing ${decisionAnalysis.manualExplorationChoices} manual inspection${decisionAnalysis.manualExplorationChoices > 1 ? 's' : ''}. Taking time to verify sites manually demonstrates strong security awareness.`
      });
    }

    // Intentional malicious choices (actual risky behavior)
    if (decisionAnalysis.maliciousChoices > 0) {
      lessons.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Risky Intentional Choices',
        text: `You made ${decisionAnalysis.maliciousChoices} intentional choice${decisionAnalysis.maliciousChoices > 1 ? 's' : ''} to visit malicious sites. In real scenarios, this could lead to financial loss and data theft.`
      });
    }

    // Decision timing feedback
    if (decisionAnalysis.avgDecisionTime < 3 && decisionAnalysis.intentionalChoices > 0) {
      lessons.push({
        type: 'warning',
        icon: Clock,
        title: 'Quick Decision Making',
        text: 'Your intentional decisions were made very quickly. While efficiency is good, security verification requires careful consideration of site authenticity.'
      });
    }

    // Overall security awareness
    if (decisionAnalysis.intentionalChoices > 0) {
      const intentionalRiskRatio = decisionAnalysis.maliciousChoices / decisionAnalysis.intentionalChoices;
      if (intentionalRiskRatio === 0) {
        lessons.push({
          type: 'success',
          icon: Shield,
          title: 'Perfect Security Awareness',
          text: 'All your intentional choices were secure! You demonstrated excellent security awareness in identifying safe retailers.'
        });
      } else if (intentionalRiskRatio < 0.5) {
        lessons.push({
          type: 'success',
          icon: Shield,
          title: 'Good Security Practices',
          text: 'You showed good security awareness with mostly safe intentional choices. Continue applying these principles in real-world shopping.'
        });
      }
    }

    // Learning behavior feedback
    if (decisionAnalysis.educationalChoices > 0 && decisionAnalysis.manualExplorationChoices > 0) {
      lessons.push({
        type: 'success',
        icon: Brain,
        title: 'Comprehensive Learning Approach',
        text: 'You combined both educational exploration and manual inspection, showing a thorough approach to understanding security risks.'
      });
    }

    return lessons;
  };

  const securityLessons = getSecurityLessons();

  return (
    <div className="flex-1 flex flex-col bg-slate-900 text-white p-6 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <Trophy size={60} className="text-yellow-400 mx-auto mb-4" />
        <h1 className="text-3xl font-black mb-2">Security Analysis Complete</h1>
        <div className={`inline-block px-4 py-2 rounded-full ${rank.bg} ${rank.color} font-bold text-lg mb-4`}>
          {rank.name}
        </div>
        <div className="text-4xl font-black text-white mb-2">{score}/100</div>
        <div className="text-slate-400">Final Score</div>
      </div>

      {/* Decision Summary */}
      <div className="bg-slate-800/50 rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Target className="text-indigo-400" size={20} />
          Decision Summary
        </h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 mb-4">
          <div className="bg-slate-900/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="text-red-400" size={16} />
              <span className="text-red-400 font-bold">Risky Intentional Choices</span>
            </div>
            <div className="text-2xl font-bold">{decisionAnalysis.maliciousChoices}</div>
          </div>
        </div>

        <div className="text-slate-400 text-sm">
          Average decision time: {decisionAnalysis.avgDecisionTime.toFixed(1)}s • 
          Score impact: {decisionAnalysis.totalScoreImpact} pts
        </div>
      </div>

      {/* Interactive Decision Details */}
      <div className="bg-slate-800/50 rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Eye className="text-indigo-400" size={20} />
          Decision Details
        </h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {decisions.length > 0 ? (
            decisions.map((decision, index) => (
              <DecisionCard 
                key={decision.timestamp} 
                decision={decision} 
                index={decisions.indexOf(decision)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Eye size={48} className="mx-auto mb-4 opacity-50" />
              <div>No decisions recorded</div>
            </div>
          )}
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="bg-slate-800/50 rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <AlertTriangle className="text-yellow-400" size={20} />
          Score Breakdown (Deductions)
        </h2>
        <div className="space-y-2">
          {deductionEvents.length > 0 ? (
            deductionEvents.map((e) => (
              <div key={e.timestamp} className="flex items-start justify-between gap-4 p-3 rounded-xl bg-slate-900/50 border border-slate-700/50">
                <div>
                  <div className="text-sm font-bold text-white">{formatScoreReason(e.reason, e.meta)}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{new Date(e.timestamp).toLocaleTimeString()}</div>
                </div>
                <div className="text-sm font-black text-red-400 shrink-0">{e.change} pts</div>
              </div>
            ))
          ) : (
            <div className="text-slate-400 text-sm">No score deductions recorded.</div>
          )}
        </div>
      </div>

      {/* Security Lessons */}
      <div className="bg-slate-800/50 rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Brain className="text-purple-400" size={20} />
          Security Lessons Learned
        </h2>
        <div className="space-y-3">
          {securityLessons.map((lesson, index) => (
            <div key={index} className={`flex gap-3 p-4 rounded-xl ${
              lesson.type === 'success' ? 'bg-green-900/20 border border-green-800/30' : 'bg-yellow-900/20 border border-yellow-800/30'
            }`}>
              <lesson.icon className={`flex-shrink-0 mt-1 ${
                lesson.type === 'success' ? 'text-green-400' : 'text-yellow-400'
              }`} size={18} />
              <div>
                <div className="font-bold mb-1">{lesson.title}</div>
                <div className="text-slate-300 text-sm leading-relaxed">{lesson.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Takeaways */}
      <div className="bg-slate-800/50 rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Shield className="text-indigo-400" size={20} />
          Key Security Principles
        </h2>
        <div className="space-y-2 text-slate-300">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0" />
            <div className="text-sm">Always verify retailer authenticity before making purchases</div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0" />
            <div className="text-sm">Be cautious of prices significantly below market value</div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0" />
            <div className="text-sm">Take time to review site details before proceeding with checkout</div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0" />
            <div className="text-sm">Understand that AI agents can be manipulated by malicious websites</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-auto space-y-3">
        <button 
          onClick={onRestart}
          className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw size={18} />
          Try Again
        </button>
      </div>
    </div>
  );
};

export default GameSummary;
