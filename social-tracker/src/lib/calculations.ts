import { Content, Settings, BudgetSummary } from '@/types';

/**
 * Calculate EMV for a single platform.
 * EMV = (impressions / 1000) × CPM rate
 * Returns value in cents.
 */
export function calculateEMV(impressions: number, cpmRate: number): number {
  if (!impressions || !cpmRate) return 0;
  return Math.round((impressions / 1000) * cpmRate * 100);
}

/**
 * Calculate all EMV values for a content item.
 */
export function calculateContentEMV(
  content: Content,
  settings: Settings
): { emv_ig: number; emv_fb: number; emv_li: number; emv_total: number } {
  const emv_ig = calculateEMV(content.organic_impressions_ig, settings.cpm_instagram);
  const emv_fb = calculateEMV(content.organic_impressions_fb, settings.cpm_facebook);
  const emv_li = calculateEMV(content.organic_impressions_li, settings.cpm_linkedin);
  return {
    emv_ig,
    emv_fb,
    emv_li,
    emv_total: emv_ig + emv_fb + emv_li,
  };
}

/**
 * Calculate total organic impressions for a content item.
 */
export function calculateTotalImpressions(content: Content): number {
  return (
    (content.organic_impressions_ig || 0) +
    (content.organic_impressions_fb || 0) +
    (content.organic_impressions_li || 0)
  );
}

/**
 * Calculate total organic clicks for a content item.
 */
export function calculateTotalClicks(content: Content): number {
  return (
    (content.organic_clicks_ig || 0) +
    (content.organic_clicks_fb || 0) +
    (content.organic_clicks_li || 0)
  );
}

/**
 * Calculate total paid impressions for a content item.
 */
export function calculateTotalPaidImpressions(content: Content): number {
  return (
    (content.paid_impressions_ig || 0) +
    (content.paid_impressions_fb || 0) +
    (content.paid_impressions_li || 0)
  );
}

/**
 * Calculate total paid clicks for a content item.
 */
export function calculateTotalPaidClicks(content: Content): number {
  return (
    (content.paid_clicks_ig || 0) +
    (content.paid_clicks_fb || 0) +
    (content.paid_clicks_li || 0)
  );
}

/**
 * Calculate budget summary with time-based pacing.
 */
export function calculateBudgetSummary(
  annualBudget: number,
  paidSpendYTD: number,
  productionCostYTD: number,
  currentMonth?: number
): BudgetSummary {
  const month = currentMonth || new Date().getMonth() + 1; // 1-12
  const totalSpend = paidSpendYTD + productionCostYTD;
  const remaining = annualBudget - totalSpend;
  const pacingPercentage = annualBudget > 0 ? (totalSpend / annualBudget) * 100 : 0;
  const expectedPacing = (month / 12) * 100;

  let status: BudgetSummary['status'] = 'on_track';
  if (pacingPercentage > expectedPacing + 5) {
    status = 'ahead';
  } else if (pacingPercentage < expectedPacing - 10) {
    status = 'under';
  }

  return {
    annual_budget: annualBudget,
    paid_spend_ytd: paidSpendYTD,
    production_cost_ytd: productionCostYTD,
    total_spend_ytd: totalSpend,
    remaining_budget: remaining,
    pacing_percentage: pacingPercentage,
    expected_pacing: expectedPacing,
    status,
  };
}

/**
 * Get a human-readable pacing status message.
 */
export function getPacingStatusMessage(summary: BudgetSummary): string {
  const diff = Math.abs(summary.pacing_percentage - summary.expected_pacing).toFixed(1);
  switch (summary.status) {
    case 'ahead':
      return `Spending is ${diff}% ahead of expected pace. Consider slowing spend.`;
    case 'under':
      return `Spending is ${diff}% behind expected pace. Budget is available for allocation.`;
    case 'on_track':
      return 'Spending is on track with expected pace.';
  }
}
