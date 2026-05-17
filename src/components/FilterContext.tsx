'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

export type ViewMode = 'month' | 'year';

type Ctx = {
  month: number;
  year: number;
  view: ViewMode;
  setMonth: (m: number) => void;
  setYear: (y: number) => void;
  setView: (v: ViewMode) => void;
  matches: (dateStr: string) => boolean;
};

const FilterContext = createContext<Ctx | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [view, setView] = useState<ViewMode>('month');

  const matches = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (view === 'year') return d.getFullYear() === year;
    return d.getMonth() === month && d.getFullYear() === year;
  };

  return (
    <FilterContext.Provider value={{ month, year, view, setMonth, setYear, setView, matches }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const c = useContext(FilterContext);
  if (!c) throw new Error('useFilter must be inside FilterProvider');
  return c;
}
