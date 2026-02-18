export type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle';
export type NoiseType = 'white' | 'brown' | 'pink' | 'velvet';
export type EnvelopeShape = 'piano' | 'strings' | 'percussive' | 'reverse';
export type FilterType = 'lowpass' | 'highpass' | 'bandpass';

export interface SoundParams {
  id?: string;
  name: string;
  attack: number;
  decay: number;
  envelopeShape: EnvelopeShape;
  baseFrequency: number;
  harmony: number;
  quantize: number; // 0 for continuous, >0 for steps per octave
  timbre: string;
  waveformPairs: WaveformType[];
  noiseAmount: number;
  noiseType: NoiseType;
  noiseModulation: number; // Jitters the oscillator frequency
  filterType: FilterType;
  filterCutoff: number;    // Glues the sound together (0 = off, 1-10000 = Hz)
  filterResonance: number; // Adds that "sculpted" peak
  combAmount: number;      // Feedback for the comb filter (0 to 0.95)
  combDelay: number;       // Delay time for the comb filter (0.0001 to 0.05s)
  vibratoDepth: number;
  vibratoRate: number;
  reverbAmount: number;
  echoAmount: number;
  echoDelay: number;
  createdAt?: number;
}

export const defaultSoundParams: SoundParams = {
  name: "New Sound",
  attack: 0.1,
  decay: 0.5,
  envelopeShape: 'piano',
  baseFrequency: 440,
  harmony: 0.5,
  quantize: 0,
  timbre: "bright",
  waveformPairs: ["sine"],
  noiseAmount: 0.1,
  noiseType: "white",
  noiseModulation: 0.2,
  filterType: 'lowpass',
  filterCutoff: 0, // Default to 0 (off)
  filterResonance: 1,
  combAmount: 0,
  combDelay: 0.01,
  vibratoDepth: 0,
  vibratoRate: 5,
  reverbAmount: 0.2,
  echoAmount: 0,
  echoDelay: 0.3,
};

export const GAME_PRESETS: SoundParams[] = [
  {
    ...defaultSoundParams,
    name: "Classic Laser",
    baseFrequency: 1200,
    waveformPairs: ["sawtooth"],
    envelopeShape: "percussive",
    decay: 0.25,
    combAmount: 0.8,
    combDelay: 0.002,
    noiseModulation: 0.1,
    filterCutoff: 8000,
  },
  {
    ...defaultSoundParams,
    name: "8-Bit Jump",
    baseFrequency: 330,
    waveformPairs: ["square"],
    envelopeShape: "piano",
    attack: 0.01,
    decay: 0.3,
    quantize: 12,
    vibratoDepth: 0.5,
    vibratoRate: 15,
  },
  {
    ...defaultSoundParams,
    name: "Mega Explosion",
    baseFrequency: 60,
    noiseType: "brown",
    noiseAmount: 0.9,
    waveformPairs: ["sine"],
    envelopeShape: "percussive",
    decay: 1.5,
    filterCutoff: 400,
    filterResonance: 15,
    reverbAmount: 0.6,
  },
  {
    ...defaultSoundParams,
    name: "Shiny Coin",
    baseFrequency: 880,
    harmony: 0.5,
    waveformPairs: ["sine", "triangle"],
    envelopeShape: "piano",
    decay: 0.2,
    reverbAmount: 0.4,
    echoAmount: 0.3,
    echoDelay: 0.1,
  },
  {
    ...defaultSoundParams,
    name: "Teleport Warp",
    baseFrequency: 110,
    waveformPairs: ["sawtooth"],
    envelopeShape: "reverse",
    attack: 0.8,
    decay: 0.1,
    noiseModulation: 0.6,
    combAmount: 0.5,
    combDelay: 0.01,
    vibratoDepth: 0.8,
    vibratoRate: 8,
  },
  {
    ...defaultSoundParams,
    name: "Retro Hit",
    baseFrequency: 220,
    noiseAmount: 0.5,
    noiseType: "white",
    waveformPairs: ["square"],
    envelopeShape: "percussive",
    decay: 0.1,
    filterCutoff: 2000,
    filterResonance: 8,
  },
  {
    ...defaultSoundParams,
    name: "Power Up",
    baseFrequency: 440,
    harmony: 1.0,
    waveformPairs: ["sine", "square"],
    envelopeShape: "strings",
    attack: 0.2,
    decay: 0.8,
    vibratoDepth: 0.3,
    vibratoRate: 6,
    quantize: 24,
  }
];
