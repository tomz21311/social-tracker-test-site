'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { Content, Campaign, Settings, Platform } from '@/types';
import {
  calculateContentEMV,
  calculateTotalImpressions,
  calculateTotalClicks,
  calculateTotalPaidImpressions,
  calculateTotalPaidClicks,
} from '@/lib/calculations';

interface SnapshotData {
  // KPIs for the selected month
  campaignAdSpend: number;
  productionCost: number;
  organicImpressions: number;
  paidImpressions: number;
  totalClicks: number;
  emv: number;
  netValue: number;
  // Counts
  contentCount: number;
  campaignCount: number;
}

export function useSnapshotData(
  year: number,
  month: number, // 1-12
  settings: Settings | null
) {
  const [data, setData] = useState<SnapshotData | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);

    const monthStr = month.toString().padStart(2, '0');
    const startDate = `${year}-${monthStr}-01`;
    // End of month
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${monthStr}-${lastDay}`;

    // Fetch content for the month
    const { data: contentRows } = await supabase
      .from('content')
      .select('*')
      .gte('publish_date', startDate)
      .lte('publish_date', endDate);

    const content = (contentRows as Content[]) || [];

    // Fetch campaigns starting in this month
    const { data: campaignRows } = await supabase
      .from('campaigns')
      .select('*')
      .gte('start_date', startDate)
      .lte('start_date', endDate);

    const campaigns = (campaignRows as Campaign[]) || [];

    // Fetch production costs for this month's content
    const contentIds = content.map((c) => c.id);
    let totalProductionCost = 0;
    if (contentIds.length > 0) {
      const { data: costs } = await supabase
        .from('production_costs')
        .select('amount')
        .in('content_id', contentIds);
      totalProductionCost = (costs || []).reduce((s: number, c: any) => s + c.amount, 0);
    }

    const campaignAdSpend = campaigns.reduce((s, c) => s + c.spend, 0);

    let organicImpressions = 0;
    let paidImpressions = 0;
    let totalClicks = 0;
    let emv = 0;

    for (const c of content) {
      organicImpressions += calculateTotalImpressions(c);
      paidImpressions += calculateTotalPaidImpressions(c);
      totalClicks += calculateTotalClicks(c) + calculateTotalPaidClicks(c);
      if (settings) {
        emv += calculateContentEMV(c, settings).emv_total;
      }
    }

    const netValue = emv - (totalProductionCost + campaignAdSpend);

    setData({
      campaignAdSpend,
      productionCost: totalProductionCost,
      organicImpressions,
      paidImpressions,
      totalClicks,
      emv,
      netValue,
      contentCount: content.length,
      campaignCount: campaigns.length,
    });

    setLoading(false);
  }, [year, month, settings]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading };
}
