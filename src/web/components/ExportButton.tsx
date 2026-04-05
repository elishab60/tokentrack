import React from 'react';
import { useFilterParams } from '../hooks/useFilters';
import { api } from '../lib/api-client';

export function ExportButton() {
  const params = useFilterParams();
  const btnStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.03em',
    padding: '5px 12px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--stone)',
    cursor: 'pointer', transition: 'all var(--duration-fast)',
    textDecoration: 'none', display: 'inline-block',
  };

  return (
    <div className="flex gap-1.5">
      <a href={api.exportUrl('csv', params)} download style={btnStyle}>CSV</a>
      <a href={api.exportUrl('json', params)} download style={btnStyle}>JSON</a>
    </div>
  );
}
