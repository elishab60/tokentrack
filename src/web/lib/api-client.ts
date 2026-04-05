const BASE = '';

async function fetchApi<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  summary: (params?: Record<string, string>) => fetchApi<any>('/api/summary', params),
  daily: (params?: Record<string, string>) => fetchApi<any[]>('/api/daily', params),
  weekly: (params?: Record<string, string>) => fetchApi<any[]>('/api/weekly', params),
  monthly: (params?: Record<string, string>) => fetchApi<any[]>('/api/monthly', params),
  projects: (params?: Record<string, string>) => fetchApi<any[]>('/api/projects', params),
  models: (params?: Record<string, string>) => fetchApi<any[]>('/api/models', params),
  sessions: (params?: Record<string, string>) => fetchApi<any[]>('/api/sessions', params),
  sessionDetail: (id: string) => fetchApi<any>(`/api/sessions/${id}`),
  heatmap: (params?: Record<string, string>) => fetchApi<any[]>('/api/heatmap', params),
  filters: () => fetchApi<{ projects: string[]; models: string[]; providers: string[] }>('/api/filters'),
  providers: () => fetchApi<any[]>('/api/providers'),
  pricing: () => fetchApi<any>('/api/pricing'),
  exportUrl: (format: string, params?: Record<string, string>) => {
    const url = new URL('/api/export', window.location.origin);
    url.searchParams.set('format', format);
    if (params) Object.entries(params).forEach(([k, v]) => { if (v) url.searchParams.set(k, v); });
    return url.toString();
  },
};
