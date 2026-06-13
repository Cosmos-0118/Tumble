/* eslint-disable @typescript-eslint/no-explicit-any */

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private lastNoteTime = 0;

  public playTone(freq: number, vol = 0.06, type: OscillatorType = "sine") {
    if (typeof window === "undefined") return;

    let context = this.ctx;
    if (!context) {
      context = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.ctx = context;
    }

    if (context.state === "suspended") {
      context.resume();
    }

    // gentle throttle to avoid audio overload
    const now = performance.now();
    if (now - this.lastNoteTime < 5) return; // Prevent outright audio crash
    this.lastNoteTime = now;

    const t = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    // Simple, clean plink envelope
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol * 0.5, t + 0.005); // Reduced volume
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); // Shorter decay

    osc.connect(gain).connect(context.destination);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  public destroy() {
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
