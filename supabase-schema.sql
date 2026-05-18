-- AItoolsindia Supabase Schema
-- Run this once in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── POSTS TABLE ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  meta_title      TEXT,
  meta_description TEXT,
  excerpt         TEXT,
  content         JSONB,
  faq             JSONB DEFAULT '[]',
  tags            TEXT[] DEFAULT '{}',
  category        TEXT NOT NULL DEFAULT 'ai-news',
  image_url       TEXT,
  image_alt       TEXT,
  reading_time    INTEGER DEFAULT 5,
  source_url      TEXT,
  source_title    TEXT,
  published_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_posts_slug         ON posts (slug);
CREATE INDEX IF NOT EXISTS idx_posts_category     ON posts (category);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_tags         ON posts USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_posts_content      ON posts USING GIN (content);

-- ─── FULL TEXT SEARCH INDEX ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_posts_fts ON posts
  USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, '')));

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────────────────────
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

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Public can read all published posts
CREATE POLICY "Public can read posts"
  ON posts FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "Service role full access"
  ON posts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── HELPFUL VIEWS ───────────────────────────────────────────────────────────

-- Recent posts view (for quick queries)
CREATE OR REPLACE VIEW recent_posts AS
  SELECT
    id, slug, title, excerpt, category, tags, image_url, published_at, reading_time
  FROM posts
  ORDER BY published_at DESC
  LIMIT 30;

-- Category counts view
CREATE OR REPLACE VIEW category_counts AS
  SELECT category, COUNT(*) as post_count
  FROM posts
  GROUP BY category
  ORDER BY post_count DESC;

-- ─── COMMENTS ────────────────────────────────────────────────────────────────
-- To reset the database (careful!):
-- DROP TABLE IF EXISTS posts CASCADE;

-- To check post count:
-- SELECT COUNT(*) FROM posts;

-- To find posts without excerpts:
-- SELECT id, title FROM posts WHERE excerpt IS NULL OR excerpt = '';
