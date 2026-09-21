'use client';
import { useEffect, useState } from 'react';

interface ScoreRingProps {
  score: number;
  size?: number;
}

export function ScoreRing({ score, size = 160 }: ScoreRingProps) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(score * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  // Fixed geometry — the ring is mathematically guaranteed to be a circle.
  const stroke = 12;
  const padding = 3; // outline padding
  const outerStroke = stroke + padding * 2;
  const r = (size - outerStroke) / 2; // radius for both strokes
  const c = 2 * Math.PI * r;
  const offset = c - (displayed / 100) * c;
  const center = size / 2;

  const color =
    score >= 70 ? '#ef4444' :
    score >= 50 ? '#f97316' :
    score >= 30 ? '#fbbf24' :
    score >= 15 ? '#84cc16' :
                  '#22c55e';

  return (
    <div
      className="relative shrink-0 select-none"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
      >
        {/* Black outline (behind everything) */}
        <circle
          cx={center}
          cy={center}
          r={r}
          stroke="#0a0a0a"
          strokeWidth={outerStroke}
          fill="none"
        />

        {/* White track */}
        <circle
          cx={center}
          cy={center}
          r={r}
          stroke="#ffffff"
          strokeWidth={stroke}
          fill="none"
        />

        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          strokeLinecap="butt"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-baseline leading-none">
          <span className="headline tabular-nums" style={{ fontSize: size * 0.28 }}>
            {displayed}
          </span>
          <span className="headline" style={{ fontSize: size * 0.16 }}>
            %
          </span>
        </div>
        <div
        className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-muted"
      >
        vibecoded
      </div>
      </div>
    </div>
  );
}