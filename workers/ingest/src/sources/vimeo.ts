/**
 * Vimeo API client.
 *
 * Docs: https://developer.vimeo.com/api/reference/videos
 *
 * Personal access token; scopes "public" + "private" if the channel has
 * unlisted videos. We extract the Leonfindel internal code from the title:
 *   "B052 — Cliente X — Proyecto Y" → "B052"
 */

const API = 'https://api.vimeo.com';
const PER_PAGE = 100;

export interface VimeoVideo {
  uri: string; // "/videos/12345678"
  name: string;
  description: string | null;
  duration: number;
  width: number;
  height: number;
  link: string;
  embed?: { html: string };
  created_time: string;
  pictures?: { sizes?: Array<{ width: number; link: string }> };
  player_embed_url?: string;
}

interface VimeoPage {
  total: number;
  page: number;
  per_page: number;
  paging: { next: string | null; previous: string | null };
  data: VimeoVideo[];
}

/** Default regex: code at the start of the title, e.g. `^B052\s` or `B052 -`. */
const DEFAULT_CODE_RE = /^([A-Z]\d{3,4})\b/;

export function extractCode(title: string, re: RegExp = DEFAULT_CODE_RE): string | null {
  const m = title.match(re);
  return m ? (m[1] as string) : null;
}

export function vimeoIdFromUri(uri: string): string {
  return uri.replace(/^\/videos\//, '');
}

export function bestThumbnail(v: VimeoVideo): string | null {
  const sizes = v.pictures?.sizes;
  if (!sizes || sizes.length === 0) return null;
  return sizes.reduce((best, s) => (s.width > best.width ? s : best), sizes[0]!).link;
}

/** Iterate ALL videos from a Vimeo user, paginating automatically. */
export async function* iterateUserVideos(
  userId: string,
  token: string,
): AsyncGenerator<VimeoVideo, void, void> {
  let path: string | null = `/users/${encodeURIComponent(userId.replace(/^user\//, ''))}/videos?per_page=${PER_PAGE}&fields=uri,name,description,duration,width,height,link,created_time,pictures,player_embed_url`;
  while (path) {
    const res: Response = await fetch(`${API}${path}`, {
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/vnd.vimeo.*+json;version=3.4',
      },
    });
    if (!res.ok) throw new Error(`vimeo api ${path} → ${res.status} ${await res.text()}`);
    const page = (await res.json()) as VimeoPage;
    for (const v of page.data) yield v;
    path = page.paging.next;
  }
}
