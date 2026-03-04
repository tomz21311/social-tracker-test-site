'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
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
import { useContent } from '@/hooks/useContent';
import { useSettings } from '@/hooks/useSettings';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import { Content } from '@/types';
import {
  formatCurrency,
  formatNumber,
  getPlatformLabel,
  getContentTypeLabel,
  CONTENT_TYPES,
  PLATFORMS,
} from '@/lib/constants';
import {
  calculateContentEMV,
  calculateTotalImpressions,
  calculateTotalClicks,
} from '@/lib/calculations';
import { ContentForm } from '@/components/content/ContentForm';
import { QuickAddContent } from '@/components/content/QuickAddContent';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { exportContentCSV } from '@/lib/csv-export';

type SortField =
  | 'publish_date'
  | 'title'
  | 'impressions'
  | 'clicks'
  | 'emv'
  | 'content_type';
type SortDir = 'asc' | 'desc';

export default function ContentPage() {
  const { filters } = useGlobalFilters();
  const { content, loading, createContent, deleteContent } = useContent({
    year: filters.year,
    platform: filters.platform,
    search: filters.search,
  });
  const { settings } = useSettings();
  const router = useRouter();

  const [showNewForm, setShowNewForm] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Content | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortField, setSortField] = useState<SortField>('publish_date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterType, setFilterType] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  // Sorting and local filtering
  const enriched = content.map((c) => {
    const emvData = settings
      ? calculateContentEMV(c, settings)
      : { emv_ig: 0, emv_fb: 0, emv_li: 0, emv_total: 0 };
    return {
      ...c,
      impressions_total: calculateTotalImpressions(c),
      clicks_total: calculateTotalClicks(c),
      paid_impressions_total:
        (c.paid_impressions_ig || 0) +
        (c.paid_impressions_fb || 0) +
        (c.paid_impressions_li || 0),
      paid_clicks_total:
        (c.paid_clicks_ig || 0) +
        (c.paid_clicks_fb || 0) +
        (c.paid_clicks_li || 0),
      ...emvData,
    };
  });

  let filtered = enriched;
  if (filterType) {
    filtered = filtered.filter((c) => c.content_type === filterType);
  }
  if (filterPlatform) {
    filtered = filtered.filter((c) => c.platforms.includes(filterPlatform as any));
  }

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'publish_date':
        cmp = a.publish_date.localeCompare(b.publish_date);
        break;
      case 'title':
        cmp = a.title.localeCompare(b.title);
        break;
      case 'content_type':
        cmp = (a.content_type || '').localeCompare(b.content_type || '');
        break;
      case 'impressions':
        cmp = a.impressions_total - b.impressions_total;
        break;
      case 'clicks':
        cmp = a.clicks_total - b.clicks_total;
        break;
      case 'emv':
        cmp = a.emv_total - b.emv_total;
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
    if (sortField !== field)
      return <ChevronDown className="w-3 h-3 text-surface-300" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-brand-600" />
    ) : (
      <ChevronDown className="w-3 h-3 text-brand-600" />
    );
  };

  const handleCreate = async (data: any) => {
    await createContent(data);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteContent(deleteTarget.id);
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
        <h1 className="page-title">Content</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportContentCSV(content, settings)}
            disabled={content.length === 0}
            className="btn-ghost text-surface-500"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowQuickAdd(true)}
            className="btn-secondary"
          >
            <Zap className="w-4 h-4 text-amber-500" />
            Quick Add
          </button>
          <button onClick={() => setShowNewForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            New Content
          </button>
        </div>
      </div>

      {/* Local filters */}
      <div className="flex gap-3 mb-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="!w-auto !py-1.5 !text-sm"
        >
          <option value="">All Types</option>
          {CONTENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
          className="!w-auto !py-1.5 !text-sm"
        >
          <option value="">All Platforms</option>
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        {(filterType || filterPlatform) && (
          <button
            onClick={() => {
              setFilterType('');
              setFilterPlatform('');
            }}
            className="btn-ghost btn-sm text-surface-500"
          >
            Clear
          </button>
        )}
        <span className="ml-auto text-sm text-surface-400 self-center">
          {sorted.length} item{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <FileText className="empty-state-icon" />
              <h3 className="empty-state-title">No content yet</h3>
              <p className="empty-state-text">
                Add your first piece of content to start tracking performance.
              </p>
              <button
                onClick={() => setShowNewForm(true)}
                className="btn-primary mt-4"
              >
                <Plus className="w-4 h-4" />
                New Content
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
                    <button
                      onClick={() => toggleSort('publish_date')}
                      className="flex items-center gap-1"
                    >
                      Date <SortIcon field="publish_date" />
                    </button>
                  </th>
                  <th>
                    <button
                      onClick={() => toggleSort('title')}
                      className="flex items-center gap-1"
                    >
                      Title <SortIcon field="title" />
                    </button>
                  </th>
                  <th>Platforms</th>
                  <th>
                    <button
                      onClick={() => toggleSort('content_type')}
                      className="flex items-center gap-1"
                    >
                      Type <SortIcon field="content_type" />
                    </button>
                  </th>
                  <th>Tags</th>
                  <th className="text-right">
                    <button
                      onClick={() => toggleSort('impressions')}
                      className="flex items-center gap-1 ml-auto"
                    >
                      Organic Impr. <SortIcon field="impressions" />
                    </button>
                  </th>
                  <th className="text-right">
                    <button
                      onClick={() => toggleSort('clicks')}
                      className="flex items-center gap-1 ml-auto"
                    >
                      Organic Clicks <SortIcon field="clicks" />
                    </button>
                  </th>
                  <th className="text-right">Paid Impr.</th>
                  <th className="text-right">Paid Clicks</th>
                  <th className="text-right">
                    <button
                      onClick={() => toggleSort('emv')}
                      className="flex items-center gap-1 ml-auto"
                    >
                      EMV <SortIcon field="emv" />
                    </button>
                  </th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
                  const paginated = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
                  return paginated;
                })().map((item) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap text-surface-500">
                      {new Date(item.publish_date + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td>
                      <button
                        onClick={() => router.push(`/content/${item.id}`)}
                        className="text-brand-600 hover:text-brand-700 font-medium text-left"
                      >
                        {item.title}
                      </button>
                    </td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        {item.platforms.map((p) => (
                          <span key={p} className="badge-gray">
                            {getPlatformLabel(p)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {item.content_type
                        ? getContentTypeLabel(item.content_type)
                        : '—'}
                    </td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        {item.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="badge-blue">
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 2 && (
                          <span className="badge-gray">+{item.tags.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="text-right tabular-nums">
                      {formatNumber(item.impressions_total)}
                    </td>
                    <td className="text-right tabular-nums">
                      {formatNumber(item.clicks_total)}
                    </td>
                    <td className="text-right tabular-nums text-blue-600">
                      {formatNumber(item.paid_impressions_total)}
                    </td>
                    <td className="text-right tabular-nums text-blue-600">
                      {formatNumber(item.paid_clicks_total)}
                    </td>
                    <td className="text-right tabular-nums text-emerald-600 font-medium">
                      {formatCurrency(item.emv_total)}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/content/${item.id}`)}
                          className="p-1.5 rounded hover:bg-surface-100 text-surface-400 hover:text-surface-600"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            router.push(`/content/${item.id}?edit=true`)
                          }
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

      {/* Modals */}
      <ContentForm
        open={showNewForm}
        onClose={() => setShowNewForm(false)}
        onSubmit={handleCreate}
      />

      <QuickAddContent
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onSubmit={handleCreate}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Content"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This will remove the content and all its production costs. Linked campaigns will not be deleted.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
