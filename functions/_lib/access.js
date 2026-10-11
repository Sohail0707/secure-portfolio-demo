// Demo magic-link tokens. In a real build these live in a database or a
// Netlify Blobs store and are issued when you approve an access request.
export const TOKENS = {
  'demo-approved-7f3k9q': { name: 'Approved client', active: true },
  'demo-revoked-2m8x4p': { name: 'Revoked client', active: false },
};

export const COOKIE_NAME = 'portfolio_access';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function lookupToken(token) {
  if (typeof token !== 'string' || !Object.hasOwn(TOKENS, token)) return null;
  return TOKENS[token];
}

export function readTokenFromRequest(req) {
  const header = req.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === COOKIE_NAME) return decodeURIComponent(rest.join('='));
  }
  return null;
}

// "approved" | "revoked" | "none"
export function accessFromRequest(req) {
  const entry = lookupToken(readTokenFromRequest(req));
  if (!entry) return { access: 'none', name: 'Public visitor' };
  return entry.active ? { access: 'approved', name: entry.name } : { access: 'revoked', name: entry.name };
}

export function accessCookie(token) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearedCookie() {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}
