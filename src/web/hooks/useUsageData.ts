import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api-client';
import { useFilterParams } from './useFilters';

export function useUsageData() {
  const params = useFilterParams();
  const paramsKey = JSON.stringify(params);

  const [summary, setSummary] = useState<any>(null);
  const [daily, setDaily] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [filterOptions, setFilterOptions] = useState<{ projects: string[]; models: string[]; providers: string[] }>({ projects: [], models: [], providers: [] });
  const [providerInfo, setProviderInfo] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, d, p, m, sess, h, f, pi] = await Promise.all([
        api.summary(params),
        api.daily(params),
        api.projects(params),
        api.models(params),
        api.sessions(params),
        api.heatmap(params),
        api.filters(),
        api.providers(),
      ]);
      setSummary(s);
      setDaily(d);
      setProjects(p);
      setModels(m);
      setSessions(sess);
      setHeatmap(h);
      setFilterOptions(f);
      setProviderInfo(pi);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [paramsKey]);

  useEffect(() => {
    const timer = setTimeout(refresh, 150);
    return () => clearTimeout(timer);
  }, [refresh]);

  return { summary, daily, projects, models, sessions, heatmap, filterOptions, providerInfo, loading, error, refresh };
}
