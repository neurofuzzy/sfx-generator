"use client";

import { useState } from "react";
import { generateSoundEffectFromDescription } from "@/ai/flows/generate-sound-effect-from-description";
import { SoundParams } from "@/types/audio";
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
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const result = await generateSoundEffectFromDescription(prompt);
      onGenerated({
        ...result,
        name: prompt.length > 20 ? prompt.substring(0, 20) + "..." : prompt,
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
