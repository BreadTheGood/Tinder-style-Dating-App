class AudioService {
  private ctx: AudioContext | null = null;

  private getContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
       this.ctx.resume();
    }
    return this.ctx;
  }

  // Play a soft "pop" for sending a message
  playSend() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch(e) {}
  }

  // Play a gentle double-pop for receiving a message
  playReceive() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      
      const playPop = (time: number, freq: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(freq + 200, time + 0.05);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.1, time + 0.01);
        gain.gain.linearRampToValueAtTime(0, time + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.08);
      };
      
      playPop(now, 700);
      playPop(now + 0.1, 900);
    } catch(e) {}
  }

  // Play a bright, happy chime for a match
  playMatch() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      
      const playTone = (time: number, freq: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.15, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
      };
      
      playTone(now, 523.25, 0.4); // C5
      playTone(now + 0.15, 659.25, 0.4); // E5
      playTone(now + 0.3, 783.99, 0.6); // G5
      playTone(now + 0.45, 1046.50, 1.0); // C6
    } catch(e) {}
  }

  // Play a bubbly, exciting sound for receiving a drink
  playDrink() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      
      const playBubble = (time: number, freq: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(freq + 400, time + 0.1);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.2, time + 0.02);
        gain.gain.linearRampToValueAtTime(0, time + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.1);
      };
      
      playBubble(now, 400);
      playBubble(now + 0.1, 550);
      playBubble(now + 0.2, 700);
      playBubble(now + 0.3, 850);
      playBubble(now + 0.45, 1200);
    } catch(e) {}
  }
}

export const audio = new AudioService();
