'use client';

import { useState } from 'react';
import { X, Zap } from 'lucide-react';
import { Campaign, Platform } from '@/types';
import { PLATFORMS, OBJECTIVES, dollarsToCents } from '@/lib/constants';
import { MultiCheckbox } from '@/components/shared/MultiCheckbox';

interface QuickAddCampaignProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) => Promise<any>;
}

export function QuickAddCampaign({ open, onClose, onSubmit }: QuickAddCampaignProps) {
  const [name, setName] = useState('');
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [objective, setObjective] = useState('');
  const [spendDollars, setSpendDollars] = useState('');
  const [startDate, setStartDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Campaign name is required.');
      return;
    }
    if (platforms.length === 0) {
      setError('Select at least one platform.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        campaign_name: name.trim(),
        platforms,
        objective: objective || null,
        start_date: startDate || null,
        end_date: null,
        spend: dollarsToCents(parseFloat(spendDollars) || 0),
        geo_type: null,
        geo_tags: [],
        notes: null,
      } as any);
      onClose();
    } catch {
      setError('Failed to save campaign.');
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h2 className="text-lg font-semibold text-surface-900">Quick Add Campaign</h2>
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
              <label htmlFor="qac-name">Campaign Name *</label>
              <input
                id="qac-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Campaign name"
                autoFocus
              />
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
                <label htmlFor="qac-objective">Objective</label>
                <select
                  id="qac-objective"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                >
                  <option value="">Select</option>
                  {OBJECTIVES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="qac-spend">Ad Spend ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm">
                    $
                  </span>
                  <input
                    id="qac-spend"
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

            <div>
              <label htmlFor="qac-start">Start Date</label>
              <input
                id="qac-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
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
              {saving ? 'Saving...' : 'Add Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
