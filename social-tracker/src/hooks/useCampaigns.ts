'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { Campaign, Platform } from '@/types';

interface UseCampaignsOptions {
  year?: number;
  platform?: Platform | 'all';
  search?: string;
}

export function useCampaigns(options: UseCampaignsOptions = {}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('campaigns')
      .select('*')
      .order('start_date', { ascending: false });

    if (options.year) {
      query = query.or(
        `start_date.gte.${options.year}-01-01,end_date.gte.${options.year}-01-01`
      );
      query = query.or(
        `start_date.lte.${options.year}-12-31,end_date.lte.${options.year}-12-31`
      );
    }

    if (options.platform && options.platform !== 'all') {
      query = query.contains('platforms', [options.platform]);
    }

    if (options.search) {
      query = query.ilike('campaign_name', `%${options.search}%`);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
      setCampaigns([]);
    } else {
      setCampaigns((data as Campaign[]) || []);
    }
    setLoading(false);
  }, [options.year, options.platform, options.search]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const createCampaign = async (
    newCampaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>
  ) => {
    const { data, error: createError } = await supabase
      .from('campaigns')
      .insert(newCampaign)
      .select()
      .single();

    if (createError) {
      return { data: null, error: createError.message };
    }

    await fetchCampaigns();
    return { data: data as Campaign, error: null };
  };

  const deleteCampaign = async (id: string) => {
    const { error: deleteError } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return { error: deleteError.message };
    }

    await fetchCampaigns();
    return { error: null };
  };

  return {
    campaigns,
    loading,
    error,
    createCampaign,
    deleteCampaign,
    refetch: fetchCampaigns,
  };
}

// Single campaign hook
export function useCampaignItem(id: string) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchCampaign = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      setError(fetchError.message);
      setCampaign(null);
    } else {
      setCampaign(data as Campaign);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  const updateCampaign = async (
    updates: Partial<Omit<Campaign, 'id' | 'created_at' | 'updated_at'>>
  ) => {
    const { data, error: updateError } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    setCampaign(data as Campaign);
    return { data: data as Campaign, error: null };
  };

  const deleteCampaign = async () => {
    const { error: deleteError } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return { error: deleteError.message };
    }

    return { error: null };
  };

  return {
    campaign,
    loading,
    error,
    updateCampaign,
    deleteCampaign,
    refetch: fetchCampaign,
  };
}
