import React, { useState } from 'react';
import { Bot, ShieldAlert, Zap, ChevronRight, ChevronLeft } from 'lucide-react';
import { ArcadeButton, ArcadeTypography } from '../../../components/ui';
import { ARCADE_COLORS } from '../../../theme/theme';
import ArcadePanel from './ui/ArcadePanel';

interface IntroScreenProps {
  onStart: () => void;
}

const SLIDES = [
  {
    icon: Bot,
    iconColor: ARCADE_COLORS.cyan,
    title: 'What is an AI Shopping Agent?',
    body: 'An AI shopping agent is software that acts on your behalf — it browses websites, compares prices, fills in your payment details, and completes purchases automatically. Think of it as a personal shopper that lives inside your browser.',
  },
  {
    icon: Zap,
    iconColor: ARCADE_COLORS.yellow,
    title: 'Why Should You Care?',
    body: 'These agents have access to your credit card numbers, home address, and personal data. They make decisions for you in milliseconds — visiting websites, reading content, and executing transactions without asking. That speed comes with risk.',
  },
  {
    icon: ShieldAlert,
    iconColor: ARCADE_COLORS.red,
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
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-3xl mx-auto relative z-10">
      {/* Title */}
      <ArcadeTypography arcadeColor="yellow" arcadeSize="sm" font="pressstart2p" sx={{ mb: 1.5 }}>
        CYBER AI FESTIVAL
      </ArcadeTypography>
      <ArcadeTypography
        arcadeColor="yellow"
        arcadeSize="xl"
        font="monoton"
        sx={{ mb: 6, fontSize: { xs: '2.2rem', md: '3.5rem' } }}
      >
        RETAIL DEMOLITION
      </ArcadeTypography>

      {/* Slide indicator */}
      <div className="flex gap-2 mb-8">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className="h-2 transition-all duration-300"
            style={{
              width: i === slide ? 40 : 16,
              backgroundColor: i === slide ? ARCADE_COLORS.yellow : `${ARCADE_COLORS.white}30`,
              boxShadow: i === slide ? `0 0 10px ${ARCADE_COLORS.yellow}` : 'none',
            }}
          />
        ))}
      </div>

      {/* Panel */}
      <ArcadePanel
        accent="yellow"
        sx={{ width: '100%', mb: 5, p: { xs: 3, md: 4 } }}
      >
        <div className="flex flex-col items-center gap-5">
          <div
            className="w-20 h-20 flex items-center justify-center"
            style={{
              border: `2px solid ${current.iconColor}`,
              boxShadow: `0 0 20px ${current.iconColor}60, inset 0 0 20px ${current.iconColor}20`,
            }}
          >
            <Icon size={42} style={{ color: current.iconColor }} />
          </div>
          <ArcadeTypography
            arcadeColor="yellow"
            arcadeSize="md"
            font="pressstart2p"
            glow
            sx={{ lineHeight: 1.5, fontSize: { xs: '0.9rem', md: '1.05rem' } }}
          >
            {current.title}
          </ArcadeTypography>
          <ArcadeTypography
            arcadeColor="white"
            arcadeSize="sm"
            font="vt323"
            glow={false}
            sx={{ fontSize: { xs: '1.3rem', md: '1.5rem' }, lineHeight: 1.35, letterSpacing: '1px' }}
          >
            {current.body}
          </ArcadeTypography>
        </div>
      </ArcadePanel>

      {/* Navigation */}
      <div className="flex items-center gap-4 w-full justify-center">
        {slide > 0 && (
          <ArcadeButton
            color="yellow"
            variant="outline"
            size="md"
            onClick={() => setSlide(s => s - 1)}
            startIcon={<ChevronLeft size={16} />}
          >
            BACK
          </ArcadeButton>
        )}

        <ArcadeButton
          color="yellow"
          variant="filled"
          size="lg"
          onClick={isLast ? onStart : () => setSlide(s => s + 1)}
          endIcon={<ChevronRight size={18} />}
          animation={isLast ? 'pulse' : 'none'}
        >
          {isLast ? 'ENTER SIMULATION' : 'NEXT'}
        </ArcadeButton>
      </div>
    </div>
  );
};

export default IntroScreen;
