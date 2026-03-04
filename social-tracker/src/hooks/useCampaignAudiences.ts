'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { Audience } from '@/types';

interface LinkedAudience extends Audience {
  link_id: string;
}

export function useCampaignAudiences(campaignId: string) {
  const [audiences, setAudiences] = useState<LinkedAudience[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchLinked = useCallback(async () => {
    setLoading(true);

    const { data } = await supabase
      .from('campaign_audiences')
      .select('id, audience_id, audiences(*)')
      .eq('campaign_id', campaignId);

    if (data) {
      const linked = data
        .filter((row: any) => row.audiences)
        .map((row: any) => ({
          ...row.audiences,
          link_id: row.id,
        }));
      setAudiences(linked as LinkedAudience[]);
    } else {
      setAudiences([]);
    }
    setLoading(false);
  }, [campaignId]);

  useEffect(() => {
    if (campaignId) {
      fetchLinked();
    }
  }, [fetchLinked, campaignId]);

  const linkAudience = async (audienceId: string) => {
    const existing = audiences.find((a) => a.id === audienceId);
    if (existing) {
      return { error: 'Audience is already linked.' };
    }

    const { error } = await supabase
      .from('campaign_audiences')
      .insert({ campaign_id: campaignId, audience_id: audienceId });

    if (!error) {
      await fetchLinked();
    }
    return { error: error?.message || null };
  };

  const unlinkAudience = async (linkId: string) => {
    const { error } = await supabase
      .from('campaign_audiences')
      .delete()
      .eq('id', linkId);

    if (!error) {
      await fetchLinked();
    }
    return { error: error?.message || null };
  };

  return {
    audiences,
    loading,
    linkAudience,
    unlinkAudience,
    refetch: fetchLinked,
  };
}
