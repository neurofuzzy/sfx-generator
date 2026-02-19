"use client";

import { useState, useEffect } from "react";
import { generateSoundEffectFromDescription, isAiConfigured } from "@/ai/flows/generate-sound-effect-from-description";
import { defaultSoundParams, SoundParams } from "@/types/audio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AiGeneratorProps {
  onGenerated: (params: SoundParams) => void;
}

export default function AiGenerator({ onGenerated }: AiGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function checkAvailability() {
      try {
        const available = await isAiConfigured();
        setIsVisible(available);
      } catch {
        // In static export environments, the server action might fail entirely
        setIsVisible(false);
      }
    }
    checkAvailability();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const result = await generateSoundEffectFromDescription(prompt);
      // Merge with defaultSoundParams to ensure all required fields (like filterType) are present
      onGenerated({
        ...defaultSoundParams,
        ...result,
        name: prompt.length > 20 ? prompt.substring(0, 20) + "..." : prompt,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        waveformPairs: result.waveformPairs as any,
      });
      toast({
        title: "Sound Sculpted!",
        description: `Gemini interpreted: "${prompt}"`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Sculpting Failed",
        description: "Gemini couldn't process your request. Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything until we know if AI is available
  if (isVisible === false) return null;
  if (isVisible === null) return <div className="h-16 w-full animate-pulse bg-muted/20 rounded-2xl" />;

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-2xl border border-white/5 shadow-inner">
        <Input
          placeholder="Describe your sound (e.g., 'rusty gate creaking', 'alien portal opening')..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="border-none bg-transparent focus-visible:ring-0 text-lg py-6 placeholder:text-muted-foreground/50"
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          disabled={loading}
        />
        <Button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="rounded-xl h-12 px-6 bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all active:scale-95 shrink-0"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Sculpt
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
