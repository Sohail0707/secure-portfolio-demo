import { accessFromRequest } from './_lib/access.js';

export default async (req) =>
  new Response(JSON.stringify(accessFromRequest(req)), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
