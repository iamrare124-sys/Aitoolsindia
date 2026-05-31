-- ═══════════════════════════════════════════════════════════════════
-- AItoolsindia / SyndicateHub — Unified Supabase Schema
-- Supports 10 sites in one Supabase project via site_name column
-- Run once in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── POSTS TABLE ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-site: every row belongs to one site
  site_name        TEXT NOT NULL DEFAULT 'aitoolsindia',

  -- Core content
  slug             TEXT NOT NULL,
  title            TEXT NOT NULL,
  excerpt          TEXT,
  content          JSONB,

  -- Taxonomy
  category         TEXT NOT NULL DEFAULT 'ai-news',
  tags             TEXT[] DEFAULT '{}',

  -- Media
  cover_image      TEXT,
  cover_image_alt  TEXT,

  -- Author
  author_name      TEXT,
  author_title     TEXT,

  -- SEO
  meta_title       TEXT,
  meta_description TEXT,
  schema_json      JSONB,

  -- Extra data
  live_data        JSONB,
  faq              JSONB DEFAULT '[]',

  -- Stats
  reading_time     INT DEFAULT 5,
  word_count       INT DEFAULT 800,
  ai_score         INT DEFAULT 7,
  views            INT DEFAULT 0,

  -- Status
  published        BOOLEAN DEFAULT true,
  tweeted          BOOLEAN DEFAULT false,

  -- Source tracking
  source_url       TEXT,
  source_headline  TEXT,

  -- Timestamps
  published_at     TIMESTAMPTZ DEFAULT now(),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ─── UNIQUE CONSTRAINT ────────────────────────────────────────────
-- Same slug can exist on different sites — unique per (site_name, slug)
CREATE UNIQUE INDEX IF NOT EXISTS posts_site_slug_idx ON posts(site_name, slug);

-- ─── PERFORMANCE INDEXES ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS posts_site_name_idx  ON posts(site_name);
CREATE INDEX IF NOT EXISTS posts_category_idx   ON posts(category);
CREATE INDEX IF NOT EXISTS posts_created_idx    ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS posts_published_idx  ON posts(published);
CREATE INDEX IF NOT EXISTS posts_source_url_idx ON posts(source_url);
CREATE INDEX IF NOT EXISTS posts_views_idx      ON posts(views DESC);

-- Full-text search
CREATE INDEX IF NOT EXISTS posts_fts_idx ON posts
  USING GIN (to_tsvector('english',
    coalesce(title, '') || ' ' || coalesce(excerpt, '')
  ));

-- Tags GIN index
CREATE INDEX IF NOT EXISTS posts_tags_idx ON posts USING GIN (tags);

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON posts;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Public: read published posts only
DROP POLICY IF EXISTS "Public read published" ON posts;
CREATE POLICY "Public read published" ON posts
  FOR SELECT
  USING (published = true);

-- Service role: full access (used by cron/admin)
DROP POLICY IF EXISTS "Service full access" ON posts;
CREATE POLICY "Service full access" ON posts
  FOR ALL
  USING (auth.role() = 'service_role');

-- ─── HELPER VIEWS ─────────────────────────────────────────────────

-- Per-site post counts
CREATE OR REPLACE VIEW site_post_counts AS
  SELECT site_name, COUNT(*) AS total, SUM(views) AS total_views
  FROM posts
  WHERE published = true
  GROUP BY site_name
  ORDER BY total DESC;

-- Trending posts across all sites
CREATE OR REPLACE VIEW global_trending AS
  SELECT id, site_name, slug, title, category, views, created_at
  FROM posts
  WHERE published = true
  ORDER BY views DESC
  LIMIT 50;

-- ─── USEFUL QUERIES (comments only) ──────────────────────────────
-- Check all sites:   SELECT * FROM site_post_counts;
-- Posts for site:    SELECT slug, title FROM posts WHERE site_name = 'aitoolsindia' ORDER BY created_at DESC LIMIT 10;
-- Reset views:       UPDATE posts SET views = 0 WHERE site_name = 'aitoolsindia';
-- Delete all posts:  DELETE FROM posts WHERE site_name = 'aitoolsindia';
-- Count per site:    SELECT site_name, COUNT(*) FROM posts GROUP BY site_name;
