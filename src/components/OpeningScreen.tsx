import React, { useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, Network } from 'lucide-react';

interface OpeningScreenProps {
  onEnter: () => void;
}

export const OpeningScreen: React.FC<OpeningScreenProps> = ({ onEnter }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animated knowledge network canvas background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate cluster nodes representing academic documents & semantic concepts
    const numNodes = Math.min(65, Math.floor((width * height) / 18000));
    const nodes: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      cluster: number;
    }[] = [];

    const clusterColors = [
      'rgba(56, 189, 248, 0.85)', // electric cyan
      'rgba(14, 165, 233, 0.8)',  // electric blue
      'rgba(168, 85, 247, 0.85)', // violet
      'rgba(45, 212, 191, 0.8)'   // teal
    ];

    for (let i = 0; i < numNodes; i++) {
      const cluster = i % 4;
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2.5 + 1.5,
        color: clusterColors[cluster],
        cluster
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle connections between nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const maxDist = nodes[i].cluster === nodes[j].cluster ? 130 : 75;
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.35;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle =
              nodes[i].cluster === nodes[j].cluster
                ? `rgba(56, 189, 248, ${alpha})`
                : `rgba(168, 85, 247, ${alpha * 0.6})`;
            ctx.lineWidth = 0.85;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#070B14] overflow-hidden select-none px-6">
      {/* Background Knowledge Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-85" />

      {/* Subtle radial glow */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-cyan-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute w-[450px] h-[450px] rounded-full bg-violet-600/10 blur-[110px] pointer-events-none translate-x-40 translate-y-30" />

      {/* Main Content Container */}
      <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
        {/* Subtle Network Emblem */}
        <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900/80 border border-cyan-500/30 shadow-[0_0_30px_rgba(56,189,248,0.2)]">
          <Network className="w-8 h-8 text-cyan-400 animate-pulse" />
        </div>

        {/* Title-Only Requirement */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-4 leading-tight">
          Research Abstract Classification <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400">
            &amp; Trend Discovery Platform
          </span>
        </h1>

        {/* Project Tagline */}
        <p className="text-lg sm:text-xl text-slate-400 font-light max-w-2xl mb-10 tracking-wide">
          Transform Research Papers into Intelligent Insights.
        </p>

        {/* Clear Enter Button */}
        <button
          onClick={onEnter}
          className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-base sm:text-lg shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:shadow-[0_0_35px_rgba(56,189,248,0.55)] hover:from-cyan-400 hover:to-blue-500 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <span>Enter Platform</span>
          <ArrowRight className="w-5 h-5 text-white transition-transform group-hover:translate-x-1" />
        </button>

        {/* Minimal Academic Tagline indicator */}
        <div className="mt-14 flex items-center gap-2 text-xs text-slate-500">
          <span>AI &amp; Data Science Intelligence Platform</span>
          <span aria-hidden="true">·</span>
          <span>NLP Preprocessing</span>
          <span aria-hidden="true">·</span>
          <span>Topic Discovery</span>
          <span aria-hidden="true">·</span>
          <span>Trend Analytics</span>
        </div>
      </div>
    </div>
  );
};
