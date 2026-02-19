"use client";

import { useState, useEffect } from "react";
import { SoundParams, defaultSoundParams, GAME_PRESETS } from "@/types/audio";
import { audioEngine } from "@/lib/audio-engine";
import { encodeSoundParams, decodeSoundParams } from "@/helpers/url-sharing";
import SoundControls from "@/components/sound-controls";
import AudioVisualizer from "@/components/audio-visualizer";
import AiGenerator from "@/components/ai-generator";
import Randomizer from "@/components/randomizer";
import QuickPresets from "@/components/quick-presets";
import Composer from "@/components/composer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Download,
  Headphones,
  Share2,
  Github,
  LayoutGrid,
  Music,
  Copy,
  Check
} from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function SoundSculptorApp() {
  const { toast } = useToast();
  const [params, setParams] = useState<SoundParams>(defaultSoundParams);
  const [masterVolume, setMasterVolume] = useState(1.0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [presets, setPresets] = useState<SoundParams[]>([]);

  // Share Modal State
  const [shareUrl, setShareUrl] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // 1. Handle URL Sharing on Load
    if (typeof window !== "undefined") {
      const search = window.location.search;
      if (search) {
        const sharedParams = decodeSoundParams(search);
        if (Object.keys(sharedParams).length > 0) {
          setParams({
            ...defaultSoundParams,
            ...sharedParams,
          } as SoundParams);
          toast({
            title: "Sound Imported",
            description: "Shared parameters have been loaded.",
          });
        }
      }

      // Load master volume
      const storedVolume = localStorage.getItem("master-volume");
      if (storedVolume) {
        const vol = parseFloat(storedVolume);
        if (!isNaN(vol)) {
          setMasterVolume(vol);
          audioEngine.setMasterVolume(vol);
        }
      }
    }

    // 2. Load presets from localStorage
    const stored = localStorage.getItem("sound-presets");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPresets([...GAME_PRESETS, ...parsed]);
      } catch {
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
  }, [toast]);

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

  const handleUpdateMasterVolume = (val: number) => {
    setMasterVolume(val);
    audioEngine.setMasterVolume(val);
    localStorage.setItem("master-volume", val.toString());
  };

  const handleSelectPreset = (newParams: SoundParams, shouldPlay: boolean = true) => {
    const merged = { ...defaultSoundParams, ...newParams };
    setParams(merged);
    if (shouldPlay) {
      handlePlay(merged);
    }
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

  const handleShare = () => {
    const compressed = encodeSoundParams(params);
    const url = `${window.location.origin}${window.location.pathname}?${compressed}`;
    setShareUrl(url);
    setIsShareModalOpen(true);
    setCopied(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Your sound settings are ready to share.",
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleTabChange = () => {
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
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
            onClick={handleShare}
          >
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
                  masterVolume={masterVolume}
                  setMasterVolume={handleUpdateMasterVolume}
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

      {/* Share Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-white/10 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              Share Sound Preset
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Anyone with this link can load your synthesis parameters instantly.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-4">
            <div className="grid flex-1 gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="bg-white/5 border-white/10 focus-visible:ring-primary rounded-xl"
              />
            </div>
            <Button size="icon" onClick={copyToClipboard} className="bg-primary hover:bg-primary/90 shrink-0 rounded-xl">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" onClick={() => setIsShareModalOpen(false)} className="rounded-xl">Close</Button>
          </div>
        </DialogContent>
      </Dialog>

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
