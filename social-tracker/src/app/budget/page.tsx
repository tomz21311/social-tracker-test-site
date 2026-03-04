'use client';

import { useState } from 'react';
import { DollarSign, Check, X } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import { useBudgetData } from '@/hooks/useBudgetData';
import { formatCurrency } from '@/lib/constants';
import { getPacingStatusMessage } from '@/lib/calculations';

export default function BudgetPage() {
  const { settings, updateSettings } = useSettings();
  const { filters } = useGlobalFilters();
  const { summary, platformBreakdown, loading } = useBudgetData(filters.year, settings);

  const [editing, setEditing] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  const startEdit = () => {
    setBudgetInput(
      settings ? (settings.annual_budget / 100).toFixed(0) : '0'
    );
    setEditing(true);
  };

  const saveEdit = async () => {
    const cents = Math.round(parseFloat(budgetInput || '0') * 100);
    await updateSettings({ annual_budget: cents });
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasBudget = settings.annual_budget > 0;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Budget</h1>
        <span className="text-sm text-surface-500">{filters.year}</span>
      </div>

      {/* Annual Budget Card */}
      <div className="card mb-6">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-base font-medium text-surface-800">Annual Budget</h2>
          {!editing && (
            <button onClick={startEdit} className="btn-secondary btn-sm">
              Edit
            </button>
          )}
        </div>
        <div className="card-body">
          {editing ? (
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">$</span>
                <input
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="!pl-7 !w-48"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                />
              </div>
              <button onClick={saveEdit} className="btn-primary btn-sm">
                <Check className="w-4 h-4" />
                Save
              </button>
              <button onClick={cancelEdit} className="btn-ghost btn-sm text-surface-500">
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          ) : (
            <div className="text-3xl font-bold text-surface-900">
              {formatCurrency(settings.annual_budget)}
            </div>
          )}
        </div>
      </div>

      {!hasBudget ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <DollarSign className="empty-state-icon" />
              <h3 className="empty-state-title">No budget set</h3>
              <p className="empty-state-text">
                Set an annual budget above to see pacing and breakdown data.
              </p>
            </div>
          </div>
        </div>
      ) : summary ? (
        <>
          {/* Pacing Card */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="text-base font-medium text-surface-800">Budget Pacing</h2>
            </div>
            <div className="card-body">
              {/* Progress bar */}
              <div className="relative mb-4 mt-6">
                <div className="w-full bg-surface-100 rounded-full h-6 overflow-hidden">
                  <div
                    className={`h-6 rounded-full transition-all ${
                      summary.status === 'ahead'
                        ? 'bg-amber-500'
                        : summary.status === 'under'
                        ? 'bg-blue-400'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(summary.pacing_percentage, 100)}%`,
                    }}
                  />
                </div>
                {/* Expected pace marker */}
                <div
                  className="absolute top-0 h-6 border-r-2 border-dashed border-surface-600"
                  style={{ left: `${Math.min(summary.expected_pacing, 100)}%` }}
                >
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-surface-500 whitespace-nowrap">
                    Expected
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-surface-500">
                  {summary.pacing_percentage.toFixed(1)}% spent
                </span>
                <span
                  className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                    summary.status === 'ahead'
                      ? 'bg-amber-50 text-amber-700'
                      : summary.status === 'under'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {summary.status === 'on_track'
                    ? 'On Track'
                    : summary.status === 'ahead'
                    ? 'Ahead'
                    : 'Under'}
                </span>
              </div>

              <p className="text-sm text-surface-600">
                {getPacingStatusMessage(summary)}
              </p>

              {/* Summary grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-surface-100">
                <div>
                  <div className="text-xs text-surface-500 uppercase tracking-wide">Campaign Ad Spend</div>
                  <div className="text-lg font-semibold tabular-nums">{formatCurrency(summary.paid_spend_ytd)}</div>
                </div>
                <div>
                  <div className="text-xs text-surface-500 uppercase tracking-wide">Production Costs</div>
                  <div className="text-lg font-semibold tabular-nums">{formatCurrency(summary.production_cost_ytd)}</div>
                </div>
                <div>
                  <div className="text-xs text-surface-500 uppercase tracking-wide">Total Spent</div>
                  <div className="text-lg font-bold text-surface-900 tabular-nums">{formatCurrency(summary.total_spend_ytd)}</div>
                </div>
                <div>
                  <div className="text-xs text-surface-500 uppercase tracking-wide">Remaining</div>
                  <div
                    className={`text-lg font-bold tabular-nums ${
                      summary.remaining_budget >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(summary.remaining_budget)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Breakdown */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-base font-medium text-surface-800">Platform Breakdown</h2>
            </div>
            <div className="card-body">
              {platformBreakdown.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Platform</th>
                      <th className="text-right">Ad Spend</th>
                      <th className="text-right">Production Cost</th>
                      <th className="text-right">Total</th>
                      <th className="text-right">% of Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {platformBreakdown.map((row) => (
                      <tr key={row.platform}>
                        <td className="font-medium">{row.label}</td>
                        <td className="text-right tabular-nums">{formatCurrency(row.adSpend)}</td>
                        <td className="text-right tabular-nums">{formatCurrency(row.productionCost)}</td>
                        <td className="text-right tabular-nums font-medium">{formatCurrency(row.total)}</td>
                        <td className="text-right tabular-nums">
                          {settings.annual_budget > 0
                            ? ((row.total / settings.annual_budget) * 100).toFixed(1)
                            : '0.0'}
                          %
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-surface-200 font-semibold">
                      <td>Total</td>
                      <td className="text-right tabular-nums">
                        {formatCurrency(platformBreakdown.reduce((s, r) => s + r.adSpend, 0))}
                      </td>
                      <td className="text-right tabular-nums">
                        {formatCurrency(platformBreakdown.reduce((s, r) => s + r.productionCost, 0))}
                      </td>
                      <td className="text-right tabular-nums">
                        {formatCurrency(platformBreakdown.reduce((s, r) => s + r.total, 0))}
                      </td>
                      <td className="text-right tabular-nums">
                        {settings.annual_budget > 0
                          ? (
                              (platformBreakdown.reduce((s, r) => s + r.total, 0) /
                                settings.annual_budget) *
                              100
                            ).toFixed(1)
                          : '0.0'}
                        %
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-surface-400">No spend data yet.</p>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
