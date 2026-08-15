/**
 * WorkStash Sound Pack — Web Audio API synthesis
 * Zero external files. All tones are generated programmatically.
 */

let _ctx: AudioContext | null = null;

function ctx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}

type WaveType = "sine" | "triangle" | "sawtooth" | "square";

interface ToneOpts {
  freq: number;
  endFreq?: number;
  duration: number;
  volume?: number;
  wave?: WaveType;
  attack?: number;
  decay?: number;
  delay?: number;
}

function tone(ac: AudioContext, opts: ToneOpts) {
  const { freq, endFreq = freq, duration, volume = 0.18, wave = "sine", attack = 0.008, decay = duration, delay = 0 } = opts;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = wave;
  const t0 = ac.currentTime + delay;
  osc.frequency.setValueAtTime(freq, t0);
  if (endFreq !== freq) osc.frequency.linearRampToValueAtTime(endFreq, t0 + duration);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
  osc.start(t0);
  osc.stop(t0 + decay + 0.01);
}

export function playClick(): void {
  const ac = ctx();
  tone(ac, { freq: 820, endFreq: 660, duration: 0.07, volume: 0.12, wave: "sine", attack: 0.004, decay: 0.065 });
}

export function playComplete(): void {
  const ac = ctx();
  tone(ac, { freq: 880, duration: 0.18, volume: 0.15, wave: "sine", attack: 0.008, decay: 0.16 });
  tone(ac, { freq: 1320, duration: 0.22, volume: 0.12, wave: "sine", attack: 0.01, decay: 0.20, delay: 0.1 });
}

export function playCreate(): void {
  const ac = ctx();
  tone(ac, { freq: 440, endFreq: 660, duration: 0.14, volume: 0.13, wave: "sine", attack: 0.005, decay: 0.12 });
}

export function playArchive(): void {
  const ac = ctx();
  tone(ac, { freq: 700, endFreq: 380, duration: 0.18, volume: 0.11, wave: "triangle", attack: 0.006, decay: 0.17 });
}

export function playDefrag(): void {
  const ac = ctx();
  tone(ac, { freq: 523.25, duration: 0.25, volume: 0.13, wave: "sine", attack: 0.01, decay: 0.22 });
  tone(ac, { freq: 659.25, duration: 0.25, volume: 0.13, wave: "sine", attack: 0.01, decay: 0.22, delay: 0.12 });
  tone(ac, { freq: 783.99, duration: 0.30, volume: 0.12, wave: "sine", attack: 0.01, decay: 0.28, delay: 0.24 });
  tone(ac, { freq: 1046.5, duration: 0.35, volume: 0.10, wave: "sine", attack: 0.01, decay: 0.32, delay: 0.36 });
}

export function playTagSpotlight(): void {
  const ac = ctx();
  tone(ac, { freq: 1047, endFreq: 1318, duration: 0.18, volume: 0.10, wave: "sine", attack: 0.006, decay: 0.16 });
}

export function playDrop(): void {
  const ac = ctx();
  tone(ac, { freq: 280, endFreq: 160, duration: 0.12, volume: 0.14, wave: "triangle", attack: 0.004, decay: 0.11 });
}

export function playSubtaskToggle(): void {
  const ac = ctx();
  tone(ac, { freq: 960, endFreq: 760, duration: 0.055, volume: 0.09, wave: "sine", attack: 0.003, decay: 0.05 });
}

export function playError(): void {
  const ac = ctx();
  tone(ac, { freq: 320, endFreq: 280, duration: 0.12, volume: 0.10, wave: "sawtooth", attack: 0.004, decay: 0.11 });
  tone(ac, { freq: 280, endFreq: 240, duration: 0.10, volume: 0.08, wave: "sawtooth", attack: 0.004, decay: 0.09, delay: 0.10 });
}

export function playThemeToggle(): void {
  const ac = ctx();
  tone(ac, { freq: 660, endFreq: 1047, duration: 0.20, volume: 0.10, wave: "sine", attack: 0.008, decay: 0.18 });
}
