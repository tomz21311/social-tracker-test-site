'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Content, Platform, ContentType } from '@/types';
import { PLATFORMS, CONTENT_TYPES } from '@/lib/constants';
import { TagInput } from '@/components/shared/TagInput';
import { MultiCheckbox } from '@/components/shared/MultiCheckbox';

interface ContentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Content, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  initialData?: Partial<Content>;
  mode?: 'create' | 'edit';
}

const emptyContent = {
  title: '',
  publish_date: new Date().toISOString().split('T')[0],
  platforms: [] as Platform[],
  content_type: '' as ContentType,
  tags: [] as string[],
  url: '',
  notes: '',
  // Organic
  organic_impressions_ig: 0,
  organic_unique_viewers_ig: 0,
  organic_clicks_ig: 0,
  engagements_ig: 0,
  video_views_ig: 0,
  watch_time_ig: 0,
  organic_impressions_fb: 0,
  organic_unique_viewers_fb: 0,
  organic_clicks_fb: 0,
  engagements_fb: 0,
  video_views_fb: 0,
  watch_time_fb: 0,
  organic_impressions_li: 0,
  organic_unique_viewers_li: 0,
  organic_clicks_li: 0,
  engagements_li: 0,
  video_views_li: 0,
  watch_time_li: 0,
  // Paid
  paid_impressions_ig: 0,
  paid_unique_viewers_ig: 0,
  paid_clicks_ig: 0,
  paid_engagements_ig: 0,
  paid_video_views_ig: 0,
  paid_watch_time_ig: 0,
  paid_impressions_fb: 0,
  paid_unique_viewers_fb: 0,
  paid_clicks_fb: 0,
  paid_engagements_fb: 0,
  paid_video_views_fb: 0,
  paid_watch_time_fb: 0,
  paid_impressions_li: 0,
  paid_unique_viewers_li: 0,
  paid_clicks_li: 0,
  paid_engagements_li: 0,
  paid_video_views_li: 0,
  paid_watch_time_li: 0,
};

