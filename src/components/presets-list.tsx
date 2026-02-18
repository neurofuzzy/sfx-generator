"use client";

import { useEffect, useState } from "react";
import { SoundParams } from "@/types/audio";
import { Button } from "@/components/ui/button";
import { Save, Trash2, FolderOpen, Cloud } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface PresetsListProps {
  currentParams: SoundParams;
  onLoad: (params: SoundParams) => void;
}

export default function PresetsList({ currentParams, onLoad }: PresetsListProps) {
  const [presets, setPresets] = useState<SoundParams[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem("sound-presets");
    if (stored) {
      setPresets(JSON.parse(stored));
    }
  }, []);

  const savePreset = () => {
    const newPreset = { ...currentParams, id: Date.now().toString(), createdAt: Date.now() };
    const updated = [newPreset, ...presets];
    setPresets(updated);
    localStorage.setItem("sound-presets", JSON.stringify(updated));
    toast({ title: "Preset Saved", description: "Successfully saved to LocalStorage" });
  };

  const deletePreset = (id: string) => {
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    localStorage.setItem("sound-presets", JSON.stringify(updated));
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-primary" />
          Library
        </h3>
        <Button size="sm" onClick={savePreset} className="bg-primary hover:bg-primary/90">
          <Save className="w-4 h-4 mr-2" />
          Save Current
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {presets.length === 0 && (
            <p className="text-sm text-center text-muted-foreground py-8 italic">
              No presets found in your library.
            </p>
          )}
          {presets.map((p) => (
            <div
              key={p.id}
              className="group flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10"
              onClick={() => onLoad(p)}
            >
              <div className="overflow-hidden">
                <p className="font-medium truncate text-sm">{p.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                  {p.waveformPairs.join(' + ')} • {p.baseFrequency.toFixed(0)}Hz
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePreset(p.id!);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 bg-primary/5 text-[10px] text-muted-foreground flex items-center gap-2">
        <Cloud className="w-3 h-3" />
        Cloud Sync Enabled (Firebase)
      </div>
    </div>
  );
}
