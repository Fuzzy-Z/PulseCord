// Discord-Style Synthesized Sound Effects (Pure Web Audio API - Zero External Dependencies)

class SoundFX {
  constructor() {
    this.ctx = null;
  }

  getAudioContext() {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  play(type) {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      switch (type) {
        // 1. Join Voice Call (Uplifting double chime)
        case 'join': {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'triangle';

          osc1.frequency.setValueAtTime(440, now); // A4
          osc1.frequency.exponentialRampToValueAtTime(880, now + 0.18); // A5

          osc2.frequency.setValueAtTime(554.37, now + 0.05); // C#5
          osc2.frequency.exponentialRampToValueAtTime(1108.73, now + 0.22); // C#6

          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now + 0.05);
          osc1.stop(now + 0.35);
          osc2.stop(now + 0.35);
          break;
        }

        // 2. Leave Voice Call (Descending drop chime)
        case 'leave': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(783.99, now); // G5
          osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.22); // C4

          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.3);
          break;
        }

        // 3. Mute Microphone (Subtle low blip)
        case 'mute': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);

          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.1);
          break;
        }

        // 4. Unmute Microphone (Crisp high blip)
        case 'unmute': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(600, now + 0.09);

          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.12);
          break;
        }

        // 5. Deafen Audio (Muffled low descending tone)
        case 'deafen': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.linearRampToValueAtTime(160, now + 0.15);

          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.2);
          break;
        }

        // 6. Undeafen Audio (Bright double chirp)
        case 'undeafen': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(660, now + 0.15);

          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.22);
          break;
        }

        // 7. Friend Joined Room (Soft pleasant ping)
        case 'user-join': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.setValueAtTime(659.25, now + 0.08); // E5

          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.25);
          break;
        }

        // 8. Friend Left Room (Soft low pop)
        case 'user-leave': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(330, now + 0.12);

          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.18);
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.warn('[SoundFX] Error playing sound:', err);
    }
  }
}

export const soundFX = new SoundFX();
