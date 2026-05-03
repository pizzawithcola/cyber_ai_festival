import React, { useEffect, useState } from 'react';
import { Info, AlertTriangle, CheckCircle, BookOpen, Shield } from 'lucide-react';
import type { HintContent } from '../constants/gameData';

interface HintPanelProps {
  hint: HintContent | null;
  children?: React.ReactNode; // for rendering summary content
}

const ICON_MAP = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  education: BookOpen,
  shield: Shield,
};

const ICON_COLOR = {
  info: 'text-blue-400',
  warning: 'text-amber-400',
  success: 'text-green-400',
  education: 'text-purple-400',
  shield: 'text-indigo-400',
};

const HintPanel: React.FC<HintPanelProps> = ({ hint, children }) => {
  const [visible, setVisible] = useState(false);
  const [currentHint, setCurrentHint] = useState<HintContent | null>(null);

  useEffect(() => {
    if (hint) {
      setVisible(false);
      const t = setTimeout(() => {
        setCurrentHint(hint);
        setVisible(true);
      }, 150);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [hint?.title, hint?.body]);

  if (!currentHint && !children) return null;

  const IconComp = currentHint?.icon ? ICON_MAP[currentHint.icon] : Info;
  const iconColor = currentHint?.icon ? ICON_COLOR[currentHint.icon] : 'text-blue-400';

  return (
    <div
      className={`w-[440px] shrink-0 flex flex-col max-h-[780px] transition-all duration-300 ease-out ${
        visible || children ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      }`}
    >
      {/* Hint card */}
      {currentHint && currentHint.body && !children && (
        <div className="bg-[#12121a] border-2 border-indigo-700/40 rounded-2xl p-6 mb-4 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center ${iconColor}`}>
              <IconComp size={24} />
            </div>
            <h3 className="font-arcade text-[15px] leading-snug text-white">{currentHint.title}</h3>
          </div>
          <p className="font-terminal text-[22px] leading-snug text-slate-200 mb-5">{currentHint.body}</p>
          {currentHint.nextStep && (
            <div className="bg-slate-800/60 rounded-xl px-4 py-3 border border-slate-700/50">
              <div className="font-arcade text-[10px] text-amber-400 uppercase tracking-wider mb-2">▶ Next Step</div>
              <div className="font-terminal text-[20px] leading-snug text-indigo-200">{currentHint.nextStep}</div>
            </div>
          )}
        </div>
      )}

      {/* Children — used for summary content, scrollable */}
      {children && (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">{children}</div>
      )}
    </div>
  );
};

export default HintPanel;
