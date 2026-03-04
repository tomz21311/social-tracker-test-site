'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { Settings, Platform } from '@/types';
import { calculateBudgetSummary } from '@/lib/calculations';
import type { BudgetSummary } from '@/types';

interface PlatformBreakdown {
  platform: string;
  label: string;
  adSpend: number;
  productionCost: number;
  total: number;
}

export function useBudgetData(year: number, settings: Settings | null) {
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [platformBreakdown, setPlatformBreakdown] = useState<PlatformBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    if (!settings) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch campaigns for the year
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('spend, platforms, start_date')
      .or(`start_date.gte.${year}-01-01,start_date.lte.${year}-12-31`);

    const totalAdSpend = (campaigns || []).reduce(
      (s: number, c: any) => s + (c.spend || 0),
      0
    );

    // Fetch content for the year to get production costs
    const { data: contentRows } = await supabase
      .from('content')
      .select('id, platforms')
      .gte('publish_date', `${year}-01-01`)
      .lte('publish_date', `${year}-12-31`);

    const contentIds = (contentRows || []).map((c: any) => c.id);
    let totalProductionCost = 0;
    let costsByContentId: Record<string, number> = {};

    if (contentIds.length > 0) {
      const { data: costs } = await supabase
        .from('production_costs')
        .select('content_id, amount')
        .in('content_id', contentIds);

      for (const cost of costs || []) {
        totalProductionCost += cost.amount;
        costsByContentId[cost.content_id] =
          (costsByContentId[cost.content_id] || 0) + cost.amount;
      }
    }

    const budgetSummary = calculateBudgetSummary(
      settings.annual_budget,
      totalAdSpend,
      totalProductionCost
    );
    setSummary(budgetSummary);

    // Platform breakdown
    const platforms: Platform[] = ['facebook', 'instagram', 'linkedin'];
    const labels: Record<string, string> = {
      facebook: 'Facebook',
      instagram: 'Instagram',
      linkedin: 'LinkedIn',
    };

    const breakdown: PlatformBreakdown[] = platforms.map((p) => {
      // Ad spend: campaigns that include this platform (split evenly across campaign platforms)
      const platAdSpend = (campaigns || []).reduce((s: number, c: any) => {
        if (c.platforms && c.platforms.includes(p)) {
          return s + Math.round((c.spend || 0) / c.platforms.length);
        }
        return s;
      }, 0);

      // Production cost: content that includes this platform (split evenly)
      const platProdCost = (contentRows || []).reduce((s: number, c: any) => {
        if (c.platforms && c.platforms.includes(p)) {
          const cost = costsByContentId[c.id] || 0;
          return s + Math.round(cost / c.platforms.length);
        }
        return s;
      }, 0);

      return {
        platform: p,
        label: labels[p],
        adSpend: platAdSpend,
        productionCost: platProdCost,
        total: platAdSpend + platProdCost,
      };
    });

    setPlatformBreakdown(breakdown);
    setLoading(false);
  }, [year, settings]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { summary, platformBreakdown, loading, refetch: fetchData };
}
