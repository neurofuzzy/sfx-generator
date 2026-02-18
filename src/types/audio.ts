export type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle';
export type NoiseType = 'white' | 'brown' | 'pink' | 'velvet';
export type EnvelopeShape = 'piano' | 'strings' | 'percussive' | 'reverse';
export type FilterType = 'lowpass' | 'highpass' | 'bandpass';
export type PlaybackMode = 'once' | 'repeat' | 'ping-pong';

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
  distortion: number;     // Crunch/Destroy amount (0 to 1)
  noiseAmount: number;
  noiseType: NoiseType;
  noiseModulation: number; // Jitters the oscillator frequency
  lfoAmount: number;       // Modulates volume
  lfoRate: number;         // LFO frequency in Hz
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
  // Arpeggiator
  sequenceOffsets: number[]; // Semitone offsets (e.g. [0, 4, 7, 12])
  sequenceSteps: number;    // 1 to 4
  sequenceBpm: number;      // Speed of the progression
  playbackMode: PlaybackMode;
  loopCount: number;         // Number of times to repeat (for 'repeat' and 'ping-pong')
  createdAt?: number;
}

export interface ComposerTrack {
  id: string;
  soundId: string | null;
  steps: boolean[];
  stepNotes: string[]; // Per-step musical note (e.g. "C4", "D4")
  volume: number;
}

export interface CompositionState {
  bpm: number;
  key: string;
  scale: string;
  tracks: ComposerTrack[];
}

export interface SavedLoop {
  id: string;
  name: string;
  state: CompositionState;
  sounds: SoundParams[]; // Snapshot of sounds used in this composition
  createdAt: number;
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
  distortion: 0,
  noiseAmount: 0.1,
  noiseType: "white",
  noiseModulation: 0.2,
  lfoAmount: 0,
  lfoRate: 5,
  filterType: 'lowpass',
  filterCutoff: 0, 
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
  playbackMode: 'once',
  loopCount: 1,
};

