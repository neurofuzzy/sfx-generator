"use client";

import { useEffect, useState, useRef } from "react";
import { SoundParams } from "@/types/audio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Trash2, FolderOpen, Cloud, Download, Upload, Type } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface PresetsListProps {
  currentParams: SoundParams;
  onUpdateParams: (params: SoundParams) => void;
  onPresetsChange?: () => void;
}

export default function PresetsList({ currentParams, onUpdateParams, onPresetsChange }: PresetsListProps) {
  const [presets, setPresets] = useState<SoundParams[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem("sound-presets");
    if (stored) {
      try {
        setPresets(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse presets", e);
      }
    }
  }, []);

  const saveToLocalStorage = (newPresets: SoundParams[]) => {
    setPresets(newPresets);
    localStorage.setItem("sound-presets", JSON.stringify(newPresets));
    onPresetsChange?.();
  };

  const savePreset = () => {
    const newPreset = { ...currentParams, id: Date.now().toString(), createdAt: Date.now() };
    const updated = [newPreset, ...presets];
    saveToLocalStorage(updated);
    toast({ title: "Preset Saved", description: `"${newPreset.name}" added to library` });
  };

  const deletePreset = (id: string) => {
    const updated = presets.filter((p) => p.id !== id);
    saveToLocalStorage(updated);
  };

  const exportLibrary = () => {
    const dataStr = JSON.stringify(presets, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'soundsculptor-presets.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({ title: "Library Exported", description: "Presets saved to JSON file" });
  };

  const importLibrary = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported)) {
          const merged = [...imported, ...presets];
          const unique = merged.filter((v, i, a) => a.findIndex(t => (t.id === v.id || t.name === v.name)) === i);
          saveToLocalStorage(unique);
          toast({ title: "Import Successful", description: `Added ${imported.length} presets to library` });
        }
      } catch {
        toast({ variant: "destructive", title: "Import Failed", description: "Invalid JSON file" });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-white/5 space-y-3 bg-white/5">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sound Identity</h3>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Name your sound..."
            value={currentParams.name}
            onChange={(e) => onUpdateParams({ ...currentParams, name: e.target.value })}
            className="h-9 text-sm bg-background/50 border-white/10"
          />
          <Button size="sm" onClick={savePreset} className="bg-primary hover:bg-primary/90 shrink-0">
            <Save className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2 text-sm">
          <FolderOpen className="w-4 h-4 text-primary" />
          Saved Library
        </h3>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={exportLibrary}
            title="Export Library (JSON)"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => fileInputRef.current?.click()}
            title="Import Library (JSON)"
          >
            <Upload className="w-4 h-4" />
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={importLibrary}
            accept=".json"
            className="hidden"
          />
        </div>
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
              key={p.id || p.name + p.createdAt}
              className={`group flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer border ${currentParams.id === p.id ? 'bg-primary/20 border-primary/40' : 'bg-white/5 hover:bg-white/10 border-transparent hover:border-white/10'}`}
              onClick={() => onUpdateParams(p)}
            >
              <div className="overflow-hidden">
                <p className="font-medium truncate text-sm">{p.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                  {p.waveformPairs?.join(' + ')} • {p.baseFrequency?.toFixed(0)}Hz
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
        LocalStorage Persistence Active
      </div>
    </div>
  );
}