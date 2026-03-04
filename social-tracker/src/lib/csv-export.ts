import Papa from 'papaparse';
import { Content, Campaign, Settings } from '@/types';
import {
  calculateContentEMV,
  calculateTotalImpressions,
  calculateTotalClicks,
  calculateTotalPaidImpressions,
  calculateTotalPaidClicks,
} from '@/lib/calculations';

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportContentCSV(content: Content[], settings: Settings | null) {
  const rows = content.map((c) => {
    const emv = settings ? calculateContentEMV(c, settings) : { emv_ig: 0, emv_fb: 0, emv_li: 0, emv_total: 0 };
    return {
      Title: c.title,
      'Publish Date': c.publish_date,
      Platforms: c.platforms.join(', '),
      'Content Type': c.content_type || '',
      Tags: c.tags.join(', '),
      URL: c.url || '',
      'Organic Impressions (IG)': c.organic_impressions_ig || 0,
      'Organic Impressions (FB)': c.organic_impressions_fb || 0,
      'Organic Impressions (LI)': c.organic_impressions_li || 0,
      'Organic Impressions (Total)': calculateTotalImpressions(c),
      'Organic Clicks (IG)': c.organic_clicks_ig || 0,
      'Organic Clicks (FB)': c.organic_clicks_fb || 0,
      'Organic Clicks (LI)': c.organic_clicks_li || 0,
      'Organic Clicks (Total)': calculateTotalClicks(c),
      'Paid Impressions (IG)': c.paid_impressions_ig || 0,
      'Paid Impressions (FB)': c.paid_impressions_fb || 0,
      'Paid Impressions (LI)': c.paid_impressions_li || 0,
      'Paid Impressions (Total)': calculateTotalPaidImpressions(c),
      'Paid Clicks (IG)': c.paid_clicks_ig || 0,
      'Paid Clicks (FB)': c.paid_clicks_fb || 0,
      'Paid Clicks (LI)': c.paid_clicks_li || 0,
      'Paid Clicks (Total)': calculateTotalPaidClicks(c),
      'EMV (IG)': (emv.emv_ig / 100).toFixed(2),
      'EMV (FB)': (emv.emv_fb / 100).toFixed(2),
      'EMV (LI)': (emv.emv_li / 100).toFixed(2),
      'EMV (Total)': (emv.emv_total / 100).toFixed(2),
      Notes: c.notes || '',
    };
  });

  const csv = Papa.unparse(rows);
  downloadCSV(csv, `content-export-${new Date().toISOString().split('T')[0]}.csv`);
}

export function exportCampaignsCSV(campaigns: Campaign[]) {
  const rows = campaigns.map((c) => ({
    'Campaign Name': c.campaign_name,
    Platforms: c.platforms.join(', '),
    Objective: c.objective || '',
    'Start Date': c.start_date || '',
    'End Date': c.end_date || '',
    'Ad Spend ($)': (c.spend / 100).toFixed(2),
    'Geo Type': c.geo_type || '',
    'Geo Tags': c.geo_tags.join(', '),
    Notes: c.notes || '',
  }));

  const csv = Papa.unparse(rows);
  downloadCSV(csv, `campaigns-export-${new Date().toISOString().split('T')[0]}.csv`);
}

interface ProductionCostRow {
  content_title: string;
  vendor_name: string;
  provider_type: string;
  cost_type: string;
  amount: number;
  notes: string;
}

export function exportProductionCostsCSV(costs: ProductionCostRow[]) {
  const rows = costs.map((c) => ({
    'Content Title': c.content_title,
    Vendor: c.vendor_name,
    'Provider Type': c.provider_type,
    'Cost Type': c.cost_type,
    'Amount ($)': (c.amount / 100).toFixed(2),
    Notes: c.notes,
  }));

  const csv = Papa.unparse(rows);
  downloadCSV(csv, `production-costs-export-${new Date().toISOString().split('T')[0]}.csv`);
}
