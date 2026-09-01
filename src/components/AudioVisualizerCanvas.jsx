import React, { useEffect, useRef } from 'react';

export const AudioVisualizerCanvas = ({
  isActive = false,
  amplitude = 1.0,
  barCount = 32,
  color = '#5865F2',
  className = ''
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = null;
    let phase = 0;

    const render = () => {
      if (!canvas) return;
      const width = canvas.offsetWidth || 300;
      const height = canvas.offsetHeight || 80;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      if (!isActive) {
        // Draw flat subtle line when inactive
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        const barWidth = (width / barCount) * 0.6;
        const gap = (width / barCount) * 0.4;
        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + gap);
          ctx.fillRect(x, height / 2 - 1, barWidth, 2);
        }
        return;
      }

      phase += 0.05;
      const barWidth = Math.max(2, (width / barCount) * 0.6);
      const gap = Math.max(1, (width / barCount) * 0.4);

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + gap);
        // Smooth sine wave pseudo-frequency calculation
        const sin1 = Math.sin(phase + i * 0.2);
        const sin2 = Math.cos(phase * 0.7 + i * 0.35);
        const normalized = Math.max(0.1, (sin1 * 0.5 + sin2 * 0.5 + 1) / 2);
        const barHeight = Math.max(4, normalized * height * 0.8 * amplitude);
        const y = (height - barHeight) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'rgba(128, 90, 213, 0.4)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, 2);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isActive, amplitude, barCount, color]);

  return <canvas ref={canvasRef} className={`block ${className}`} />;
};

export default AudioVisualizerCanvas;