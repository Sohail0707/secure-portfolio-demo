import { accessCookie, lookupToken } from './_lib/access.js';

// Magic link: /access?token=XYZ sets the access cookie and sends the visitor home.
export default async (req) => {
  const token = new URL(req.url).searchParams.get('token');
  const entry = lookupToken(token);

  const headers = new Headers({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
  if (!entry) {
    headers.set('Location', '/?status=invalid');
  } else {
    headers.set('Set-Cookie', accessCookie(token));
    headers.set('Location', entry.active ? '/?status=approved' : '/?status=revoked');
  }
  return new Response(null, { status: 302, headers });
};
