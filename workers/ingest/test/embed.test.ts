import { describe, expect, it } from 'vitest';
import { buildEmbedText } from '../src/embed';
import type { MediaItem } from '@shared/types';

const baseItem: MediaItem = {
  code: 'B001',
  source: 'vimeo',
  source_id: '1',
  source_url: null,
  type: 'video',
  title: 'Spot Acme 2024',
  client: 'Acme',
  project: 'Lanzamiento Q1',
  location: 'Santiago',
  year: 2024,
  description: 'Comercial 30s, dirección Juan Pérez',
  tags: ['comercial', 'auto'],
  thumbnail_url: null,
  duration_sec: 30,
  width: 1920,
  height: 1080,
  embed_url: null,
  created_at: null,
  indexed_at: 0,
  vector_id: null,
};

describe('buildEmbedText', () => {
  it('joins all relevant fields', () => {
    const text = buildEmbedText(baseItem);
    expect(text).toContain('Spot Acme 2024');
    expect(text).toContain('Acme');
    expect(text).toContain('Santiago');
    expect(text).toContain('comercial, auto');
  });

  it('handles missing optional fields', () => {
    const item = { ...baseItem, client: null, location: null, description: null, tags: [] };
    const text = buildEmbedText(item);
    expect(text).toBe('Spot Acme 2024 · Lanzamiento Q1 · 2024');
  });
});
