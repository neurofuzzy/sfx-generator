"use client";

import { SoundParams, WaveformType } from "@/types/audio";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Waves, Zap, Activity, Radio, Music, Wind } from "lucide-react";

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
      {/* Waveforms */}
      <div className="space-y-4 p-4 glass-panel rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Waves className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Waveforms</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["sine", "square", "sawtooth", "triangle", "noise"] as WaveformType[]).map((wf) => (
            <Button
              key={wf}
              variant={params.waveformPairs.includes(wf) ? "default" : "outline"}
              className="capitalize flex-1 min-w-[80px]"
              onClick={() => toggleWaveform(wf)}
            >
              {wf}
            </Button>
          ))}
        </div>
      </div>

      {/* Envelope */}
      <div className="space-y-6 p-4 glass-panel rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-accent">Envelope</h3>
        </div>
        <div className="space-y-4">
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

      {/* Frequency & Harmony */}
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
        </div>
      </div>

      {/* Vibrato */}
      <div className="space-y-6 p-4 glass-panel rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Music className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-accent">Vibrato</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Rate</Label>
              <span className="text-muted-foreground">{params.vibratoRate.toFixed(1)} Hz</span>
            </div>
            <Slider
              value={[params.vibratoRate]}
              max={20}
              step={0.1}
              onValueChange={([val]) => updateParam("vibratoRate", val)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Depth</Label>
              <span className="text-muted-foreground">{(params.vibratoDepth * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[params.vibratoDepth]}
              max={1}
              step={0.01}
              onValueChange={([val]) => updateParam("vibratoDepth", val)}
            />
          </div>
        </div>
      </div>

      {/* Effects */}
      <div className="space-y-6 p-4 glass-panel rounded-2xl lg:col-span-2">
        <div className="flex items-center gap-2 mb-2">
          <Wind className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Space & Presence</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
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
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <Label>Echo Amount</Label>
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
                min={0.01}
                max={2}
                step={0.01}
                onValueChange={([val]) => updateParam("echoDelay", val)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
