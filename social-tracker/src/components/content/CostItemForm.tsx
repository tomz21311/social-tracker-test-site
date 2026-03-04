'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { ProductionCost } from '@/types';
import type { CostType } from '@/types';
import { COST_TYPES, dollarsToCents } from '@/lib/constants';
import { useVendors } from '@/hooks/useVendors';

interface CostItemFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ProductionCost, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  contentId: string;
  initialData?: Partial<ProductionCost>;
  mode?: 'create' | 'edit';
}

export function CostItemForm({
  open,
  onClose,
  onSubmit,
  contentId,
  initialData,
  mode = 'create',
}: CostItemFormProps) {
  const { vendors } = useVendors();

  const [providerType, setProviderType] = useState<'vendor' | 'internal'>(
    initialData?.provider_type || 'vendor'
  );
  const [vendorName, setVendorName] = useState(initialData?.vendor_name || '');
  const [costType, setCostType] = useState<CostType | ''>(initialData?.cost_type || '');
  const [amount, setAmount] = useState(
    initialData?.amount ? String(initialData.amount / 100) : ''
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredVendors = vendors.filter((v) =>
    v.name.toLowerCase().includes(vendorName.toLowerCase())
  );

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 0) {
      setError('Enter a valid amount.');
      return;
    }

    if (providerType === 'vendor' && !vendorName.trim()) {
      setError('Enter a vendor name.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        content_id: contentId,
        provider_type: providerType,
        vendor_name: providerType === 'vendor' ? vendorName.trim() : null,
        cost_type: costType || null,
        amount: dollarsToCents(amountNum),
        notes: notes || null,
      });
      onClose();
    } catch {
      setError('Failed to save cost item.');
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-lg font-semibold text-surface-900">
            {mode === 'create' ? 'Add Cost Item' : 'Edit Cost Item'}
          </h2>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            {/* Provider Type */}
            <div>
              <label>Provider Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="providerType"
                    checked={providerType === 'vendor'}
                    onChange={() => setProviderType('vendor')}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  <span>Vendor</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="providerType"
                    checked={providerType === 'internal'}
                    onChange={() => setProviderType('internal')}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  <span>Internal</span>
                </label>
              </div>
            </div>

            {/* Vendor Name with auto-suggest */}
            {providerType === 'vendor' && (
              <div className="relative">
                <label htmlFor="vendor-name">Vendor Name *</label>
                <input
                  id="vendor-name"
                  ref={inputRef}
                  type="text"
                  value={vendorName}
                  onChange={(e) => {
                    setVendorName(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Start typing to search vendors..."
                  autoComplete="off"
                />
                {showSuggestions && vendorName && filteredVendors.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-surface-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {filteredVendors.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-surface-50 text-surface-700"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setVendorName(v.name);
                          setShowSuggestions(false);
                        }}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cost Type */}
            <div>
              <label htmlFor="cost-type">Cost Type</label>
              <select
                id="cost-type"
                value={costType}
                onChange={(e) => setCostType(e.target.value as CostType | '')}
              >
                <option value="">Select type</option>
                {COST_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="cost-amount">Amount ($) *</label>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm">
                  $
                </span>
                <input
                  id="cost-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="!pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="cost-notes">Notes</label>
              <textarea
                id="cost-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
              {saving ? 'Saving...' : mode === 'create' ? 'Add Cost' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
