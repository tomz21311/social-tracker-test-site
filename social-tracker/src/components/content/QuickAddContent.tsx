'use client';

import { useState } from 'react';
import { X, Zap } from 'lucide-react';
import { Content, Platform, ContentType } from '@/types';
import { PLATFORMS, CONTENT_TYPES } from '@/lib/constants';
import { MultiCheckbox } from '@/components/shared/MultiCheckbox';

interface QuickAddContentProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Content, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export function QuickAddContent({ open, onClose, onSubmit }: QuickAddContentProps) {
  const [title, setTitle] = useState('');
  const [publishDate, setPublishDate] = useState(new Date().toISOString().split('T')[0]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [contentType, setContentType] = useState<ContentType | ''>('');
  const [impressions, setImpressions] = useState('');
  const [clicks, setClicks] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (platforms.length === 0) {
      setError('Select at least one platform.');
      return;
    }

    setSaving(true);

    // Build content object with metrics distributed across first selected platform
    const imp = parseInt(impressions) || 0;
    const clk = parseInt(clicks) || 0;
    const firstPlatform = platforms[0];

    const data: any = {
      title: title.trim(),
      publish_date: publishDate,
      platforms,
      content_type: contentType || null,
      tags: [],
      url: null,
      notes: null,
      organic_impressions_ig: firstPlatform === 'instagram' ? imp : 0,
      organic_unique_viewers_ig: 0,
      organic_clicks_ig: firstPlatform === 'instagram' ? clk : 0,
      engagements_ig: 0,
      video_views_ig: 0,
      watch_time_ig: 0,
      organic_impressions_fb: firstPlatform === 'facebook' ? imp : 0,
      organic_unique_viewers_fb: 0,
      organic_clicks_fb: firstPlatform === 'facebook' ? clk : 0,
      engagements_fb: 0,
      video_views_fb: 0,
      watch_time_fb: 0,
      organic_impressions_li: firstPlatform === 'linkedin' ? imp : 0,
      organic_unique_viewers_li: 0,
      organic_clicks_li: firstPlatform === 'linkedin' ? clk : 0,
      engagements_li: 0,
      video_views_li: 0,
      watch_time_li: 0,
    };

    try {
      await onSubmit(data);
      onClose();
    } catch {
      setError('Failed to save content.');
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h2 className="text-lg font-semibold text-surface-900">Quick Add</h2>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <p className="text-xs text-surface-400">
              Enter the essentials now. You can add more details later.
            </p>

            <div>
              <label htmlFor="qa-title">Title *</label>
              <input
                id="qa-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Content title"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="qa-date">Publish Date *</label>
                <input
                  id="qa-date"
                  type="date"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="qa-type">Type</label>
                <select
                  id="qa-type"
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as ContentType)}
                >
                  <option value="">Select</option>
                  {CONTENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label>Platforms *</label>
              <MultiCheckbox
                options={PLATFORMS}
                selected={platforms}
                onChange={(sel) => setPlatforms(sel as Platform[])}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="qa-impressions">Impressions</label>
                <input
                  id="qa-impressions"
                  type="number"
                  min="0"
                  value={impressions}
                  onChange={(e) => setImpressions(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label htmlFor="qa-clicks">Clicks</label>
                <input
                  id="qa-clicks"
                  type="number"
                  min="0"
                  value={clicks}
                  onChange={(e) => setClicks(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {platforms.length > 1 && (
              <p className="text-xs text-surface-400">
                Metrics will be assigned to {PLATFORMS.find((p) => p.value === platforms[0])?.label}.
                Edit the content later to split across platforms.
              </p>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Add Content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
