import React, { useState } from 'react';
import { Bot, ShieldAlert, Zap, ChevronRight, ChevronLeft } from 'lucide-react';

interface IntroScreenProps {
  onStart: () => void;
}

const SLIDES = [
  {
    icon: Bot,
    iconColor: 'text-indigo-400',
    iconBg: 'bg-indigo-900/40',
    title: 'What is an AI Shopping Agent?',
    body: 'An AI shopping agent is software that acts on your behalf — it browses websites, compares prices, fills in your payment details, and completes purchases automatically. Think of it as a personal shopper that lives inside your browser.',
  },
  {
    icon: Zap,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-900/40',
    title: 'Why Should You Care?',
    body: 'These agents have access to your credit card numbers, home address, and personal data. They make decisions for you in milliseconds — visiting websites, reading content, and executing transactions without asking. That speed comes with risk.',
  },
  {
    icon: ShieldAlert,
    iconColor: 'text-red-400',
    iconBg: 'bg-red-900/40',
    title: 'The Hidden Danger: Prompt Injection',
    body: 'Attackers can hide invisible instructions inside websites. When an AI agent reads a malicious page, these hidden commands can hijack the agent — making it transfer money, leak data, or perform actions you never authorized. This is called prompt injection.',
  },
];

const IntroScreen: React.FC<IntroScreenProps> = ({ onStart }) => {
  const [slide, setSlide] = useState(0);
  const current = SLIDES[slide];
  const Icon = current.icon;
  const isLast = slide === SLIDES.length - 1;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto">
      {/* Title banner */}
      <div className="font-arcade text-[18px] text-indigo-400 mb-3 tracking-widest">CYBER AI FESTIVAL</div>
      <div className="font-arcade text-[26px] text-white mb-10 tracking-widest" style={{ textShadow: '0 0 20px rgba(99,102,241,0.5)' }}>RETAIL DEMOLITION</div>

      {/* Slide indicator */}
      <div className="flex gap-2 mb-10">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === slide ? 'w-10 bg-indigo-500' : 'w-4 bg-slate-700'
            }`}
          />
        ))}
      </div>

      {/* Icon */}
      <div className={`w-24 h-24 rounded-2xl ${current.iconBg} flex items-center justify-center mb-8 border-2 border-slate-700`}>
        <Icon size={48} className={current.iconColor} />
      </div>

      {/* Content */}
      <h1 className="font-arcade text-[20px] leading-relaxed text-white mb-8 px-4">{current.title}</h1>
      <p className="font-terminal text-[26px] leading-snug text-slate-200 mb-14 px-4">{current.body}</p>

      {/* Navigation */}
      <div className="flex items-center gap-4 w-full">
        {slide > 0 ? (
          <button
            onClick={() => setSlide(s => s - 1)}
            className="font-arcade px-6 py-4 rounded-xl text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-[12px]"
          >
            <ChevronLeft size={18} /> BACK
          </button>
        ) : (
          <div className="px-6 py-4" />
        )}

        <button
          onClick={isLast ? onStart : () => setSlide(s => s + 1)}
          className="font-arcade flex-1 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors flex items-center justify-center gap-3 text-[14px] tracking-wider"
          style={{ boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}
        >
          {isLast ? 'ENTER SIMULATION' : 'NEXT'}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default IntroScreen;
