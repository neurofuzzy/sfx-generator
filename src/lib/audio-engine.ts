import { SoundParams, WaveformType } from "@/types/audio";

class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private reverbBuffer: AudioBuffer | null = null;

  async init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
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

  play(params: SoundParams) {
    if (!this.ctx || !this.analyser) return;

    const now = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.connect(this.analyser);

    // Reverb
    if (params.reverbAmount > 0 && this.reverbBuffer) {
      const reverb = this.ctx.createConvolver();
      reverb.buffer = this.reverbBuffer;
      const reverbGain = this.ctx.createGain();
      reverbGain.gain.value = params.reverbAmount;
      masterGain.connect(reverb);
      reverb.connect(reverbGain);
      reverbGain.connect(this.analyser);
    }

    // Echo
    if (params.echoAmount > 0) {
      const delay = this.ctx.createDelay(2.0);
      delay.delayTime.value = params.echoDelay;
      const feedback = this.ctx.createGain();
      feedback.gain.value = params.echoAmount * 0.6;
      masterGain.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(this.analyser);
    }

    // Envelope
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(1, now + params.attack);
    env.gain.exponentialRampToValueAtTime(0.001, now + params.attack + params.decay);
    env.connect(masterGain);

    // Oscillators
    params.waveformPairs.forEach((wf, index) => {
      const freq = params.baseFrequency * (index === 1 ? (1 + params.harmony) : 1);
      
      if (wf === 'noise') {
        const bufferSize = 2 * this.ctx!.sampleRate;
        const noiseBuffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx!.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;
        noise.connect(env);
        noise.start(now);
        noise.stop(now + params.attack + params.decay);
      } else {
        const osc = this.ctx!.createOscillator();
        osc.type = wf as OscillatorType;
        osc.frequency.setValueAtTime(freq, now);

        // Vibrato
        if (params.vibratoDepth > 0) {
          const lfo = this.ctx!.createOscillator();
          const lfoGain = this.ctx!.createGain();
          lfo.frequency.value = params.vibratoRate;
          lfoGain.gain.value = params.vibratoDepth * 50;
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          lfo.start(now);
          lfo.stop(now + params.attack + params.decay);
        }

        osc.connect(env);
        osc.start(now);
        osc.stop(now + params.attack + params.decay);
      }
    });

    // Cleanup master after sound finishes
    setTimeout(() => {
        masterGain.disconnect();
    }, (params.attack + params.decay + params.echoDelay * 4) * 1000 + 100);
  }

  async exportToWav(params: SoundParams): Promise<Blob> {
    const sampleRate = 44100;
    const duration = params.attack + params.decay + (params.echoAmount > 0 ? params.echoDelay * 4 : 0);
    const offlineCtx = new OfflineAudioContext(1, sampleRate * duration, sampleRate);

    // Redo standard synthesis in offline context
    const now = 0;
    const masterGain = offlineCtx.createGain();
    masterGain.connect(offlineCtx.destination);

    if (params.reverbAmount > 0) {
        // Mock reverb for export is hard without buffer, skipping for simplicity in this helper
    }

    const env = offlineCtx.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(1, now + params.attack);
    env.gain.exponentialRampToValueAtTime(0.001, now + params.attack + params.decay);
    env.connect(masterGain);

    params.waveformPairs.forEach((wf, index) => {
      const freq = params.baseFrequency * (index === 1 ? (1 + params.harmony) : 1);
      if (wf === 'noise') {
        const bufferSize = 2 * sampleRate;
        const noiseBuffer = offlineCtx.createBuffer(1, bufferSize, sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
        const noise = offlineCtx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;
        noise.connect(env);
        noise.start(now);
      } else {
        const osc = offlineCtx.createOscillator();
        osc.type = wf as OscillatorType;
        osc.frequency.setValueAtTime(freq, now);
        osc.connect(env);
        osc.start(now);
      }
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
