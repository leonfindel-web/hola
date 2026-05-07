import type { MediaItem } from '@shared/types';

const SITE = 'https://leonfindel.cl';
const DEFAULT_DESCRIPTION =
  'Leonfindel — productora audiovisual chilena. Archivo de video y fotografía profesional, indexado y buscable.';

export interface MetaInput {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article' | 'video.other';
}

export interface MetaOutput {
  title: string;
  description: string;
  url: string;
  ogType: 'website' | 'article' | 'video.other';
  image: string | null;
}

export function buildMeta(input: MetaInput = {}): MetaOutput {
  const title = input.title ? `${input.title} — Leonfindel` : 'Leonfindel';
  const description = input.description ?? DEFAULT_DESCRIPTION;
  const path = input.path ?? '/';
  const url = `${SITE}${path.startsWith('/') ? path : `/${path}`}`;
  return {
    title,
    description,
    url,
    ogType: input.type ?? 'website',
    image: input.image ?? null,
  };
}

export function structuredDataForItem(item: MediaItem): object {
  if (item.type === 'video') {
    return {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: item.title,
      description: item.description ?? item.title,
      thumbnailUrl: item.thumbnail_url ?? undefined,
      duration: item.duration_sec ? `PT${item.duration_sec}S` : undefined,
      embedUrl: item.embed_url ?? undefined,
      contentUrl: item.source_url ?? undefined,
      uploadDate: item.created_at ? new Date(item.created_at * 1000).toISOString() : undefined,
    };
  }
  if (item.type === 'photo') {
    return {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: item.title,
      description: item.description ?? item.title,
      contentUrl: item.source_url ?? item.thumbnail_url ?? undefined,
      thumbnailUrl: item.thumbnail_url ?? undefined,
      uploadDate: item.created_at ? new Date(item.created_at * 1000).toISOString() : undefined,
    };
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: item.title,
    description: item.description ?? item.title,
    url: item.source_url ?? undefined,
  };
}
