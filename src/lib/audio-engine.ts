import { SoundParams, WaveformType, NoiseType } from "@/types/audio";

class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private reverbBuffer: AudioBuffer | null = null;

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
    const k = amount * 400; // Increase the multiplier for more intense crunch
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

  private triggerNote(ctx: BaseAudioContext, time: number, freq: number, params: SoundParams, destination: AudioNode) {
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    
    const peakLevel = (0.6 / (params.waveformPairs.length || 1)) * (1 + (params.distortion ?? 0) * 1.5);
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
    
    // Distorter (Waveshaper)
    const distorter = ctx.createWaveShaper();
    if (params.distortion > 0) {
      distorter.curve = this.makeDistortionCurve(params.distortion);
      distorter.oversample = '4x';
    }
    
    env.connect(distorter);
    distorter.connect(destination);

    // Noise layer per note
    let noiseModNode: GainNode | null = null;
    if (params.noiseAmount > 0 || params.noiseModulation > 0) {
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = this.createNoiseBuffer(params.noiseType);
      noiseSource.loop = true;
      
      const additiveNoiseGain = ctx.createGain();
      additiveNoiseGain.gain.value = params.noiseAmount * 0.3;
      noiseSource.connect(additiveNoiseGain);
      additiveNoiseGain.connect(env);
      
      noiseSource.start(time);
      noiseSource.stop(time + duration + 0.1);

      if (params.noiseModulation > 0) {
        noiseModNode = ctx.createGain();
        noiseModNode.gain.value = params.noiseModulation * 500;
        noiseSource.connect(noiseModNode);
      }
    }

    // Oscillators per note
    params.waveformPairs.forEach((wf, index) => {
      let finalFreq = freq * (index === 1 ? (1 + params.harmony) : 1);
      finalFreq = this.quantizeFreq(finalFreq, params.quantize);
      
      const osc = ctx.createOscillator();
      osc.type = wf as OscillatorType;
      osc.frequency.setValueAtTime(finalFreq, time);

      // Apply Frequency Drift
      if (params.frequencyDrift !== 0) {
        const driftMultiplier = Math.pow(2, params.frequencyDrift / 12);
        const targetFreq = finalFreq * driftMultiplier;
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, targetFreq), time + duration);
      }

      if (noiseModNode) {
        noiseModNode.connect(osc.frequency);
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
      }

      osc.connect(env);
      osc.start(time);
      osc.stop(time + duration);
    });
  }

  play(params: SoundParams) {
    if (!this.ctx || !this.compressor) return;

    const now = this.ctx.currentTime;
    
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.75, now);

    // LFO for Volume (Tremolo / Pulsing)
    const lfoVca = this.ctx.createGain();
    lfoVca.gain.setValueAtTime(1.0, now);
    if (params.lfoAmount > 0) {
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = params.lfoRate;
      // Modulate between (1 - depth) and 1.
      lfoGain.gain.value = params.lfoAmount * 0.5;
      lfoVca.gain.value = 1.0 - (params.lfoAmount * 0.5);
      lfo.connect(lfoGain);
      lfoGain.connect(lfoVca.gain);
      lfo.start(now);
      const totalDuration = (params.sequenceSteps * (60 / params.sequenceBpm)) + params.attack + params.decay + 5;
      lfo.stop(now + totalDuration);
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

    // Sequence execution
    const stepDuration = 60 / params.sequenceBpm;
    for (let i = 0; i < params.sequenceSteps; i++) {
      const offsetSemitones = params.sequenceOffsets[i];
      const freqMultiplier = Math.pow(2, offsetSemitones / 12);
      const freq = params.baseFrequency * freqMultiplier;
      this.triggerNote(this.ctx, now + i * stepDuration, freq, params, masterGain);
    }

    // Cleanup
    const totalDuration = (params.sequenceSteps * stepDuration) + params.attack + params.decay + 5;
    setTimeout(() => {
        masterGain.disconnect();
        filter.disconnect();
    }, totalDuration * 1000);
  }

  async exportToWav(params: SoundParams): Promise<Blob> {
    const sampleRate = 44100;
    const stepDuration = 60 / params.sequenceBpm;
    const totalDuration = (params.sequenceSteps * stepDuration) + params.attack + params.decay + (params.echoAmount > 0 ? 3 : 1);
    const offlineCtx = new OfflineAudioContext(1, Math.ceil(sampleRate * (totalDuration + 1)), sampleRate);

    const now = 0;
    
    const compressor = offlineCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-12, now);
    compressor.ratio.setValueAtTime(12, now);
    compressor.connect(offlineCtx.destination);

    const masterGain = offlineCtx.createGain();
    masterGain.gain.setValueAtTime(0.75, now);

    const lfoVca = offlineCtx.createGain();
    lfoVca.gain.setValueAtTime(1.0, now);
    if (params.lfoAmount > 0) {
      const lfo = offlineCtx.createOscillator();
      const lfoGain = offlineCtx.createGain();
      lfo.frequency.value = params.lfoRate;
      lfoGain.gain.value = params.lfoAmount * 0.5;
      lfoVca.gain.value = 1.0 - (params.lfoAmount * 0.5);
      lfo.connect(lfoGain);
      lfoGain.connect(lfoVca.gain);
      lfo.start(now);
      lfo.stop(now + totalDuration);
    }
    
    const filter = offlineCtx.createBiquadFilter();
    filter.type = 'lowpass';
    const cutoffFreq = params.filterCutoff === 0 ? 20000 : Math.max(20, params.filterCutoff);
    filter.frequency.setValueAtTime(cutoffFreq, now);
    filter.Q.setValueAtTime(params.filterResonance, now);
    
    const combSum = offlineCtx.createGain();
    const combDelay = offlineCtx.createDelay(0.1);
    const combFeedback = offlineCtx.createGain();
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

    filter.connect(compressor);

    if (params.echoAmount > 0) {
      const delay = offlineCtx.createDelay(2.0);
      delay.delayTime.setValueAtTime(params.echoDelay, now);
      const feedback = offlineCtx.createGain();
      feedback.gain.setValueAtTime(0.8, now);
      filter.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(compressor);
    }

    for (let i = 0; i < params.sequenceSteps; i++) {
      const offsetSemitones = params.sequenceOffsets[i];
      const freqMultiplier = Math.pow(2, offsetSemitones / 12);
      const freq = params.baseFrequency * freqMultiplier;
      this.triggerNote(offlineCtx, now + i * stepDuration, freq, params, masterGain);
    }

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
