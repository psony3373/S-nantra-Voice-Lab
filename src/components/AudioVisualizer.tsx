import React, { useEffect, useRef } from 'react';
import { getAnalyser } from '../utils/audioDsp';
import { VoiceId } from '../types';

interface AudioVisualizerProps {
  isPlaying: boolean;
  voiceId: VoiceId;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isPlaying, voiceId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const analyser = getAnalyser();
      const isEryx = voiceId === 'eryx';
      const primaryColor = isEryx ? 'rgba(245, 158, 11, ' : 'rgba(244, 63, 94, ';
      const secondaryColor = isEryx ? 'rgba(217, 119, 6, ' : 'rgba(236, 72, 153, ';

      if (isPlaying && analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        // Draw frequency bars
        const barCount = 48;
        const barWidth = (width / barCount) - 2;
        const step = Math.floor(bufferLength / barCount);

        for (let i = 0; i < barCount; i++) {
          const value = dataArray[i * step] || 0;
          const percent = value / 255;
          const barHeight = Math.max(4, percent * (height * 0.82));
          const x = i * (barWidth + 2);
          const y = height - barHeight;

          // Gradient for bars
          const grad = ctx.createLinearGradient(0, y, 0, height);
          grad.addColorStop(0, `${primaryColor}0.95)`);
          grad.addColorStop(1, `${secondaryColor}0.2)`);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
          ctx.fill();

          // Subtle glow cap
          if (percent > 0.4) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(x, y, barWidth, 2);
          }
        }
      } else {
        // Idle gentle breathing wave
        phase += 0.04;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);

        for (let x = 0; x < width; x += 4) {
          const y =
            height / 2 +
            Math.sin(x * 0.02 + phase) * 4 +
            Math.cos(x * 0.01 - phase * 0.6) * 3;
          ctx.lineTo(x, y);
        }

        ctx.strokeStyle = `${primaryColor}0.25)`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Center label
        ctx.font = '11px sans-serif';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.textAlign = 'center';
        ctx.fillText('Audio Visualizer (Siap memutar suara & bisikan)', width / 2, height / 2 - 12);
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [isPlaying, voiceId]);

  return (
    <div className="relative w-full h-20 rounded-xl overflow-hidden bg-slate-950/80 border border-slate-800/80 shadow-inner">
      <canvas
        ref={canvasRef}
        width={640}
        height={80}
        className="w-full h-full block"
      />
      <div className="absolute top-2 right-3 flex items-center gap-1.5 pointer-events-none">
        <span
          className={`w-2 h-2 rounded-full ${
            isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
          }`}
        />
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          {isPlaying ? 'DSP Live' : 'Idle'}
        </span>
      </div>
    </div>
  );
};
