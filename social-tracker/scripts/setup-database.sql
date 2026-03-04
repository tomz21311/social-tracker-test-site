-- ============================================
-- Social Campaign Impact Tracker - Database Setup
-- Run this entire script in the Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → Paste → Run)
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: settings
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  annual_budget INTEGER DEFAULT 0,
  cpm_instagram NUMERIC(10,2) DEFAULT 0.00,
  cpm_facebook NUMERIC(10,2) DEFAULT 0.00,
  cpm_linkedin NUMERIC(10,2) DEFAULT 0.00,
  budget_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings row
INSERT INTO settings (annual_budget, cpm_instagram, cpm_facebook, cpm_linkedin, budget_year)
VALUES (0, 5.00, 5.00, 8.00, EXTRACT(YEAR FROM NOW()));

-- ============================================
-- Table: vendors
-- ============================================
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: content
-- ============================================
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  publish_date DATE NOT NULL,
  platforms TEXT[] DEFAULT '{}',
  content_type TEXT,
  tags TEXT[] DEFAULT '{}',
  url TEXT,
  notes TEXT,
  -- Instagram organic metrics
  organic_impressions_ig INTEGER DEFAULT 0,
  organic_unique_viewers_ig INTEGER DEFAULT 0,
  organic_clicks_ig INTEGER DEFAULT 0,
  engagements_ig INTEGER DEFAULT 0,
  video_views_ig INTEGER DEFAULT 0,
  watch_time_ig INTEGER DEFAULT 0,
  -- Facebook organic metrics
  organic_impressions_fb INTEGER DEFAULT 0,
  organic_unique_viewers_fb INTEGER DEFAULT 0,
  organic_clicks_fb INTEGER DEFAULT 0,
  engagements_fb INTEGER DEFAULT 0,
  video_views_fb INTEGER DEFAULT 0,
  watch_time_fb INTEGER DEFAULT 0,
  -- LinkedIn organic metrics
  organic_impressions_li INTEGER DEFAULT 0,
  organic_unique_viewers_li INTEGER DEFAULT 0,
  organic_clicks_li INTEGER DEFAULT 0,
  engagements_li INTEGER DEFAULT 0,
  video_views_li INTEGER DEFAULT 0,
  watch_time_li INTEGER DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: production_costs
-- ============================================
CREATE TABLE IF NOT EXISTS production_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('vendor', 'internal')),
  vendor_name TEXT,
  cost_type TEXT,
  amount INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: audiences
-- ============================================
CREATE TABLE IF NOT EXISTS audiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  platform TEXT,
  type TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  definition TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: campaigns
-- ============================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_name TEXT NOT NULL,
  platform TEXT,
  objective TEXT,
  content_type TEXT,
  start_date DATE,
  end_date DATE,
  spend INTEGER DEFAULT 0,
  landing_type TEXT,
  landing_url TEXT,
  impressions INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  link_clicks INTEGER DEFAULT 0,
  follows INTEGER DEFAULT 0,
  video_views INTEGER DEFAULT 0,
  watch_time INTEGER DEFAULT 0,
  geo_type TEXT,
  geo_tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Join Table: campaign_content
-- ============================================
CREATE TABLE IF NOT EXISTS campaign_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Join Table: campaign_audiences
-- ============================================
CREATE TABLE IF NOT EXISTS campaign_audiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  audience_id UUID REFERENCES audiences(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_content_publish_date ON content(publish_date);
CREATE INDEX IF NOT EXISTS idx_content_platforms ON content USING GIN(platforms);
CREATE INDEX IF NOT EXISTS idx_campaigns_platform ON campaigns(platform);
CREATE INDEX IF NOT EXISTS idx_campaigns_start_date ON campaigns(start_date);
CREATE INDEX IF NOT EXISTS idx_production_costs_content_id ON production_costs(content_id);
CREATE INDEX IF NOT EXISTS idx_campaign_content_campaign_id ON campaign_content(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_content_content_id ON campaign_content(content_id);
CREATE INDEX IF NOT EXISTS idx_campaign_audiences_campaign_id ON campaign_audiences(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_audiences_audience_id ON campaign_audiences(audience_id);

-- ============================================
-- Updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all main tables
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audiences_updated_at BEFORE UPDATE ON audiences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_costs_updated_at BEFORE UPDATE ON production_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================
-- Enable RLS on all tables
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_audiences ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all operations for authenticated users
-- (single-user app, so any authenticated user has full access)

CREATE POLICY "Authenticated users can do everything" ON settings
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can do everything" ON content
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can do everything" ON production_costs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can do everything" ON vendors
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can do everything" ON campaigns
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can do everything" ON audiences
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can do everything" ON campaign_content
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can do everything" ON campaign_audiences
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- Done! Your database is ready.
-- ============================================
