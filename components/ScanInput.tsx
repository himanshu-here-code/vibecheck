'use client';
import { useState, useRef, useEffect } from 'react';
import { ArrowRightIcon, LoaderIcon } from './Icons';

interface Props {
  onScan: (url: string) => void;
  loading: boolean;
}

export function ScanInput({ onScan, loading }: Props) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim() && !loading) onScan(value.trim());
  }

  return (
    <section className="container-tight pb-20">
      <form onSubmit={submit}>
        <div className="flex gap-3">
          <input
            ref={ref}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="owner/repo or GitHub URL"
            disabled={loading}
            className="bd bs flex-1 rounded-xl bg-card px-5 text-base font-medium disabled:opacity-60"
            style={{ minWidth: 0, height: 56 }}
          />
          <button
            type="submit"
            disabled={loading || !value.trim()}
            className="bd bs press rounded-xl bg-accent-3 px-6 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 whitespace-nowrap"
            style={{ height: 56 }}
          >
            {loading ? (
              <>
                <LoaderIcon size={15} />
                <span>Scanning</span>
              </>
            ) : (
              <>
                <span>Scan</span>
                <ArrowRightIcon size={15} />
              </>
            )}
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-muted">
          Nothing is stored. The repo is fetched, analyzed, and forgotten.
        </p>
      </form>
    </section>
  );
}