"use client";

import { useState, useEffect } from "react";
import { SoundParams, defaultSoundParams } from "@/types/audio";
import { audioEngine } from "@/lib/audio-engine";
import SoundControls from "@/components/sound-controls";
import AudioVisualizer from "@/components/audio-visualizer";
import AiGenerator from "@/components/ai-generator";
import PresetsList from "@/components/presets-list";
import { Button } from "@/components/ui/button";
import { Play, Download, Headphones, Settings2, Share2, Github } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

export default function SoundSculptorApp() {
  const [params, setParams] = useState<SoundParams>(defaultSoundParams);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const handleFirstInteraction = async () => {
      await audioEngine.init();
      setIsInitialized(true);
      window.removeEventListener("click", handleFirstInteraction);
    };
    window.addEventListener("click", handleFirstInteraction);
    return () => window.removeEventListener("click", handleFirstInteraction);
  }, []);

  const handlePlay = () => {
    audioEngine.play(params);
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
          <Button variant="outline" size="icon" className="rounded-full">
            <Github className="w-4 h-4" />
          </Button>
          <Button variant="secondary" className="gap-2 rounded-full hidden sm:flex">
            <Settings2 className="w-4 h-4" />
            Config
          </Button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Panel: Library */}
        <div className="xl:col-span-1 hidden xl:block h-[calc(100vh-250px)]">
          <PresetsList currentParams={params} onLoad={setParams} />
        </div>

        {/* Center Panel: Controls & Visualizer */}
        <main className="xl:col-span-3 space-y-6">
          <div className="flex flex-col gap-6">
            {/* AI Generator Box */}
            <AiGenerator onGenerated={setParams} />

            {/* Monitor & Global Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="md:col-span-2">
                <AudioVisualizer />
              </div>
              <div className="flex flex-col gap-3">
                <Button 
                  size="lg" 
                  className="w-full h-16 text-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl active:scale-95 transition-all"
                  onClick={handlePlay}
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

            {/* Detailed Controls */}
            <div className="space-y-4">
               <SoundControls params={params} setParams={setParams} />
            </div>
          </div>
        </main>

        {/* Mobile Presets (Only visible on small screens) */}
        <div className="xl:hidden h-96">
          <PresetsList currentParams={params} onLoad={setParams} />
        </div>
      </div>

      {!isInitialized && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center p-8 bg-card border rounded-3xl shadow-2xl max-w-sm mx-auto animate-in fade-in zoom-in duration-300">
            <Headphones className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold mb-2">Initialize Audio</h2>
            <p className="text-muted-foreground mb-6">Tap anywhere to wake up the synthesis engine.</p>
            <Button className="w-full rounded-xl">WAKE UP</Button>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  );
}
