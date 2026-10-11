import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { accessFromRequest } from './_lib/access.js';
import { WATERMARK_PATH, WATERMARK_BOX } from './_lib/watermark-paths.js';

const PUBLIC_IDS = new Set([1, 2, 3]);
const MAX_WIDTH = 1600;
const PREVIEW_WIDTH = 32;

// private-images/ is bundled with the function via `included_files` in netlify.toml.
// Its location differs between `netlify dev` (project root) and production (inside
// the function bundle, relative to the base directory), so check the known spots.
const here = path.dirname(fileURLToPath(import.meta.url));
const IMAGE_DIR = [
  path.resolve(process.cwd(), 'private-images'),
  process.env.LAMBDA_TASK_ROOT && path.resolve(process.env.LAMBDA_TASK_ROOT, 'private-images'),
  path.resolve(here, 'private-images'),
  path.resolve(here, '..', 'private-images'),
  path.resolve(here, '..', '..', 'private-images'),
].find((dir) => dir && existsSync(path.join(dir, 'project-1.jpg')));

const BASE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, noimageindex',
  'X-Content-Type-Options': 'nosniff',
};

// Rendered images are deterministic, so keep them for the life of a warm function.
const cache = new Map();

function parseId(raw) {
  // Strict: only the literal strings "1" to "6". No paths, signs, decimals or padding.
  return typeof raw === 'string' && /^[1-6]$/.test(raw) ? Number(raw) : null;
}

function watermarkSvg(width, height) {
  const textWidth = WATERMARK_BOX.x2 - WATERMARK_BOX.x1;
  const capHeight = -WATERMARK_BOX.y1;
  // The text is defined once (centred on 0,0 at font size 100) and reused with <use>.
  const defs = `<path id="wm" d="${WATERMARK_PATH}" transform="translate(${-WATERMARK_BOX.x1 - textWidth / 2} ${capHeight / 2})"/>`;
  const mark = (x, y, fontSize, opacity, shadowOpacity) => {
    const s = fontSize / 100;
    const shadow = Math.max(1, fontSize * 0.045) / s;
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(4)})">` +
      `<use href="#wm" x="${shadow.toFixed(2)}" y="${shadow.toFixed(2)}" fill="#000" fill-opacity="${shadowOpacity}"/>` +
      `<use href="#wm" fill="#fff" fill-opacity="${opacity}"/></g>`;
  };

  // Tiled marks: offset rows of repeated text, rotated -30deg about the centre and
  // laid out over a square as wide as the diagonal, so every corner is covered.
  const fontSize = Math.max(12, Math.round(width * 0.019));
  const stepX = (textWidth * fontSize) / 100 + fontSize * 3.5;
  const stepY = fontSize * 4.5;
  const half = Math.ceil(Math.hypot(width, height) / 2);
  const rowsEachSide = Math.ceil(half / stepY) + 1;
  const colsEachSide = Math.ceil(half / stepX) + 1;
  let tiles = '';
  for (let r = -rowsEachSide; r <= rowsEachSide; r++) {
    if (r === 0) continue; // this row is reserved for the large centred mark
    const offset = r % 2 ? stepX / 2 : 0;
    for (let c = -colsEachSide; c <= colsEachSide; c++) {
      tiles += mark(c * stepX + offset, r * stepY, fontSize, 0.22, 0.14);
    }
  }

  // One larger centred mark, with thin rules either side.
  const bigSize = Math.round(width * 0.04);
  const bigHalf = (textWidth * bigSize) / 200;
  const ruleGap = bigSize * 0.8;
  const ruleLen = Math.max(0, half - bigHalf - ruleGap);
  const rule = (x1, x2) => `<line x1="${x1.toFixed(1)}" y1="0" x2="${x2.toFixed(1)}" y2="0" stroke="#fff" stroke-opacity="0.35" stroke-width="${Math.max(1, bigSize * 0.04).toFixed(1)}"/>`;
  const centre = rule(-bigHalf - ruleGap - ruleLen, -bigHalf - ruleGap) + rule(bigHalf + ruleGap, bigHalf + ruleGap + ruleLen) + mark(0, 0, bigSize, 0.5, 0.22);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>${defs}</defs>
    <g transform="translate(${width / 2} ${height / 2}) rotate(-30)">${tiles}${centre}</g>
  </svg>`;
}

async function renderWatermarked(file) {
  const base = sharp(file).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true });
  const { data, info } = await base.toBuffer({ resolveWithObject: true });
  const overlay = Buffer.from(watermarkSvg(info.width, info.height));
  return sharp(data)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
}

async function renderPreview(file) {
  // A brand-new, tiny file. The page scales it up; there is nothing more to recover.
  return sharp(file)
    .rotate()
    .resize({ width: PREVIEW_WIDTH })
    .blur(1.2)
    .jpeg({ quality: 40 })
    .toBuffer({ resolveWithObject: true });
}

async function render(id, variant) {
  const key = `${id}:${variant}`;
  if (!cache.has(key)) {
    const file = path.join(IMAGE_DIR, `project-${id}.jpg`);
    const job = (variant === 'full' ? renderWatermarked(file) : renderPreview(file)).catch((err) => {
      cache.delete(key);
      throw err;
    });
    cache.set(key, job);
  }
  return cache.get(key);
}

// Size of the watermarked version, so the page can compare without downloading it.
async function fullDimensions(id) {
  const key = `${id}:dims`;
  if (!cache.has(key)) {
    const job = sharp(path.join(IMAGE_DIR, `project-${id}.jpg`)).metadata().then(({ width, height, orientation }) => {
      const [w, h] = orientation >= 5 ? [height, width] : [width, height];
      const outW = Math.min(w, MAX_WIDTH);
      return `${outW}x${Math.round((h * outW) / w)}`;
    });
    cache.set(key, job);
  }
  return cache.get(key);
}

function error(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...BASE_HEADERS, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export default async (req) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return error(405, 'Method not allowed');

  const id = parseId(new URL(req.url).searchParams.get('id'));
  if (id === null) return error(400, 'id must be an integer from 1 to 6');
  if (!IMAGE_DIR) return error(500, 'Image store not found');

  const isPublic = PUBLIC_IDS.has(id);
  const approved = !isPublic && accessFromRequest(req).access === 'approved';
  const variant = isPublic || approved ? 'full' : 'preview';

  try {
    const { data, info } = await render(id, variant);
    const extra = variant === 'preview' ? { 'X-Approved-Dimensions': await fullDimensions(id) } : {};
    return new Response(req.method === 'HEAD' ? null : data, {
      status: 200,
      headers: {
        ...BASE_HEADERS,
        'Content-Type': 'image/jpeg',
        'Content-Length': String(data.length),
        'X-Image-Variant': variant === 'full' ? 'watermarked' : 'server-blurred-preview',
        'X-Image-Dimensions': `${info.width}x${info.height}`,
        Vary: 'Cookie',
        ...extra,
      },
    });
  } catch (err) {
    console.error('image render failed', id, variant, err);
    return error(500, 'Could not render image');
  }
};
