'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  Link as LinkIcon,
  Save,
  X,
  ExternalLink,
} from 'lucide-react';
import { useContentItem } from '@/hooks/useContent';
import { useSettings } from '@/hooks/useSettings';
import { useProductionCosts } from '@/hooks/useProductionCosts';
import { useLinkedCampaigns } from '@/hooks/useLinkedCampaigns';
import { CampaignLinker } from '@/components/campaigns/CampaignLinker';
import { Content, Platform } from '@/types';
import {
  formatCurrency,
  formatNumber,
  getPlatformLabel,
  getContentTypeLabel,
  PLATFORMS,
  CONTENT_TYPES,
} from '@/lib/constants';
import {
  calculateContentEMV,
  calculateTotalImpressions,
  calculateTotalClicks,
} from '@/lib/calculations';
import { ContentForm } from '@/components/content/ContentForm';
import { CostItemForm } from '@/components/content/CostItemForm';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const { content, loading, error, updateContent, deleteContent, refetch } =
    useContentItem(id);
  const { settings } = useSettings();
  const { costs, addCost, deleteCost, totals } = useProductionCosts(id);
  const { campaigns: linkedCampaigns, linkedSpendTotal, linkCampaign, unlinkCampaign } =
    useLinkedCampaigns(id);

  const [editMode, setEditMode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCostForm, setShowCostForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteCostTarget, setDeleteCostTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showCampaignLinker, setShowCampaignLinker] = useState(false);
  const defaultTab = (): Platform => {
    if (!content) return 'facebook';
    const p = content.platforms;
    if (p.includes('facebook')) return 'facebook';
    if (p.includes('linkedin')) return 'linkedin';
    if (p.includes('instagram')) return 'instagram';
    return 'facebook';
  };

  const [activeMetricsTab, setActiveMetricsTab] = useState<Platform>(defaultTab());

  useEffect(() => {
    if (searchParams.get('edit') === 'true') {
      setShowEditModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (content) {
      const p = content.platforms;
      if (p.includes('facebook')) setActiveMetricsTab('facebook');
      else if (p.includes('linkedin')) setActiveMetricsTab('linkedin');
      else if (p.includes('instagram')) setActiveMetricsTab('instagram');
    }
  }, [content]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="card card-body">
        <p className="text-sm text-red-600">Content not found or failed to load.</p>
        <button onClick={() => router.push('/content')} className="btn-secondary mt-4">
          <ArrowLeft className="w-4 h-4" /> Back to Content Library
        </button>
      </div>
    );
  }

  const emv = settings
    ? calculateContentEMV(content, settings)
    : { emv_ig: 0, emv_fb: 0, emv_li: 0, emv_total: 0 };
  const totalImpressions = calculateTotalImpressions(content);
  const totalClicks = calculateTotalClicks(content);
  const totalPaidImpressions =
    (content.paid_impressions_ig || 0) +
    (content.paid_impressions_fb || 0) +
    (content.paid_impressions_li || 0);
  const totalPaidClicks =
    (content.paid_clicks_ig || 0) +
    (content.paid_clicks_fb || 0) +
    (content.paid_clicks_li || 0);
  const allInCost = totals.total + linkedSpendTotal;
  const totalImpressionsAll = totalImpressions + totalPaidImpressions;
  const totalClicksAll = totalClicks + totalPaidClicks;

  const handleUpdate = async (data: any) => {
    await updateContent(data);
    await refetch();
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deleteContent();
    router.push('/content');
  };

  const handleDeleteCost = async () => {
    if (!deleteCostTarget) return;
    setDeleting(true);
    await deleteCost(deleteCostTarget);
    setDeleting(false);
    setDeleteCostTarget(null);
  };

  const metricsForPlatform = (p: Platform) => {
    const suffix: Record<Platform, string> = {
      instagram: 'ig',
      facebook: 'fb',
      linkedin: 'li',
    };
    const s = suffix[p];
    return {
      organic: {
        impressions: (content as any)[`organic_impressions_${s}`] || 0,
        unique_viewers: (content as any)[`organic_unique_viewers_${s}`] || 0,
        clicks: (content as any)[`organic_clicks_${s}`] || 0,
        engagements: (content as any)[`engagements_${s}`] || 0,
        video_views: (content as any)[`video_views_${s}`] || 0,
        watch_time: (content as any)[`watch_time_${s}`] || 0,
      },
      paid: {
        impressions: (content as any)[`paid_impressions_${s}`] || 0,
        unique_viewers: (content as any)[`paid_unique_viewers_${s}`] || 0,
        clicks: (content as any)[`paid_clicks_${s}`] || 0,
        engagements: (content as any)[`paid_engagements_${s}`] || 0,
        video_views: (content as any)[`paid_video_views_${s}`] || 0,
        watch_time: (content as any)[`paid_watch_time_${s}`] || 0,
      },
    };
  };

  return (
    <div className="max-w-4xl">
      {/* Back button + Actions */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push('/content')}
          className="btn-ghost text-surface-500"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Content Library
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="btn-secondary"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-danger"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Block 1: Top Summary Card */}
      <div className="card mb-4">
        <div className="card-body">
          <h1 className="text-xl font-semibold text-surface-900 mb-3">
            {content.title}
          </h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-surface-500 block text-xs font-medium uppercase tracking-wide mb-0.5">
                Publish Date
              </span>
              <span className="text-surface-800">
                {new Date(content.publish_date + 'T00:00:00').toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div>
              <span className="text-surface-500 block text-xs font-medium uppercase tracking-wide mb-0.5">
                Platforms
              </span>
              <div className="flex gap-1 flex-wrap">
                {content.platforms.map((p) => (
                  <span key={p} className="badge-gray">{getPlatformLabel(p)}</span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-surface-500 block text-xs font-medium uppercase tracking-wide mb-0.5">
                Content Type
              </span>
              <span className="text-surface-800">
                {content.content_type ? getContentTypeLabel(content.content_type) : '—'}
              </span>
            </div>
            <div>
              <span className="text-surface-500 block text-xs font-medium uppercase tracking-wide mb-0.5">
                Tags
              </span>
              <div className="flex gap-1 flex-wrap">
                {content.tags.length > 0
                  ? content.tags.map((t) => (
                      <span key={t} className="badge-blue">{t}</span>
                    ))
                  : <span className="text-surface-400">—</span>}
              </div>
            </div>
          </div>
          {content.url && (
            <div className="mt-3">
              <a
                href={content.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {content.url}
              </a>
            </div>
          )}
          {content.notes && (
            <p className="text-sm text-surface-500 mt-3 border-t border-surface-100 pt-3">
              {content.notes}
            </p>
          )}
        </div>
      </div>

      {/* Block 2: Performance Metrics */}
      <div className="card mb-4">
        <div className="card-header">
          <h2 className="text-base font-medium text-surface-800">
            Performance Metrics
          </h2>
        </div>
        <div className="card-body">
          {content.platforms.length > 0 ? (
            <>
              <div className="flex gap-1 mb-4 border-b border-surface-200">
                {content.platforms.map((p) => (
                  <button
                    key={p}
                    onClick={() => setActiveMetricsTab(p)}
                    className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      activeMetricsTab === p
                        ? 'border-brand-600 text-brand-600'
                        : 'border-transparent text-surface-500 hover:text-surface-700'
                    }`}
                  >
                    {getPlatformLabel(p)}
                  </button>
                ))}
              </div>
              {(() => {
                const m = metricsForPlatform(activeMetricsTab);
                const renderMetricRow = (label: string, data: typeof m.organic, colorClass?: string) => (
                  <div>
                    <h4 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${colorClass || 'text-surface-500'}`}>
                      {label}
                    </h4>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                      <div>
                        <div className="text-xs text-surface-400">Impressions</div>
                        <div className="text-lg font-semibold tabular-nums">{formatNumber(data.impressions)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-surface-400">Unique Viewers</div>
                        <div className="text-lg font-semibold tabular-nums">{formatNumber(data.unique_viewers)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-surface-400">Link Clicks</div>
                        <div className="text-lg font-semibold tabular-nums">{formatNumber(data.clicks)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-surface-400">Engagements</div>
                        <div className="text-lg font-semibold tabular-nums">{formatNumber(data.engagements)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-surface-400">Video Views</div>
                        <div className="text-lg font-semibold tabular-nums">{formatNumber(data.video_views)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-surface-400">Watch Time</div>
                        <div className="text-lg font-semibold tabular-nums">{data.watch_time ? `${data.watch_time}s` : '—'}</div>
                      </div>
                    </div>
                  </div>
                );
                return (
                  <div className="space-y-5">
                    {renderMetricRow('Organic', m.organic, 'text-surface-500')}
                    <div className="border-t border-surface-100" />
                    {renderMetricRow('Paid', m.paid, 'text-blue-600')}
                  </div>
                );
              })()}
            </>
          ) : (
            <p className="text-sm text-surface-400">No platforms selected.</p>
          )}
        </div>
      </div>

      {/* Block 3: Estimated EMV */}
      <div className="card mb-4">
        <div className="card-header">
          <h2 className="text-base font-medium text-surface-800">
            Estimated Earned Media Value
          </h2>
        </div>
        <div className="card-body">
          <div className="flex items-center gap-8">
            <div>
              <div className="text-3xl font-bold text-emerald-600">
                {formatCurrency(emv.emv_total)}
              </div>
              <div className="text-xs text-surface-500 mt-1">Total EMV</div>
            </div>
            <div className="flex gap-6 text-sm">
              {content.platforms.includes('instagram') && (
                <div>
                  <div className="text-surface-500 text-xs">Instagram</div>
                  <div className="font-medium">{formatCurrency(emv.emv_ig)}</div>
                </div>
              )}
              {content.platforms.includes('facebook') && (
                <div>
                  <div className="text-surface-500 text-xs">Facebook</div>
                  <div className="font-medium">{formatCurrency(emv.emv_fb)}</div>
                </div>
              )}
              {content.platforms.includes('linkedin') && (
                <div>
                  <div className="text-surface-500 text-xs">LinkedIn</div>
                  <div className="font-medium">{formatCurrency(emv.emv_li)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Block 4: Production Cost */}
      <div className="card mb-4">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-base font-medium text-surface-800">
            Production Cost
          </h2>
          <button onClick={() => setShowCostForm(true)} className="btn-secondary btn-sm">
            <Plus className="w-3.5 h-3.5" />
            Add Cost Item
          </button>
        </div>
        <div className="card-body">
          {costs.length > 0 ? (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Vendor</th>
                    <th>Type</th>
                    <th className="text-right">Amount</th>
                    <th>Notes</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {costs.map((cost) => (
                    <tr key={cost.id}>
                      <td>
                        <span
                          className={
                            cost.provider_type === 'vendor'
                              ? 'badge-blue'
                              : 'badge-green'
                          }
                        >
                          {cost.provider_type === 'vendor' ? 'Vendor' : 'Internal'}
                        </span>
                      </td>
                      <td>{cost.vendor_name || '—'}</td>
                      <td className="capitalize">{cost.cost_type || '—'}</td>
                      <td className="text-right tabular-nums font-medium">
                        {formatCurrency(cost.amount)}
                      </td>
                      <td className="text-surface-500 max-w-[200px] truncate">
                        {cost.notes || '—'}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => setDeleteCostTarget(cost.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-surface-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 pt-3 border-t border-surface-100 flex gap-6 text-sm">
                <div>
                  <span className="text-surface-500">Vendor Total: </span>
                  <span className="font-medium">{formatCurrency(totals.vendor)}</span>
                </div>
                <div>
                  <span className="text-surface-500">Internal Total: </span>
                  <span className="font-medium">{formatCurrency(totals.internal)}</span>
                </div>
                <div>
                  <span className="text-surface-500">Total: </span>
                  <span className="font-semibold">{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-surface-400">
              No production costs added yet. Click &quot;Add Cost Item&quot; to track costs.
            </p>
          )}
        </div>
      </div>

      {/* Block 5: Linked Campaigns */}
      <div className="card mb-4">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-base font-medium text-surface-800">
            Linked Campaigns ({linkedCampaigns.length})
          </h2>
          <button
            onClick={() => setShowCampaignLinker(true)}
            className="btn-secondary btn-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Link Campaign
          </button>
        </div>
        <div className="card-body">
          {linkedCampaigns.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Platforms</th>
                  <th className="text-right">Ad Spend</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {linkedCampaigns.map((c) => (
                  <tr key={c.link_id}>
                    <td>
                      <button
                        onClick={() => router.push(`/campaigns/${c.id}`)}
                        className="text-brand-600 hover:text-brand-700 font-medium"
                      >
                        {c.campaign_name}
                      </button>
                    </td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        {c.platforms.map((p) => (
                          <span key={p} className="badge-gray text-xs">{getPlatformLabel(p)}</span>
                        ))}
                      </div>
                    </td>
                    <td className="text-right tabular-nums">{formatCurrency(c.spend)}</td>
                    <td className="text-right">
                      <button
                        onClick={() => unlinkCampaign(c.link_id)}
                        className="p-1.5 rounded hover:bg-red-50 text-surface-400 hover:text-red-600"
                        title="Unlink campaign"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-surface-400">
              No campaigns linked. Click &quot;Link Campaign&quot; to add this content to a campaign.
            </p>
          )}
        </div>
      </div>

      {/* Block 6: Summary */}
      <div className="card mb-4">
        <div className="card-header">
          <h2 className="text-base font-medium text-surface-800">Summary</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <div className="text-xs text-surface-500 uppercase tracking-wide">Organic Impressions</div>
              <div className="text-lg font-semibold">{formatNumber(totalImpressions)}</div>
            </div>
            <div>
              <div className="text-xs text-blue-500 uppercase tracking-wide">Paid Impressions</div>
              <div className="text-lg font-semibold text-blue-600">{formatNumber(totalPaidImpressions)}</div>
            </div>
            <div>
              <div className="text-xs text-surface-500 uppercase tracking-wide">Total Impressions (All)</div>
              <div className="text-lg font-bold text-surface-900">{formatNumber(totalImpressionsAll)}</div>
            </div>
            <div>
              <div className="text-xs text-surface-500 uppercase tracking-wide">Organic Clicks</div>
              <div className="text-lg font-semibold">{formatNumber(totalClicks)}</div>
            </div>
            <div>
              <div className="text-xs text-blue-500 uppercase tracking-wide">Paid Clicks</div>
              <div className="text-lg font-semibold text-blue-600">{formatNumber(totalPaidClicks)}</div>
            </div>
            <div>
              <div className="text-xs text-surface-500 uppercase tracking-wide">Total Clicks (All)</div>
              <div className="text-lg font-bold text-surface-900">{formatNumber(totalClicksAll)}</div>
            </div>
            <div>
              <div className="text-xs text-surface-500 uppercase tracking-wide">Total Production Cost</div>
              <div className="text-lg font-semibold">{formatCurrency(totals.total)}</div>
            </div>
            <div>
              <div className="text-xs text-surface-500 uppercase tracking-wide">Linked Paid Spend</div>
              <div className="text-lg font-semibold">{formatCurrency(linkedSpendTotal)}</div>
            </div>
            <div>
              <div className="text-xs text-surface-500 uppercase tracking-wide">Estimated EMV</div>
              <div className="text-lg font-bold text-emerald-600">{formatCurrency(emv.emv_total)}</div>
            </div>
            <div>
              <div className="text-xs text-surface-500 uppercase tracking-wide">Net Value</div>
              <div className={`text-lg font-bold ${emv.emv_total - totals.total >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(emv.emv_total - totals.total)}
              </div>
              <div className="text-xs text-surface-400 mt-0.5">EMV minus Production Cost</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ContentForm
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdate}
        initialData={content}
        mode="edit"
      />

      <CostItemForm
        open={showCostForm}
        onClose={() => setShowCostForm(false)}
        onSubmit={async (data) => {
          await addCost(data);
        }}
        contentId={id}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Content"
        message={`Are you sure you want to delete "${content.title}"? This will remove the content and all its production costs. Linked campaigns will not be deleted.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ConfirmDialog
        open={!!deleteCostTarget}
        title="Delete Cost Item"
        message="Are you sure you want to remove this cost item?"
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDeleteCost}
        onCancel={() => setDeleteCostTarget(null)}
      />

      <CampaignLinker
        open={showCampaignLinker}
        onClose={() => setShowCampaignLinker(false)}
        onLink={linkCampaign}
        excludeIds={linkedCampaigns.map((c) => c.id)}
      />
    </div>
  );
}
