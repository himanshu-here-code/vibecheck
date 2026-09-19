'use client';
import { useEffect, useState } from 'react';

export function ScoreRing({ score }: { score: number }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(score * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [score]);

  const size = 160;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (displayed / 100) * c;

  const color =
    score >= 70 ? '#ef4444' :
    score >= 30 ? '#fbbf24' :
                  '#34d399';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="#0a0a0a" strokeWidth={stroke + 6} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke="#ffffff" strokeWidth={stroke} fill="none" />
        <circle
          cx={size/2} cy={size/2} r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="butt"
          style={{ transition: 'stroke-dashoffset .35s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-baseline leading-none">
          <span className="headline text-[44px] tabular-nums">{displayed}</span>
          <span className="headline text-2xl">%</span>
        </div>
        <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
          vibecoded
        </div>
      </div>
    </div>
  );
}