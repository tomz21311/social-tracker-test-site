'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Megaphone,
  Plus,
  Zap,
  Eye,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useSettings } from '@/hooks/useSettings';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import { useAudiences } from '@/hooks/useAudiences';
import { Campaign } from '@/types';
import {
  formatCurrency,
  formatNumber,
  getPlatformLabel,
  getObjectiveLabel,
  OBJECTIVES,
} from '@/lib/constants';
import { CampaignForm } from '@/components/campaigns/CampaignForm';
import { QuickAddCampaign } from '@/components/campaigns/QuickAddCampaign';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { exportCampaignsCSV } from '@/lib/csv-export';

type SortField = 'start_date' | 'campaign_name' | 'spend' | 'objective';
type SortDir = 'asc' | 'desc';

export default function CampaignsPage() {
  const { filters } = useGlobalFilters();
  const { campaigns, loading, createCampaign, deleteCampaign } = useCampaigns({
    year: filters.year,
    platform: filters.platform,
    search: filters.search,
  });
  const { audiences } = useAudiences();
  const router = useRouter();

  const [showNewForm, setShowNewForm] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortField, setSortField] = useState<SortField>('start_date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterObjective, setFilterObjective] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  let filtered = campaigns;
  if (filterObjective) {
    filtered = filtered.filter((c) => c.objective === filterObjective);
  }

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'start_date':
        cmp = (a.start_date || '').localeCompare(b.start_date || '');
        break;
      case 'campaign_name':
        cmp = a.campaign_name.localeCompare(b.campaign_name);
        break;
      case 'spend':
        cmp = a.spend - b.spend;
        break;
      case 'objective':
        cmp = (a.objective || '').localeCompare(b.objective || '');
        break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-surface-300" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-brand-600" />
    ) : (
      <ChevronDown className="w-3 h-3 text-brand-600" />
    );
  };

  const handleCreate = async (data: any) => {
    const result = await createCampaign(data);
    return result;
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteCampaign(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Campaigns</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCampaignsCSV(campaigns)}
            disabled={campaigns.length === 0}
            className="btn-ghost text-surface-500"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>
          <button onClick={() => setShowQuickAdd(true)} className="btn-secondary">
            <Zap className="w-4 h-4 text-amber-500" />
            Quick Add
          </button>
          <button onClick={() => setShowNewForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <select
          value={filterObjective}
          onChange={(e) => setFilterObjective(e.target.value)}
          className="!w-auto !py-1.5 !text-sm"
        >
          <option value="">All Objectives</option>
          {OBJECTIVES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {filterObjective && (
          <button onClick={() => setFilterObjective('')} className="btn-ghost btn-sm text-surface-500">
            Clear
          </button>
        )}
        <span className="ml-auto text-sm text-surface-400 self-center">
          {sorted.length} campaign{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <Megaphone className="empty-state-icon" />
              <h3 className="empty-state-title">No campaigns yet</h3>
              <p className="empty-state-text">
                Create a campaign to group content and track performance.
              </p>
              <button onClick={() => setShowNewForm(true)} className="btn-primary mt-4">
                <Plus className="w-4 h-4" />
                New Campaign
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    <button onClick={() => toggleSort('start_date')} className="flex items-center gap-1">
                      Date <SortIcon field="start_date" />
                    </button>
                  </th>
                  <th>
                    <button onClick={() => toggleSort('campaign_name')} className="flex items-center gap-1">
                      Campaign <SortIcon field="campaign_name" />
                    </button>
                  </th>
                  <th>Platforms</th>
                  <th>
                    <button onClick={() => toggleSort('objective')} className="flex items-center gap-1">
                      Objective <SortIcon field="objective" />
                    </button>
                  </th>
                  <th className="text-right">
                    <button onClick={() => toggleSort('spend')} className="flex items-center gap-1 ml-auto">
                      Ad Spend <SortIcon field="spend" />
                    </button>
                  </th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((item) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap text-surface-500">
                      {item.start_date
                        ? new Date(item.start_date + 'T00:00:00').toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td>
                      <button
                        onClick={() => router.push(`/campaigns/${item.id}`)}
                        className="text-brand-600 hover:text-brand-700 font-medium text-left"
                      >
                        {item.campaign_name}
                      </button>
                    </td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        {item.platforms.map((p) => (
                          <span key={p} className="badge-gray">{getPlatformLabel(p)}</span>
                        ))}
                      </div>
                    </td>
                    <td>{item.objective ? getObjectiveLabel(item.objective) : '—'}</td>
                    <td className="text-right tabular-nums font-medium">
                      {formatCurrency(item.spend)}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/campaigns/${item.id}`)}
                          className="p-1.5 rounded hover:bg-surface-100 text-surface-400 hover:text-surface-600"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/campaigns/${item.id}?edit=true`)}
                          className="p-1.5 rounded hover:bg-surface-100 text-surface-400 hover:text-surface-600"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 rounded hover:bg-red-50 text-surface-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {sorted.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100">
              <span className="text-sm text-surface-500">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sorted.length)} of {sorted.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded hover:bg-surface-100 text-surface-500 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.ceil(sorted.length / PAGE_SIZE) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded text-sm font-medium ${
                      currentPage === page
                        ? 'bg-brand-600 text-white'
                        : 'hover:bg-surface-100 text-surface-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(Math.ceil(sorted.length / PAGE_SIZE), p + 1))}
                  disabled={currentPage === Math.ceil(sorted.length / PAGE_SIZE)}
                  className="p-1.5 rounded hover:bg-surface-100 text-surface-500 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <CampaignForm
        open={showNewForm}
        onClose={() => setShowNewForm(false)}
        onSubmit={handleCreate}
        audiences={audiences}
      />

      <QuickAddCampaign
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onSubmit={handleCreate}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Campaign"
        message={`Are you sure you want to delete "${deleteTarget?.campaign_name}"? Linked content and audiences will not be deleted.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
