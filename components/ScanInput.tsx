'use client';
import { useState, useRef, useEffect } from 'react';
import {
  ArrowRightIcon,
  LoaderIcon,
  LockIcon,
  ExternalLinkIcon,
} from './Icons';

interface Props {
  onScan: (url: string, authToken?: string) => void;
  loading: boolean;
}

export function ScanInput({ onScan, loading }: Props) {
  const [value, setValue] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [token, setToken] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || loading) return;
    onScan(value.trim(), showToken && token ? token.trim() : undefined);
  }

  function togglePrivate() {
    setShowToken(!showToken);
    if (showToken) setToken('');
  }

  return (
    <section className="container-form pb-20">
      <form onSubmit={submit}>
        {/* Input row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="owner/repo or paste a GitHub URL"
            disabled={loading}
            className="bd bs flex-1 rounded-xl bg-card px-5 text-base font-medium disabled:opacity-60"
            style={{ minWidth: 0, height: 60 }}
          />
          <button
            type="submit"
            disabled={loading || !value.trim()}
            className="bd bs press rounded-xl bg-accent-3 px-8 text-base font-bold disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 whitespace-nowrap"
            style={{ height: 60 }}
          >
            {loading ? (
              <>
                <LoaderIcon size={16} />
                <span>Scanning</span>
              </>
            ) : (
              <>
                <span>Scan</span>
                <ArrowRightIcon size={16} />
              </>
            )}
          </button>
        </div>

        {/* Private repo row */}
        <div className="mt-3.5 flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={togglePrivate}
            className="inline-flex items-center gap-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
            aria-pressed={showToken}
          >
            <span
              className="flex items-center justify-center rounded transition-colors"
              style={{
                width: 18,
                height: 18,
                border: '2px solid var(--border)',
                background: showToken ? 'var(--accent)' : 'var(--card)',
              }}
            >
              {showToken && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </span>
            <LockIcon size={14} />
            Private repository
          </button>

          <a
            href="https://github.com/settings/tokens/new?description=vibecheck&scopes=repo"
            target="_blank"
            rel="noopener noreferrer"
            title="Opens GitHub with the token name and scope pre-filled"
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted transition-colors hover:text-accent"
          >
            Get your token
            <ExternalLinkIcon size={12} />
          </a>
        </div>

        {/* Token input */}
        {showToken && (
          <div className="pop mt-3">
            <div className="bd bs-sm rounded-xl bg-card overflow-hidden">
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_… or github_pat_…"
                disabled={loading}
                className="w-full bg-transparent px-5 py-3 text-sm font-mono outline-none disabled:opacity-60"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div className="mt-2 flex items-start gap-2 text-[12px] leading-relaxed text-muted">
              <LockIcon size={12} className="mt-0.5 shrink-0" />
              <span>
                Used once, never stored.{' '}
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-2 underline-offset-2 hover:text-accent"
                >
                  Revoke anytime
                </a>
                .
              </span>
            </div>
          </div>
        )}
      </form>
    </section>
  );
}