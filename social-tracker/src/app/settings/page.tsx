'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { centsToDollars, dollarsToCents, formatCurrency } from '@/lib/constants';
import { Save, Check, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const { settings, loading, error: fetchError, updateSettings } = useSettings();

  const [cpmInstagram, setCpmInstagram] = useState('');
  const [cpmFacebook, setCpmFacebook] = useState('');
  const [cpmLinkedin, setCpmLinkedin] = useState('');
  const [annualBudget, setAnnualBudget] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Populate form when settings load
  useEffect(() => {
    if (settings) {
      setCpmInstagram(String(settings.cpm_instagram));
      setCpmFacebook(String(settings.cpm_facebook));
      setCpmLinkedin(String(settings.cpm_linkedin));
      setAnnualBudget(String(centsToDollars(settings.annual_budget)));
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);

    const igRate = parseFloat(cpmInstagram);
    const fbRate = parseFloat(cpmFacebook);
    const liRate = parseFloat(cpmLinkedin);
    const budget = parseFloat(annualBudget);

    if (isNaN(igRate) || isNaN(fbRate) || isNaN(liRate) || isNaN(budget)) {
      setError('Please enter valid numbers for all fields.');
      setSaving(false);
      return;
    }

    if (igRate < 0 || fbRate < 0 || liRate < 0 || budget < 0) {
      setError('Values cannot be negative.');
      setSaving(false);
      return;
    }

    const { error: saveError } = await updateSettings({
      cpm_instagram: igRate,
      cpm_facebook: fbRate,
      cpm_linkedin: liRate,
      annual_budget: dollarsToCents(Math.round(budget)),
    });

    if (saveError) {
      setError(saveError);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">Failed to load settings: {fetchError}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* EMV CPM Rates */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-base font-medium text-surface-800">Earned Media Value (EMV) — CPM Rates</h2>
            <p className="text-sm text-surface-500 mt-1">
              Set the CPM (cost per thousand impressions) rate for each platform. These rates are used to calculate the estimated earned media value of your organic content.
            </p>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label htmlFor="cpm-ig">Instagram CPM Rate ($)</label>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm">$</span>
                <input
                  id="cpm-ig"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cpmInstagram}
                  onChange={(e) => setCpmInstagram(e.target.value)}
                  className="!pl-7 max-w-xs"
                  placeholder="5.00"
                />
              </div>
            </div>

            <div>
              <label htmlFor="cpm-fb">Facebook CPM Rate ($)</label>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm">$</span>
                <input
                  id="cpm-fb"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cpmFacebook}
                  onChange={(e) => setCpmFacebook(e.target.value)}
                  className="!pl-7 max-w-xs"
                  placeholder="5.00"
                />
              </div>
            </div>

            <div>
              <label htmlFor="cpm-li">LinkedIn CPM Rate ($)</label>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm">$</span>
                <input
                  id="cpm-li"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cpmLinkedin}
                  onChange={(e) => setCpmLinkedin(e.target.value)}
                  className="!pl-7 max-w-xs"
                  placeholder="8.00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Annual Budget */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-base font-medium text-surface-800">Annual Budget</h2>
            <p className="text-sm text-surface-500 mt-1">
              Set your total annual social media budget. This is used to calculate spend pacing throughout the year. The budget runs on a calendar year (Jan–Dec).
            </p>
          </div>
          <div className="card-body">
            <div>
              <label htmlFor="annual-budget">Total Annual Budget ($)</label>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm">$</span>
                <input
                  id="annual-budget"
                  type="number"
                  step="1"
                  min="0"
                  value={annualBudget}
                  onChange={(e) => setAnnualBudget(e.target.value)}
                  className="!pl-7 max-w-xs"
                  placeholder="50000"
                />
              </div>
              {settings && settings.annual_budget > 0 && (
                <p className="text-xs text-surface-400 mt-2">
                  Current budget: {formatCurrency(settings.annual_budget)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Save button and feedback */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Settings
              </span>
            )}
          </button>

          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <Check className="w-4 h-4" />
              Settings saved successfully.
            </span>
          )}

          {error && (
            <span className="flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              {error}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
