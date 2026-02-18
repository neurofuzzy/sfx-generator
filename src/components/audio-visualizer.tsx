"use client";

import { useEffect, useRef } from "react";
import { audioEngine } from "@/lib/audio-engine";

export default function AudioVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const draw = () => {
      const analyser = audioEngine.getAnalyser();
      if (!analyser) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgb(121, 91, 237)"; // Primary color
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="w-full h-32 glass-panel rounded-xl overflow-hidden relative border border-white/10">
      <canvas
        ref={canvasRef}
        width={800}
        height={200}
        className="w-full h-full opacity-80"
      />
      <div className="absolute bottom-2 right-4 text-[10px] text-muted-foreground uppercase tracking-widest pointer-events-none font-bold">
        Live Monitor
      </div>
    </div>
  );
}