export function ContentForm({
  open,
  onClose,
  onSubmit,
  initialData,
  mode = 'create',
}: ContentFormProps) {
  const [form, setForm] = useState({ ...emptyContent, ...initialData });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Reset form state whenever the modal opens or initialData changes
  useEffect(() => {
    if (open) {
      setForm({ ...emptyContent, ...initialData });
      setError('');
    }
  }, [open, initialData]);

  if (!open) return null;

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!form.publish_date) {
      setError('Publish date is required.');
      return;
    }
    if (form.platforms.length === 0) {
      setError('Select at least one platform.');
      return;
    }

    setSaving(true);
    try {
      // Strip out DB-managed fields so we send only editable data
      const { id, created_at, updated_at, ...submitData } = form as any;
      await onSubmit(submitData);
      onClose();
    } catch {
      setError('Failed to save content.');
    }
    setSaving(false);
  };

  const metricsForPlatform = (suffix: string) => {
    const key = (field: string) => `${field}_${suffix}` as keyof typeof form;
    return {
      impressions: key('organic_impressions'),
      unique_viewers: key('organic_unique_viewers'),
      clicks: key('organic_clicks'),
      engagements: key('engagements'),
      video_views: key('video_views'),
      watch_time: key('watch_time'),
    };
  };

  const paidMetricsForPlatform = (suffix: string) => {
    const key = (field: string) => `${field}_${suffix}` as keyof typeof form;
    return {
      impressions: key('paid_impressions'),
      unique_viewers: key('paid_unique_viewers'),
      clicks: key('paid_clicks'),
      engagements: key('paid_engagements'),
      video_views: key('paid_video_views'),
      watch_time: key('paid_watch_time'),
    };
  };

  const platformSuffix: Record<Platform, string> = {
    instagram: 'ig',
    facebook: 'fb',
    linkedin: 'li',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="text-lg font-semibold text-surface-900">
            {mode === 'create' ? 'New Content' : 'Edit Content'}
          </h2>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-5">
            {/* Title */}
            <div>
              <label htmlFor="content-title">Title *</label>
              <input
                id="content-title"
                type="text"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Content title"
                autoFocus
              />
            </div>

            {/* Date + Content Type row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="publish-date">Publish Date *</label>
                <input
                  id="publish-date"
                  type="date"
                  value={form.publish_date}
                  onChange={(e) => updateField('publish_date', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="content-type">Content Type</label>
                <select
                  id="content-type"
                  value={form.content_type || ''}
                  onChange={(e) => updateField('content_type', e.target.value || null)}
                >
                  <option value="">Select type</option>
                  {CONTENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Platforms */}
            <div>
              <label>Platforms *</label>
              <MultiCheckbox
                options={PLATFORMS}
                selected={form.platforms}
                onChange={(selected) => updateField('platforms', selected)}
              />
            </div>

            {/* Tags */}
            <div>
              <label>Topic Tags</label>
              <TagInput
                tags={form.tags}
                onChange={(tags) => updateField('tags', tags)}
                placeholder="Type a tag and press Enter"
              />
            </div>

            {/* URL */}
            <div>
              <label htmlFor="content-url">URL</label>
              <input
                id="content-url"
                type="url"
                value={form.url || ''}
                onChange={(e) => updateField('url', e.target.value || null)}
                placeholder="https://..."
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="content-notes">Notes</label>
              <textarea
                id="content-notes"
                value={form.notes || ''}
                onChange={(e) => updateField('notes', e.target.value || null)}
                rows={2}
                placeholder="Optional notes"
              />
            </div>

            {/* Metrics — Organic and Paid per platform */}
            {form.platforms.length > 0 && (
              <div>
                <div className="mb-1">
                  <label className="!mb-0">Performance Metrics</label>
                  <p className="text-xs text-surface-400 mt-0.5">
                    Enter organic and paid metrics for each platform.
                  </p>
                </div>

                <div className="space-y-4 mt-3">
                  {form.platforms.map((p) => {
                    const suffix = platformSuffix[p];
                    const organic = metricsForPlatform(suffix);
                    const paid = paidMetricsForPlatform(suffix);
                    const platformLabel = PLATFORMS.find((pl) => pl.value === p)?.label;

                    const renderMetricFields = (metrics: ReturnType<typeof metricsForPlatform>) => (
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="!text-xs">Impressions</label>
                          <input
                            type="number"
                            min="0"
                            value={form[metrics.impressions] as number || ''}
                            onChange={(e) =>
                              updateField(metrics.impressions, parseInt(e.target.value) || 0)
                            }
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="!text-xs">Unique Viewers</label>
                          <input
                            type="number"
                            min="0"
                            value={form[metrics.unique_viewers] as number || ''}
                            onChange={(e) =>
                              updateField(metrics.unique_viewers, parseInt(e.target.value) || 0)
                            }
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="!text-xs">Link Clicks</label>
                          <input
                            type="number"
                            min="0"
                            value={form[metrics.clicks] as number || ''}
                            onChange={(e) =>
                              updateField(metrics.clicks, parseInt(e.target.value) || 0)
                            }
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="!text-xs">Engagements</label>
                          <input
                            type="number"
                            min="0"
                            value={form[metrics.engagements] as number || ''}
                            onChange={(e) =>
                              updateField(metrics.engagements, parseInt(e.target.value) || 0)
                            }
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="!text-xs">Video Views</label>
                          <input
                            type="number"
                            min="0"
                            value={form[metrics.video_views] as number || ''}
                            onChange={(e) =>
                              updateField(metrics.video_views, parseInt(e.target.value) || 0)
                            }
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="!text-xs">Watch Time (sec)</label>
                          <input
                            type="number"
                            min="0"
                            value={form[metrics.watch_time] as number || ''}
                            onChange={(e) =>
                              updateField(metrics.watch_time, parseInt(e.target.value) || 0)
                            }
                            placeholder="0"
                          />
                        </div>
                      </div>
                    );

                    return (
                      <div key={p} className="space-y-3">
                        {/* Organic */}
                        <div className="rounded-lg border border-surface-200 bg-surface-50/50 p-4">
                          <h4 className="text-sm font-medium text-surface-700 mb-3">
                            {platformLabel} — Organic
                          </h4>
                          {renderMetricFields(organic)}
                        </div>
                        {/* Paid */}
                        <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-4">
                          <h4 className="text-sm font-medium text-blue-700 mb-3">
                            {platformLabel} — Paid
                          </h4>
                          {renderMetricFields(paid)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
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
              {saving ? 'Saving...' : mode === 'create' ? 'Create Content' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
