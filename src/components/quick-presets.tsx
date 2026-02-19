"use client";

import { GAME_PRESETS, SoundParams } from "@/types/audio";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Zap, ArrowUp, Bomb, Coins, Repeat, Target, Star, Skull, Drum, Speaker, Keyboard, Waves, Music, Disc } from "lucide-react";

interface QuickPresetsProps {
  onSelect: (params: SoundParams) => void;
}

const presetIcons: Record<string, React.ElementType> = {
  // Musical Instruments
  "Deep Kick": Drum,
  "Snare": Music,
  "Cymbal": Disc,
  "Acid Bass": Speaker,
  "Soft Piano": Keyboard,
  "Ethereal Pad": Waves,
  // Game FX
  "Classic Laser": Zap,
  "8-Bit Jump": ArrowUp,
  "Mega Explosion": Bomb,
  "Shiny Coin": Coins,
  "Teleport Warp": Repeat,
  "Retro Hit": Target,
  "Power Up": Star,
  "Game Over": Skull,
};

export default function QuickPresets({ onSelect }: QuickPresetsProps) {
  return (
    <div className="w-full bg-muted/20 border-y border-white/5 py-3 px-1">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max space-x-3 px-4">
          <div className="flex items-center gap-2 mr-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/50 select-none">
            Preset <span className="text-accent">Quick Bank</span>
          </div>
          {GAME_PRESETS.map((preset) => {
            const Icon = presetIcons[preset.name] || Music;
            return (
              <Button
                key={preset.name}
                variant="ghost"
                size="sm"
                className="rounded-full bg-white/5 hover:bg-primary/20 hover:text-primary transition-all border border-transparent hover:border-primary/20 gap-2 h-9 px-4"
                onClick={() => onSelect(preset)}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{preset.name}</span>
              </Button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="hidden" />
      </ScrollArea>
    </div>
  );
}
