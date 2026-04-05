import React, { useEffect, useState } from 'react';
import { useTheme } from '../hooks/useTheme';

export function Layout({ children }: { children: React.ReactNode }) {
  const { dark, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-base)', color: 'var(--ink)' }}>
      <header
        className="sticky top-0 z-50 animate-slide-down"
        style={{
          background: 'var(--surface-base)',
          borderBottom: '1px solid var(--border-subtle)',
          boxShadow: scrolled ? 'var(--shadow-md)' : 'none',
          transition: 'box-shadow 200ms ease',
        }}
      >
        <div className="max-w-[1440px] mx-auto px-6">
          {/* Row 1: Brand + Theme toggle */}
          <div className="flex items-center justify-between py-3">
            <span style={{
              fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
              fontSize: '17px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
            }}>
              Token<span style={{ color: 'var(--accent-orange)' }}>Track</span>
            </span>

            <button
              onClick={toggle}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32,
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-card)',
                color: 'var(--stone)',
                cursor: 'pointer',
                transition: 'border-color 150ms, color 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-orange)'; e.currentTarget.style.color = 'var(--ink)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--stone)'; }}
              title={dark ? 'Light mode' : 'Dark mode'}
            >
              {dark ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-6 py-5">
        {children}
      </main>

      <footer className="mt-8 py-5 text-center" style={{ borderTop: '1px solid var(--border-hairline)', color: 'var(--stone)', fontFamily: 'var(--font-body)', fontSize: '12px', lineHeight: 1.6 }}>
        <p>TokenTrack · Token consumption tracker · Costs shown are API-rate estimates · All data local</p>
      </footer>
    </div>
  );
}
