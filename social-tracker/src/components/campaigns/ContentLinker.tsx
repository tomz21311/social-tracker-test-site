'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Content } from '@/types';

interface ContentLinkerProps {
  open: boolean;
  onClose: () => void;
  onLink: (contentId: string) => Promise<{ error: string | null }>;
  excludeIds: string[];
}

export function ContentLinker({ open, onClose, onLink, excludeIds }: ContentLinkerProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Content[]>([]);
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
        .from('content')
        .select('*')
        .ilike('title', `%${search}%`)
        .order('publish_date', { ascending: false })
        .limit(10);

      if (data) {
        setResults(
          (data as Content[]).filter((c) => !excludeIds.includes(c.id))
        );
      }
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, excludeIds]);

  if (!open) return null;

  const handleLink = async (contentId: string) => {
    setLinking(contentId);
    setError('');
    const { error: linkError } = await onLink(contentId);
    if (linkError) {
      setError(linkError);
    } else {
      // Remove from results
      setResults((prev) => prev.filter((c) => c.id !== contentId));
    }
    setLinking(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-lg font-semibold text-surface-900">Link Content</h2>
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
              placeholder="Search content by title..."
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
                        {item.title}
                      </div>
                      <div className="text-xs text-surface-400">
                        {new Date(item.publish_date + 'T00:00:00').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                        {' · '}
                        {item.platforms.join(', ')}
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
                No matching content found.
              </p>
            ) : (
              <p className="text-sm text-surface-400 text-center py-6">
                Start typing to search for content items.
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
