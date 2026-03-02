// Web Audio API based sound system - no external dependencies needed

class AudioManager {
  private audioCtx: AudioContext | null = null;
  private enabled: boolean = true;
  private initialized: boolean = false;

  init() {
    if (this.initialized) return;
    try {
      this.audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.initialized = true;
    } catch {
      console.warn('Web Audio API not supported');
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.15) {
    if (!this.enabled || !this.audioCtx) return;
    
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {
      // Silently fail
    }
  }

  private playChord(frequencies: number[], duration: number, type: OscillatorType = 'sine', volume: number = 0.1) {
    frequencies.forEach(f => this.playTone(f, duration, type, volume));
  }

  spinStart() {
    this.playTone(200, 0.1, 'square', 0.08);
  }

  reelStop(index: number) {
    this.playTone(300 + index * 80, 0.08, 'square', 0.06);
  }

  winSmall() {
    setTimeout(() => this.playTone(523, 0.15, 'sine', 0.12), 0);
    setTimeout(() => this.playTone(659, 0.15, 'sine', 0.12), 100);
    setTimeout(() => this.playTone(784, 0.2, 'sine', 0.12), 200);
  }

  winMedium() {
    setTimeout(() => this.playChord([523, 659], 0.2, 'sine', 0.1), 0);
    setTimeout(() => this.playChord([659, 784], 0.2, 'sine', 0.1), 150);
    setTimeout(() => this.playChord([784, 1047], 0.3, 'sine', 0.1), 300);
    setTimeout(() => this.playChord([1047, 1319], 0.4, 'sine', 0.1), 500);
  }

  winBig() {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        this.playChord([523 + i * 50, 659 + i * 50, 784 + i * 50], 0.3, 'sine', 0.08);
      }, i * 120);
    }
  }

  fireballLand() {
    // Deep gong sound
    this.playTone(80, 0.8, 'sine', 0.2);
    this.playTone(160, 0.6, 'triangle', 0.15);
    setTimeout(() => this.playTone(120, 0.5, 'sine', 0.1), 100);
  }

  holdAndSpinTrigger() {
    // Dramatic ascending sequence
    const notes = [262, 330, 392, 523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.12), i * 100);
    });
  }

  holdAndSpinComplete() {
    // Fanfare
    const fanfare = [
      [523, 659, 784],
      [659, 784, 1047],
      [784, 1047, 1319],
      [1047, 1319, 1568],
    ];
    fanfare.forEach((chord, i) => {
      setTimeout(() => this.playChord(chord, 0.5, 'sine', 0.1), i * 250);
    });
  }

  jackpotWin() {
    // Extended celebration
    for (let i = 0; i < 16; i++) {
      setTimeout(() => {
        const freq = 400 + Math.sin(i * 0.5) * 300 + i * 30;
        this.playChord([freq, freq * 1.25, freq * 1.5], 0.4, 'sine', 0.08);
      }, i * 150);
    }
  }

  freeGamesTrigger() {
    const notes = [392, 494, 587, 698, 784, 988, 1175];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.4, 'triangle', 0.12);
      }, i * 120);
    });
  }

  countUp() {
    this.playTone(800 + Math.random() * 400, 0.05, 'square', 0.04);
  }

  buttonClick() {
    this.playTone(600, 0.05, 'square', 0.06);
  }

  grandJackpot() {
    // Epic ascending with harmony
    for (let i = 0; i < 24; i++) {
      setTimeout(() => {
        const base = 200 + i * 40;
        this.playChord([base, base * 1.25, base * 1.5, base * 2], 0.6, 'sine', 0.06);
      }, i * 100);
    }
  }
}

export const audioManager = new AudioManager();
