"use client";

import { SoundParams, WaveformType, NoiseType, EnvelopeShape, FilterType } from "@/types/audio";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Waves, Zap, Activity, Radio, Music, Wind, Volume2, Filter, Timer } from "lucide-react";

interface SoundControlsProps {
  params: SoundParams;
  setParams: (params: SoundParams) => void;
}

export default function SoundControls({ params, setParams }: SoundControlsProps) {
  const updateParam = (key: keyof SoundParams, value: any) => {
    setParams({ ...params, [key]: value });
  };

  const toggleWaveform = (wf: WaveformType) => {
    const current = params.waveformPairs;
    if (current.includes(wf)) {
      if (current.length > 1) {
        updateParam("waveformPairs", current.filter((w) => w !== wf));
      }
    } else {
      if (current.length < 2) {
        updateParam("waveformPairs", [...current, wf]);
      } else {
        updateParam("waveformPairs", [current[1], wf]);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
      {/* Oscillators & Vibrato */}
      <div className="space-y-6 p-4 glass-panel rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Waves className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Oscillators</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["sine", "square", "sawtooth", "triangle"] as WaveformType[]).map((wf) => (
            <Button
              key={wf}
              variant={params.waveformPairs.includes(wf) ? "default" : "outline"}
              size="sm"
              className="capitalize flex-1 min-w-[70px]"
              onClick={() => toggleWaveform(wf)}
            >
              {wf}
            </Button>
          ))}
        </div>
        
        <div className="space-y-4 pt-2 border-t border-white/5">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Vibrato Depth</Label>
              <span className="text-muted-foreground">{(params.vibratoDepth * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[params.vibratoDepth]}
              max={1}
              step={0.01}
              onValueChange={([val]) => updateParam("vibratoDepth", val)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Vibrato Rate</Label>
              <span className="text-muted-foreground">{params.vibratoRate.toFixed(1)}Hz</span>
            </div>
            <Slider
              value={[params.vibratoRate]}
              min={0.1}
              max={20}
              step={0.1}
              onValueChange={([val]) => updateParam("vibratoRate", val)}
            />
          </div>
        </div>
      </div>

      {/* Scultping Filter */}
      <div className="space-y-6 p-4 glass-panel rounded-2xl border-primary/20 bg-primary/5">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Sculptor (Filter)</h3>
        </div>
        <div className="space-y-4">
          <div className="flex gap-1">
            {(["lowpass", "highpass", "bandpass"] as FilterType[]).map((type) => (
              <Button
                key={type}
                size="sm"
                variant={params.filterType === type ? "default" : "outline"}
                className="capitalize flex-1 text-[10px] h-7"
                onClick={() => updateParam("filterType", type)}
              >
                {type === 'lowpass' ? 'Low Pass' : type === 'highpass' ? 'High Pass' : 'Band Pass'}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Cutoff</Label>
              <span className="text-muted-foreground">{params.filterCutoff.toFixed(0)} Hz</span>
            </div>
            <Slider
              value={[params.filterCutoff]}
              min={20}
              max={10000}
              step={1}
              onValueChange={([val]) => updateParam("filterCutoff", val)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Resonance</Label>
              <span className="text-muted-foreground">{params.filterResonance.toFixed(1)}</span>
            </div>
            <Slider
              value={[params.filterResonance]}
              min={0}
              max={20}
              step={0.1}
              onValueChange={([val]) => updateParam("filterResonance", val)}
            />
          </div>
        </div>
      </div>

      {/* Noise Section */}
      <div className="space-y-6 p-4 glass-panel rounded-2xl border-accent/20">
        <div className="flex items-center gap-2 mb-2">
          <Volume2 className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-accent">Noise & Mod</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Additive Layer</Label>
              <span className="text-muted-foreground">{(params.noiseAmount * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[params.noiseAmount]}
              max={1}
              step={0.01}
              onValueChange={([val]) => updateParam("noiseAmount", val)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Frequency Jitter (Destructive)</Label>
              <span className="text-muted-foreground">{(params.noiseModulation * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[params.noiseModulation]}
              max={1}
              step={0.01}
              onValueChange={([val]) => updateParam("noiseModulation", val)}
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {(["white", "pink", "brown", "velvet"] as NoiseType[]).map((type) => (
              <Button
                key={type}
                size="sm"
                variant={params.noiseType === type ? "secondary" : "ghost"}
                className="capitalize flex-1 text-[10px] h-7"
                onClick={() => updateParam("noiseType", type)}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Envelope */}
      <div className="space-y-6 p-4 glass-panel rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-accent">Envelope</h3>
        </div>
        <div className="space-y-4">
          <div className="flex gap-2">
            {(["linear", "exponential"] as EnvelopeShape[]).map((shape) => (
              <Button
                key={shape}
                size="sm"
                variant={params.envelopeShape === shape ? "default" : "outline"}
                className="flex-1 capitalize h-8 text-xs"
                onClick={() => updateParam("envelopeShape", shape)}
              >
                {shape}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Attack</Label>
              <span className="text-muted-foreground">{params.attack.toFixed(2)}s</span>
            </div>
            <Slider
              value={[params.attack]}
              max={1}
              step={0.01}
              onValueChange={([val]) => updateParam("attack", val)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Decay</Label>
              <span className="text-muted-foreground">{params.decay.toFixed(2)}s</span>
            </div>
            <Slider
              value={[params.decay]}
              max={2}
              step={0.01}
              onValueChange={([val]) => updateParam("decay", val)}
            />
          </div>
        </div>
      </div>

      {/* Tuning */}
      <div className="space-y-6 p-4 glass-panel rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Radio className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Tuning</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Base Freq</Label>
              <span className="text-muted-foreground">{params.baseFrequency.toFixed(0)} Hz</span>
            </div>
            <Slider
              value={[params.baseFrequency]}
              min={20}
              max={2000}
              step={1}
              onValueChange={([val]) => updateParam("baseFrequency", val)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Harmony Offset</Label>
              <span className="text-muted-foreground">{(params.harmony * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[params.harmony]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={([val]) => updateParam("harmony", val)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Quantize (Steps/Octave)</Label>
              <span className="text-muted-foreground">{params.quantize === 0 ? 'Smooth' : params.quantize}</span>
            </div>
            <Slider
              value={[params.quantize]}
              min={0}
              max={48}
              step={1}
              onValueChange={([val]) => updateParam("quantize", val)}
            />
          </div>
        </div>
      </div>

      {/* Space */}
      <div className="space-y-6 p-4 glass-panel rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Wind className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Space</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Reverb</Label>
              <span className="text-muted-foreground">{(params.reverbAmount * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[params.reverbAmount]}
              max={1}
              step={0.01}
              onValueChange={([val]) => updateParam("reverbAmount", val)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Echo Mix</Label>
              <span className="text-muted-foreground">{(params.echoAmount * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[params.echoAmount]}
              max={1}
              step={0.01}
              onValueChange={([val]) => updateParam("echoAmount", val)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Echo Delay</Label>
              <span className="text-muted-foreground">{params.echoDelay.toFixed(2)}s</span>
            </div>
            <Slider
              value={[params.echoDelay]}
              min={0}
              max={0.5}
              step={0.01}
              onValueChange={([val]) => updateParam("echoDelay", val)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
