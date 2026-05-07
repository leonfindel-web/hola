import { describe, expect, it } from 'vitest';
import {
  excelRowToPartial,
  indexFlickrByCode,
  indexVimeoByCode,
  merge,
} from '../src/normalize';
import { extractCode as extractVimeo } from '../src/sources/vimeo';
import { extractCode as extractFlickr } from '../src/sources/flickr';
import type { VimeoVideo } from '../src/sources/vimeo';
import type { FlickrPhoto } from '../src/sources/flickr';

describe('vimeo extractCode', () => {
  it('extracts B052 from "B052 — Cliente — Proyecto"', () => {
    expect(extractVimeo('B052 — Cliente X — Proyecto Y')).toBe('B052');
  });
  it('extracts F1234 with 4-digit codes', () => {
    expect(extractVimeo('F1234 Some title')).toBe('F1234');
  });
  it('returns null when no code prefix', () => {
    expect(extractVimeo('My cool reel')).toBeNull();
  });
});

describe('flickr extractCode', () => {
  it('finds code in title', () => {
    const p = { id: '1', title: 'F042 — playa', tags: '' } as unknown as FlickrPhoto;
    expect(extractFlickr(p)).toBe('F042');
  });
  it('falls back to tags', () => {
    const p = { id: '1', title: 'untitled', tags: 'beach F042 sunset' } as unknown as FlickrPhoto;
    expect(extractFlickr(p)).toBe('F042');
  });
  it('returns null when nothing matches', () => {
    const p = { id: '1', title: 'just a photo', tags: 'beach sunset' } as unknown as FlickrPhoto;
    expect(extractFlickr(p)).toBeNull();
  });
});

describe('excelRowToPartial', () => {
  it('returns null without code', () => {
    expect(excelRowToPartial({ Titulo: 'X' })).toBeNull();
  });
  it('parses tags by comma/semicolon', () => {
    const out = excelRowToPartial({ Codigo: 'B001', Tags: 'a, b; c|d' });
    expect(out?.tags).toEqual(['a', 'b', 'c', 'd']);
  });
  it('falls back to code as title', () => {
    const out = excelRowToPartial({ Codigo: 'B001' });
    expect(out?.title).toBe('B001');
  });
});

describe('merge', () => {
  const partial = {
    code: 'B001',
    type: 'video' as const,
    title: 'Reel',
    client: 'Acme',
    project: null,
    location: null,
    year: 2024,
    description: null,
    tags: [],
  };

  it('marks excel-only when no provider data', () => {
    const item = merge(partial, undefined, undefined, 1000);
    expect(item.source).toBe('excel-only');
    expect(item.thumbnail_url).toBeNull();
  });

  it('uses vimeo data when available', () => {
    const v: VimeoVideo = {
      uri: '/videos/12345',
      name: 'B001 something',
      description: 'desc',
      duration: 90,
      width: 1920,
      height: 1080,
      link: 'https://vimeo.com/12345',
      created_time: '2024-01-15T10:00:00Z',
      pictures: { sizes: [{ width: 1280, link: 'https://i/pic.jpg' }] },
      player_embed_url: 'https://player.vimeo.com/video/12345',
    };
    const item = merge(partial, v, undefined, 1000);
    expect(item.source).toBe('vimeo');
    expect(item.source_id).toBe('12345');
    expect(item.thumbnail_url).toBe('https://i/pic.jpg');
    expect(item.embed_url).toBe('https://player.vimeo.com/video/12345');
    expect(item.client).toBe('Acme'); // excel wins
  });
});

describe('indexers', () => {
  it('indexVimeoByCode skips entries without code', () => {
    const vids: VimeoVideo[] = [
      { uri: '/videos/1', name: 'B001 ok', description: '', duration: 0, width: 0, height: 0, link: '', created_time: '' },
      { uri: '/videos/2', name: 'no code here', description: '', duration: 0, width: 0, height: 0, link: '', created_time: '' },
    ];
    const map = indexVimeoByCode(vids);
    expect(map.size).toBe(1);
    expect(map.has('B001')).toBe(true);
  });

  it('indexFlickrByCode same idea', () => {
    const photos = [
      { id: '1', title: 'F010 beach', tags: '', server: '', secret: '', owner: '', farm: 1, ispublic: 1 } as unknown as FlickrPhoto,
      { id: '2', title: 'random', tags: '', server: '', secret: '', owner: '', farm: 1, ispublic: 1 } as unknown as FlickrPhoto,
    ];
    const map = indexFlickrByCode(photos);
    expect(map.size).toBe(1);
    expect(map.has('F010')).toBe(true);
  });
});
