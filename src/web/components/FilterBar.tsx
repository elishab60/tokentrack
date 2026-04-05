import React, { useEffect, useState } from 'react';
import { useFilters } from '../hooks/useFilters';
import { api } from '../lib/api-client';
import { Dropdown, type DropdownOption } from './Dropdown';
import { DateRangePicker } from './DateRangePicker';
import { formatCost } from '../lib/formatters';

export function FilterBar() {
  const { from, to, project, model, provider, setFrom, setTo, setProject, setModel, setProvider, setDateRange, clearAll } = useFilters();
  const [options, setOptions] = useState<{ projects: string[]; models: string[]; providers: string[] }>({ projects: [], models: [], providers: [] });
  const [projectData, setProjectData] = useState<any[]>([]);
  const [modelData, setModelData] = useState<any[]>([]);

  useEffect(() => {
    api.filters().then(setOptions);
    api.projects().then(setProjectData);
    api.models().then(setModelData);
  }, []);

  // Provider options
  const PROVIDER_META: Record<string, { label: string; dot: string }> = {
    'claude-code': { label: 'Claude Code', dot: 'var(--provider-cc)' },
    'codex': { label: 'Codex', dot: 'var(--provider-cx)' },
    'antigravity': { label: 'Antigravity', dot: '#4285f4' },
  };
  const providerOpts: DropdownOption[] = [
    { value: '', label: 'All Providers' },
    ...options.providers.map(p => ({
      value: p,
      label: PROVIDER_META[p]?.label || p,
      dot: PROVIDER_META[p]?.dot,
    })),
  ];

  // Project options — filter junk, sort by cost, show cost
  const cleanProjects = projectData
    .filter(p => {
      if (!p.project || p.project.length <= 1) return false;
      if (/^\d+$/.test(p.project)) return false;
      if (/^20\d\d$/.test(p.project)) return false;
      if (p.totalCost < 1) return false;
      return true;
    })
    .sort((a, b) => b.totalCost - a.totalCost);

  const projectOpts: DropdownOption[] = [
    { value: '', label: 'All Projects' },
    ...cleanProjects.map(p => ({
      value: p.project,
      label: p.project,
      meta: formatCost(p.totalCost),
    })),
  ];

  // Model options — show usage %
  const totalModelTokens = modelData.reduce((s, m) => s + m.inputTokens + m.outputTokens + m.cacheTokens, 0);
  const modelOpts: DropdownOption[] = [
    { value: '', label: 'All Models' },
    ...modelData
      .sort((a, b) => (b.inputTokens + b.outputTokens + b.cacheTokens) - (a.inputTokens + a.outputTokens + a.cacheTokens))
      .map(m => {
        const tokens = m.inputTokens + m.outputTokens + m.cacheTokens;
        const pct = totalModelTokens > 0 ? ((tokens / totalModelTokens) * 100).toFixed(0) : '0';
        const dot = m.provider === 'claude-code' ? 'var(--provider-cc)' : m.provider === 'codex' ? 'var(--provider-cx)' : 'var(--stone)';
        return { value: m.model, label: m.model, meta: `${pct}%`, dot };
      }),
  ];

  const hasFilters = from || to || project || model || provider;

  return (
    <div className="flex flex-wrap items-center gap-2 animate-in" style={{ animationDelay: '100ms' }}>
      <Dropdown options={providerOpts} value={provider} onChange={setProvider} placeholder="All Providers" />

      <DateRangePicker from={from} to={to} onFromChange={setFrom} onToChange={setTo} onRangeChange={setDateRange} />

      <Dropdown options={projectOpts} value={project} onChange={setProject} placeholder="All Projects" searchable />
      <Dropdown options={modelOpts} value={model} onChange={setModel} placeholder="All Models" />

      {hasFilters && (
        <button onClick={clearAll} style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--accent-orange)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          ✕ Clear
        </button>
      )}
    </div>
  );
}
