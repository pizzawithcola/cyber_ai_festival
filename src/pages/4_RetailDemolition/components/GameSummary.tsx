import { Trophy, AlertTriangle, CheckCircle, Clock, Shield, Brain, Target, RefreshCw } from 'lucide-react';

interface Decision {
  site: {
    isMalicious: boolean;
    isVerified: boolean;
    name: string;
  };
  timeTaken: number;
}

interface GameSummaryProps {
  score: number;
  logs: any[];
  decisions: Decision[];
  onRestart: () => void;
}

const GameSummary: React.FC<GameSummaryProps> = ({ score, decisions, onRestart }) => {
  const getRank = () => {
    if (score >= 90) return { name: 'Security Expert', color: 'text-green-400', bg: 'bg-green-900/20' };
    if (score >= 70) return { name: 'Security Conscious', color: 'text-blue-400', bg: 'bg-blue-900/20' };
    if (score >= 50) return { name: 'Learning', color: 'text-yellow-400', bg: 'bg-yellow-900/20' };
    return { name: 'Needs Training', color: 'text-red-400', bg: 'bg-red-900/20' };
  };

  const rank = getRank();

  const analyzeDecisions = () => {
    const analysis = {
      safeChoices: 0,
      riskyChoices: 0,
      maliciousChoices: 0,
      totalTime: 0,
      avgDecisionTime: 0
    };

    decisions.forEach(decision => {
      if (decision.site.isMalicious) {
        analysis.maliciousChoices++;
      } else if (decision.site.isVerified) {
        analysis.safeChoices++;
      } else {
        analysis.riskyChoices++;
      }
      analysis.totalTime += decision.timeTaken;
    });

    analysis.avgDecisionTime = decisions.length > 0 ? analysis.totalTime / decisions.length : 0;
    return analysis;
  };

  const decisionAnalysis = analyzeDecisions();

  const getSecurityLessons = () => {
    const lessons = [];
    
    if (decisionAnalysis.maliciousChoices > 0) {
      lessons.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Malicious Site Detection',
        text: `You clicked ${decisionAnalysis.maliciousChoices} malicious site${decisionAnalysis.maliciousChoices > 1 ? 's' : ''}. Look for verified badges and be wary of prices that seem too good to be true.`
      });
    }

    if (decisionAnalysis.safeChoices > 0) {
      lessons.push({
        type: 'success',
        icon: CheckCircle,
        title: 'Verified Retailer Selection',
        text: `Good job choosing ${decisionAnalysis.safeChoices} verified retailer${decisionAnalysis.safeChoices > 1 ? 's' : ''}. Verified sites offer better protection against fraud.`
      });
    }

    if (decisionAnalysis.avgDecisionTime < 3) {
      lessons.push({
        type: 'warning',
        icon: Clock,
        title: 'Decision Speed',
        text: 'You made decisions very quickly. Take time to verify site authenticity before making purchases.'
      });
    }

    if (score >= 70) {
      lessons.push({
        type: 'success',
        icon: Shield,
        title: 'Overall Security Awareness',
        text: 'You demonstrated good security practices. Continue applying these principles in real-world shopping.'
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
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-900/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="text-green-400" size={16} />
              <span className="text-green-400 font-bold">Safe Choices</span>
            </div>
            <div className="text-2xl font-bold">{decisionAnalysis.safeChoices}</div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="text-red-400" size={16} />
              <span className="text-red-400 font-bold">Risky Choices</span>
            </div>
            <div className="text-2xl font-bold">{decisionAnalysis.maliciousChoices + decisionAnalysis.riskyChoices}</div>
          </div>
        </div>
        <div className="text-slate-400 text-sm">
          Average decision time: {decisionAnalysis.avgDecisionTime.toFixed(1)}s
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
