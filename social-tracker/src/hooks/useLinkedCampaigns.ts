'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { Campaign } from '@/types';

interface LinkedCampaign extends Campaign {
  link_id: string;
}

export function useLinkedCampaigns(contentId: string) {
  const [campaigns, setCampaigns] = useState<LinkedCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchLinked = useCallback(async () => {
    setLoading(true);

    const { data } = await supabase
      .from('campaign_content')
      .select('id, campaign_id, campaigns(*)')
      .eq('content_id', contentId);

    if (data) {
      const linked = data
        .filter((row: any) => row.campaigns)
        .map((row: any) => ({
          ...row.campaigns,
          link_id: row.id,
        }));
      setCampaigns(linked as LinkedCampaign[]);
    } else {
      setCampaigns([]);
    }
    setLoading(false);
  }, [contentId]);

  useEffect(() => {
    if (contentId) {
      fetchLinked();
    }
  }, [fetchLinked, contentId]);

  const linkCampaign = async (campaignId: string) => {
    const { error } = await supabase
      .from('campaign_content')
      .insert({ campaign_id: campaignId, content_id: contentId });

    if (!error) {
      await fetchLinked();
    }
    return { error: error?.message || null };
  };

  const unlinkCampaign = async (linkId: string) => {
    const { error } = await supabase
      .from('campaign_content')
      .delete()
      .eq('id', linkId);

    if (!error) {
      await fetchLinked();
    }
    return { error: error?.message || null };
  };

  const linkedSpendTotal = campaigns.reduce((sum, c) => sum + (c.spend || 0), 0);

  return {
    campaigns,
    loading,
    linkCampaign,
    unlinkCampaign,
    linkedSpendTotal,
    refetch: fetchLinked,
  };
}
