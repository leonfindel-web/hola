-- Leonfindel — D1 schema
-- Source of truth: this file. Apply via:
--   wrangler d1 execute leonfindel --local  --file=data/schema.sql
--   wrangler d1 execute leonfindel --remote --file=data/schema.sql
--
-- For incremental changes prefer numbered files in data/migrations/.

PRAGMA foreign_keys = ON;

-- ──────────────────────────────────────────────────────────────────
-- media: canonical row per item in the Leonfindel catalog
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media (
  code           TEXT PRIMARY KEY,             -- B052, B053, F001, ...
  source         TEXT NOT NULL,                -- 'vimeo' | 'flickr' | 'excel-only'
  source_id      TEXT,                         -- ID en Vimeo/Flickr (NULL si solo Excel)
  source_url     TEXT,                         -- URL pública

  type           TEXT NOT NULL,                -- 'video' | 'photo' | 'document'

  -- Metadata Excel (primaria)
  title          TEXT NOT NULL,
  client         TEXT,
  project        TEXT,
  location       TEXT,
  year           INTEGER,
  description    TEXT,
  tags           TEXT,                         -- JSON array: ["a","b"]

  -- Metadata media provider (secundaria)
  thumbnail_url  TEXT,
  duration_sec   INTEGER,                      -- solo videos
  width          INTEGER,
  height         INTEGER,
  embed_url      TEXT,

  -- Timestamps (epoch seconds)
  created_at     INTEGER,
  indexed_at     INTEGER NOT NULL,

  vector_id      TEXT,                         -- ID en Vectorize

  CHECK (source IN ('vimeo', 'flickr', 'excel-only')),
  CHECK (type IN ('video', 'photo', 'document'))
);

CREATE INDEX IF NOT EXISTS idx_media_source     ON media(source);
CREATE INDEX IF NOT EXISTS idx_media_type       ON media(type);
CREATE INDEX IF NOT EXISTS idx_media_year       ON media(year);
CREATE INDEX IF NOT EXISTS idx_media_client     ON media(client);
CREATE INDEX IF NOT EXISTS idx_media_indexed_at ON media(indexed_at);

-- ──────────────────────────────────────────────────────────────────
-- media_fts: full-text mirror, kept in sync via triggers
-- ──────────────────────────────────────────────────────────────────
CREATE VIRTUAL TABLE IF NOT EXISTS media_fts USING fts5(
  code UNINDEXED,
  title,
  client,
  project,
  location,
  description,
  tags,
  content='media',
  content_rowid='rowid',
  tokenize='unicode61 remove_diacritics 2'
);

CREATE TRIGGER IF NOT EXISTS media_fts_insert AFTER INSERT ON media BEGIN
  INSERT INTO media_fts(rowid, code, title, client, project, location, description, tags)
  VALUES (new.rowid, new.code, new.title, new.client, new.project, new.location, new.description, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS media_fts_delete AFTER DELETE ON media BEGIN
  INSERT INTO media_fts(media_fts, rowid, code, title, client, project, location, description, tags)
  VALUES ('delete', old.rowid, old.code, old.title, old.client, old.project, old.location, old.description, old.tags);
END;

CREATE TRIGGER IF NOT EXISTS media_fts_update AFTER UPDATE ON media BEGIN
  INSERT INTO media_fts(media_fts, rowid, code, title, client, project, location, description, tags)
  VALUES ('delete', old.rowid, old.code, old.title, old.client, old.project, old.location, old.description, old.tags);
  INSERT INTO media_fts(rowid, code, title, client, project, location, description, tags)
  VALUES (new.rowid, new.code, new.title, new.client, new.project, new.location, new.description, new.tags);
END;

-- ──────────────────────────────────────────────────────────────────
-- ingest_runs: audit log for cron + manual reindex runs
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ingest_runs (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at     INTEGER NOT NULL,
  finished_at    INTEGER,
  status         TEXT NOT NULL,                -- 'running' | 'success' | 'error'
  trigger        TEXT NOT NULL,                -- 'cron' | 'admin'
  items_added    INTEGER NOT NULL DEFAULT 0,
  items_updated  INTEGER NOT NULL DEFAULT 0,
  items_failed   INTEGER NOT NULL DEFAULT 0,
  error_message  TEXT,

  CHECK (status IN ('running', 'success', 'error')),
  CHECK (trigger IN ('cron', 'admin'))
);

CREATE INDEX IF NOT EXISTS idx_ingest_runs_started_at ON ingest_runs(started_at DESC);
