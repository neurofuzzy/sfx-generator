"use client";

import { useState } from "react";
import { SoundParams } from "@/types/audio";
import { audioEngine } from "@/lib/audio-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dices, RefreshCw } from "lucide-react";

interface RandomizerProps {
  onRandomize: (params: SoundParams, shouldPlay?: boolean) => void;
}

export default function Randomizer({ onRandomize }: RandomizerProps) {
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 999999));

  const applySeed = (targetSeed: number, shouldPlay: boolean = true) => {
    // Use the core engine's seeding logic to generate params
    const randomParams = audioEngine.generateParamsFromSeed(targetSeed);
    onRandomize(randomParams, shouldPlay);
  };

  const handleRandomize = () => {
    const newSeed = Math.floor(Math.random() * 999999);
    setSeed(newSeed);
    applySeed(newSeed, true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      applySeed(seed, true);
    }
  };

  return (
    <div className="w-full bg-muted/20 border-y border-white/5 py-4 px-6">
      <div className="flex flex-col sm:flex-row items-center gap-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/50 select-none shrink-0">
          <Dices className="w-4 h-4" />
          Entropy Engine
        </div>
        
        <div className="flex flex-1 items-center gap-2 w-full">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase">Seed</span>
            <Input
              type="number"
              value={seed}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) {
                  setSeed(val);
                  applySeed(val, false); // Update sliders silently
                } else if (e.target.value === "") {
                  setSeed(0);
                  applySeed(0, false);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type seed and hit Enter..."
              className="pl-12 h-10 bg-white/5 border-white/10 rounded-xl font-mono text-sm focus:ring-accent/50"
            />
          </div>
          
          <Button 
            onClick={handleRandomize}
            className="bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20 rounded-xl h-10 px-8 font-bold gap-2 transition-all active:scale-95 shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            RANDOMIZE
          </Button>
        </div>
      </div>
    </div>
  );
}
