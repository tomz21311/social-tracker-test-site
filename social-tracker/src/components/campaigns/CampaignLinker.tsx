'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Campaign } from '@/types';

interface CampaignLinkerProps {
  open: boolean;
  onClose: () => void;
  onLink: (campaignId: string) => Promise<{ error: string | null }>;
  excludeIds: string[];
}

export function CampaignLinker({ open, onClose, onLink, excludeIds }: CampaignLinkerProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Campaign[]>([]);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
    if (open) {
      setSearch('');
      setResults([]);
      setError('');
    }
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!search.trim()) {
        setResults([]);
        return;
      }

      setSearching(true);
      const { data } = await supabase
        .from('campaigns')
        .select('*')
        .ilike('campaign_name', `%${search}%`)
        .order('start_date', { ascending: false })
        .limit(10);

      if (data) {
        setResults(
          (data as Campaign[]).filter((c) => !excludeIds.includes(c.id))
        );
      }
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, excludeIds]);

  if (!open) return null;

  const handleLink = async (campaignId: string) => {
    setLinking(campaignId);
    setError('');
    const { error: linkError } = await onLink(campaignId);
    if (linkError) {
      setError(linkError);
    } else {
      setResults((prev) => prev.filter((c) => c.id !== campaignId));
    }
    setLinking(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-lg font-semibold text-surface-900">Link to Campaign</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body">
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="!pl-9"
              placeholder="Search campaigns by name..."
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-3">
              {error}
            </div>
          )}

          <div className="max-h-64 overflow-y-auto">
            {searching ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-1">
                {results.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-surface-50"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-surface-800 truncate">
                        {item.campaign_name}
                      </div>
                      <div className="text-xs text-surface-400">
                        {item.platforms.join(', ')}
                        {item.start_date &&
                          ` · ${new Date(item.start_date + 'T00:00:00').toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}`}
                      </div>
                    </div>
                    <button
                      onClick={() => handleLink(item.id)}
                      disabled={linking === item.id}
                      className="btn-secondary btn-sm ml-3 flex-shrink-0"
                    >
                      {linking === item.id ? (
                        <span className="w-3.5 h-3.5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          Link
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : search.trim() ? (
              <p className="text-sm text-surface-400 text-center py-6">
                No matching campaigns found.
              </p>
            ) : (
              <p className="text-sm text-surface-400 text-center py-6">
                Start typing to search for campaigns.
              </p>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
