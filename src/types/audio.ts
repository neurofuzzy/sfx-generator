export type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle';
export type NoiseType = 'white' | 'brown' | 'pink' | 'velvet';
export type EnvelopeShape = 'linear' | 'exponential';

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
  filterCutoff: number;    // Glues the sound together
  filterResonance: number; // Adds that "sculpted" peak
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
  envelopeShape: 'exponential',
  baseFrequency: 440,
  harmony: 0.5,
  quantize: 0,
  timbre: "bright",
  waveformPairs: ["sine"],
  noiseAmount: 0.1,
  noiseType: "white",
  noiseModulation: 0.2,
  filterCutoff: 2000,
  filterResonance: 5,
  vibratoDepth: 0,
  vibratoRate: 5,
  reverbAmount: 0.2,
  echoAmount: 0,
  echoDelay: 0.3,
};
