/**
 * Google Sheets reader via REST + service account JWT.
 *
 * No googleapis SDK — we run on Workers, not Node. Just sign a JWT with
 * Web Crypto, exchange for an access token, and call the Sheets API.
 */

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface SheetsValuesResponse {
  range: string;
  majorDimension: string;
  values: string[][];
}

/** Raw row from the Sheet, keyed by column header (first row). */
export type SheetRow = Record<string, string>;

const TOKEN_URI = 'https://oauth2.googleapis.com/token';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';

function base64UrlEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i] as number);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '');
  const raw = atob(b64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}

async function signJwt(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: sa.client_email,
    scope: SCOPE,
    aud: sa.token_uri ?? TOKEN_URI,
    exp: now + 3600,
    iat: now,
  };
  const enc = new TextEncoder();
  const headerB64 = base64UrlEncode(enc.encode(JSON.stringify(header)));
  const claimB64 = base64UrlEncode(enc.encode(JSON.stringify(claim)));
  const signingInput = `${headerB64}.${claimB64}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(signingInput));
  return `${signingInput}.${base64UrlEncode(sig)}`;
}

async function getAccessToken(credsJson: string): Promise<string> {
  const sa = JSON.parse(credsJson) as ServiceAccount;
  const jwt = await signJwt(sa);
  const res = await fetch(sa.token_uri ?? TOKEN_URI, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`google token exchange failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as TokenResponse;
  return data.access_token;
}

/**
 * Read a single range from the Sheet and return rows as objects keyed by the
 * first row (headers). Empty cells become empty strings.
 */
export async function readSheet(
  sheetId: string,
  range: string,
  credsJson: string,
): Promise<SheetRow[]> {
  const token = await getAccessToken(credsJson);
  const url = `${SHEETS_API}/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`sheets read failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as SheetsValuesResponse;
  const values = data.values ?? [];
  if (values.length === 0) return [];
  const headers = (values[0] ?? []).map((h) => h.trim());
  const rows: SheetRow[] = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i] ?? [];
    const obj: SheetRow = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j];
      if (!key) continue;
      obj[key] = (row[j] ?? '').toString().trim();
    }
    rows.push(obj);
  }
  return rows;
}
