'use client';
import { useEffect, useState } from 'react';

const STEPS = [
  'Fetching repository tree…',
  'Reading source files…',
  'Checking for missing pages…',
  'Scanning for placeholder text…',
  'Detecting vibecoded signatures…',
  'Compiling your report…',
];

export function LoadingScan() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length);
    }, 1100);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="container-tight pop">
      <div className="bd bs-lg rounded-3xl bg-card px-8 py-16">
        <div className="flex flex-col items-center text-center">
          {/* Rotating scan ring */}
          <div className="relative" style={{ width: 96, height: 96 }}>
            <svg
              className="scan-ring absolute inset-0"
              width={96}
              height={96}
              viewBox="0 0 96 96"
              fill="none"
            >
              <circle
                cx="48" cy="48" r="40"
                stroke="#0a0a0a"
                strokeWidth="6"
                strokeDasharray="80 200"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-accent" />
            </div>
          </div>

          {/* Status text */}
          <div
            className="mt-8 text-[15px] font-semibold"
            key={step}
            style={{ animation: 'pop-in .3s ease both' }}
          >
            {STEPS[step]}
          </div>

          {/* Dots */}
          <div className="mt-3 flex gap-1.5">
            <span className="dot dot-1 h-2 w-2 rounded-full bg-accent" />
            <span className="dot dot-2 h-2 w-2 rounded-full bg-accent" />
            <span className="dot h-2 w-2 rounded-full bg-accent" />
          </div>

          {/* Sweeping progress bar */}
          <div
            className="mt-8 w-full max-w-xs overflow-hidden rounded-full"
            style={{ height: 6, background: 'rgba(10,10,10,0.08)' }}
          >
            <div
              className="sweep h-full w-1/4 rounded-full bg-accent"
            />
          </div>

          <p className="mt-6 text-sm text-muted">
            Usually takes 5–15 seconds
          </p>
        </div>
      </div>
    </div>
  );
}