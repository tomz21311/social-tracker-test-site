import {
  ContentType,
  CostType,
  Objective,
  LandingType,
  GeoType,
  AudienceType,
  Platform,
} from '@/types';

export const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' },
];

export const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'post', label: 'Post' },
  { value: 'video', label: 'Video' },
  { value: 'slideshow', label: 'Slideshow' },
  { value: 'story', label: 'Story' },
  { value: 'reel', label: 'Reel' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'article', label: 'Article' },
  { value: 'other', label: 'Other' },
];

export const COST_TYPES: { value: CostType; label: string }[] = [
  { value: 'filming', label: 'Filming' },
  { value: 'editing', label: 'Editing' },
  { value: 'design', label: 'Design' },
  { value: 'copywriting', label: 'Copywriting' },
  { value: 'photography', label: 'Photography' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'other', label: 'Other' },
];

export const OBJECTIVES: { value: Objective; label: string }[] = [
  { value: 'awareness', label: 'Awareness' },
  { value: 'traffic', label: 'Traffic' },
  { value: 'conversions', label: 'Conversions' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'reach', label: 'Reach' },
  { value: 'video_views', label: 'Video Views' },
  { value: 'lead_generation', label: 'Lead Generation' },
  { value: 'other', label: 'Other' },
];

export const LANDING_TYPES: { value: LandingType; label: string }[] = [
  { value: 'website', label: 'Website' },
  { value: 'landing_page', label: 'Landing Page' },
  { value: 'lead_form', label: 'Lead Form' },
  { value: 'app', label: 'App' },
  { value: 'profile', label: 'Profile' },
  { value: 'other', label: 'Other' },
];

export const GEO_TYPES: { value: GeoType; label: string }[] = [
  { value: 'town_list', label: 'Town List' },
  { value: 'radius', label: 'Radius' },
  { value: 'county', label: 'County' },
  { value: 'statewide', label: 'Statewide' },
  { value: 'custom', label: 'Custom' },
];

export const AUDIENCE_TYPES: { value: AudienceType; label: string }[] = [
  { value: 'interest', label: 'Interest' },
  { value: 'geo', label: 'Geographic' },
  { value: 'retargeting', label: 'Retargeting' },
  { value: 'lookalike', label: 'Lookalike' },
  { value: 'custom', label: 'Custom' },
];

export const VENDOR_CATEGORIES = [
  'Video Production',
  'Design Agency',
  'Freelance',
  'Photography',
  'Consulting',
  'Other',
];

// Navigation items for sidebar
export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/content', label: 'Content', icon: 'FileText' },
  { href: '/campaigns', label: 'Campaigns', icon: 'Megaphone' },
  { href: '/audiences', label: 'Audiences', icon: 'Users' },
  { href: '/budget', label: 'Budget', icon: 'DollarSign' },
  { href: '/reports', label: 'Reports', icon: 'BarChart3' },
  { href: '/settings', label: 'Settings', icon: 'Settings' },
] as const;

// Helper: format cents to dollar string
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// Helper: format cents to dollar string with cents
export function formatCurrencyExact(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

// Helper: format large numbers with commas
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

// Helper: dollars input to cents
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

// Helper: cents to dollars
export function centsToDollars(cents: number): number {
  return cents / 100;
}

// Helper: get platform label
export function getPlatformLabel(platform: string): string {
  const found = PLATFORMS.find((p) => p.value === platform);
  return found ? found.label : platform;
}

// Helper: get content type label
export function getContentTypeLabel(type: string): string {
  const found = CONTENT_TYPES.find((t) => t.value === type);
  return found ? found.label : type;
}

// Helper: get objective label
export function getObjectiveLabel(objective: string): string {
  const found = OBJECTIVES.find((o) => o.value === objective);
  return found ? found.label : objective;
}

// Helper: get geo type label
export function getGeoTypeLabel(geoType: string): string {
  const found = GEO_TYPES.find((g) => g.value === geoType);
  return found ? found.label : geoType;
}

// Helper: get audience type label
export function getAudienceTypeLabel(type: string): string {
  const found = AUDIENCE_TYPES.find((t) => t.value === type);
  return found ? found.label : type;
}

// Year options for year selector
export function getYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear - 3; y <= currentYear + 1; y++) {
    years.push(y);
  }
  return years;
}
