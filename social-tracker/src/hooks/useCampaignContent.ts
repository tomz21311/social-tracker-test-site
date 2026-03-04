'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { Content, Settings } from '@/types';
import { calculateContentEMV, calculateTotalImpressions, calculateTotalClicks } from '@/lib/calculations';

interface LinkedContentItem extends Content {
  link_id: string;
  organic_impressions_total: number;
  paid_impressions_total: number;
  organic_clicks_total: number;
  paid_clicks_total: number;
  emv_total: number;
  production_cost_total: number;
}

interface AggregatedMetrics {
  organic_impressions: number;
  paid_impressions: number;
  total_impressions: number;
  organic_clicks: number;
  paid_clicks: number;
  total_clicks: number;
  total_emv: number;
  total_production_cost: number;
}

export function useCampaignContent(campaignId: string, settings: Settings | null) {
  const [linkedContent, setLinkedContent] = useState<LinkedContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchLinkedContent = useCallback(async () => {
    setLoading(true);

    // Get linked content items
    const { data: links } = await supabase
      .from('campaign_content')
      .select('id, content_id, content(*)')
      .eq('campaign_id', campaignId);

    if (links) {
      // For each content item, also fetch production costs
      const items: LinkedContentItem[] = [];

      for (const link of links) {
        const content = (link as any).content as Content;
        if (!content) continue;

        // Fetch production costs for this content
        const { data: costs } = await supabase
          .from('production_costs')
          .select('amount')
          .eq('content_id', content.id);

        const productionCostTotal = costs
          ? costs.reduce((sum, c) => sum + c.amount, 0)
          : 0;

        const emv = settings
          ? calculateContentEMV(content, settings)
          : { emv_total: 0 };

        const organicImpressions = calculateTotalImpressions(content);
        const organicClicks = calculateTotalClicks(content);
        const paidImpressions =
          (content.paid_impressions_ig || 0) +
          (content.paid_impressions_fb || 0) +
          (content.paid_impressions_li || 0);
        const paidClicks =
          (content.paid_clicks_ig || 0) +
          (content.paid_clicks_fb || 0) +
          (content.paid_clicks_li || 0);

        items.push({
          ...content,
          link_id: link.id,
          organic_impressions_total: organicImpressions,
          paid_impressions_total: paidImpressions,
          organic_clicks_total: organicClicks,
          paid_clicks_total: paidClicks,
          emv_total: emv.emv_total,
          production_cost_total: productionCostTotal,
        });
      }

      setLinkedContent(items);
    } else {
      setLinkedContent([]);
    }
    setLoading(false);
  }, [campaignId, settings]);

  useEffect(() => {
    if (campaignId) {
      fetchLinkedContent();
    }
  }, [fetchLinkedContent, campaignId]);

  const linkContent = async (contentId: string) => {
    // Check if already linked
    const existing = linkedContent.find((c) => c.id === contentId);
    if (existing) {
      return { error: 'Content is already linked to this campaign.' };
    }

    const { error } = await supabase
      .from('campaign_content')
      .insert({ campaign_id: campaignId, content_id: contentId });

    if (!error) {
      await fetchLinkedContent();
    }
    return { error: error?.message || null };
  };

  const unlinkContent = async (linkId: string) => {
    const { error } = await supabase
      .from('campaign_content')
      .delete()
      .eq('id', linkId);

    if (!error) {
      await fetchLinkedContent();
    }
    return { error: error?.message || null };
  };

  // Compute aggregated metrics
  const aggregated: AggregatedMetrics = linkedContent.reduce(
    (acc, item) => ({
      organic_impressions: acc.organic_impressions + item.organic_impressions_total,
      paid_impressions: acc.paid_impressions + item.paid_impressions_total,
      total_impressions:
        acc.total_impressions +
        item.organic_impressions_total +
        item.paid_impressions_total,
      organic_clicks: acc.organic_clicks + item.organic_clicks_total,
      paid_clicks: acc.paid_clicks + item.paid_clicks_total,
      total_clicks:
        acc.total_clicks + item.organic_clicks_total + item.paid_clicks_total,
      total_emv: acc.total_emv + item.emv_total,
      total_production_cost: acc.total_production_cost + item.production_cost_total,
    }),
    {
      organic_impressions: 0,
      paid_impressions: 0,
      total_impressions: 0,
      organic_clicks: 0,
      paid_clicks: 0,
      total_clicks: 0,
      total_emv: 0,
      total_production_cost: 0,
    }
  );

  return {
    linkedContent,
    loading,
    linkContent,
    unlinkContent,
    aggregated,
    refetch: fetchLinkedContent,
  };
}
