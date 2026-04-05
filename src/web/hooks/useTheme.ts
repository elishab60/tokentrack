import { create } from 'zustand';

interface ThemeState {
  dark: boolean;
  toggle: () => void;
}

export const useTheme = create<ThemeState>((set) => ({
  dark: false,
  toggle: () => set(s => {
    const next = !s.dark;
    document.documentElement.classList.toggle('dark', next);
    return { dark: next };
  }),
}));
