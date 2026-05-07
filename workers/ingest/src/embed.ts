/**
 * Embeddings via Workers AI → upsert a Vectorize.
 *
 * Strategy: build an embedding text per item that joins title + client +
 * project + location + description + tags into a single document. bge-m3 is
 * multilingual (Spanish + English + Portuguese all good).
 */

import type { MediaItem } from '@shared/types';
import { setVectorId } from './db';

const EMBED_BATCH = 16;

interface AiEmbeddingResponse {
  shape: number[];
  data: number[][];
}

export function buildEmbedText(item: MediaItem): string {
  const parts: string[] = [item.title];
  if (item.client) parts.push(item.client);
  if (item.project) parts.push(item.project);
  if (item.location) parts.push(item.location);
  if (item.year !== null) parts.push(String(item.year));
  if (item.description) parts.push(item.description);
  if (item.tags.length > 0) parts.push(item.tags.join(', '));
  return parts.join(' · ');
}

interface EmbedDeps {
  ai: Ai;
  vectorize: VectorizeIndex;
  db: D1Database;
  model: string;
}

export interface EmbedSummary {
  attempted: number;
  succeeded: number;
  failed: number;
}

export async function embedAndStore(
  items: MediaItem[],
  deps: EmbedDeps,
): Promise<EmbedSummary> {
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < items.length; i += EMBED_BATCH) {
    const slice = items.slice(i, i + EMBED_BATCH);
    const texts = slice.map(buildEmbedText);

    let vectors: number[][];
    try {
      const res = (await deps.ai.run(deps.model, { text: texts })) as AiEmbeddingResponse;
      vectors = res.data;
    } catch (e) {
      console.error('[embed] batch failed', { from: i, err: (e as Error).message });
      failed += slice.length;
      continue;
    }

    const vectorizePayload = slice.map((item, idx) => ({
      id: item.code,
      values: vectors[idx] as number[],
      metadata: {
        code: item.code,
        type: item.type,
        client: item.client ?? '',
        year: item.year ?? 0,
      },
    }));

    try {
      await deps.vectorize.upsert(vectorizePayload);
    } catch (e) {
      console.error('[embed] vectorize upsert failed', { err: (e as Error).message });
      failed += slice.length;
      continue;
    }

    // Persist vector_id (== code) back to D1
    for (const item of slice) {
      try {
        await setVectorId(deps.db, item.code, item.code);
        succeeded++;
      } catch (e) {
        console.error('[embed] setVectorId failed', { code: item.code, err: (e as Error).message });
        failed++;
      }
    }
  }

  return { attempted: items.length, succeeded, failed };
}
