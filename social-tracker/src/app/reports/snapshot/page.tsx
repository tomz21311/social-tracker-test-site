'use client';

import { useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/hooks/useSettings';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import { useSnapshotData } from '@/hooks/useSnapshotData';
import { formatCurrency, formatNumber } from '@/lib/constants';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function SnapshotPage() {
  const router = useRouter();
  const { settings } = useSettings();
  const { filters } = useGlobalFilters();

  const currentMonth = new Date().getMonth() + 1;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [narrative, setNarrative] = useState('');

  const { data, loading } = useSnapshotData(filters.year, selectedMonth, settings);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print-only styles */}
      <style jsx global>{`
        @media print {
          /* Hide everything except snapshot */
          body * {
            visibility: hidden;
          }
          #snapshot-report,
          #snapshot-report * {
            visibility: visible;
          }
          #snapshot-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 40px;
          }
          .no-print {
            display: none !important;
          }
          .print-break {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div>
        {/* Controls — hidden on print */}
        <div className="no-print">
          <div className="page-header">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/reports')} className="btn-ghost text-surface-500">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="page-title">Monthly Snapshot</h1>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="!w-auto !py-1.5 !text-sm"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx} value={idx + 1}>
                    {name} {filters.year}
                  </option>
                ))}
              </select>
              <button onClick={handlePrint} className="btn-primary">
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Snapshot Report Card */}
        <div id="snapshot-report" className="max-w-3xl mx-auto">
          {loading || !data ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-8 pt-4">
                <h2 className="text-2xl font-bold text-surface-900">
                  {MONTH_NAMES[selectedMonth - 1]} {filters.year}
                </h2>
                <p className="text-sm text-surface-500 mt-1">
                  Social Campaign Impact Report
                </p>
              </div>

              {/* Activity Summary */}
              <div className="print-break card mb-6">
                <div className="card-header">
                  <h3 className="text-base font-medium text-surface-800">Activity Summary</h3>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-surface-50 rounded-lg">
                      <div className="text-3xl font-bold text-surface-900">{data.contentCount}</div>
                      <div className="text-xs text-surface-500 uppercase tracking-wide mt-1">Content Published</div>
                    </div>
                    <div className="text-center p-4 bg-surface-50 rounded-lg">
                      <div className="text-3xl font-bold text-surface-900">{data.campaignCount}</div>
                      <div className="text-xs text-surface-500 uppercase tracking-wide mt-1">Campaigns Launched</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="print-break card mb-6">
                <div className="card-header">
                  <h3 className="text-base font-medium text-surface-800">Performance Metrics</h3>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <div className="text-xs text-surface-500 uppercase tracking-wide">Campaign Ad Spend</div>
                      <div className="text-xl font-bold text-surface-900 tabular-nums mt-1">
                        {formatCurrency(data.campaignAdSpend)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-surface-500 uppercase tracking-wide">Production Cost</div>
                      <div className="text-xl font-bold text-surface-900 tabular-nums mt-1">
                        {formatCurrency(data.productionCost)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-surface-500 uppercase tracking-wide">Organic Impressions</div>
                      <div className="text-xl font-bold text-surface-900 tabular-nums mt-1">
                        {formatNumber(data.organicImpressions)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-surface-500 uppercase tracking-wide">Paid Impressions</div>
                      <div className="text-xl font-bold text-surface-900 tabular-nums mt-1">
                        {formatNumber(data.paidImpressions)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-surface-500 uppercase tracking-wide">Total Link Clicks</div>
                      <div className="text-xl font-bold text-surface-900 tabular-nums mt-1">
                        {formatNumber(data.totalClicks)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-surface-500 uppercase tracking-wide">Estimated EMV</div>
                      <div className="text-xl font-bold text-emerald-600 tabular-nums mt-1">
                        {formatCurrency(data.emv)}
                      </div>
                    </div>
                  </div>

                  {/* Net Value highlight */}
                  <div className="mt-6 pt-4 border-t border-surface-100">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-surface-700">Net Value</div>
                      <div
                        className={`text-2xl font-bold tabular-nums ${
                          data.netValue >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(data.netValue)}
                      </div>
                    </div>
                    <div className="text-xs text-surface-400 mt-0.5">
                      EMV minus all costs (ad spend + production)
                    </div>
                  </div>
                </div>
              </div>

              {/* Narrative / Notes */}
              <div className="print-break card mb-6">
                <div className="card-header">
                  <h3 className="text-base font-medium text-surface-800">Notes &amp; Commentary</h3>
                </div>
                <div className="card-body">
                  <textarea
                    value={narrative}
                    onChange={(e) => setNarrative(e.target.value)}
                    placeholder="Add notes, highlights, or commentary for this month's report..."
                    className="w-full min-h-[120px] text-sm"
                    rows={5}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-surface-400 mt-8 pb-8">
                Generated {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
