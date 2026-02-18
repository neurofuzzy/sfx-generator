"use client";

import { useState, useEffect } from "react";
import { SoundParams, defaultSoundParams, GAME_PRESETS } from "@/types/audio";
import { audioEngine } from "@/lib/audio-engine";
import SoundControls from "@/components/sound-controls";
import AudioVisualizer from "@/components/audio-visualizer";
import AiGenerator from "@/components/ai-generator";
import Randomizer from "@/components/randomizer";
import QuickPresets from "@/components/quick-presets";
import Composer from "@/components/composer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Download, Headphones, Share2, Github, LayoutGrid, Music } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

export default function SoundSculptorApp() {
  const [params, setParams] = useState<SoundParams>(defaultSoundParams);
  const [isInitialized, setIsInitialized] = useState(false);
  const [presets, setPresets] = useState<SoundParams[]>([]);

  useEffect(() => {
    // Load presets from localStorage on mount
    const stored = localStorage.getItem("sound-presets");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPresets([...GAME_PRESETS, ...parsed]);
      } catch (e) {
        setPresets(GAME_PRESETS);
      }
    } else {
      setPresets(GAME_PRESETS);
    }

    const handleFirstInteraction = async () => {
      await audioEngine.init();
      setIsInitialized(true);
      window.removeEventListener("click", handleFirstInteraction);
    };
    window.addEventListener("click", handleFirstInteraction);
    return () => window.removeEventListener("click", handleFirstInteraction);
  }, []);

  const handlePlay = (overriddenParams?: SoundParams) => {
    audioEngine.play(overriddenParams || params);
  };

  const handleUpdateParams = (newParams: Partial<SoundParams>) => {
    setParams((prev) => ({
      ...defaultSoundParams,
      ...prev,
      ...newParams,
    }));
  };

  const handleSelectPreset = (newParams: SoundParams) => {
    const merged = { ...defaultSoundParams, ...newParams };
    setParams(merged);
    handlePlay(merged);
  };

  const handleExport = async () => {
    const blob = await audioEngine.exportToWav(params);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${params.name || "sculpted-sound"}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTabChange = (value: string) => {
    audioEngine.stopAll();
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <Headphones className="w-10 h-10 text-primary" />
            Polyphonic Debris
            <span className="text-accent text-lg font-light hidden sm:inline">SoundSculptor</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-md">
            Next-generation synthesis for spacious, binaural retro soundscapes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-full">
            <Share2 className="w-4 h-4" />
          </Button>
          <a 
            href="https://github.com/neurofuzzy/sfx-generator" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="icon" className="rounded-full">
              <Github className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </header>

      <Tabs defaultValue="sculptor" className="w-full" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/20 border border-white/5 rounded-2xl p-1">
          <TabsTrigger value="sculptor" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
            <Music className="w-4 h-4" />
            Sound Sculptor
          </TabsTrigger>
          <TabsTrigger value="composer" className="rounded-xl data-[state=active]:bg-accent data-[state=active]:text-accent-foreground flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" />
            EDM Composer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sculptor" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <main className="space-y-6">
            <div className="flex flex-col gap-6">
              <AiGenerator onGenerated={handleSelectPreset} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div className="md:col-span-2">
                  <AudioVisualizer />
                </div>
                <div className="flex flex-col gap-3">
                  <Button 
                    size="lg" 
                    className="w-full h-16 text-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl active:scale-95 transition-all"
                    onClick={() => handlePlay()}
                  >
                    <Play className="w-6 h-6 mr-2 fill-current" />
                    PREVIEW
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full h-12 font-bold border-accent/20 text-accent hover:bg-accent/10 rounded-xl"
                    onClick={handleExport}
                  >
                    <Download className="w-5 h-5 mr-2" />
                    EXPORT .WAV
                  </Button>
                </div>
              </div>

              <Randomizer onRandomize={handleSelectPreset} />
              
              <QuickPresets onSelect={handleSelectPreset} />

              <div className="space-y-4">
                  <SoundControls 
                    params={params} 
                    setParams={handleUpdateParams} 
                    onPresetsChange={() => {
                        const stored = localStorage.getItem("sound-presets");
                        if (stored) {
                            setPresets([...GAME_PRESETS, ...JSON.parse(stored)]);
                        }
                    }}
                  />
              </div>
            </div>
          </main>
        </TabsContent>

        <TabsContent value="composer" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Composer library={presets} />
        </TabsContent>
      </Tabs>

      {!isInitialized && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center p-8 bg-card border rounded-3xl shadow-2xl max-w-sm mx-auto animate-in fade-in zoom-in duration-300">
            <Headphones className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold mb-2">Initialize Audio</h2>
            <p className="text-muted-foreground mb-6">Tap anywhere to wake up the synthesis engine.</p>
            <Button className="w-full rounded-xl" onClick={() => setIsInitialized(true)}>WAKE UP</Button>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  );
}
