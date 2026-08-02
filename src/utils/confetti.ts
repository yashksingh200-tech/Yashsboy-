import confetti from 'canvas-confetti';

/**
 * Triggers a festive celebratory confetti burst
 */
export function triggerCelebrationConfetti(type: 'streak' | 'goal' | 'checkin' | 'milestone' = 'checkin'): void {
  if (typeof window === 'undefined') return;

  try {
    if (type === 'streak' || type === 'milestone') {
      // Big dual-burst confetti for streaks and major milestones
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 9999,
      };

      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      };

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
        colors: ['#818cf8', '#c084fc', '#f472b6'],
      });
      fire(0.2, {
        spread: 60,
        colors: ['#fbbf24', '#34d399', '#60a5fa'],
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        colors: ['#a78bfa', '#f43f5e', '#10b981'],
        scalar: 1.2,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    } else {
      // Gentle subtle burst for daily check-ins & quick goals
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#818cf8', '#34d399', '#fbbf24', '#f472b6'],
        zIndex: 9999,
      });
    }
  } catch (err) {
    console.warn('Confetti trigger skipped:', err);
  }
}
