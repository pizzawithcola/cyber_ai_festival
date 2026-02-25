import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';

const QuizComponent = ({ onAnswer, quizAnswers, onFinished }) => {
  const options = [
    { id: 'user', text: "The Consumer (You)", desc: "Users should be cautious about where they send agents" },
    { id: 'attacker', text: "The Malicious Site", desc: "The site owner committed fraud with injected commands" },
    { id: 'developer', text: "The AI Developer", desc: "Built an unsafe system without proper guardrails" },
    { id: 'platform', text: "The Browser/Platform", desc: "Should sanitize content before AI reads it" },
    { id: 'all', text: "All of the Above", desc: "Security is a shared responsibility across all parties" }
  ];

  const [selectedOptionId, setSelectedOptionId] = useState(null);

  const feedback = {
    user: "End users should be careful, but they cannot fully defend against complex supply-chain and prompt injection attacks on their own. Focusing only on the consumer misses the shared responsibility between attackers, developers, and platforms.",
    attacker: "The malicious site is directly responsible for carrying out the fraud, but strong system and platform defenses are also needed to prevent these attacks from succeeding.",
    developer: "Developers do share responsibility for building safer agents and guardrails, but they are not the only party involved. Attackers and platforms also play key roles.",
    platform: "Platforms should help sanitize and isolate untrusted content, but this alone cannot stop all attacks. Attackers, developers, and users all influence the overall security posture.",
    all: "This is the best answer: effective security is a shared responsibility across attackers (who create threats), developers (who design defenses), platforms (that mediate content), and users (who choose where to send agents)."
  };

  return (
    <div className="flex-1 flex flex-col bg-white p-6 overflow-hidden relative">
      <div className="flex items-center gap-2 text-red-600 mb-6 shrink-0 font-black">
        <ShieldAlert size={20} /> INCIDENT ANALYSIS
      </div>
      <div className="flex-1 overflow-y-auto space-y-4">
        <p className="text-sm text-slate-600">
          Your agent was hijacked via <strong>Indirect Prompt Injection</strong>. Who bears primary responsibility?
        </p>
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => {
              if (selectedOptionId) return;
              onAnswer(option.id);
              setSelectedOptionId(option.id);
            }}
            className={`w-full text-left p-4 rounded-xl border text-sm transition-all ${
              quizAnswers.includes(option.id)
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-slate-200 hover:border-indigo-600'
            } ${selectedOptionId ? 'opacity-60 cursor-default' : ''}`}
            disabled={!!selectedOptionId}
          >
            <div className="font-bold text-slate-900">{option.text}</div>
            <div className="text-xs text-slate-500 mt-1">{option.desc}</div>
          </button>
        ))}
      </div>

      {selectedOptionId && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm">
            <div className="text-[11px] font-bold text-slate-700 mb-2">
              {selectedOptionId === 'all'
                ? 'Why this answer is correct'
                : 'Why this answer is not fully correct'}
            </div>
            <div className="text-[11px] text-slate-600 leading-relaxed mb-4">
              {feedback[selectedOptionId]}
            </div>
            <button
              type="button"
              onClick={onFinished}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold uppercase tracking-wide"
            >
              Finished
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizComponent;
