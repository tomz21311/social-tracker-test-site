'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';

interface ProductionCostExportRow {
  content_title: string;
  vendor_name: string;
  provider_type: string;
  cost_type: string;
  amount: number;
  notes: string;
}

export function useProductionCostsExport() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const fetchAll = useCallback(async (year: number): Promise<ProductionCostExportRow[]> => {
    setLoading(true);

    // Get content IDs for the year
    const { data: contentRows } = await supabase
      .from('content')
      .select('id, title')
      .gte('publish_date', `${year}-01-01`)
      .lte('publish_date', `${year}-12-31`);

    if (!contentRows || contentRows.length === 0) {
      setLoading(false);
      return [];
    }

    const contentMap: Record<string, string> = {};
    for (const c of contentRows) {
      contentMap[c.id] = c.title;
    }

    const { data: costs } = await supabase
      .from('production_costs')
      .select('content_id, vendor_name, provider_type, cost_type, amount, notes')
      .in('content_id', contentRows.map((c) => c.id));

    setLoading(false);

    return (costs || []).map((c: any) => ({
      content_title: contentMap[c.content_id] || 'Unknown',
      vendor_name: c.vendor_name || '',
      provider_type: c.provider_type || '',
      cost_type: c.cost_type || '',
      amount: c.amount || 0,
      notes: c.notes || '',
    }));
  }, []);

  return { fetchAll, loading };
}