export const GAME_PRESETS: SoundParams[] = [
  // --- Musical Instruments ---
  {
    ...defaultSoundParams,
    name: "Deep Kick",
    attack: 0.001,
    decay: 0.4,
    envelopeShape: "percussive",
    baseFrequency: 55,
    frequencyDrift: -12,
    waveformPairs: ["sine"],
    distortion: 0.3,
    filterCutoff: 200,
    filterResonance: 5,
    reverbAmount: 0.05,
  },
  {
    ...defaultSoundParams,
    name: "Snare",
    attack: 0.005,
    decay: 0.2,
    envelopeShape: "percussive",
    baseFrequency: 180,
    waveformPairs: ["triangle"],
    noiseAmount: 0.8,
    noiseType: "white",
    distortion: 0.2,
    filterCutoff: 4000,
    filterResonance: 2,
    reverbAmount: 0.1,
  },
  {
    ...defaultSoundParams,
    name: "Cymbal",
    attack: 0.001,
    decay: 0.6,
    envelopeShape: "percussive",
    baseFrequency: 8000,
    waveformPairs: ["sine"],
    noiseAmount: 1.0,
    noiseType: "white",
    filterCutoff: 12000,
    reverbAmount: 0.3,
  },
  {
    ...defaultSoundParams,
    name: "Acid Bass",
    attack: 0.05,
    decay: 0.6,
    envelopeShape: "strings",
    baseFrequency: 110,
    waveformPairs: ["sawtooth", "square"],
    distortion: 0.5,
    filterCutoff: 1200,
    filterResonance: 12,
    lfoAmount: 0.2,
    lfoRate: 0.5,
  },
  {
    ...defaultSoundParams,
    name: "Soft Piano",
    attack: 0.02,
    decay: 1.2,
    envelopeShape: "piano",
    baseFrequency: 440,
    waveformPairs: ["sine", "triangle"],
    harmony: 0.01,
    reverbAmount: 0.4,
    filterCutoff: 2500,
  },
  {
    ...defaultSoundParams,
    name: "Ethereal Pad",
    attack: 0.8,
    decay: 1.5,
    envelopeShape: "strings",
    baseFrequency: 220,
    waveformPairs: ["sine", "sawtooth"],
    harmony: 0.5,
    vibratoDepth: 0.2,
    vibratoRate: 3,
    reverbAmount: 0.7,
    echoAmount: 0.3,
    echoDelay: 0.4,
    filterCutoff: 1500,
  },
  // --- Classic Game FX ---
  {
    ...defaultSoundParams,
    name: "Classic Laser",
    attack: 0.1,
    decay: 0.82,
    envelopeShape: "percussive",
    baseFrequency: 922,
    frequencyDrift: -24,
    harmony: 0.5,
    waveformPairs: ["sawtooth", "sine"],
    distortion: 0,
    noiseAmount: 0.1,
    noiseType: "white",
    noiseModulation: 0.1,
    lfoAmount: 0.73,
    lfoRate: 12.4,
    filterCutoff: 8000,
    filterResonance: 1,
    combAmount: 0.6,
    combDelay: 0.001,
    reverbAmount: 0.2,
    echoDelay: 0.21,
  },
  {
    ...defaultSoundParams,
    name: "8-Bit Jump",
    attack: 0.01,
    decay: 0.3,
    envelopeShape: "piano",
    baseFrequency: 330,
    frequencyDrift: 8,
    harmony: 0.5,
    quantize: 12,
    waveformPairs: ["square"],
    distortion: 0,
    noiseAmount: 0.1,
    noiseType: "white",
    noiseModulation: 0.2,
    vibratoDepth: 0.5,
    vibratoRate: 15,
    reverbAmount: 0.2,
    echoAmount: 0,
    echoDelay: 0.3,
  },
  {
    ...defaultSoundParams,
    name: "Mega Explosion",
    attack: 0.1,
    decay: 1.12,
    envelopeShape: "percussive",
    baseFrequency: 60,
    frequencyDrift: 0,
    harmony: 0.5,
    waveformPairs: ["sine"],
    distortion: 0.79,
    noiseAmount: 0.9,
    noiseType: "brown",
    noiseModulation: 0.2,
    filterCutoff: 400,
    filterResonance: 15,
    reverbAmount: 0.15,
    echoAmount: 0,
    echoDelay: 0.15,
  },
  {
    ...defaultSoundParams,
    name: "Shiny Coin",
    baseFrequency: 1318,
    sequenceSteps: 2,
    sequenceOffsets: [0, 5, 0, 0],
    sequenceBpm: 600,
    waveformPairs: ["sine"],
    envelopeShape: "piano",
    decay: 0.15,
    reverbAmount: 0.4,
    distortion: 0,
  },
  {
    ...defaultSoundParams,
    name: "Power Up",
    attack: 0.1,
    decay: 0.15,
    envelopeShape: "percussive",
    baseFrequency: 440,
    frequencyDrift: 0,
    harmony: 0.5,
    quantize: 12,
    timbre: "bright",
    waveformPairs: ["square"],
    distortion: 0,
    noiseAmount: 0.1,
    noiseType: "white",
    noiseModulation: 0.2,
    lfoAmount: 0,
    lfoRate: 5,
    filterType: "lowpass",
    filterCutoff: 0,
    filterResonance: 1,
    combAmount: 0,
    combDelay: 0.01,
    vibratoDepth: 0.3,
    vibratoRate: 10,
    reverbAmount: 0.3,
    echoAmount: 0,
    echoDelay: 0.3,
    sequenceOffsets: [0, 4, 7, 12],
    sequenceSteps: 4,
    sequenceBpm: 790,
    playbackMode: 'once',
    loopCount: 1
  },
  {
    ...defaultSoundParams,
    name: "Game Over",
    baseFrequency: 220,
    sequenceSteps: 3,
    sequenceOffsets: [0, -3, -7, 0],
    sequenceBpm: 180,
    waveformPairs: ["sawtooth"],
    envelopeShape: "strings",
    attack: 0.1,
    decay: 0.6,
    filterCutoff: 2000,
    reverbAmount: 0.6,
    distortion: 0,
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
    lfoAmount: 0.5,
    lfoRate: 12,
    distortion: 0,
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
    distortion: 0,
  },
];
