import React, { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import type { HintContent } from '../constants/gameData';
import { ArcadeTypography } from '../../../components/ui';
import { ARCADE_COLORS } from '../../../theme/theme';
import ArcadePanel from './ui/ArcadePanel';

interface HintPanelProps {
  hint: HintContent | null;
  children?: React.ReactNode; // for rendering summary content
  // 递增信号：值变化时面板抖动一次（选错商品提醒）
  shakeSignal?: number;
}

const HintPanel: React.FC<HintPanelProps> = ({ hint, children, shakeSignal }) => {
  const [visible, setVisible] = useState(false);
  const [currentHint, setCurrentHint] = useState<HintContent | null>(null);
  const [shaking, setShaking] = useState(false);

  // Highlight the target item name inside a piece of text with a glowing "breathing" effect.
  const renderWithGlow = (text: string, taskItem?: string): React.ReactNode => {
    if (!taskItem) return text;
    const idx = text.indexOf(taskItem);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span
          style={{
            fontWeight: 700,
            color: '#fff8e0',
            textShadow: `0 0 6px ${ARCADE_COLORS.yellow}, 0 0 14px ${ARCADE_COLORS.yellow}`,
            animation: 'hintTaskBreath 2.2s ease-in-out infinite',
          }}
        >
          {text.slice(idx, idx + taskItem.length)}
        </span>
        {text.slice(idx + taskItem.length)}
        <style>{`
          @keyframes hintTaskBreath {
            0%, 100% { opacity: 1; text-shadow: 0 0 6px ${ARCADE_COLORS.yellow}, 0 0 14px ${ARCADE_COLORS.yellow}; }
            50% { opacity: 0.55; text-shadow: 0 0 2px ${ARCADE_COLORS.yellow}88, 0 0 6px ${ARCADE_COLORS.yellow}88; }
          }
        `}</style>
      </>
    );
  };

  useEffect(() => {
    if (!shakeSignal) return;
    setShaking(true);
    const t = setTimeout(() => setShaking(false), 600);
    return () => clearTimeout(t);
  }, [shakeSignal]);

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
  }, [hint?.title, hint?.body, hint?.nextStep, hint?.task, hint]);

  if (!currentHint && !children) return null;

  return (
    <div
      className={`w-full max-w-[460px] shrink-0 flex flex-col max-h-full transition-all duration-300 ease-out relative z-[2] ${
        visible || children
          ? 'opacity-100 translate-x-0 portrait:translate-y-0'
          : 'opacity-0 translate-x-4 portrait:translate-x-0 portrait:-translate-y-4'
      } ${shaking ? 'animate-hint-shake' : ''}`}
    >
      {/* Hint card */}
      {currentHint && currentHint.body && !children && (
        <ArcadePanel accent="yellow" sx={{ mb: 2, p: 3 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-6 flex items-center justify-center shrink-0" style={{ color: ARCADE_COLORS.yellow }}>
              <Info size={24} />
            </div>
            <ArcadeTypography
              arcadeColor="yellow"
              arcadeSize="sm"
              font="pressstart2p"
              sx={{ lineHeight: 1.4, fontSize: '0.78rem' }}
            >
              {currentHint.title}
            </ArcadeTypography>
          </div>
          {currentHint.nextStep && (
            <div
              style={{
                border: `1px solid ${ARCADE_COLORS.yellow}50`,
                background: `${ARCADE_COLORS.yellow}10`,
                padding: '10px 14px',
              }}
            >
              <ArcadeTypography
                arcadeColor="yellow"
                arcadeSize="xs"
                font="pressstart2p"
                sx={{ display: 'block', mb: 1, fontSize: '0.6rem', lineHeight: 1.5 }}
              >
                {currentHint.task || '▶ NEXT STEP'}
              </ArcadeTypography>
              <ArcadeTypography
                arcadeColor="white"
                arcadeSize="sm"
                font="electrolize"
                glow={false}
                sx={{ display: 'block', fontSize: '0.9rem', lineHeight: 1.5 }}
              >
                {renderWithGlow(currentHint.nextStep, currentHint.taskItem)}
              </ArcadeTypography>
            </div>
          )}
        </ArcadePanel>
      )}

      {/* Children — used for summary content, scrollable */}
      {children && (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {children}
        </div>
      )}
    </div>
  );
};

export default HintPanel;
