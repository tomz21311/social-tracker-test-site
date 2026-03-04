'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Audience, Platform, AudienceType } from '@/types';
import { PLATFORMS, AUDIENCE_TYPES } from '@/lib/constants';
import { TagInput } from '@/components/shared/TagInput';

interface AudienceFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Audience, 'id' | 'created_at' | 'updated_at'>) => Promise<any>;
  initialData?: Partial<Audience>;
  mode?: 'create' | 'edit';
}

const emptyAudience = {
  name: '',
  platform: '' as any,
  type: '' as any,
  tags: [] as string[],
  notes: '',
  definition: '',
};

export function AudienceForm({
  open,
  onClose,
  onSubmit,
  initialData,
  mode = 'create',
}: AudienceFormProps) {
  const [form, setForm] = useState({ ...emptyAudience, ...initialData });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm({ ...emptyAudience, ...initialData });
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

    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }

    setSaving(true);
    try {
      const { id, created_at, updated_at, ...submitData } = form as any;
      submitData.platform = submitData.platform || null;
      submitData.type = submitData.type || null;
      submitData.notes = submitData.notes || null;
      submitData.definition = submitData.definition || null;

      await onSubmit(submitData);
      onClose();
    } catch {
      setError('Failed to save audience.');
    }
    setSaving(false);
  };

  const platformOptions = [
    ...PLATFORMS,
    { value: 'cross_platform', label: 'Cross-Platform' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-lg font-semibold text-surface-900">
            {mode === 'create' ? 'New Audience' : 'Edit Audience'}
          </h2>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div>
              <label htmlFor="audience-name">Name *</label>
              <input
                id="audience-name"
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Audience name"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="audience-platform">Platform</label>
                <select
                  id="audience-platform"
                  value={form.platform || ''}
                  onChange={(e) => updateField('platform', e.target.value || null)}
                >
                  <option value="">Select platform</option>
                  {platformOptions.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="audience-type">Type</label>
                <select
                  id="audience-type"
                  value={form.type || ''}
                  onChange={(e) => updateField('type', e.target.value || null)}
                >
                  <option value="">Select type</option>
                  {AUDIENCE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label>Tags</label>
              <TagInput
                tags={form.tags}
                onChange={(tags) => updateField('tags', tags)}
                placeholder="Add tags"
              />
            </div>

            <div>
              <label htmlFor="audience-definition">Definition</label>
              <textarea
                id="audience-definition"
                value={form.definition || ''}
                onChange={(e) => updateField('definition', e.target.value || null)}
                rows={3}
                placeholder="Describe the targeting criteria..."
              />
            </div>

            <div>
              <label htmlFor="audience-notes">Notes</label>
              <textarea
                id="audience-notes"
                value={form.notes || ''}
                onChange={(e) => updateField('notes', e.target.value || null)}
                rows={2}
                placeholder="Optional notes"
              />
            </div>

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
              {saving ? 'Saving...' : mode === 'create' ? 'Create Audience' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
