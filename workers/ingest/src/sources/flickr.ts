/**
 * Flickr API client.
 *
 * Docs: https://www.flickr.com/services/api/
 *
 * Strategy: paginate `flickr.people.getPublicPhotos`, then for each photo
 * fetch `flickr.photos.getInfo` if we need tags/description (skipped here
 * for performance; we batch via getInfo only when extracting code from tags
 * fails on the title).
 *
 * Code extraction priority:
 *   1. Title prefix ("F052 - ...")
 *   2. Tag matching code regex (e.g. tag "F052")
 */

const API = 'https://api.flickr.com/services/rest/';
const PER_PAGE = 100;

const DEFAULT_CODE_RE = /\b([A-Z]\d{3,4})\b/;

export interface FlickrPhoto {
  id: string;
  owner: string;
  secret: string;
  server: string;
  farm: number;
  title: string;
  ispublic: 0 | 1;
  // extras
  description?: { _content: string };
  dateupload?: string;
  tags?: string;
  url_o?: string;
  url_l?: string;
  url_z?: string;
  width_l?: string;
  height_l?: string;
}

interface FlickrPhotosResponse {
  photos: {
    page: number;
    pages: number;
    perpage: number;
    total: number;
    photo: FlickrPhoto[];
  };
  stat: 'ok' | 'fail';
  message?: string;
}

export function extractCode(photo: FlickrPhoto, re: RegExp = DEFAULT_CODE_RE): string | null {
  const fromTitle = photo.title.match(re);
  if (fromTitle) return fromTitle[1] as string;
  if (photo.tags) {
    for (const t of photo.tags.split(/\s+/)) {
      const m = t.match(re);
      if (m) return m[1] as string;
    }
  }
  return null;
}

export function staticUrl(p: FlickrPhoto, size: 'z' | 'b' | 'l' = 'l'): string {
  return `https://live.staticflickr.com/${p.server}/${p.id}_${p.secret}_${size}.jpg`;
}

export function pageUrl(p: FlickrPhoto): string {
  return `https://www.flickr.com/photos/${p.owner}/${p.id}`;
}

export async function* iterateUserPhotos(
  userId: string,
  apiKey: string,
): AsyncGenerator<FlickrPhoto, void, void> {
  let page = 1;
  let totalPages = 1;
  do {
    const params = new URLSearchParams({
      method: 'flickr.people.getPublicPhotos',
      api_key: apiKey,
      user_id: userId,
      per_page: String(PER_PAGE),
      page: String(page),
      extras: 'description,date_upload,tags,url_o,url_l,url_z',
      format: 'json',
      nojsoncallback: '1',
    });
    const res = await fetch(`${API}?${params.toString()}`);
    if (!res.ok) throw new Error(`flickr api → ${res.status} ${await res.text()}`);
    const data = (await res.json()) as FlickrPhotosResponse;
    if (data.stat !== 'ok') throw new Error(`flickr api fail: ${data.message ?? 'unknown'}`);
    for (const p of data.photos.photo) yield p;
    totalPages = data.photos.pages;
    page++;
  } while (page <= totalPages);
}
