'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { ProductionCost } from '@/types';

export function useProductionCosts(contentId: string) {
  const [costs, setCosts] = useState<ProductionCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchCosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('production_costs')
      .select('*')
      .eq('content_id', contentId)
      .order('created_at', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setCosts([]);
    } else {
      setCosts((data as ProductionCost[]) || []);
    }
    setLoading(false);
  }, [contentId]);

  useEffect(() => {
    if (contentId) {
      fetchCosts();
    }
  }, [fetchCosts, contentId]);

  const addCost = async (
    cost: Omit<ProductionCost, 'id' | 'created_at' | 'updated_at'>
  ) => {
    const { data, error: createError } = await supabase
      .from('production_costs')
      .insert(cost)
      .select()
      .single();

    if (createError) {
      return { data: null, error: createError.message };
    }

    // Auto-create vendor if it's a new vendor name
    if (cost.provider_type === 'vendor' && cost.vendor_name) {
      await supabase
        .from('vendors')
        .upsert(
          { name: cost.vendor_name },
          { onConflict: 'name' }
        );
    }

    await fetchCosts();
    return { data: data as ProductionCost, error: null };
  };

  const updateCost = async (
    id: string,
    updates: Partial<Omit<ProductionCost, 'id' | 'created_at' | 'updated_at'>>
  ) => {
    const { data, error: updateError } = await supabase
      .from('production_costs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    await fetchCosts();
    return { data: data as ProductionCost, error: null };
  };

  const deleteCost = async (id: string) => {
    const { error: deleteError } = await supabase
      .from('production_costs')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return { error: deleteError.message };
    }

    await fetchCosts();
    return { error: null };
  };

  const totals = {
    vendor: costs
      .filter((c) => c.provider_type === 'vendor')
      .reduce((sum, c) => sum + c.amount, 0),
    internal: costs
      .filter((c) => c.provider_type === 'internal')
      .reduce((sum, c) => sum + c.amount, 0),
    total: costs.reduce((sum, c) => sum + c.amount, 0),
  };

  return {
    costs,
    loading,
    error,
    addCost,
    updateCost,
    deleteCost,
    totals,
    refetch: fetchCosts,
  };
}

// Hook for fetching all production costs for a year (used by budget/dashboard)
export function useProductionCostsForYear(year: number) {
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      // Get all content IDs for the year, then sum their production costs
      const { data: contentData } = await supabase
        .from('content')
        .select('id')
        .gte('publish_date', `${year}-01-01`)
        .lte('publish_date', `${year}-12-31`);

      if (contentData && contentData.length > 0) {
        const ids = contentData.map((c) => c.id);
        const { data: costData } = await supabase
          .from('production_costs')
          .select('amount')
          .in('content_id', ids);

        if (costData) {
          setTotal(costData.reduce((sum, c) => sum + c.amount, 0));
        }
      } else {
        setTotal(0);
      }
      setLoading(false);
    }
    fetch();
  }, [year]);

  return { total, loading };
}
