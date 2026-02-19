import { SoundParams, WaveformType, NoiseType, CompositionState, defaultSoundParams, EnvelopeShape, PlaybackMode } from "@/types/audio";

/**
 * Standard frequency map for musical note playback.
 */
const NOTE_FREQUENCIES: Record<string, number> = {
  "C3": 130.81, "C#3": 138.59, "D3": 146.83, "D#3": 155.56, "E3": 164.81, "F3": 174.61, "F#3": 185.00, "G3": 196.00, "G#3": 207.65, "A3": 220.00, "A#3": 233.08, "B3": 246.94,
  "C4": 261.63, "C#4": 277.18, "D4": 293.66, "D#4": 311.13, "E4": 329.63, "F4": 349.23, "F#4": 369.99, "G4": 392.00, "G#4": 415.30, "A4": 440.00, "A#4": 466.16, "B4": 493.88,
  "C5": 523.25, "C#5": 554.37, "D5": 587.33, "D#5": 622.25, "E5": 659.25, "F5": 698.46, "F#5": 739.99, "G5": 783.99, "G#5": 830.61, "A5": 880.00, "A#5": 932.33, "B5": 987.77,
};

/**
 * Core Procedural Synthesis Engine
 * 
 * Handles real-time Web Audio API scheduling, oscillator management, 
 * and effect processing.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private reverbBuffer: AudioBuffer | null = null;
  private compositionLoopInterval: NodeJS.Timeout | number | null = null;
  private activeNodes: Set<AudioScheduledSourceNode> = new Set();
  private continuousLoops: Map<string, { stop: () => void }> = new Map();
  private masterVolume: number = 1.0;

  async init() {
    if (!this.ctx) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (!AudioContextClass) {
        console.error("Web Audio API not supported in this browser.");
        return;
      }

      this.ctx = new AudioContextClass();
      this.compressor = this.ctx.createDynamicsCompressor();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;

      this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      this.compressor.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      await this.generateReverbBuffer();
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  setMasterVolume(val: number) {
    this.masterVolume = Math.max(0, Math.min(1.5, val));
  }

  getAnalyser() {
    return this.analyser;
  }

  generateParamsFromSeed(seed: number): SoundParams {
    const nextRand = this.mulberry32(seed);
    const pick = <T,>(arr: T[]): T => arr[Math.floor(nextRand() * arr.length)];
    const range = (min: number, max: number) => min + nextRand() * (max - min);
    const intRange = (min: number, max: number) => Math.floor(range(min, max + 1));

    const waveforms: WaveformType[] = ["sine", "square", "sawtooth", "triangle"];
    const noiseTypes: NoiseType[] = ["white", "brown", "pink", "velvet"];
    const envelopeShapes: EnvelopeShape[] = ["piano", "strings", "percussive", "reverse"];
    const playbackModes: PlaybackMode[] = ["once", "repeat", "ping-pong"];

    const w1 = pick(waveforms);
    const w2 = pick(waveforms);
    const waveformPairs = nextRand() > 0.3 ? [w1, w2] : [w1];

    return {
      ...defaultSoundParams,
      name: `Seed #${seed}`,
      attack: range(0, 0.5),
      decay: range(0.1, 1.5),
      envelopeShape: pick(envelopeShapes),
      baseFrequency: range(40, 1200),
      frequencyDrift: intRange(-24, 24),
      harmony: range(0, 1),
      quantize: nextRand() > 0.5 ? pick([0, 12, 24, 48]) : 0,
      waveformPairs: waveformPairs as WaveformType[],
      distortion: nextRand() > 0.5 ? range(0, 1) : 0,
      noiseAmount: range(0, 0.8),
      noiseType: pick(noiseTypes),
      lfoAmount: nextRand() > 0.7 ? range(0, 1) : 0,
      lfoRate: range(0.1, 15),
      filterCutoff: nextRand() > 0.3 ? range(200, 8000) : 0,
      filterResonance: range(0, 15),
      combAmount: nextRand() > 0.8 ? range(0, 0.9) : 0,
      combDelay: range(0.001, 0.03),
      vibratoDepth: nextRand() > 0.7 ? range(0, 0.8) : 0,
      vibratoRate: range(1, 15),
      reverbAmount: range(0.1, 0.8),
      echoAmount: nextRand() > 0.8 ? range(0, 0.6) : 0,
      echoDelay: range(0.1, 0.5),
      sequenceSteps: intRange(1, 4),
      sequenceOffsets: [intRange(-12, 12), intRange(-12, 12), intRange(-12, 12), intRange(-12, 12)],
      sequenceBpm: intRange(120, 800),
      playbackMode: pick(playbackModes),
      loopCount: intRange(1, 4),
    };
  }

  private mulberry32(a: number) {
    return function () {
      let t = (a += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  private async generateReverbBuffer() {
    if (!this.ctx) return;
    const length = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
      }
    }
    this.reverbBuffer = buffer;
  }

  private makeDistortionCurve(amount: number) {
    const k = amount * 400;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  private quantizeFreq(freq: number, steps: number): number {
    if (steps <= 0) return freq;
    const logFreq = Math.log2(freq / 440);
    const quantizedLogFreq = Math.round(logFreq * steps) / steps;
    return 440 * Math.pow(2, quantizedLogFreq);
  }

  private createNoiseBuffer(type: NoiseType): AudioBuffer {
    if (!this.ctx) throw new Error("Audio Context not initialized");
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = 2 * sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const output = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    } else if (type === 'pink') {
      let b0, b1, b2, b3, b4, b5, b6;
      b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }
    } else if (type === 'brown') {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        const out = (lastOut + (0.02 * white)) / 1.02;
        lastOut = out;
        output[i] = out * 3.5;
      }
    } else if (type === 'velvet') {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() < 0.02 ? (Math.random() < 0.5 ? 1 : -1) : 0;
      }
    }
    return buffer;
  }

  private trackNode(node: AudioScheduledSourceNode) {
    this.activeNodes.add(node);
    node.onended = () => {
      this.activeNodes.delete(node);
    };
  }

  private triggerNote(ctx: BaseAudioContext, time: number, freq: number, params: SoundParams, destination: AudioNode, gainScale: number = 1.0) {
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);

    const peakLevel = (0.6 / (params.waveformPairs.length || 1)) * (1 + (params.distortion ?? 0) * 1.5) * gainScale;
    const duration = params.attack + params.decay;

    if (params.envelopeShape === 'piano') {
      env.gain.exponentialRampToValueAtTime(peakLevel, time + Math.max(0.001, params.attack));
      env.gain.exponentialRampToValueAtTime(0.001, time + duration);
    } else if (params.envelopeShape === 'strings') {
      env.gain.linearRampToValueAtTime(peakLevel, time + params.attack);
      env.gain.linearRampToValueAtTime(0, time + duration);
    } else if (params.envelopeShape === 'percussive') {
      env.gain.exponentialRampToValueAtTime(peakLevel, time + 0.005);
      env.gain.exponentialRampToValueAtTime(0.0001, time + 0.005 + params.decay);
    } else if (params.envelopeShape === 'reverse') {
      env.gain.linearRampToValueAtTime(peakLevel, time + params.attack);
      env.gain.linearRampToValueAtTime(0.001, time + params.attack + 0.01);
    }

    const distorter = ctx.createWaveShaper();
    if (params.distortion > 0) {
      distorter.curve = this.makeDistortionCurve(params.distortion);
      distorter.oversample = '4x';
    }

    env.connect(distorter);
    distorter.connect(destination);

    if (params.noiseAmount > 0) {
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = this.createNoiseBuffer(params.noiseType);
      noiseSource.loop = true;
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = params.noiseAmount * 0.3;
      noiseSource.connect(noiseGain);
      noiseGain.connect(env);
      noiseSource.start(time);
      noiseSource.stop(time + duration + 0.1);
      this.trackNode(noiseSource);
    }

    params.waveformPairs.forEach((wf, index) => {
      let finalFreq = freq * (index === 1 ? (1 + params.harmony) : 1);
      finalFreq = this.quantizeFreq(finalFreq, params.quantize);

      const osc = ctx.createOscillator();
      osc.type = wf as OscillatorType;
      osc.frequency.setValueAtTime(finalFreq, time);

      if (params.frequencyDrift !== 0) {
        const driftMultiplier = Math.pow(2, params.frequencyDrift / 12);
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, finalFreq * driftMultiplier), time + duration);
      }

      if (params.vibratoDepth > 0) {
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = params.vibratoRate;
        lfoGain.gain.value = params.vibratoDepth * 50;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(time);
        lfo.stop(time + duration);
        this.trackNode(lfo);
      }

      osc.connect(env);
      osc.start(time);
      osc.stop(time + duration);
      this.trackNode(osc);
    });
  }

  private playInternal(params: SoundParams, timeOffset: number, frequencyOverride: number | undefined, volumeMultiplier: number, destination: AudioNode): { duration: number } {
    if (!this.ctx) return { duration: 0 };
    const now = this.ctx.currentTime + timeOffset;
    const baseFreq = frequencyOverride || params.baseFrequency;

    const sequenceGain = this.ctx.createGain();
    sequenceGain.gain.setValueAtTime(1.0, now);

    const lfoVca = this.ctx.createGain();
    lfoVca.gain.setValueAtTime(1.0, now);
    if (params.lfoAmount > 0) {
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = params.lfoRate;
      lfoGain.gain.value = params.lfoAmount * 0.5;
      lfoVca.gain.value = 1.0 - (params.lfoAmount * 0.5);
      lfo.connect(lfoGain);
      lfoGain.connect(lfoVca.gain);
      lfo.start(now);
      const totalLen = (params.sequenceSteps * (60 / params.sequenceBpm)) + params.attack + params.decay + 5;
      lfo.stop(now + totalLen);
      this.trackNode(lfo);
    }

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const cutoffFreq = params.filterCutoff === 0 ? 20000 : Math.max(20, params.filterCutoff);
    filter.frequency.setValueAtTime(cutoffFreq, now);
    filter.Q.setValueAtTime(params.filterResonance, now);

    const combSum = this.ctx.createGain();
    const combDelay = this.ctx.createDelay(0.1);
    const combFeedback = this.ctx.createGain();
    combDelay.delayTime.setValueAtTime(Math.max(0.0001, params.combDelay), now);
    combFeedback.gain.setValueAtTime(params.combAmount, now);

    sequenceGain.connect(lfoVca);
    lfoVca.connect(combSum);
    combSum.connect(filter);

    if (params.combAmount > 0) {
      combSum.connect(combDelay);
      combDelay.connect(combFeedback);
      combFeedback.connect(combSum);
    }

    filter.connect(destination);

    if (params.reverbAmount > 0 && this.reverbBuffer) {
      const reverb = this.ctx.createConvolver();
      reverb.buffer = this.reverbBuffer;
      const reverbGain = this.ctx.createGain();
      reverbGain.gain.value = params.reverbAmount * 0.5;
      filter.connect(reverb);
      reverb.connect(reverbGain);
      reverbGain.connect(destination);
    }

    if (params.echoAmount > 0) {
      const delay = this.ctx.createDelay(2.0);
      delay.delayTime.setValueAtTime(params.echoDelay, now);
      const feedback = this.ctx.createGain();
      feedback.gain.setValueAtTime(0.8, now);
      filter.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(destination);
    }

    const stepDuration = 60 / params.sequenceBpm;
    let sequence: number[] = [];
    const baseOffsets = params.sequenceOffsets.slice(0, params.sequenceSteps);

    if (params.playbackMode === 'once') {
      sequence = baseOffsets;
    } else if (params.playbackMode === 'repeat') {
      for (let r = 0; r < params.loopCount; r++) sequence.push(...baseOffsets);
    } else if (params.playbackMode === 'ping-pong') {
      const cycle = [...baseOffsets, ...([...baseOffsets].reverse().slice(1, -1))];
      for (let r = 0; r < params.loopCount; r++) sequence.push(...cycle);
    }

    sequence.forEach((offset, i) => {
      const freq = baseFreq * Math.pow(2, offset / 12);
      this.triggerNote(this.ctx!, now + i * stepDuration, freq, params, sequenceGain);
    });

    return { duration: sequence.length * stepDuration };
  }

  play(params: SoundParams, timeOffset: number = 0, frequencyOverride?: number, volumeMultiplier: number = 1.0) {
    if (!this.ctx || !this.compressor) return;

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.75 * this.masterVolume * volumeMultiplier, this.ctx.currentTime + timeOffset);
    masterGain.connect(this.compressor);

    const { duration } = this.playInternal(params, timeOffset, frequencyOverride, volumeMultiplier, masterGain);

    const cleanupTime = duration + params.attack + params.decay + 5;
    setTimeout(() => {
      masterGain.disconnect();
    }, (timeOffset + cleanupTime) * 1000);
  }

  playContinuous(params: SoundParams, volumeMultiplier: number = 1.0): string {
    if (!this.ctx || !this.compressor) return "";
    const id = Math.random().toString(36).substring(7);

    const loopParams = { ...params, playbackMode: 'once' as PlaybackMode, loopCount: 1 };
    const stepDuration = 60 / params.sequenceBpm;
    const iterationDuration = params.sequenceSteps * stepDuration;

    let isPlaying = true;
    let activeGains: GainNode[] = [];

    const trigger = () => {
      if (!isPlaying || !this.ctx || !this.compressor) return;

      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.75 * this.masterVolume * volumeMultiplier, this.ctx.currentTime);
      masterGain.connect(this.compressor);
      activeGains.push(masterGain);

      this.playInternal(loopParams, 0, undefined, volumeMultiplier, masterGain);

      // Schedule next trigger
      setTimeout(trigger, iterationDuration * 1000);

      // Cleanup this gain node after the arpeggio and tail are done
      const cleanupTime = iterationDuration + params.attack + params.decay + 5;
      setTimeout(() => {
        activeGains = activeGains.filter(g => g !== masterGain);
        try {
          masterGain.disconnect();
        } catch { }
      }, cleanupTime * 1000);
    };

    trigger();

    this.continuousLoops.set(id, {
      stop: () => {
        // Simply set isPlaying to false.
        // The current iteration triggered by playInternal will finish naturally 
        // because the oscillators have their own stop() times and envelopes.
        isPlaying = false;
        this.continuousLoops.delete(id);
      }
    });

    return id;
  }

  stopContinuous(id: string) {
    const loop = this.continuousLoops.get(id);
    if (loop) {
      loop.stop();
    }
  }

  stopAll() {
    this.stopComposition();
    this.continuousLoops.forEach(loop => loop.stop());
    this.activeNodes.forEach(node => {
      try {
        node.stop();
        node.disconnect();
      } catch { }
    });
    this.activeNodes.clear();
  }

  stopComposition() {
    if (this.compositionLoopInterval) {
      clearInterval(this.compositionLoopInterval);
      this.compositionLoopInterval = null;
    }
  }

  playComposition(composition: CompositionState, library: SoundParams[], onStep: (step: number) => void) {
    if (!this.ctx) return;
    this.stopComposition();

    let currentStep = 0;
    const stepDuration = 60 / composition.bpm / 4;

    const runStep = () => {
      if (!this.ctx) return;
      onStep(currentStep);

      composition.tracks.forEach(track => {
        if (track.steps[currentStep] && track.soundId) {
          const sound = library.find(s => s.id === track.soundId);
          if (sound) {
            const freq = NOTE_FREQUENCIES[track.stepNotes[currentStep]] || 440;
            this.play(sound, 0.05, freq);
          }
        }
      });
      currentStep = (currentStep + 1) % 8;
    };

    runStep();
    this.compositionLoopInterval = setInterval(runStep, stepDuration * 1000);
  }

  async exportCompositionToWav(composition: CompositionState, library: SoundParams[]): Promise<Blob> {
    const sampleRate = 44100;
    const stepDuration = 60 / composition.bpm / 4;
    const totalDuration = stepDuration * 8 + 2;

    const offlineCtx = new OfflineAudioContext(1, Math.ceil(sampleRate * totalDuration), sampleRate);
    const compressor = offlineCtx.createDynamicsCompressor();
    compressor.connect(offlineCtx.destination);

    composition.tracks.forEach(track => {
      if (!track.soundId) return;
      const sound = library.find(s => s.id === track.soundId);
      if (!sound) return;

      track.steps.forEach((isActive, idx) => {
        if (isActive) {
          const time = idx * stepDuration;
          const freq = NOTE_FREQUENCIES[track.stepNotes[idx]] || 440;
          const masterGain = offlineCtx.createGain();
          masterGain.gain.value = 0.5 * this.masterVolume;
          masterGain.connect(compressor);
          this.triggerNote(offlineCtx, time, freq, sound, masterGain);
        }
      });
    });

    const renderedBuffer = await offlineCtx.startRendering();
    return this.audioBufferToWav(renderedBuffer);
  }

  async exportToWav(params: SoundParams): Promise<Blob> {
    const sampleRate = 44100;
    const stepDuration = 60 / params.sequenceBpm;

    let sequence: number[] = [];
    const baseOffsets = params.sequenceOffsets.slice(0, params.sequenceSteps);
    if (params.playbackMode === 'once') {
      sequence = baseOffsets;
    } else if (params.playbackMode === 'repeat') {
      for (let r = 0; r < params.loopCount; r++) sequence.push(...baseOffsets);
    } else if (params.playbackMode === 'ping-pong') {
      const cycle = [...baseOffsets, ...([...baseOffsets].reverse().slice(1, -1))];
      for (let r = 0; r < params.loopCount; r++) sequence.push(...cycle);
    }

    const totalDuration = (sequence.length * stepDuration) + params.attack + params.decay + 3;
    const offlineCtx = new OfflineAudioContext(1, Math.ceil(sampleRate * (totalDuration + 1)), sampleRate);

    const compressor = offlineCtx.createDynamicsCompressor();
    compressor.connect(offlineCtx.destination);

    const masterGain = offlineCtx.createGain();
    masterGain.gain.setValueAtTime(0.75 * this.masterVolume, 0);
    masterGain.connect(compressor);

    sequence.forEach((offset, i) => {
      const freq = params.baseFrequency * Math.pow(2, offset / 12);
      this.triggerNote(offlineCtx, i * stepDuration, freq, params, masterGain);
    });

    const renderedBuffer = await offlineCtx.startRendering();
    return this.audioBufferToWav(renderedBuffer);
  }

  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArr = new ArrayBuffer(length);
    const view = new DataView(bufferArr);
    const channels = [];
    let i, sample, offset = 0, pos = 0;

    const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
    const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    for (i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));

    while (pos < length) {
      for (i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF);
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([bufferArr], { type: 'audio/wav' });
  }
}

export const audioEngine = new AudioEngine();
