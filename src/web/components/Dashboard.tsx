import React from 'react';
import { Layout } from './Layout';
import { FilterBar } from './FilterBar';
import { KPICards } from './KPICards';
import { TokenChart } from './TokenChart';
import { ModelBreakdown } from './ModelBreakdown';
import { CostChart } from './CostChart';
import { HeatmapCalendar } from './HeatmapCalendar';
import { ProjectList } from './ProjectList';
import { SessionExplorer } from './SessionExplorer';
import { ExportButton } from './ExportButton';
import { ProviderComparison } from './ProviderComparison';
import { useUsageData } from '../hooks/useUsageData';

export function Dashboard() {
  const { summary, daily, projects, models, sessions, heatmap, loading, error } = useUsageData();

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <FilterBar />
          <ExportButton />
        </div>

        {loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-lg" style={i === 0 ? { gridColumn: 'span 2' } : {}} />)}
            </div>
            <div className="skeleton h-80 rounded-lg" />
          </div>
        )}

        {error && (
          <div className="card p-4" style={{ borderColor: 'rgba(217,119,87,0.3)', background: 'rgba(217,119,87,0.05)' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent-orange)' }}>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <KPICards summary={summary} />
            {summary?.providerBreakdown?.length > 1 && <ProviderComparison data={summary.providerBreakdown} />}
            {daily.length > 0 && <TokenChart data={daily} />}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {models.length > 0 && <ModelBreakdown data={models} />}
              {projects.length > 0 && <CostChart data={projects} />}
            </div>
            {heatmap.length > 0 && <HeatmapCalendar data={heatmap} />}
            {projects.length > 0 && <ProjectList data={projects} />}
            {sessions.length > 0 && <SessionExplorer data={sessions} />}
          </>
        )}

        {!loading && !error && summary?.totalTokens === 0 && (
          <div className="text-center py-20">
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>◇</div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--ink)', marginBottom: 8 }}>No usage data found</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--stone)' }}>
              Make sure Claude Code, Codex, or Antigravity has been used and data files exist.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
