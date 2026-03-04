'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  X,
  Users,
} from 'lucide-react';
import { useCampaignItem } from '@/hooks/useCampaigns';
import { useSettings } from '@/hooks/useSettings';
import { useCampaignContent } from '@/hooks/useCampaignContent';
import { useCampaignAudiences } from '@/hooks/useCampaignAudiences';
import { useAudiences } from '@/hooks/useAudiences';
import { Campaign, Platform } from '@/types';
import {
  formatCurrency,
  formatNumber,
  getPlatformLabel,
  getObjectiveLabel,
  getGeoTypeLabel,
} from '@/lib/constants';
import { CampaignForm } from '@/components/campaigns/CampaignForm';
import { ContentLinker } from '@/components/campaigns/ContentLinker';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const { campaign, loading, error, updateCampaign, deleteCampaign, refetch } =
    useCampaignItem(id);
  const { settings } = useSettings();
  const { linkedContent, aggregated, linkContent, unlinkContent } =
    useCampaignContent(id, settings);
  const {
    audiences: linkedAudiences,
    linkAudience,
    unlinkAudience,
  } = useCampaignAudiences(id);
  const { audiences: allAudiences } = useAudiences();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showContentLinker, setShowContentLinker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAudienceSelector, setShowAudienceSelector] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (searchParams.get('edit') === 'true') {
      setShowEditModal(true);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="card card-body">
        <p className="text-sm text-red-600">Campaign not found or failed to load.</p>
        <button onClick={() => router.push('/campaigns')} className="btn-secondary mt-4">
          <ArrowLeft className="w-4 h-4" /> Back to Campaigns
        </button>
      </div>
    );
  }

  const handleUpdate = async (data: any) => {
    await updateCampaign(data);
    await refetch();
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deleteCampaign();
    router.push('/campaigns');
  };

  const allInCost = aggregated.total_production_cost + campaign.spend;
  const netValue = aggregated.total_emv - allInCost;

  // Audiences not yet linked
  const unlinkedAudiences = allAudiences.filter(
    (a) => !linkedAudiences.find((la) => la.id === a.id)
  );

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push('/campaigns')} className="btn-ghost text-surface-500">
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowEditModal(true)} className="btn-secondary">
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} className="btn-danger">
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Block 1: Campaign Info */}
      <div className="card mb-4">
        <div className="card-body">
          <h1 className="text-xl font-semibold text-surface-900 mb-3">
            {campaign.campaign_name}
          </h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-surface-500 block text-xs font-medium uppercase tracking-wide mb-0.5">
                Platforms
              </span>
              <div className="flex gap-1 flex-wrap">
                {campaign.platforms.map((p) => (
                  <span key={p} className="badge-gray">{getPlatformLabel(p)}</span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-surface-500 block text-xs font-medium uppercase tracking-wide mb-0.5">
                Objective
              </span>
              <span className="text-surface-800">
                {campaign.objective ? getObjectiveLabel(campaign.objective) : '—'}
              </span>
            </div>
            <div>
              <span className="text-surface-500 block text-xs font-medium uppercase tracking-wide mb-0.5">
                Date Range
              </span>
              <span className="text-surface-800">
                {campaign.start_date
                  ? new Date(campaign.start_date + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—'}
                {campaign.end_date &&
                  ` — ${new Date(campaign.end_date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}`}
              </span>
            </div>
            <div>
              <span className="text-surface-500 block text-xs font-medium uppercase tracking-wide mb-0.5">
                Geo
              </span>
              <span className="text-surface-800">
                {campaign.geo_type ? getGeoTypeLabel(campaign.geo_type) : '—'}
                {campaign.geo_tags.length > 0 && (
                  <span className="ml-1 text-surface-400">
                    ({campaign.geo_tags.join(', ')})
                  </span>
                )}
              </span>
            </div>
          </div>
          {campaign.notes && (
            <p className="text-sm text-surface-500 mt-3 border-t border-surface-100 pt-3">
              {campaign.notes}
            </p>
          )}
        </div>
      </div>

      {/* Block 2: Campaign Ad Spend */}
      <div className="card mb-4">
        <div className="card-header">
          <h2 className="text-base font-medium text-surface-800">Campaign Ad Spend</h2>
        </div>
        <div className="card-body">
          <div className="text-3xl font-bold text-surface-900">
            {formatCurrency(campaign.spend)}
          </div>
          <div className="text-xs text-surface-400 mt-1">Campaign-level ad budget</div>
        </div>
      </div>

      {/* Block 3: Linked Content */}
      <div className="card mb-4">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-base font-medium text-surface-800">
            Linked Content ({linkedContent.length})
          </h2>
          <button
            onClick={() => setShowContentLinker(true)}
            className="btn-secondary btn-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Content
          </button>
        </div>
        <div className="card-body">
          {linkedContent.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Platforms</th>
                  <th className="text-right">Organic Impr.</th>
                  <th className="text-right">Paid Impr.</th>
                  <th className="text-right">EMV</th>
                  <th className="text-right">Prod. Cost</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {linkedContent.map((item) => (
                  <tr key={item.link_id}>
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
                          <span key={p} className="badge-gray text-xs">{getPlatformLabel(p)}</span>
                        ))}
                      </div>
                    </td>
                    <td className="text-right tabular-nums">
                      {formatNumber(item.organic_impressions_total)}
                    </td>
                    <td className="text-right tabular-nums text-blue-600">
                      {formatNumber(item.paid_impressions_total)}
                    </td>
                    <td className="text-right tabular-nums text-emerald-600">
                      {formatCurrency(item.emv_total)}
                    </td>
                    <td className="text-right tabular-nums">
                      {formatCurrency(item.production_cost_total)}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => unlinkContent(item.link_id)}
                        className="p-1.5 rounded hover:bg-red-50 text-surface-400 hover:text-red-600"
                        title="Unlink content"
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
              No content linked yet. Click &quot;Add Content&quot; to link content items.
            </p>
          )}
        </div>
      </div>

      {/* Block 4: Aggregated Organic Metrics */}
      <div className="card mb-4">
        <div className="card-header">
          <h2 className="text-base font-medium text-surface-800">
            Aggregated Organic Metrics
          </h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <div className="text-xs text-surface-500 uppercase tracking-wide">Organic Impressions</div>
              <div className="text-lg font-semibold tabular-nums">{formatNumber(aggregated.organic_impressions)}</div>
            </div>
            <div>
              <div className="text-xs text-surface-500 uppercase tracking-wide">Organic Clicks</div>
              <div className="text-lg font-semibold tabular-nums">{formatNumber(aggregated.organic_clicks)}</div>
            </div>
            <div>
              <div className="text-xs text-surface-500 uppercase tracking-wide">Estimated EMV</div>
              <div className="text-lg font-bold text-emerald-600 tabular-nums">{formatCurrency(aggregated.total_emv)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Block 5: Aggregated Paid Metrics */}
      <div className="card mb-4">
        <div className="card-header">
          <h2 className="text-base font-medium text-surface-800">
            Aggregated Paid Metrics
          </h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <div className="text-xs text-blue-500 uppercase tracking-wide">Paid Impressions</div>
              <div className="text-lg font-semibold text-blue-600 tabular-nums">{formatNumber(aggregated.paid_impressions)}</div>
            </div>
            <div>
              <div className="text-xs text-blue-500 uppercase tracking-wide">Paid Clicks</div>
              <div className="text-lg font-semibold text-blue-600 tabular-nums">{formatNumber(aggregated.paid_clicks)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Block 6: Campaign Summary */}
      <div className="card mb-4">
        <div className="card-header">
          <h2 className="text-base font-medium text-surface-800">Campaign Summary</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <div className="text-xs text-surface-500 uppercase tracking-wide">Total Impressions (All)</div>
              <div className="text-lg font-bold text-surface-900 tabular-nums">{formatNumber(aggregated.total_impressions)}</div>
            </div>
            <div>
              <div className="text-xs text-surface-500 uppercase tracking-wide">Total Clicks (All)</div>
              <div className="text-lg font-bold text-surface-900 tabular-nums">{formatNumber(aggregated.total_clicks)}</div>
            </div>
            <div>
              <div className="text-xs text-surface-500 uppercase tracking-wide">Total EMV</div>
              <div className="text-lg font-bold text-emerald-600 tabular-nums">{formatCurrency(aggregated.total_emv)}</div>
            </div>
            <div>
              <div className="text-xs text-surface-500 uppercase tracking-wide">Total Production Cost</div>
              <div className="text-lg font-semibold tabular-nums">{formatCurrency(aggregated.total_production_cost)}</div>
            </div>
            <div>
              <div className="text-xs text-surface-500 uppercase tracking-wide">Campaign Ad Spend</div>
              <div className="text-lg font-semibold tabular-nums">{formatCurrency(campaign.spend)}</div>
            </div>
            <div>
              <div className="text-xs text-surface-500 uppercase tracking-wide">All-In Cost</div>
              <div className="text-lg font-bold text-surface-900 tabular-nums">{formatCurrency(allInCost)}</div>
              <div className="text-xs text-surface-400 mt-0.5">Production + Ad Spend</div>
            </div>
            <div>
              <div className="text-xs text-surface-500 uppercase tracking-wide">Net Value</div>
              <div className={`text-lg font-bold tabular-nums ${netValue >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(netValue)}
              </div>
              <div className="text-xs text-surface-400 mt-0.5">EMV minus All-In Cost</div>
            </div>
          </div>
        </div>
      </div>

      {/* Linked Audiences */}
      <div className="card mb-4">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-base font-medium text-surface-800">
            Audiences ({linkedAudiences.length})
          </h2>
          {unlinkedAudiences.length > 0 && (
            <button
              onClick={() => setShowAudienceSelector(!showAudienceSelector)}
              className="btn-secondary btn-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Audience
            </button>
          )}
        </div>
        <div className="card-body">
          {showAudienceSelector && unlinkedAudiences.length > 0 && (
            <div className="border border-surface-200 rounded-md mb-4 max-h-40 overflow-y-auto">
              {unlinkedAudiences.map((aud) => (
                <button
                  key={aud.id}
                  onClick={() => linkAudience(aud.id)}
                  className="w-full text-left flex items-center justify-between px-3 py-2 hover:bg-surface-50 text-sm border-b border-surface-100 last:border-b-0"
                >
                  <div>
                    <span className="text-surface-800">{aud.name}</span>
                    {aud.type && (
                      <span className="ml-2 text-xs text-surface-400 capitalize">{aud.type}</span>
                    )}
                  </div>
                  <Plus className="w-3.5 h-3.5 text-surface-400" />
                </button>
              ))}
            </div>
          )}

          {linkedAudiences.length > 0 ? (
            <div className="space-y-2">
              {linkedAudiences.map((aud) => (
                <div
                  key={aud.link_id}
                  className="flex items-center justify-between px-3 py-2 bg-surface-50 rounded-md"
                >
                  <div>
                    <span className="text-sm font-medium text-surface-800">{aud.name}</span>
                    {aud.type && (
                      <span className="ml-2 text-xs text-surface-400 capitalize">{aud.type}</span>
                    )}
                    {aud.platform && (
                      <span className="ml-2 badge-gray text-xs">{getPlatformLabel(aud.platform)}</span>
                    )}
                  </div>
                  <button
                    onClick={() => unlinkAudience(aud.link_id)}
                    className="p-1 rounded hover:bg-red-50 text-surface-400 hover:text-red-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-surface-400">
              No audiences linked. {unlinkedAudiences.length > 0 ? 'Click "Add Audience" to link one.' : 'Create audiences first in the Audiences section.'}
            </p>
          )}
        </div>
      </div>

      {/* Modals */}
      <CampaignForm
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdate}
        initialData={campaign}
        audiences={allAudiences}
        linkedAudienceIds={linkedAudiences.map((a) => a.id)}
        mode="edit"
      />

      <ContentLinker
        open={showContentLinker}
        onClose={() => setShowContentLinker(false)}
        onLink={linkContent}
        excludeIds={linkedContent.map((c) => c.id)}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Campaign"
        message={`Are you sure you want to delete "${campaign.campaign_name}"? Linked content and audiences will not be deleted.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
