-- Migration 001: initial schema.
-- Apply with:
--   wrangler d1 execute leonfindel --local  --file=data/migrations/001_init.sql
--   wrangler d1 execute leonfindel --remote --file=data/migrations/001_init.sql
--
-- Mirrors data/schema.sql at this point in history. Future migrations are
-- diffs against the previous one — never edit a migration after it has been
-- applied to a remote database.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS media (
  code           TEXT PRIMARY KEY,
  source         TEXT NOT NULL,
  source_id      TEXT,
  source_url     TEXT,
  type           TEXT NOT NULL,
  title          TEXT NOT NULL,
  client         TEXT,
  project        TEXT,
  location       TEXT,
  year           INTEGER,
  description    TEXT,
  tags           TEXT,
  thumbnail_url  TEXT,
  duration_sec   INTEGER,
  width          INTEGER,
  height         INTEGER,
  embed_url      TEXT,
  created_at     INTEGER,
  indexed_at     INTEGER NOT NULL,
  vector_id      TEXT,
  CHECK (source IN ('vimeo', 'flickr', 'excel-only')),
  CHECK (type IN ('video', 'photo', 'document'))
);

CREATE INDEX IF NOT EXISTS idx_media_source     ON media(source);
CREATE INDEX IF NOT EXISTS idx_media_type       ON media(type);
CREATE INDEX IF NOT EXISTS idx_media_year       ON media(year);
CREATE INDEX IF NOT EXISTS idx_media_client     ON media(client);
CREATE INDEX IF NOT EXISTS idx_media_indexed_at ON media(indexed_at);

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

CREATE TABLE IF NOT EXISTS ingest_runs (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at     INTEGER NOT NULL,
  finished_at    INTEGER,
  status         TEXT NOT NULL,
  trigger        TEXT NOT NULL,
  items_added    INTEGER NOT NULL DEFAULT 0,
  items_updated  INTEGER NOT NULL DEFAULT 0,
  items_failed   INTEGER NOT NULL DEFAULT 0,
  error_message  TEXT,
  CHECK (status IN ('running', 'success', 'error')),
  CHECK (trigger IN ('cron', 'admin'))
);

CREATE INDEX IF NOT EXISTS idx_ingest_runs_started_at ON ingest_runs(started_at DESC);
