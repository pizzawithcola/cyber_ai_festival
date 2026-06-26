// Synthesized notification chime for Retail Demolition (game 4).
// Uses the Web Audio API so no audio asset needs to be bundled. A single shared
// AudioContext is lazily created and reused; all failures are swallowed so a
// missing/blocked audio backend never breaks gameplay.

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
};

/**
 * Plays a short two-tone "ding-dong" chime, mimicking a phone SMS alert.
 * Safe to call from any event handler or effect; errors are ignored.
 */
export const playNotificationSound = (): void => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    // Browsers suspend the context until a user gesture; resume best-effort.
    if (ctx.state === 'suspended') void ctx.resume();

    const now = ctx.currentTime;
    // Two ascending tones for a pleasant notification feel.
    const tones = [
      { freq: 880, start: 0 },
      { freq: 1318.5, start: 0.13 },
    ];

    tones.forEach(({ freq, start }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const t = now + start;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.36);
    });
  } catch {
    // Ignore audio errors — sound is a non-critical enhancement.
  }
};
