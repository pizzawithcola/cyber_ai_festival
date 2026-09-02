import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';

interface QuizOption {
  id: string;
  text: string;
  desc: string;
}

interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
  feedback: Record<string, string>;
}

interface QuizComponentProps {
  onAnswer: (qIndex: number, answerId: string) => void;
  onFinished: () => void;
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'responsibility',
    text: 'Your agent was hijacked by malware hidden on a website. Who bears primary responsibility?',
    options: [
      { id: 'user', text: 'The Consumer (You)', desc: 'Users should be cautious about where they send agents' },
      { id: 'attacker', text: 'The Malicious Site', desc: 'The site owner committed fraud with injected commands' },
      { id: 'developer', text: 'The AI Developer', desc: 'Built an unsafe system without proper guardrails' },
      { id: 'platform', text: 'The Browser/Platform', desc: 'Should sanitize content before AI reads it' },
      { id: 'all', text: 'All of the Above', desc: 'Security is a shared responsibility across all parties' },
    ],
    feedback: {
      user: 'End users should be careful, but they cannot fully defend against complex malware and supply-chain attacks on their own. Focusing only on the consumer misses the shared responsibility between attackers, developers, and platforms.',
      attacker: 'The malicious site is directly responsible for carrying out the fraud, but strong system and platform defenses are also needed to prevent these attacks from succeeding.',
      developer: 'Developers do share responsibility for building safer agents and guardrails, but they are not the only party involved. Attackers and platforms also play key roles.',
      platform: 'Platforms should help sanitize and isolate untrusted content, but this alone cannot stop all attacks. Attackers, developers, and users all influence the overall security posture.',
      all: 'This is the best answer: effective security is a shared responsibility across attackers (who create threats), developers (who design defenses), platforms (that mediate content), and users (who choose where to send agents).',
    },
  },
  {
    id: 'response',
    text: 'A fraud alert just appeared on your phone after the agent charged your card. What should you do?',
    options: [
      { id: 'ignore', text: 'Ignore it', desc: 'It is probably a spam message' },
      { id: 'contact_bank', text: 'Contact the bank & freeze the card', desc: 'Stop further damage immediately' },
      { id: 'trust_agent', text: 'Trust the agent', desc: 'The AI knows what it is doing' },
      { id: 'share_creds', text: 'Share your credentials', desc: 'Help the agent fix the issue' },
    ],
    feedback: {
      ignore: 'Ignoring a fraud alert lets the attacker keep charging your card. You should act on every alert and verify the charge.',
      contact_bank: 'This is the best response: freeze the card, confirm the charge with the bank, and report it. The faster you react, the less damage.',
      trust_agent: 'Agents are useful but not infallible — this incident proves a malicious site hijacked it. Never blindly trust automation with money.',
      share_creds: 'Never share credentials with anyone, especially after a compromise. The bank will never ask for your password or OTP.',
    },
  },
];

const QuizComponent = ({ onAnswer, onFinished }: QuizComponentProps) => {
  const [qIndex, setQIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const question = QUESTIONS[qIndex];
  const isLast = qIndex === QUESTIONS.length - 1;

  const handleSelect = (optionId: string) => {
    if (selectedOptionId) return;
    onAnswer(qIndex, optionId);
    setSelectedOptionId(optionId);
  };

  const handleNext = () => {
    if (isLast) {
      onFinished();
    } else {
      setQIndex(i => i + 1);
      setSelectedOptionId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white p-6 overflow-hidden relative">
      <div className="flex items-center gap-2 text-red-600 mb-6 shrink-0 font-black">
        <ShieldAlert size={20} /> INCIDENT ANALYSIS
      </div>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
        Question {qIndex + 1} of {QUESTIONS.length}
      </div>
      <div className="flex-1 overflow-y-auto space-y-4">
        <p className="text-sm text-slate-600">
          {question.text}
        </p>
        {question.options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option.id)}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${
              selectedOptionId
                ? 'border-2 border-slate-300 opacity-60'
                : 'border-2 border-slate-300 hover:border-indigo-600'
            }`}
            disabled={!!selectedOptionId}
          >
            <div className="font-bold text-slate-900">{option.text}</div>
            <div className="text-[10px] text-slate-500 mt-1">{option.desc}</div>
          </button>
        ))}
      </div>

      {selectedOptionId && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm">
            {(() => {
              const isCorrect = selectedOptionId === 'all' || selectedOptionId === 'contact_bank';
              return (
                <>
                  <div className={`text-[11px] font-black mb-2 uppercase tracking-wide flex items-center gap-1.5 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    <span
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px]"
                      style={{ backgroundColor: isCorrect ? '#16a34a' : '#dc2626' }}
                    >
                      {isCorrect ? '✓' : '✗'}
                    </span>
                    {isCorrect ? 'Correct!' : 'Not quite...'}
                  </div>
                  <div className="text-[11px] text-slate-600 leading-relaxed mb-4">
                    {question.feedback[selectedOptionId]}
                  </div>
                </>
              );
            })()}
            <button
              type="button"
              onClick={handleNext}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold uppercase tracking-wide"
            >
              {isLast ? 'Finished' : 'Next Question'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizComponent;
