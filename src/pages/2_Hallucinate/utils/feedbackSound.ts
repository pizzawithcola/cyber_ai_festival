// Synthesized answer feedback sounds for the Hallucinate training game.
// Web Audio keeps this lightweight and avoids bundling audio files.

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;

  const Ctx = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
  if (!Ctx) return null;

  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
};

const playTone = (
  ctx: AudioContext,
  {
    frequency,
    start,
    duration,
    volume,
    type = 'sine',
  }: {
    frequency: number;
    start: number;
    duration: number;
    volume: number;
    type?: OscillatorType;
  },
) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const t = ctx.currentTime + start;

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, t);

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.025);
};

export const playAnswerFeedbackSound = (result: 'correct' | 'wrong'): void => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();

    if (result === 'correct') {
      playTone(ctx, { frequency: 659.25, start: 0, duration: 0.16, volume: 0.18 });
      playTone(ctx, { frequency: 987.77, start: 0.11, duration: 0.22, volume: 0.2 });
      return;
    }

    playTone(ctx, { frequency: 220, start: 0, duration: 0.18, volume: 0.19, type: 'triangle' });
    playTone(ctx, { frequency: 164.81, start: 0.13, duration: 0.26, volume: 0.17, type: 'triangle' });
  } catch {
    // Sound is a small enhancement; audio failures should never interrupt play.
  }
};
