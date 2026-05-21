import React, { useEffect, useState } from 'react';
import { Info, AlertTriangle, CheckCircle, BookOpen, Shield } from 'lucide-react';
import type { HintContent } from '../constants/gameData';
import { ArcadeTypography } from '../../../components/ui';
import { ARCADE_COLORS } from '../../../theme/theme';
import ArcadePanel from './ui/ArcadePanel';

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

const ICON_COLOR: Record<string, string> = {
  info: ARCADE_COLORS.yellow,
  warning: ARCADE_COLORS.red,
  success: ARCADE_COLORS.lime,
  education: ARCADE_COLORS.yellow,
  shield: ARCADE_COLORS.yellow,
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
  }, [hint?.title, hint?.body, hint?.nextStep, hint]);

  if (!currentHint && !children) return null;

  const IconComp = currentHint?.icon ? ICON_MAP[currentHint.icon] : Info;
  const iconColor = currentHint?.icon ? ICON_COLOR[currentHint.icon] : ARCADE_COLORS.yellow;

  return (
    <div
      className={`w-[460px] shrink-0 flex flex-col max-h-[820px] transition-all duration-300 ease-out relative z-[2] ${
        visible || children ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      }`}
    >
      {/* Hint card */}
      {currentHint && currentHint.body && !children && (
        <ArcadePanel accent="yellow" sx={{ mb: 2, p: 3 }}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 flex items-center justify-center shrink-0"
              style={{
                border: `2px solid ${iconColor}`,
                color: iconColor,
                boxShadow: `0 0 12px ${iconColor}60, inset 0 0 12px ${iconColor}20`,
              }}
            >
              <IconComp size={22} />
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
          <ArcadeTypography
            arcadeColor="white"
            arcadeSize="sm"
            font="electrolize"
            glow={false}
            sx={{ display: 'block', fontSize: '0.95rem', lineHeight: 1.55, letterSpacing: '0.3px', mb: 2.5 }}
          >
            {currentHint.body}
          </ArcadeTypography>
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
                sx={{ display: 'block', mb: 1, fontSize: '0.6rem' }}
              >
                ▶ NEXT STEP
              </ArcadeTypography>
              <ArcadeTypography
                arcadeColor="white"
                arcadeSize="sm"
                font="electrolize"
                glow={false}
                sx={{ display: 'block', fontSize: '0.9rem', lineHeight: 1.5 }}
              >
                {currentHint.nextStep}
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
