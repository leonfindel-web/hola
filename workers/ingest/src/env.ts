/**
 * Worker INGEST — environment binding.
 *
 * Mirrors wrangler.toml. Keep in sync.
 */

export interface Env {
  // Public vars
  ENVIRONMENT: string;
  VIMEO_USER_ID: string;
  FLICKR_USER_ID: string;
  GOOGLE_SHEET_ID: string;
  EMBED_MODEL: string;

  // Secrets
  VIMEO_TOKEN: string;
  FLICKR_API_KEY: string;
  GOOGLE_SHEETS_CREDS: string; // JSON, single-line
  ADMIN_SECRET: string;

  // Bindings
  DB: D1Database;
  VECTORIZE: VectorizeIndex;
  AI: Ai;
}
