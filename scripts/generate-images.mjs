// Generates the six placeholder portfolio originals in /private-images and the
// deliberately public CSS-blur sample in /public/sample-css.jpg.
// Replace the files in /private-images with real work at any time; keep the names.
import sharp from 'sharp';

const W = 2400;
const H = 1600;
const FONT = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

const projects = [
  { id: 1, client: 'Northwind Coffee', kind: 'Brand identity', bg: ['#f4ede4', '#e8d9c5'], ink: '#3b2a1e', accent: '#c26a2e', layout: 'brand', dark: false },
  { id: 2, client: 'Atlas Fitness', kind: 'Mobile app', bg: ['#0f172a', '#1e293b'], ink: '#f8fafc', accent: '#22d3ee', layout: 'mobile', dark: true },
  { id: 3, client: 'Harbor & Pine', kind: 'Website redesign', bg: ['#ecf3ef', '#d4e4da'], ink: '#18342a', accent: '#2f7d5b', layout: 'web', dark: false },
  { id: 4, client: 'Meridian Bank', kind: 'Analytics dashboard', bg: ['#f5f7fb', '#e3e8f3'], ink: '#111a33', accent: '#3355ff', layout: 'dashboard', dark: false },
  { id: 5, client: 'Solace Health', kind: 'Patient portal', bg: ['#fdf2f4', '#f6dde3'], ink: '#3a1420', accent: '#d6456b', layout: 'web', dark: false },
  { id: 6, client: 'Vela Motors', kind: 'Launch campaign', bg: ['#111111', '#2a2320'], ink: '#fafafa', accent: '#ff7a3d', layout: 'brand', dark: true },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const text = (x, y, size, fill, str, weight = 600, extra = '') =>
  `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" ${extra}>${esc(str)}</text>`;
const card = (x, y, w, h, fill, r = 28) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;

function bars(x, y, w, h, color, values) {
  const bw = w / values.length;
  return values
    .map((v, i) => `<rect x="${x + i * bw + bw * 0.18}" y="${y + h - v * h}" width="${bw * 0.64}" height="${v * h}" rx="10" fill="${color}" opacity="${0.55 + 0.45 * v}"/>`)
    .join('');
}

function line(x, y, w, h, color, values) {
  const pts = values.map((v, i) => `${x + (i / (values.length - 1)) * w},${y + h - v * h}`).join(' ');
  return `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>`;
}

function body(p) {
  const { ink, accent } = p;
  const soft = p.dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.75)';
  const muted = p.dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)';

  if (p.layout === 'dashboard') {
    const kpis = [['Assets under mgmt', '$4,812.6M', '+12.4%'], ['Net new clients', '18,204', '+6.1%'], ['Avg. return', '9.37%', '+0.8 pts'], ['Churn', '1.92%', '-0.4 pts']];
    const accounts = ['Halvorsen Group  $412.0M', 'Okafor Holdings  $388.5M', 'Lindqvist & Co  $301.2M', 'Prairie Mutual  $276.9M', 'Tanaka Partners  $244.3M'];
    return [
      card(140, 360, 2120, 1100, '#ffffff'),
      text(220, 470, 44, ink, 'Q3 portfolio performance'),
      text(220, 530, 30, muted, 'Internal. Not for distribution. Figures in USD millions.', 400),
      ...kpis.map(([l, v, d], i) =>
        card(220 + i * 505, 590, 470, 230, '#f2f5ff', 22) +
        text(260 + i * 505, 660, 30, muted, l, 500) +
        text(260 + i * 505, 750, 72, ink, v, 700) +
        text(260 + i * 505, 800, 28, accent, d, 600)),
      card(220, 870, 1250, 520, '#f7f8fc', 22),
      text(260, 930, 32, ink, 'Monthly inflows vs. target'),
      bars(260, 970, 1170, 380, accent, [0.42, 0.55, 0.48, 0.66, 0.71, 0.63, 0.8, 0.86, 0.77, 0.92, 0.88, 0.97]),
      line(260, 970, 1170, 380, '#ff8a3d', [0.5, 0.52, 0.55, 0.58, 0.6, 0.63, 0.66, 0.69, 0.72, 0.75, 0.78, 0.81]),
      card(1510, 870, 670, 520, '#f7f8fc', 22),
      text(1550, 930, 32, ink, 'Top accounts'),
      ...accounts.map((s, i) => text(1550, 1010 + i * 72, 32, ink, s, 500)),
    ].join('');
  }

  if (p.layout === 'mobile') {
    return [0, 1, 2].map((i) => {
      const x = 330 + i * 640;
      const rows = ['Bench press  4 x 8', 'Rows  3 x 10', 'Plank  3 x 60s'];
      return [
        card(x, 330, 520, 1120, '#020617', 70),
        card(x + 22, 352, 476, 1076, '#111c33', 52),
        text(x + 60, 450, 34, muted, ['Today', 'Workout', 'Progress'][i], 500),
        text(x + 60, 520, 56, ink, ['8,421 steps', 'Upper body', '-4.2 kg'][i], 700),
        `<circle cx="${x + 260}" cy="780" r="150" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="34"/>`,
        `<circle cx="${x + 260}" cy="780" r="150" fill="none" stroke="${accent}" stroke-width="34" stroke-dasharray="${[700, 560, 820][i]} 1000" transform="rotate(-90 ${x + 260} 780)" stroke-linecap="round"/>`,
        text(x + 200, 800, 60, ink, ['84%', '62%', '91%'][i], 700),
        ...rows.map((r, j) => card(x + 60, 1010 + j * 130, 400, 100, 'rgba(255,255,255,0.06)', 20) + text(x + 90, 1072 + j * 130, 30, ink, r, 500)),
      ].join('');
    }).join('');
  }

  if (p.layout === 'web') {
    const health = p.id === 5;
    return [
      card(140, 330, 2120, 1130, '#ffffff', 26),
      `<rect x="140" y="330" width="2120" height="70" rx="26" fill="${p.bg[1]}"/>`,
      ...[0, 1, 2].map((i) => `<circle cx="${190 + i * 40}" cy="365" r="11" fill="${muted}"/>`),
      text(240, 520, 34, accent, p.client, 700),
      ...['Home', 'Services', 'About', 'Contact'].map((s, i) => text(1500 + i * 190, 520, 30, ink, s, 500)),
      text(240, 720, 110, ink, health ? 'Care that comes' : 'Built to last.', 700),
      text(240, 850, 110, ink, health ? 'to you.' : 'Made by hand.', 700),
      text(240, 950, 38, muted, health ? 'Book visits, read results, and message your care team in one place.' : 'Timber homes and cabins, designed and built on the Pacific coast.', 400),
      card(240, 1030, 380, 110, accent, 55) + text(300, 1100, 36, '#ffffff', health ? 'Book a visit' : 'View projects', 600),
      card(1380, 600, 760, 760, p.bg[1], 40),
      `<circle cx="1760" cy="900" r="210" fill="${accent}" opacity="0.85"/>`,
      card(1460, 1150, 600, 150, '#ffffff', 26) + text(1500, 1240, 34, ink, health ? 'Dr. Amara Osei  ·  Tue 10:30' : 'Cedar Ridge  ·  Completed 2025', 600),
    ].join('');
  }

  // brand board
  const vela = p.id === 6;
  return [
    card(140, 340, 1060, 1100, soft, 30),
    `<circle cx="670" cy="760" r="260" fill="${accent}"/>`,
    text(vela ? 560 : 545, 815, 150, p.bg[0], vela ? 'V' : 'N', 800),
    text(240, 1200, 90, ink, p.client, 700),
    text(240, 1290, 38, muted, vela ? 'Electric, without compromise.' : 'Roasted slowly. Served warmly.', 400),
    ...[accent, ink, p.bg[1], '#ffffff', '#7a8b6f', '#d9c7a7'].map((c, i) => card(1280 + (i % 3) * 330, 340 + Math.floor(i / 3) * 330, 300, 300, c, 24)),
    card(1280, 1000, 960, 440, soft, 30),
    text(1340, 1110, 40, muted, 'Typography', 500),
    text(1340, 1240, 110, ink, 'Aa Bb Cc 123', 700),
    text(1340, 1340, 34, muted, 'Display / Headline / Body / Caption', 400),
  ].join('');
}

function svgFor(p) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.bg[0]}"/><stop offset="1" stop-color="${p.bg[1]}"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  ${text(140, 200, 40, p.accent, `PROJECT ${String(p.id).padStart(2, '0')}  ·  ${p.kind.toUpperCase()}`, 700, 'letter-spacing="4"')}
  ${text(140, 290, 76, p.ink, p.client, 700)}
  ${body(p)}
</svg>`;
}

for (const p of projects) {
  const file = `private-images/project-${p.id}.jpg`;
  await sharp(Buffer.from(svgFor(p))).jpeg({ quality: 88, mozjpeg: true }).toFile(file);
  console.log('wrote', file);
}

await sharp('private-images/project-6.jpg').resize({ width: 800 }).jpeg({ quality: 82, mozjpeg: true }).toFile('public/sample-css.jpg');
console.log('wrote public/sample-css.jpg');
