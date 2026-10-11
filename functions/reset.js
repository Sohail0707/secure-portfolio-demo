import { clearedCookie } from './_lib/access.js';

// Clears the access cookie so the visitor is back to "Public visitor".
export default async () =>
  new Response(null, {
    status: 302,
    headers: {
      Location: '/?status=reset',
      'Set-Cookie': clearedCookie(),
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
