'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Campaign, Platform, Audience } from '@/types';
import { PLATFORMS, OBJECTIVES, GEO_TYPES, dollarsToCents } from '@/lib/constants';
import { MultiCheckbox } from '@/components/shared/MultiCheckbox';
import { TagInput } from '@/components/shared/TagInput';

interface CampaignFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) => Promise<any>;
  onLinkAudiences?: (audienceIds: string[]) => Promise<void>;
  initialData?: Partial<Campaign>;
  audiences?: Audience[];
  linkedAudienceIds?: string[];
  mode?: 'create' | 'edit';
}

const emptyCampaign = {
  campaign_name: '',
  platforms: [] as Platform[],
  objective: '' as any,
  start_date: '',
  end_date: '',
  spend: 0,
  geo_type: '' as any,
  geo_tags: [] as string[],
  notes: '',
};

export function CampaignForm({
  open,
  onClose,
  onSubmit,
  onLinkAudiences,
  initialData,
  audiences = [],
  linkedAudienceIds = [],
  mode = 'create',
}: CampaignFormProps) {
  const [form, setForm] = useState({ ...emptyCampaign, ...initialData });
  const [spendDollars, setSpendDollars] = useState(
    initialData?.spend ? String(initialData.spend / 100) : ''
  );
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>(linkedAudienceIds);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm({ ...emptyCampaign, ...initialData });
      setSpendDollars(initialData?.spend ? String(initialData.spend / 100) : '');
      setSelectedAudiences(linkedAudienceIds);
      setError('');
    }
  }, [open, initialData]);

  if (!open) return null;

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAudience = (id: string) => {
    setSelectedAudiences((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.campaign_name.trim()) {
      setError('Campaign name is required.');
      return;
    }
    if (form.platforms.length === 0) {
      setError('Select at least one platform.');
      return;
    }

    setSaving(true);
    try {
      const { id, created_at, updated_at, ...submitData } = form as any;
      submitData.spend = dollarsToCents(parseFloat(spendDollars) || 0);
      submitData.objective = submitData.objective || null;
      submitData.geo_type = submitData.geo_type || null;
      submitData.start_date = submitData.start_date || null;
      submitData.end_date = submitData.end_date || null;
      submitData.notes = submitData.notes || null;

      const result = await onSubmit(submitData);

      // Link audiences for new campaigns
      if (mode === 'create' && onLinkAudiences && selectedAudiences.length > 0) {
        await onLinkAudiences(selectedAudiences);
      }

      onClose();
    } catch {
      setError('Failed to save campaign.');
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-lg font-semibold text-surface-900">
            {mode === 'create' ? 'New Campaign' : 'Edit Campaign'}
          </h2>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="campaign-name">Campaign Name *</label>
              <input
                id="campaign-name"
                type="text"
                value={form.campaign_name}
                onChange={(e) => updateField('campaign_name', e.target.value)}
                placeholder="Campaign name"
                autoFocus
              />
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

            {/* Objective + Spend */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="campaign-objective">Objective</label>
                <select
                  id="campaign-objective"
                  value={form.objective || ''}
                  onChange={(e) => updateField('objective', e.target.value || null)}
                >
                  <option value="">Select objective</option>
                  {OBJECTIVES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="campaign-spend">Ad Spend ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm">
                    $
                  </span>
                  <input
                    id="campaign-spend"
                    type="number"
                    step="0.01"
                    min="0"
                    value={spendDollars}
                    onChange={(e) => setSpendDollars(e.target.value)}
                    className="!pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="campaign-start">Start Date</label>
                <input
                  id="campaign-start"
                  type="date"
                  value={form.start_date || ''}
                  onChange={(e) => updateField('start_date', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="campaign-end">End Date</label>
                <input
                  id="campaign-end"
                  type="date"
                  value={form.end_date || ''}
                  onChange={(e) => updateField('end_date', e.target.value)}
                />
              </div>
            </div>

            {/* Geo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="campaign-geo-type">Geo Type</label>
                <select
                  id="campaign-geo-type"
                  value={form.geo_type || ''}
                  onChange={(e) => updateField('geo_type', e.target.value || null)}
                >
                  <option value="">Select type</option>
                  {GEO_TYPES.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Geo Tags</label>
                <TagInput
                  tags={form.geo_tags}
                  onChange={(tags) => updateField('geo_tags', tags)}
                  placeholder="Add geo tags"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="campaign-notes">Notes</label>
              <textarea
                id="campaign-notes"
                value={form.notes || ''}
                onChange={(e) => updateField('notes', e.target.value || null)}
                rows={2}
                placeholder="Optional notes"
              />
            </div>

            {/* Audience selector */}
            {audiences.length > 0 && (
              <div>
                <label>Audiences</label>
                <p className="text-xs text-surface-400 mb-2">
                  Select audiences to link to this campaign.
                </p>
                <div className="border border-surface-200 rounded-md max-h-40 overflow-y-auto">
                  {audiences.map((aud) => (
                    <label
                      key={aud.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-surface-50 cursor-pointer text-sm border-b border-surface-100 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAudiences.includes(aud.id)}
                        onChange={() => toggleAudience(aud.id)}
                        className="w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                      />
                      <div>
                        <span className="text-surface-800">{aud.name}</span>
                        {aud.type && (
                          <span className="ml-2 text-xs text-surface-400 capitalize">
                            {aud.type}
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
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
              {saving ? 'Saving...' : mode === 'create' ? 'Create Campaign' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
