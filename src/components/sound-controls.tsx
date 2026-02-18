"use client";

import { SoundParams, WaveformType, NoiseType, EnvelopeShape } from "@/types/audio";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Waves, Activity, Radio, Wind, Volume2, Filter, ListMusic, Plus, Minus, Zap, Flame } from "lucide-react";
import PresetsList from "./presets-list";

interface SoundControlsProps {
  params: SoundParams;
  setParams: (params: SoundParams) => void;
}

export default function SoundControls({ params, setParams }: SoundControlsProps) {
  const updateParam = (key: keyof SoundParams, value: any) => {
    setParams({ ...params, [key]: value });
  };

  const updateSequenceOffset = (index: number, val: number) => {
    const newOffsets = [...(params.sequenceOffsets || [0, 0, 0, 0])];
    newOffsets[index] = val;
    updateParam("sequenceOffsets", newOffsets);
  };

  const toggleWaveform = (wf: WaveformType) => {
    const current = params.waveformPairs || ["sine"];
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
      {/* Oscillators */}
      <div className="space-y-6 p-4 glass-panel rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Waves className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Oscillators</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["sine", "square", "sawtooth", "triangle"] as WaveformType[]).map((wf) => (
            <Button
              key={wf}
              variant={(params.waveformPairs || []).includes(wf) ? "default" : "outline"}
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
              <Label>Base Freq</Label>
              <span className="text-muted-foreground">{(params.baseFrequency ?? 440).toFixed(0)} Hz</span>
            </div>
            <Slider
              value={[params.baseFrequency ?? 440]}
              min={20}
              max={2000}
              step={1}
              onValueChange={([val]) => updateParam("baseFrequency", val)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <Label>Crunch (Distortion)</Label>
              </div>
              <span className="text-muted-foreground">{((params.distortion ?? 0) * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[params.distortion ?? 0]}
              max={1}
              step={0.01}
              onValueChange={([val]) => updateParam("distortion", val)}
              className="accent-orange-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Harmony Offset</Label>
              <span className="text-muted-foreground">{((params.harmony ?? 0) * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[params.harmony ?? 0]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={([val]) => updateParam("harmony", val)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Freq Drift (Slide)</Label>
              <span className="text-muted-foreground">{(params.frequencyDrift ?? 0) > 0 ? '+' : ''}{params.frequencyDrift ?? 0} semi</span>
            </div>
            <Slider
              value={[params.frequencyDrift ?? 0]}
              min={-24}
              max={24}
              step={1}
              onValueChange={([val]) => updateParam("frequencyDrift", val)}
            />
          </div>
        </div>
      </div>

      {/* Pitch Sequencer */}
      <div className="space-y-6 p-4 glass-panel rounded-2xl border-primary/20 bg-primary/5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Sequencer</h3>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map((step) => (
              <Button
                key={step}
                size="icon"
                variant={(params.sequenceSteps ?? 1) === step ? "default" : "ghost"}
                className="h-6 w-6 text-[10px]"
                onClick={() => updateParam("sequenceSteps", step)}
              >
                {step}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((i) => {
              const sequenceOffsets = params.sequenceOffsets || [0, 0, 0, 0];
              const offset = sequenceOffsets[i] ?? 0;
              return (
                <div key={i} className={`flex flex-col items-center gap-2 ${i >= (params.sequenceSteps ?? 1) ? 'opacity-20 pointer-events-none' : ''}`}>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7 rounded-full bg-white/5 border-white/10 hover:bg-primary/20"
                    onClick={() => updateSequenceOffset(i, Math.min(12, offset + 1))}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  <div className="h-24 w-full bg-white/5 rounded-lg flex flex-col justify-end p-1 relative overflow-hidden border border-white/5">
                    <div 
                      className="w-full bg-primary/40 rounded-sm transition-all" 
                      style={{ height: `${((offset + 12) / 24) * 100}%` }} 
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold pointer-events-none">
                      {offset > 0 ? '+' : ''}{offset}
                    </span>
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7 rounded-full bg-white/5 border-white/10 hover:bg-primary/20"
                    onClick={() => updateSequenceOffset(i, Math.max(-12, offset - 1))}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
          </div>
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex justify-between text-xs">
              <Label>Speed (BPM)</Label>
              <span className="text-muted-foreground">{params.sequenceBpm ?? 120}</span>
            </div>
            <Slider
              value={[params.sequenceBpm ?? 120]}
              min={60}
              max={1200}
              step={10}
              onValueChange={([val]) => updateParam("sequenceBpm", val)}
            />
          </div>
        </div>
      </div>

      {/* Noise & Mod (LFO) */}
      <div className="space-y-6 p-4 glass-panel rounded-2xl border-accent/20">
        <div className="flex items-center gap-2 mb-2">
          <Volume2 className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-accent">Noise & Mod</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Additive Layer</Label>
              <span className="text-muted-foreground">{((params.noiseAmount ?? 0) * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[params.noiseAmount ?? 0]}
              max={1}
              step={0.01}
              onValueChange={([val]) => updateParam("noiseAmount", val)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Frequency Jitter</Label>
              <span className="text-muted-foreground">{((params.noiseModulation ?? 0) * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[params.noiseModulation ?? 0]}
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

          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-accent" />
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Volume Pulse (LFO)</Label>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px]">
                <Label>Depth</Label>
                <span className="text-muted-foreground">{((params.lfoAmount ?? 0) * 100).toFixed(0)}%</span>
              </div>
              <Slider
                value={[params.lfoAmount ?? 0]}
                max={1}
                step={0.01}
                onValueChange={([val]) => updateParam("lfoAmount", val)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px]">
                <Label>Rate</Label>
                <span className="text-muted-foreground">{(params.lfoRate ?? 5).toFixed(1)}Hz</span>
              </div>
              <Slider
                value={[params.lfoRate ?? 5]}
                min={0.1}
                max={20}
                step={0.1}
                onValueChange={([val]) => updateParam("lfoRate", val)}
              />
            </div>
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
          <div className="grid grid-cols-2 gap-2">
            {(["piano", "strings", "percussive", "reverse"] as EnvelopeShape[]).map((shape) => (
              <Button
                key={shape}
                size="sm"
                variant={params.envelopeShape === shape ? "default" : "outline"}
                className="capitalize h-8 text-[10px]"
                onClick={() => updateParam("envelopeShape", shape)}
              >
                {shape}
              </Button>
            ))}
          </div>
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex justify-between text-xs">
              <Label>Attack</Label>
              <span className="text-muted-foreground">{(params.attack ?? 0.1).toFixed(2)}s</span>
            </div>
            <Slider
              value={[params.attack ?? 0.1]}
              max={1}
              step={0.01}
              onValueChange={([val]) => updateParam("attack", val)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Decay</Label>
              <span className="text-muted-foreground">{(params.decay ?? 0.5).toFixed(2)}s</span>
            </div>
            <Slider
              value={[params.decay ?? 0.5]}
              max={2}
              step={0.01}
              onValueChange={([val]) => updateParam("decay", val)}
            />
          </div>
        </div>
      </div>

      {/* Tuning: Vibrato & Quantization */}
      <div className="space-y-6 p-4 glass-panel rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Radio className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Tuning</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Vibrato Depth</Label>
              <span className="text-muted-foreground">{((params.vibratoDepth ?? 0) * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[params.vibratoDepth ?? 0]}
              max={1}
              step={0.01}
              onValueChange={([val]) => updateParam("vibratoDepth", val)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Vibrato Rate</Label>
              <span className="text-muted-foreground">{(params.vibratoRate ?? 5).toFixed(1)}Hz</span>
            </div>
            <Slider
              value={[params.vibratoRate ?? 5]}
              min={0.1}
              max={20}
              step={0.1}
              onValueChange={([val]) => updateParam("vibratoRate", val)}
            />
          </div>
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex justify-between text-xs">
              <Label>Quantize (Steps/Octave)</Label>
              <span className="text-muted-foreground">{(params.quantize ?? 0) === 0 ? 'Smooth' : params.quantize}</span>
            </div>
            <Slider
              value={[params.quantize ?? 0]}
              min={0}
              max={48}
              step={1}
              onValueChange={([val]) => updateParam("quantize", val)}
            />
          </div>
        </div>
      </div>

      {/* Sculptor */}
      <div className="space-y-6 p-4 glass-panel rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Sculptor</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Low Pass Cutoff</Label>
              <span className="text-muted-foreground">{(params.filterCutoff ?? 0) === 0 ? 'OFF' : `${(params.filterCutoff ?? 0).toFixed(0)} Hz`}</span>
            </div>
            <Slider
              value={[params.filterCutoff ?? 0]}
              min={0}
              max={10000}
              step={10}
              onValueChange={([val]) => updateParam("filterCutoff", val)}
            />
          </div>
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex justify-between text-xs">
              <Label>Comb Feedback</Label>
              <span className="text-muted-foreground">{((params.combAmount ?? 0) * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[params.combAmount ?? 0]}
              min={0}
              max={0.95}
              step={0.01}
              onValueChange={([val]) => updateParam("combAmount", val)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Comb Delay</Label>
              <span className="text-muted-foreground">{((params.combDelay ?? 0.01) * 1000).toFixed(1)}ms</span>
            </div>
            <Slider
              value={[params.combDelay ?? 0.01]}
              min={0.0001}
              max={0.05}
              step={0.0001}
              onValueChange={([val]) => updateParam("combDelay", val)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Filter Resonance</Label>
              <span className="text-muted-foreground">{(params.filterResonance ?? 1).toFixed(1)}</span>
            </div>
            <Slider
              value={[params.filterResonance ?? 1]}
              min={0}
              max={20}
              step={0.1}
              onValueChange={([val]) => updateParam("filterResonance", val)}
            />
          </div>
        </div>
      </div>

      {/* Space */}
      <div className="space-y-6 p-4 glass-panel rounded-2xl lg:col-span-1">
        <div className="flex items-center gap-2 mb-2">
          <Wind className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Space</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Reverb</Label>
              <span className="text-muted-foreground">{((params.reverbAmount ?? 0) * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[params.reverbAmount ?? 0]}
              max={1}
              step={0.01}
              onValueChange={([val]) => updateParam("reverbAmount", val)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Echo Mix</Label>
              <span className="text-muted-foreground">{((params.echoAmount ?? 0) * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[params.echoAmount ?? 0]}
              max={1}
              step={0.01}
              onValueChange={([val]) => updateParam("echoAmount", val)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Echo Delay</Label>
              <span className="text-muted-foreground">{(params.echoDelay ?? 0.3).toFixed(2)}s</span>
            </div>
            <Slider
              value={[params.echoDelay ?? 0.3]}
              min={0}
              max={0.5}
              step={0.01}
              onValueChange={([val]) => updateParam("echoDelay", val)}
            />
          </div>
        </div>
      </div>

      {/* Library Panel (Integrated) */}
      <div className="lg:col-span-2 min-h-[400px]">
        <PresetsList currentParams={params} onUpdateParams={setParams} />
      </div>
    </div>
  );
}
