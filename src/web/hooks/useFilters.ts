import { create } from 'zustand';

interface FilterState {
  from: string;
  to: string;
  project: string;
  model: string;
  provider: string;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  setProject: (v: string) => void;
  setModel: (v: string) => void;
  setProvider: (v: string) => void;
  setDateRange: (from: string, to: string) => void;
  clearAll: () => void;
}

export const useFilters = create<FilterState>((set) => ({
  from: '',
  to: '',
  project: '',
  model: '',
  provider: '',
  setFrom: (from) => set({ from }),
  setTo: (to) => set({ to }),
  setProject: (project) => set({ project }),
  setModel: (model) => set({ model }),
  setProvider: (provider) => set({ provider }),
  setDateRange: (from, to) => set({ from, to }),
  clearAll: () => set({ from: '', to: '', project: '', model: '', provider: '' }),
}));

export function useFilterParams(): Record<string, string> {
  const from = useFilters(s => s.from);
  const to = useFilters(s => s.to);
  const project = useFilters(s => s.project);
  const model = useFilters(s => s.model);
  const provider = useFilters(s => s.provider);

  const p: Record<string, string> = {};
  if (from) p.from = from;
  if (to) p.to = to;
  if (project) p.project = project;
  if (model) p.model = model;
  if (provider) p.provider = provider;
  return p;
}
