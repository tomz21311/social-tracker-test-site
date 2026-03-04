'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { GlobalFilters, Platform } from '@/types';

interface GlobalFiltersContextValue {
  filters: GlobalFilters;
  setYear: (year: number) => void;
  setPlatform: (platform: Platform | 'all') => void;
  setSearch: (search: string) => void;
  clearFilters: () => void;
}

const defaultFilters: GlobalFilters = {
  year: new Date().getFullYear(),
  platform: 'all',
  search: '',
};

const GlobalFiltersContext = createContext<GlobalFiltersContextValue | null>(null);

export function GlobalFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<GlobalFilters>(defaultFilters);

  const setYear = useCallback((year: number) => {
    setFilters((prev) => ({ ...prev, year }));
  }, []);

  const setPlatform = useCallback((platform: Platform | 'all') => {
    setFilters((prev) => ({ ...prev, platform }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  return (
    <GlobalFiltersContext.Provider
      value={{ filters, setYear, setPlatform, setSearch, clearFilters }}
    >
      {children}
    </GlobalFiltersContext.Provider>
  );
}

export function useGlobalFilters() {
  const context = useContext(GlobalFiltersContext);
  if (!context) {
    throw new Error('useGlobalFilters must be used within a GlobalFiltersProvider');
  }
  return context;
}
