export interface Env {
  ENVIRONMENT: string;
  EMBED_MODEL: string;
  ALLOWED_ORIGINS: string;

  ADMIN_SECRET: string;

  DB: D1Database;
  VECTORIZE: VectorizeIndex;
  AI: Ai;
}
