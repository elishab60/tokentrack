import React from 'react';

const CFG: Record<string, { name: string; color: string; abbr: string }> = {
  'claude-code': { name: 'Claude Code', color: 'var(--provider-cc)', abbr: 'CC' },
  'codex': { name: 'Codex', color: 'var(--provider-cx)', abbr: 'CX' },
  'antigravity': { name: 'Antigravity', color: '#4285f4', abbr: 'AG' },
};

export function ProviderBadge({ provider }: { provider: string }) {
  const c = CFG[provider] || { name: provider, color: 'var(--stone)', abbr: '??' };
  return (
    <span
      title={c.name}
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
      style={{ fontFamily: 'var(--font-display)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.03em', color: c.color, background: `color-mix(in srgb, ${c.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${c.color} 20%, transparent)` }}
    >
      <span className="w-[5px] h-[5px] rounded-full" style={{ background: c.color }} />
      {c.abbr}
    </span>
  );
}

export function ProviderDot({ provider }: { provider: string }) {
  const c = CFG[provider] || { color: 'var(--stone)' };
  return <span className="inline-block w-2 h-2 rounded-full" style={{ background: c.color }} />;
}
