// ============================================
// Database entity types
// ============================================

export interface Settings {
  id: string;
  annual_budget: number; // stored in cents
  cpm_instagram: number;
  cpm_facebook: number;
  cpm_linkedin: number;
  budget_year: number;
  created_at: string;
  updated_at: string;
}

export interface Content {
  id: string;
  title: string;
  publish_date: string;
  platforms: Platform[];
  content_type: ContentType | null;
  tags: string[];
  url: string | null;
  notes: string | null;
  // Instagram metrics
  organic_impressions_ig: number;
  organic_unique_viewers_ig: number;
  organic_clicks_ig: number;
  engagements_ig: number;
  video_views_ig: number;
  watch_time_ig: number;
  // Facebook metrics
  organic_impressions_fb: number;
  organic_unique_viewers_fb: number;
  organic_clicks_fb: number;
  engagements_fb: number;
  video_views_fb: number;
  watch_time_fb: number;
  // LinkedIn metrics
  organic_impressions_li: number;
  organic_unique_viewers_li: number;
  organic_clicks_li: number;
  engagements_li: number;
  video_views_li: number;
  watch_time_li: number;
  // Instagram paid metrics
  paid_impressions_ig: number;
  paid_unique_viewers_ig: number;
  paid_clicks_ig: number;
  paid_engagements_ig: number;
  paid_video_views_ig: number;
  paid_watch_time_ig: number;
  // Facebook paid metrics
  paid_impressions_fb: number;
  paid_unique_viewers_fb: number;
  paid_clicks_fb: number;
  paid_engagements_fb: number;
  paid_video_views_fb: number;
  paid_watch_time_fb: number;
  // LinkedIn paid metrics
  paid_impressions_li: number;
  paid_unique_viewers_li: number;
  paid_clicks_li: number;
  paid_engagements_li: number;
  paid_video_views_li: number;
  paid_watch_time_li: number;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ProductionCost {
  id: string;
  content_id: string;
  provider_type: 'vendor' | 'internal';
  vendor_name: string | null;
  cost_type: CostType | null;
  amount: number; // stored in cents
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  campaign_name: string;
  platforms: Platform[];
  objective: Objective | null;
  start_date: string | null;
  end_date: string | null;
  spend: number; // campaign-level ad budget, stored in cents
  geo_type: GeoType | null;
  geo_tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Audience {
  id: string;
  name: string;
  platform: Platform | 'cross_platform' | null;
  type: AudienceType | null;
  tags: string[];
  notes: string | null;
  definition: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignContent {
  id: string;
  campaign_id: string;
  content_id: string | null;
  created_at: string;
}

export interface CampaignAudience {
  id: string;
  campaign_id: string;
  audience_id: string | null;
  created_at: string;
}

// ============================================
// Enum / union types
// ============================================

export type Platform = 'instagram' | 'facebook' | 'linkedin';

export type ContentType =
  | 'post'
  | 'video'
  | 'slideshow'
  | 'story'
  | 'reel'
  | 'carousel'
  | 'article'
  | 'other';

export type CostType =
  | 'filming'
  | 'editing'
  | 'design'
  | 'copywriting'
  | 'photography'
  | 'strategy'
  | 'other';

export type Objective =
  | 'awareness'
  | 'traffic'
  | 'conversions'
  | 'engagement'
  | 'reach'
  | 'video_views'
  | 'lead_generation'
  | 'other';

export type LandingType =
  | 'website'
  | 'landing_page'
  | 'lead_form'
  | 'app'
  | 'profile'
  | 'other';

export type GeoType =
  | 'town_list'
  | 'radius'
  | 'county'
  | 'statewide'
  | 'custom';

export type AudienceType =
  | 'interest'
  | 'geo'
  | 'retargeting'
  | 'lookalike'
  | 'custom';

// ============================================
// Computed / display types
// ============================================

export interface ContentWithComputedFields extends Content {
  organic_impressions_total: number;
  organic_clicks_total: number;
  paid_impressions_total: number;
  paid_clicks_total: number;
  emv_ig: number;
  emv_fb: number;
  emv_li: number;
  emv_total: number;
  production_cost_total: number;
}

export interface BudgetSummary {
  annual_budget: number;
  paid_spend_ytd: number;
  production_cost_ytd: number;
  total_spend_ytd: number;
  remaining_budget: number;
  pacing_percentage: number;
  expected_pacing: number;
  status: 'on_track' | 'ahead' | 'under';
}

// ============================================
// Filter state
// ============================================

export interface GlobalFilters {
  year: number;
  platform: Platform | 'all';
  search: string;
}
