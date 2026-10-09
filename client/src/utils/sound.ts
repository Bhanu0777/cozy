// Zero-dependency procedural Web Audio API sounds for COZY

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function toggleMute(muted?: boolean): boolean {
  if (muted !== undefined) {
    soundEnabled = !muted;
  } else {
    soundEnabled = !soundEnabled;
  }
  return soundEnabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

// Gentle bubbly pop when a message is sent or received
export function playPopSound() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    const now = ctx.currentTime;
    
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.08);
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.1);
  } catch {
    // AudioContext blocked or unsupported
  }
}

// Magical warm chime for Squeeze hugs
export function playSqueezeChime() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      const now = ctx.currentTime + idx * 0.06;
      
      osc.frequency.setValueAtTime(freq, now);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.85);
    });
  } catch {
    // AudioContext blocked
  }
}

// Procedural Ambiance Engine
class AmbiancePlayer {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private isPlaying = false;
  private currentType: string | null = null;

  start(type: 'rain' | 'fire' | 'lofi' | 'night', volume = 0.25) {
    this.stop();
    const ctx = getAudioContext();
    if (!ctx) return;
    this.ctx = ctx;

    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Generate specific noise profile
    if (type === 'rain') {
      // Pink/Brown noise for rain
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.05;
        b1 = 0.95 * b1 + white * 0.1;
        b2 = 0.85 * b2 + white * 0.2;
        output[i] = (b0 + b1 + b2) * 0.5;
      }
    } else if (type === 'fire') {
      // Crackle + low rumble
      for (let i = 0; i < bufferSize; i++) {
        const crackle = Math.random() > 0.996 ? (Math.random() * 2 - 1) * 2 : 0;
        output[i] = (Math.random() * 2 - 1) * 0.15 + crackle;
      }
    } else if (type === 'lofi') {
      // Vinyl static
      for (let i = 0; i < bufferSize; i++) {
        const dust = Math.random() > 0.998 ? (Math.random() * 2 - 1) * 1.5 : 0;
        output[i] = (Math.random() * 2 - 1) * 0.08 + dust;
      }
    } else {
      // Night breeze
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.1;
      }
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    if (type === 'rain') {
      filter.type = 'lowpass';
      filter.frequency.value = 900;
    } else if (type === 'fire') {
      filter.type = 'bandpass';
      filter.frequency.value = 400;
      filter.Q.value = 1.2;
    } else if (type === 'lofi') {
      filter.type = 'highpass';
      filter.frequency.value = 1200;
    } else {
      filter.type = 'lowpass';
      filter.frequency.value = 600;
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.2);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    whiteNoise.start();

    this.noiseNode = whiteNoise;
    this.gainNode = gain;
    this.filterNode = filter;
    this.isPlaying = true;
    this.currentType = type;
  }

  setVolume(vol: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  stop() {
    if (this.gainNode && this.ctx) {
      try {
        this.gainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
        setTimeout(() => {
          if (this.noiseNode) {
            (this.noiseNode as AudioBufferSourceNode).stop();
            this.noiseNode.disconnect();
            this.noiseNode = null;
          }
        }, 500);
      } catch {
        // ignore
      }
    }
    this.isPlaying = false;
    this.currentType = null;
  }

  getStatus() {
    return { isPlaying: this.isPlaying, currentType: this.currentType };
  }
}

export const ambiance = new AmbiancePlayer();
