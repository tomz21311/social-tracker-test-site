'use client';

import { Search, X } from 'lucide-react';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import { getYearOptions, PLATFORMS } from '@/lib/constants';
import { Platform } from '@/types';

export function TopBar() {
  const { filters, setYear, setPlatform, setSearch, clearFilters } = useGlobalFilters();
  const yearOptions = getYearOptions();

  const hasActiveFilters =
    filters.platform !== 'all' ||
    filters.search !== '' ||
    filters.year !== new Date().getFullYear();

  return (
    <header className="fixed top-0 right-0 left-[var(--sidebar-width)] h-[var(--topbar-height)] bg-white border-b border-surface-200 z-30 flex items-center px-6 gap-4">
      {/* Year Selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="year-select" className="text-xs font-medium text-surface-500 uppercase tracking-wide mb-0">
          Year
        </label>
        <select
          id="year-select"
          value={filters.year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="!w-auto !py-1.5 !text-sm"
        >
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Platform Filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="platform-select" className="text-xs font-medium text-surface-500 uppercase tracking-wide mb-0">
          Platform
        </label>
        <select
          id="platform-select"
          value={filters.platform}
          onChange={(e) => setPlatform(e.target.value as Platform | 'all')}
          className="!w-auto !py-1.5 !text-sm"
        >
          <option value="all">All Platforms</option>
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-sm ml-auto relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          placeholder="Search content, campaigns..."
          value={filters.search}
          onChange={(e) => setSearch(e.target.value)}
          className="!pl-9 !py-1.5 !text-sm"
        />
        {filters.search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="btn-ghost btn-sm text-surface-500"
        >
          Clear filters
        </button>
      )}
    </header>
  );
}
