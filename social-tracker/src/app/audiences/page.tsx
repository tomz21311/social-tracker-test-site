'use client';

import { useState } from 'react';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAudiences } from '@/hooks/useAudiences';
import { Audience } from '@/types';
import {
  getPlatformLabel,
  getAudienceTypeLabel,
  AUDIENCE_TYPES,
  PLATFORMS,
} from '@/lib/constants';
import { AudienceForm } from '@/components/audiences/AudienceForm';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

export default function AudiencesPage() {
  const { audiences, loading, createAudience, updateAudience, deleteAudience } =
    useAudiences();

  const [showNewForm, setShowNewForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Audience | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Audience | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');

  let filtered = audiences;
  if (filterType) {
    filtered = filtered.filter((a) => a.type === filterType);
  }
  if (filterPlatform) {
    filtered = filtered.filter((a) => a.platform === filterPlatform);
  }

  const handleCreate = async (data: any) => {
    await createAudience(data);
  };

  const handleUpdate = async (data: any) => {
    if (!editTarget) return;
    await updateAudience(editTarget.id, data);
    setEditTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteAudience(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  };

  const platformOptions = [
    ...PLATFORMS,
    { value: 'cross_platform', label: 'Cross-Platform' },
  ];

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
        <h1 className="page-title">Audiences</h1>
        <button onClick={() => setShowNewForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          New Audience
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="!w-auto !py-1.5 !text-sm"
        >
          <option value="">All Types</option>
          {AUDIENCE_TYPES.map((t) => (
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
          {platformOptions.map((p) => (
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
          {filtered.length} audience{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <Users className="empty-state-icon" />
              <h3 className="empty-state-title">No audiences yet</h3>
              <p className="empty-state-text">
                Create reusable audience definitions to link to your campaigns.
              </p>
              <button onClick={() => setShowNewForm(true)} className="btn-primary mt-4">
                <Plus className="w-4 h-4" />
                New Audience
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((aud) => (
            <div key={aud.id} className="card">
              <div
                className="card-body flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(expandedId === aud.id ? null : aud.id)}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-surface-800">{aud.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {aud.platform && (
                        <span className="badge-gray text-xs">
                          {getPlatformLabel(aud.platform)}
                        </span>
                      )}
                      {aud.type && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {getAudienceTypeLabel(aud.type)}
                        </span>
                      )}
                      {aud.tags.length > 0 && (
                        <span className="text-xs text-surface-400">
                          {aud.tags.slice(0, 3).join(', ')}
                          {aud.tags.length > 3 && ` +${aud.tags.length - 3}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditTarget(aud);
                    }}
                    className="p-1.5 rounded hover:bg-surface-100 text-surface-400 hover:text-surface-600"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(aud);
                    }}
                    className="p-1.5 rounded hover:bg-red-50 text-surface-400 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expandedId === aud.id ? (
                    <ChevronUp className="w-4 h-4 text-surface-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-surface-400" />
                  )}
                </div>
              </div>
              {expandedId === aud.id && (
                <div className="px-6 pb-4 border-t border-surface-100 pt-3">
                  {aud.definition && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-surface-500 uppercase tracking-wide mb-1">
                        Definition
                      </div>
                      <p className="text-sm text-surface-700">{aud.definition}</p>
                    </div>
                  )}
                  {aud.notes && (
                    <div>
                      <div className="text-xs font-medium text-surface-500 uppercase tracking-wide mb-1">
                        Notes
                      </div>
                      <p className="text-sm text-surface-700">{aud.notes}</p>
                    </div>
                  )}
                  {!aud.definition && !aud.notes && (
                    <p className="text-sm text-surface-400">No additional details.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AudienceForm
        open={showNewForm}
        onClose={() => setShowNewForm(false)}
        onSubmit={handleCreate}
      />

      <AudienceForm
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleUpdate}
        initialData={editTarget || undefined}
        mode="edit"
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Audience"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Campaign links will be removed but campaigns will not be deleted.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
