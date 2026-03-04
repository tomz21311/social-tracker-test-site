'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Download,
  FileText,
  Camera,
} from 'lucide-react';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import { useSettings } from '@/hooks/useSettings';
import { useContent } from '@/hooks/useContent';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useProductionCostsExport } from '@/hooks/useProductionCostsExport';
import { exportContentCSV, exportCampaignsCSV, exportProductionCostsCSV } from '@/lib/csv-export';

export default function ReportsPage() {
  const router = useRouter();
  const { filters } = useGlobalFilters();
  const { settings } = useSettings();
  const { content } = useContent({ year: filters.year, platform: filters.platform });
  const { campaigns } = useCampaigns({ year: filters.year, platform: filters.platform });
  const { fetchAll: fetchCosts, loading: costsLoading } = useProductionCostsExport();

  const [exporting, setExporting] = useState('');

  const handleExportContent = () => {
    setExporting('content');
    try {
      exportContentCSV(content, settings);
    } finally {
      setExporting('');
    }
  };

  const handleExportCampaigns = () => {
    setExporting('campaigns');
    try {
      exportCampaignsCSV(campaigns);
    } finally {
      setExporting('');
    }
  };

  const handleExportCosts = async () => {
    setExporting('costs');
    try {
      const costs = await fetchCosts(filters.year);
      exportProductionCostsCSV(costs);
    } finally {
      setExporting('');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <span className="text-sm text-surface-500">{filters.year}</span>
      </div>

      {/* Monthly Snapshot */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center">
                <Camera className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-surface-900">Monthly Snapshot</h3>
                <p className="text-sm text-surface-500 mt-0.5">
                  Generate a printable monthly performance report with KPIs and commentary.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/reports/snapshot')}
              className="btn-primary"
            >
              <FileText className="w-4 h-4" />
              Open Snapshot
            </button>
          </div>
        </div>
      </div>

      {/* CSV Exports */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-base font-medium text-surface-800">CSV Exports</h2>
          <span className="text-xs text-surface-400">Exports include all data for {filters.year}</span>
        </div>
        <div className="card-body space-y-4">
          {/* Content Export */}
          <div className="flex items-center justify-between py-3 border-b border-surface-100">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-surface-800">Content Library</h4>
                <p className="text-xs text-surface-500">
                  {content.length} content item{content.length !== 1 ? 's' : ''} — includes all organic/paid metrics, EMV, tags
                </p>
              </div>
            </div>
            <button
              onClick={handleExportContent}
              disabled={content.length === 0 || exporting === 'content'}
              className="btn-secondary btn-sm"
            >
              <Download className="w-4 h-4" />
              {exporting === 'content' ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>

          {/* Campaigns Export */}
          <div className="flex items-center justify-between py-3 border-b border-surface-100">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-surface-800">Campaigns</h4>
                <p className="text-xs text-surface-500">
                  {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} — includes platforms, objective, ad spend, geo
                </p>
              </div>
            </div>
            <button
              onClick={handleExportCampaigns}
              disabled={campaigns.length === 0 || exporting === 'campaigns'}
              className="btn-secondary btn-sm"
            >
              <Download className="w-4 h-4" />
              {exporting === 'campaigns' ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>

          {/* Production Costs Export */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-surface-800">Production Costs</h4>
                <p className="text-xs text-surface-500">
                  All production costs for {filters.year} content — includes vendor, type, amount
                </p>
              </div>
            </div>
            <button
              onClick={handleExportCosts}
              disabled={exporting === 'costs' || costsLoading}
              className="btn-secondary btn-sm"
            >
              <Download className="w-4 h-4" />
              {exporting === 'costs' ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
