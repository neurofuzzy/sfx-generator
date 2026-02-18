import { SoundParams, WaveformType, NoiseType, CompositionState } from "@/types/audio";

const NOTE_FREQUENCIES: Record<string, number> = {
  "C3": 130.81, "C#3": 138.59, "D3": 146.83, "D#3": 155.56, "E3": 164.81, "F3": 174.61, "F#3": 185.00, "G3": 196.00, "G#3": 207.65, "A3": 220.00, "A#3": 233.08, "B3": 246.94,
  "C4": 261.63, "C#4": 277.18, "D4": 293.66, "D#4": 311.13, "E4": 329.63, "F4": 349.23, "F#4": 369.99, "G4": 392.00, "G#4": 415.30, "A4": 440.00, "A#4": 466.16, "B4": 493.88,
  "C5": 523.25, "C#5": 554.37, "D5": 587.33, "D#5": 622.25, "E5": 659.25, "F5": 698.46, "F#5": 739.99, "G5": 783.99, "G#5": 830.61, "A5": 880.00, "A#5": 932.33, "B5": 987.77,
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private reverbBuffer: AudioBuffer | null = null;
  private compositionLoopInterval: any = null;
  private activeNodes: Set<AudioScheduledSourceNode> = new Set();

  async init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
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

  getAnalyser() {
    return this.analyser;
  }

  private async generateReverbBuffer() {
    if (!this.ctx) return;
    const length = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
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
    if (steps === 0) return freq;
    const logFreq = Math.log2(freq / 440);
    const quantizedLogFreq = Math.round(logFreq * steps) / steps;
    return 440 * Math.pow(2, quantizedLogFreq);
  }

  private createNoiseBuffer(type: NoiseType): AudioBuffer {
    const sampleRate = this.ctx!.sampleRate;
    const bufferSize = 2 * sampleRate;
    const buffer = this.ctx!.createBuffer(1, bufferSize, sampleRate);
    const output = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
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
        if (Math.random() < 0.02) {
          output[i] = Math.random() < 0.5 ? 1 : -1;
        } else {
          output[i] = 0;
        }
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
      
      const additiveNoiseGain = ctx.createGain();
      additiveNoiseGain.gain.value = params.noiseAmount * 0.3;
      noiseSource.connect(additiveNoiseGain);
      additiveNoiseGain.connect(env);
      
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
        const targetFreq = finalFreq * driftMultiplier;
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, targetFreq), time + duration);
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

  play(params: SoundParams, timeOffset: number = 0, frequencyOverride?: number) {
    if (!this.ctx || !this.compressor) return;

    const now = this.ctx.currentTime + timeOffset;
    const baseFreq = frequencyOverride || params.baseFrequency;
    
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.75, now);

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
      const totalDuration = (params.sequenceSteps * (60 / params.sequenceBpm)) + params.attack + params.decay + 5;
      lfo.stop(now + totalDuration);
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

    masterGain.connect(lfoVca);
    lfoVca.connect(combSum);
    combSum.connect(filter);

    if (params.combAmount > 0) {
      combSum.connect(combDelay);
      combDelay.connect(combFeedback);
      combFeedback.connect(combSum);
    }
    
    filter.connect(this.compressor);

    if (params.reverbAmount > 0 && this.reverbBuffer) {
      const reverb = this.ctx.createConvolver();
      reverb.buffer = this.reverbBuffer;
      const reverbGain = this.ctx.createGain();
      reverbGain.gain.value = params.reverbAmount * 0.5;
      filter.connect(reverb);
      reverb.connect(reverbGain);
      reverbGain.connect(this.compressor);
    }

    if (params.echoAmount > 0) {
      const delay = this.ctx.createDelay(2.0);
      delay.delayTime.setValueAtTime(params.echoDelay, now);
      const feedback = this.ctx.createGain();
      feedback.gain.setValueAtTime(0.8, now);
      filter.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(this.compressor);
    }

    const stepDuration = 60 / params.sequenceBpm;
    let sequence: number[] = [];
    const baseOffsets = params.sequenceOffsets.slice(0, params.sequenceSteps);

    if (params.playbackMode === 'once') {
      sequence = baseOffsets;
    } else if (params.playbackMode === 'repeat') {
      for (let r = 0; r < params.loopCount; r++) {
        sequence.push(...baseOffsets);
      }
    } else if (params.playbackMode === 'ping-pong') {
      const reverseOffsets = [...baseOffsets].reverse().slice(1, -1);
      const cycle = [...baseOffsets, ...reverseOffsets];
      for (let r = 0; r < params.loopCount; r++) {
        sequence.push(...cycle);
      }
    }

    sequence.forEach((offsetSemitones, i) => {
      const freqMultiplier = Math.pow(2, offsetSemitones / 12);
      const freq = baseFreq * freqMultiplier;
      this.triggerNote(this.ctx!, now + i * stepDuration, freq, params, masterGain);
    });

    const totalDuration = (sequence.length * stepDuration) + params.attack + params.decay + 5;
    setTimeout(() => {
        masterGain.disconnect();
        filter.disconnect();
    }, totalDuration * 1000);
  }

  stopAll() {
    this.stopComposition();
    this.activeNodes.forEach(node => {
      try {
        node.stop();
        node.disconnect();
      } catch (e) {
        // Node might already be stopped
      }
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
    const stepDuration = 60 / composition.bpm / 4; // 16th notes
    
    const runStep = () => {
      if (!this.ctx) return;
      const nextTime = this.ctx.currentTime + 0.1;
      onStep(currentStep);

      composition.tracks.forEach(track => {
        if (track.steps[currentStep] && track.soundId) {
          const sound = library.find(s => s.id === track.soundId);
          if (sound) {
            const noteName = track.stepNotes[currentStep];
            const freq = NOTE_FREQUENCIES[noteName] || 440;
            this.play(sound, 0.1, freq);
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

      track.steps.forEach((isActive, stepIdx) => {
        if (isActive) {
          const time = stepIdx * stepDuration;
          const noteName = track.stepNotes[stepIdx];
          const freq = NOTE_FREQUENCIES[noteName] || 440;
          
          const masterGain = offlineCtx.createGain();
          masterGain.gain.value = 0.5;
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

    const totalDuration = (sequence.length * stepDuration) + params.attack + params.decay + (params.echoAmount > 0 ? 3 : 1);
    const offlineCtx = new OfflineAudioContext(1, Math.ceil(sampleRate * (totalDuration + 1)), sampleRate);

    const now = 0;
    const compressor = offlineCtx.createDynamicsCompressor();
    compressor.connect(offlineCtx.destination);

    const masterGain = offlineCtx.createGain();
    masterGain.gain.setValueAtTime(0.75, now);
    masterGain.connect(compressor);

    sequence.forEach((offsetSemitones, i) => {
      const freqMultiplier = Math.pow(2, offsetSemitones / 12);
      const freq = params.baseFrequency * freqMultiplier;
      this.triggerNote(offlineCtx, now + i * stepDuration, freq, params, masterGain);
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
    let i;
    let sample;
    let offset = 0;
    let pos = 0;

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
