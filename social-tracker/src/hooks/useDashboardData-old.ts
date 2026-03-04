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

interface MonthlyDataPoint {
  month: string; // 'Jan', 'Feb', etc.
  monthNum: number;
  adSpend: number;
  productionCost: number;
  organicImpressions: number;
  paidImpressions: number;
  emv: number;
}

interface TopCampaignRow {
  id: string;
  name: string;
  adSpend: number;
  totalImpressions: number;
  totalEMV: number;
}

interface TopContentRow {
  id: string;
  title: string;
  organicImpressions: number;
  emv: number;
}

interface BestValueRow {
  id: string;
  title: string;
  emv: number;
  totalCost: number;
  valuePerDollar: number;
}

interface DashboardData {
  // KPIs
  campaignAdSpendYTD: number;
  productionCostYTD: number;
  organicImpressionsYTD: number;
  paidImpressionsYTD: number;
  totalClicksYTD: number;
  emvYTD: number;
  netValueYTD: number;
  // Charts
  monthlyData: MonthlyDataPoint[];
  // Tables
  topCampaigns: TopCampaignRow[];
  topContent: TopContentRow[];
  bestValue: BestValueRow[];
}

export function useDashboardData(
  year: number,
  platform: Platform | 'all',
  settings: Settings | null
) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch all content for the year
    let contentQuery = supabase
      .from('content')
      .select('*')
      .gte('publish_date', `${year}-01-01`)
      .lte('publish_date', `${year}-12-31`);

    if (platform !== 'all') {
      contentQuery = contentQuery.contains('platforms', [platform]);
    }

    const { data: contentRows } = await contentQuery;
    const content = (contentRows as Content[]) || [];

    // Fetch all campaigns for the year
    let campaignsQuery = supabase
      .from('campaigns')
      .select('*')
      .or(`start_date.gte.${year}-01-01,start_date.lte.${year}-12-31`);

    if (platform !== 'all') {
      campaignsQuery = campaignsQuery.contains('platforms', [platform]);
    }

    const { data: campaignRows } = await campaignsQuery;
    const campaigns = (campaignRows as Campaign[]) || [];

    // Fetch all production costs for the year's content
    const contentIds = content.map((c) => c.id);
    let productionCosts: { content_id: string; amount: number }[] = [];
    if (contentIds.length > 0) {
      const { data: costRows } = await supabase
        .from('production_costs')
        .select('content_id, amount')
        .in('content_id', contentIds);
      productionCosts = costRows || [];
    }

    // Fetch campaign_content links for top campaigns table
    const campaignIds = campaigns.map((c) => c.id);
    let campaignContentLinks: { campaign_id: string; content_id: string }[] = [];
    if (campaignIds.length > 0) {
      const { data: linkRows } = await supabase
        .from('campaign_content')
        .select('campaign_id, content_id')
        .in('campaign_id', campaignIds);
      campaignContentLinks = linkRows || [];
    }

    // Build cost map: content_id -> total production cost
    const costMap: Record<string, number> = {};
    for (const cost of productionCosts) {
      costMap[cost.content_id] = (costMap[cost.content_id] || 0) + cost.amount;
    }

    // ---- KPIs ----
    const campaignAdSpendYTD = campaigns.reduce((s, c) => s + c.spend, 0);
    const productionCostYTD = productionCosts.reduce((s, c) => s + c.amount, 0);

    let organicImpressionsYTD = 0;
    let paidImpressionsYTD = 0;
    let totalClicksYTD = 0;
    let emvYTD = 0;

    for (const c of content) {
      organicImpressionsYTD += calculateTotalImpressions(c);
      paidImpressionsYTD += calculateTotalPaidImpressions(c);
      totalClicksYTD += calculateTotalClicks(c) + calculateTotalPaidClicks(c);
      if (settings) {
        emvYTD += calculateContentEMV(c, settings).emv_total;
      }
    }

    const netValueYTD = emvYTD - (productionCostYTD + campaignAdSpendYTD);

    // ---- Monthly Data ----
    const monthlyData: MonthlyDataPoint[] = MONTHS.map((month, idx) => ({
      month,
      monthNum: idx + 1,
      adSpend: 0,
      productionCost: 0,
      organicImpressions: 0,
      paidImpressions: 0,
      emv: 0,
    }));

    for (const c of content) {
      const monthIdx = new Date(c.publish_date + 'T00:00:00').getMonth();
      monthlyData[monthIdx].organicImpressions += calculateTotalImpressions(c);
      monthlyData[monthIdx].paidImpressions += calculateTotalPaidImpressions(c);
      if (settings) {
        monthlyData[monthIdx].emv += calculateContentEMV(c, settings).emv_total;
      }
      // Add production cost to the month
      const contentCost = costMap[c.id] || 0;
      monthlyData[monthIdx].productionCost += contentCost;
    }

    // Campaign spend → spread to start_date month
    for (const camp of campaigns) {
      if (camp.start_date) {
        const monthIdx = new Date(camp.start_date + 'T00:00:00').getMonth();
        monthlyData[monthIdx].adSpend += camp.spend;
      }
    }

    // ---- Top Campaigns by total impressions ----
    // Build content map by id
    const contentMap: Record<string, Content> = {};
    for (const c of content) {
      contentMap[c.id] = c;
    }

    const topCampaigns: TopCampaignRow[] = campaigns
      .map((camp) => {
        const linkedIds = campaignContentLinks
          .filter((l) => l.campaign_id === camp.id)
          .map((l) => l.content_id);

        let totalImpressions = 0;
        let totalEMV = 0;

        for (const cid of linkedIds) {
          const c = contentMap[cid];
          if (c) {
            totalImpressions += calculateTotalImpressions(c) + calculateTotalPaidImpressions(c);
            if (settings) {
              totalEMV += calculateContentEMV(c, settings).emv_total;
            }
          }
        }

        return {
          id: camp.id,
          name: camp.campaign_name,
          adSpend: camp.spend,
          totalImpressions,
          totalEMV,
        };
      })
      .sort((a, b) => b.totalImpressions - a.totalImpressions)
      .slice(0, 5);

    // ---- Top Organic Content by EMV ----
    const topContent: TopContentRow[] = content
      .map((c) => {
        const emv = settings ? calculateContentEMV(c, settings).emv_total : 0;
        return {
          id: c.id,
          title: c.title,
          organicImpressions: calculateTotalImpressions(c),
          emv,
        };
      })
      .sort((a, b) => b.emv - a.emv)
      .slice(0, 5);

    // ---- Best Value per $ ----
    const bestValue: BestValueRow[] = content
      .map((c) => {
        const emv = settings ? calculateContentEMV(c, settings).emv_total : 0;
        const totalCost = (costMap[c.id] || 0);
        const valuePerDollar = totalCost > 0 ? emv / totalCost : 0;
        return {
          id: c.id,
          title: c.title,
          emv,
          totalCost,
          valuePerDollar,
        };
      })
      .filter((r) => r.totalCost > 0 && r.emv > 0)
      .sort((a, b) => b.valuePerDollar - a.valuePerDollar)
      .slice(0, 5);

    setData({
      campaignAdSpendYTD,
      productionCostYTD,
      organicImpressionsYTD,
      paidImpressionsYTD,
      totalClicksYTD,
      emvYTD,
      netValueYTD,
      monthlyData,
      topCampaigns,
      topContent,
      bestValue,
    });

    setLoading(false);
  }, [year, platform, settings]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refetch: fetchData };
}
