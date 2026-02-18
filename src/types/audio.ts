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
  frequencyDrift: number; // Semitone offset over time (-24 to 24)
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
  // Sequencer
  sequenceOffsets: number[]; // Semitone offsets (e.g. [0, 4, 7, 12])
  sequenceSteps: number;    // 1 to 4
  sequenceBpm: number;      // Speed of the progression
  createdAt?: number;
}

export const defaultSoundParams: SoundParams = {
  name: "New Sound",
  attack: 0.1,
  decay: 0.5,
  envelopeShape: 'piano',
  baseFrequency: 440,
  frequencyDrift: 0,
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
  sequenceOffsets: [0, 0, 0, 0],
  sequenceSteps: 1,
  sequenceBpm: 120,
};

export const GAME_PRESETS: SoundParams[] = [
  {
    ...defaultSoundParams,
    name: "Classic Laser",
    baseFrequency: 1600,
    frequencyDrift: -24, // Sharp downward slide for "pew"
    waveformPairs: ["sawtooth"],
    envelopeShape: "percussive",
    decay: 0.15,
    combAmount: 0.6,
    combDelay: 0.001,
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
    baseFrequency: 1318, // E6
    sequenceSteps: 2,
    sequenceOffsets: [0, 5, 0, 0], // E -> A (classic ca-ching)
    sequenceBpm: 600,
    waveformPairs: ["sine"],
    envelopeShape: "piano",
    decay: 0.15,
    reverbAmount: 0.4,
  },
  {
    ...defaultSoundParams,
    name: "Power Up",
    baseFrequency: 440,
    sequenceSteps: 4,
    sequenceOffsets: [0, 4, 7, 12], // Major Arpeggio
    sequenceBpm: 400,
    waveformPairs: ["square"],
    envelopeShape: "percussive",
    decay: 0.15,
    vibratoDepth: 0.3,
    vibratoRate: 10,
    quantize: 12,
    reverbAmount: 0.3,
  },
  {
    ...defaultSoundParams,
    name: "Game Over",
    baseFrequency: 220,
    sequenceSteps: 3,
    sequenceOffsets: [0, -3, -7, 0], // Minor descent
    sequenceBpm: 180,
    waveformPairs: ["sawtooth"],
    envelopeShape: "strings",
    attack: 0.1,
    decay: 0.6,
    filterCutoff: 2000,
    reverbAmount: 0.6,
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
];