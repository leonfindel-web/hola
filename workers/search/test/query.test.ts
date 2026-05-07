import { describe, expect, it } from 'vitest';
import { rowToMediaItem } from '../src/query';
import type { MediaRow } from '@shared/types';

const baseRow: MediaRow = {
  code: 'B001',
  source: 'vimeo',
  source_id: '12345',
  source_url: 'https://vimeo.com/12345',
  type: 'video',
  title: 'Reel',
  client: 'Acme',
  project: null,
  location: null,
  year: 2024,
  description: null,
  tags: '["a","b"]',
  thumbnail_url: null,
  duration_sec: 60,
  width: 1920,
  height: 1080,
  embed_url: null,
  created_at: null,
  indexed_at: 1000,
  vector_id: 'B001',
};

describe('rowToMediaItem', () => {
  it('parses tags JSON to array', () => {
    expect(rowToMediaItem(baseRow).tags).toEqual(['a', 'b']);
  });
  it('falls back to [] on bad JSON', () => {
    expect(rowToMediaItem({ ...baseRow, tags: 'not json' }).tags).toEqual([]);
  });
  it('falls back to [] on null', () => {
    expect(rowToMediaItem({ ...baseRow, tags: null }).tags).toEqual([]);
  });
  it('drops non-string entries', () => {
    expect(rowToMediaItem({ ...baseRow, tags: '[1, "ok", null]' }).tags).toEqual(['ok']);
  });
});
