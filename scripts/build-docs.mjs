/**
 * MangoSense documentation artwork generator.
 *
 * Produces the isometric "3D" architecture diagram used as the hero visual of
 * README.md:
 *
 *     node scripts/build-docs.mjs        (or: npm run docs:build)
 *
 * Why generate it instead of hand-editing SVG?
 *   - Isometric projection maths stays exact (every platform is a true
 *     isometric box: top + two visible side faces).
 *   - Layout tweaks are one-line coordinate changes and re-run.
 *   - The asset is reproducible for contributors.
 *
 * Output: docs/assets/architecture-3d.svg
 *
 * Rendering notes (GitHub README):
 *   - CSS keyframe animations DO play inside an <img>-referenced SVG.
 *   - SMIL (<animateMotion>) packets DO animate as well.
 *   - Pointer hover does NOT reach SVGs referenced from a README, so the
 *     "interactive" parts of the README are the <details> panels around it.
 *   - prefers-reduced-motion is honoured (animations disable themselves).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'docs', 'assets');

// ---------------------------------------------------------------------------
// Isometric helpers  (screenX = (x-y)·cos30, screenY = (x+y)/2 - z)
// ---------------------------------------------------------------------------
const C = Math.sqrt(3) / 2;
const iso = (x, y, z) => [(x - y) * C, (x + y) * 0.5 - z];
const n = (v) => (Math.round(v * 10) / 10).toString();
const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const points = (pts) => pts.map(([x, y]) => `${n(x)},${n(y)}`).join(' ');

/**
 * Solve for the iso origin that puts a box's top-face centre at screen (cx, cy).
 * Keeps every platform on a chosen screen position while remaining a true box.
 */
function place(cx, cy, w, d, zTop) {
  const oxMinusOy = cx / C - (w - d) / 2;
  const oxPlusOy = 2 * (cy + zTop) - (w + d) / 2;
  return [(oxPlusOy + oxMinusOy) / 2, (oxPlusOy - oxMinusOy) / 2];
}

/** Isometric box: left face (y=d), right face (x=w), top face. */
function box({ ox, oy, oz, w, d, h, top, left, right, stroke = '#070d1a', so = 0.6 }) {
  const P = (x, y, z) => iso(ox + x, oy + y, oz + z);
  const t00 = P(0, 0, h);
  const t10 = P(w, 0, h);
  const t11 = P(w, d, h);
  const t01 = P(0, d, h);
  const b01 = P(0, d, 0);
  const b10 = P(w, 0, 0);
  const b11 = P(w, d, 0);
  const s = ` stroke="${stroke}" stroke-opacity="${so}" stroke-width="1.4" stroke-linejoin="round"`;
  return (
    `<polygon points="${points([t01, t11, b11, b01])}" fill="${left}"${s}/>` +
    `<polygon points="${points([t10, t11, b11, b10])}" fill="${right}"${s}/>` +
    `<polygon points="${points([t00, t10, t11, t01])}" fill="${top}"${s}/>`
  );
}

const topCentre = (ox, oy, oz, w, d, h) => iso(ox + w / 2, oy + d / 2, oz + h);
// Edge midpoints of a deck's top face:
//   neMid — far/back edge (faces up-right):  where a link LEAVES a deck
//   swMid — near/front edge (faces down-left): where a link ARRIVES at a deck
// Using these (instead of the left/right corners) keeps the line outside both
// decks so the arrowheads stay visible instead of hiding under the geometry.
const neMid = (ox, oy, oz, w, h) => iso(ox + w / 2, oy, oz + h);
const swMid = (ox, oy, oz, w, d, h) => iso(ox + w / 2, oy + d, oz + h);
const frontBottomMid = (ox, oy, oz, w, d) => iso(ox + w / 2, oy + d, oz);

const text = (x, y, str, { size = 16, weight = 600, fill = '#e2e8f0', anchor = 'middle', ls = 0, cls = '' } = {}) =>
  `<text x="${n(x)}" y="${n(y)}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"` +
  `${ls ? ` letter-spacing="${ls}"` : ''}${cls ? ` class="${cls}"` : ''}>${esc(str)}</text>`;

/** Small rounded "chip" label. */
function chip(cx, cy, label, { size = 13, fill = '#e2e8f0', bg = '#0f172a', border = '#334155', pad = 11, h = 24 } = {}) {
  const w = label.length * size * 0.56 + pad * 2;
  return (
    `<rect x="${n(cx - w / 2)}" y="${n(cy - h / 2)}" width="${n(w)}" height="${h}" rx="${h / 2}" ` +
    `fill="${bg}" fill-opacity="0.94" stroke="${border}" stroke-width="1"/>` +
    text(cx, cy + size * 0.36, label, { size, weight: 600, fill })
  );
}

/** Curved screen-space connector with double arrowheads + animated dashes. */
function link(a, b, { color = '#38bdf8', bow = 26, cls = 'flow', markerId = 'arrow' } = {}) {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  // control point lifted perpendicular-ish (upwards) for a gentle arc
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * bow;
  const cy = my + (dx / len) * bow;
  const d = `M ${n(a[0])} ${n(a[1])} Q ${n(cx)} ${n(cy)} ${n(b[0])} ${n(b[1])}`;
  const mid = [
    0.25 * a[0] + 0.5 * cx + 0.25 * b[0],
    0.25 * a[1] + 0.5 * cy + 0.25 * b[1],
  ];
  const rev = `M ${n(b[0])} ${n(b[1])} Q ${n(cx)} ${n(cy)} ${n(a[0])} ${n(a[1])}`;
  return {
    d,
    mid,
    svg:
      `<path d="${d}" fill="none" stroke="${color}" stroke-opacity="0.4" stroke-width="3" ` +
      `marker-start="url(#${markerId})" marker-end="url(#${markerId})"/>` +
      `<path class="${cls}" d="${d}" fill="none" stroke="${color}" stroke-width="3" stroke-opacity="0.95"/>` +
      `<g class="packet"><circle r="11" fill="${color}" opacity="0.16"/><circle r="4.5" fill="#f8fafc"/>` +
      `<animateMotion dur="3.2s" repeatCount="indefinite" path="${d}"/></g>` +
      `<g class="packet"><circle r="9" fill="${color}" opacity="0.12"/><circle r="3.5" fill="#f8fafc"/>` +
      `<animateMotion dur="3.2s" begin="1.6s" repeatCount="indefinite" path="${rev}"/></g>`,
  };
}

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
const PAL = {
  web: { top: '#34d399', left: '#059669', right: '#047857' },
  api: { top: '#38bdf8', left: '#0284c7', right: '#0369a1' },
  ml: { top: '#a78bfa', left: '#7c3aed', right: '#6d28d9' },
  db: { top: '#2dd4bf', body: '#0f766e', edge: '#115e59' },
  amber: { top: '#fcd34d', left: '#f59e0b', right: '#b45309' },
  rose: { top: '#fda4af', left: '#f43f5e', right: '#be123c' },
  sky: { top: '#7dd3fc', left: '#0ea5e9', right: '#0369a1' },
};

// ---------------------------------------------------------------------------
// Scene layout (screen-space centres; place() converts to iso origins)
// ---------------------------------------------------------------------------
const W = 1500;
const H = 1000;

// Staircase layout: WEB bottom-left → API centre → ML top-right.
// place() solves the iso origin so each deck's centre lands exactly here.
const web = { cx: 260, cy: 760, w: 250, d: 180, h: 20 };
const api = { cx: 700, cy: 545, w: 300, d: 210, h: 20 };
const ml = { cx: 1100, cy: 300, w: 560, d: 340, h: 20 };

const zTop = 0; // platform decks sit at z = 0 (labels/packets carry the depth)
const [webOx, webOy] = place(web.cx, web.cy, web.w, web.d, zTop);
const [apiOx, apiOy] = place(api.cx, api.cy, api.w, api.d, zTop);
const [mlOx, mlOy] = place(ml.cx, ml.cy, ml.w, ml.d, zTop);

// Mini modules sitting ON each deck
const webMod = { w: 150, d: 92, h: 26 };
const apiMod = { w: 170, d: 100, h: 26 };

// ML pipeline: three modules in a horizontal chain across the ML deck,
// each one step higher in z — an ascending pipeline.
// Iso offset (k·s, -k·s) shifts purely horizontally on screen by 2·s·cos30.
const stage = { w: 152, d: 96, h: 26 };
const stageStep = 115; // => ~200px screen separation per step
const stageDefs = [
  { k: -1, label: 'image_quality.py', sub: 'blur · lux · size', pal: PAL.amber, z: 0 },
  { k: 0, label: 'predict.py · CNN', sub: 'MobileNetV3 · 2-class', pal: PAL.rose, z: 34 },
  { k: 1, label: 'fusion.py · yield', sub: 'CNN + climate → t/acre', pal: PAL.sky, z: 68 },
];

// ---------------------------------------------------------------------------
// MongoDB cylinder (drawn in screen space, reads as a 3D drum)
// ---------------------------------------------------------------------------
const mongo = { cx: 700, cy: 840, rx: 78, ry: 27, bodyH: 88 };

// Flat cards (screen space)
const datasetCard = { x: 940, y: 720, w: 470, h: 150 };

// ---------------------------------------------------------------------------
// Connectors
// ---------------------------------------------------------------------------
const linkWebApi = link(neMid(webOx, webOy, zTop, web.w, web.h), swMid(apiOx, apiOy, zTop, api.w, api.d, api.h), {
  color: '#38bdf8',
  bow: 30,
});
const linkApiMl = link(neMid(apiOx, apiOy, zTop, api.w, api.h), swMid(mlOx, mlOy, zTop, ml.w, ml.d, ml.h), {
  color: '#a78bfa',
  bow: 30,
  markerId: 'arrowViolet',
});
const apiDbA = frontBottomMid(apiOx, apiOy, zTop, api.w, api.d);
const apiDbB = [mongo.cx, mongo.cy - 4];
const dbPath = `M ${n(apiDbA[0])} ${n(apiDbA[1])} L ${n(apiDbB[0])} ${n(apiDbB[1])}`;

const mlFront = frontBottomMid(mlOx, mlOy, zTop, ml.w, ml.d);
const trainPath = `M ${n(mlFront[0])} ${n(mlFront[1])} Q ${n(mlFront[0] + 40)} ${n(mlFront[1] + 90)} ${n(datasetCard.x + 210)} ${n(datasetCard.y)}`;

// ---------------------------------------------------------------------------
// Assemble
// ---------------------------------------------------------------------------
const parts = [];

// Background -----------------------------------------------------------------
parts.push(
  `<rect width="${W}" height="${H}" rx="26" fill="url(#bg)"/>`,
  `<rect width="${W}" height="${H}" rx="26" fill="url(#glow)"/>`
);

// Isometric floor grid (clipped to a soft ellipse) --------------------------
{
  const lines = [];
  const step = 75;
  for (let i = -14; i <= 20; i += 1) {
    const a = iso(i * step, -16 * step, 0);
    const b = iso(i * step, 22 * step, 0);
    lines.push(`<line x1="${n(a[0])}" y1="${n(a[1])}" x2="${n(b[0])}" y2="${n(b[1])}"/>`);
    const c = iso(-16 * step, i * step, 0);
    const d = iso(22 * step, i * step, 0);
    lines.push(`<line x1="${n(c[0])}" y1="${n(c[1])}" x2="${n(d[0])}" y2="${n(d[1])}"/>`);
  }
  parts.push(
    `<g clip-path="url(#floor)" stroke="#1e3a5f" stroke-width="1" opacity="0.5">${lines.join('')}</g>`
  );
}

// Connectors (drawn under the platforms so nodes sit on top) ---------------
parts.push(linkWebApi.svg, linkApiMl.svg);
parts.push(
  `<path d="${dbPath}" fill="none" stroke="${PAL.db.top}" stroke-opacity="0.45" stroke-width="2.4" ` +
    `marker-start="url(#arrowGreen)" marker-end="url(#arrowGreen)"/>` +
    `<path class="flow" d="${dbPath}" fill="none" stroke="${PAL.db.top}" stroke-width="2.4"/>`
);
parts.push(
  `<path d="${trainPath}" fill="none" stroke="#fbbf24" stroke-opacity="0.5" stroke-width="2.2" stroke-dasharray="7 7"/>` +
    `<path class="flow" d="${trainPath}" fill="none" stroke="#fbbf24" stroke-width="2.2" stroke-opacity="0.9"/>`
);

// Frontend platform ---------------------------------------------------------
parts.push(
  box({ ox: webOx, oy: webOy, oz: zTop, w: web.w, d: web.d, h: web.h, ...PAL.web }),
  box({
    ox: webOx + (web.w - webMod.w) / 2,
    oy: webOy + (web.d - webMod.d) / 2,
    oz: zTop + web.h,
    w: webMod.w,
    d: webMod.d,
    h: webMod.h,
    top: '#ecfdf5',
    left: '#a7f3d0',
    right: '#6ee7b7',
  })
);
{
  const c = topCentre(webOx + (web.w - webMod.w) / 2, webOy + (web.d - webMod.d) / 2, zTop + web.h, webMod.w, webMod.d, webMod.h);
  parts.push(text(c[0], c[1] + 4, 'AuthContext', { size: 14, weight: 700, fill: '#064e3b' }));
  parts.push(text(c[0], c[1] + 21, '+ apiClient', { size: 13, weight: 600, fill: '#047857' }));
}

// Backend platform ----------------------------------------------------------
parts.push(
  box({ ox: apiOx, oy: apiOy, oz: zTop, w: api.w, d: api.d, h: api.h, ...PAL.api }),
  box({
    ox: apiOx + (api.w - apiMod.w) / 2,
    oy: apiOy + (api.d - apiMod.d) / 2,
    oz: zTop + api.h,
    w: apiMod.w,
    d: apiMod.d,
    h: apiMod.h,
    top: '#f0f9ff',
    left: '#bae6fd',
    right: '#7dd3fc',
  })
);
{
  const c = topCentre(apiOx + (api.w - apiMod.w) / 2, apiOy + (api.d - apiMod.d) / 2, zTop + api.h, apiMod.w, apiMod.d, apiMod.h);
  parts.push(text(c[0], c[1] + 4, 'protect · validate', { size: 13, weight: 700, fill: '#0c4a6e' }));
  parts.push(text(c[0], c[1] + 21, 'rule engine', { size: 13, weight: 600, fill: '#0369a1' }));
}

// ML platform + chained pipeline stages -------------------------------------
parts.push(box({ ox: mlOx, oy: mlOy, oz: zTop, w: ml.w, d: ml.d, h: ml.h, ...PAL.ml }));

stageDefs.forEach((s) => {
  const ox = mlOx + (ml.w - stage.w) / 2;
  // k·(+step) in x and −step in y shifts the box purely horizontally on
  // screen (right for k>0); each step also rises in z — an ascending pipeline.
  const oy = mlOy + (ml.d - stage.d) / 2 - s.k * stageStep;
  const oz = zTop + ml.h + s.z;
  parts.push(box({ ox, oy, oz, w: stage.w, d: stage.d, h: stage.h, ...s.pal }));
  const c = topCentre(ox, oy, oz, stage.w, stage.d, stage.h);
  parts.push(text(c[0], c[1] + 2, s.label, { size: 14, weight: 700, fill: '#1e293b' }));
  parts.push(text(c[0], c[1] + 20, s.sub, { size: 13, weight: 600, fill: '#334155' }));
});

// Platform titles — opaque "glass" label cards. Because they carry their own
// background they can never collide unreadably with decks, modules or the
// ascending pipeline stages (which is exactly what happened with bare text).
const titleCard = (cx, cy, color, eyebrow, name, sub) => {
  const w =
    Math.max(name.length * 13.5, sub.length * 9, eyebrow.length * 8 + 20, 200) + 44;
  const h = 104;
  return (
    `<rect x="${n(cx - w / 2)}" y="${n(cy - h / 2)}" width="${n(w)}" height="${h}" rx="16" ` +
    `fill="#0b1526" fill-opacity="0.94" stroke="${color}" stroke-opacity="0.55" stroke-width="1.5"/>` +
    text(cx, cy - 24, eyebrow, { size: 13, weight: 800, fill: color, ls: 2.6 }) +
    text(cx, cy + 8, name, { size: 25, weight: 800, fill: '#f8fafc' }) +
    text(cx, cy + 34, sub, { size: 14, weight: 600, fill: '#94a3b8' })
  );
};

parts.push(titleCard(web.cx, web.cy - 180, '#34d399', 'WEB TIER', 'React 19 SPA', 'Vite · Tailwind v4 · Recharts · :5173'));
parts.push(titleCard(api.cx, api.cy - 180, '#38bdf8', 'API TIER', 'Express REST API', 'JWT · ownership checks · :5000'));
// ML card sits left of centre: the pipeline stages occupy the deck's right half.
parts.push(titleCard(ml.cx - 160, ml.cy - 180, '#a78bfa', 'ML SERVICE', 'FastAPI + PyTorch', 'uvicorn · :8000 · /docs'));

// Top-left caption (fills the negative space and labels the diagram when the
// SVG is viewed on its own, outside the README) ------------------------------
parts.push(
  text(48, 68, 'MANGOSENSE', { size: 13, weight: 800, fill: '#64748b', anchor: 'start', ls: 3.2 }),
  text(48, 100, 'request lifecycle · browser → API → ML → database', { size: 17, weight: 700, fill: '#cbd5e1', anchor: 'start' })
);

// Connector label pills -----------------------------------------------------
parts.push(
  chip(linkWebApi.mid[0], linkWebApi.mid[1], 'multipart + Bearer JWT', { bg: '#082f49', border: '#0c4a6e', fill: '#bae6fd' }),
  chip(linkApiMl.mid[0], linkApiMl.mid[1], 'Axios → /predict/bud', { bg: '#1e1b4b', border: '#4338ca', fill: '#c4b5fd' }),
  chip((apiDbA[0] + apiDbB[0]) / 2 + 96, (apiDbA[1] + apiDbB[1]) / 2, 'Mongoose CRUD', { bg: '#042f2e', border: '#115e59', fill: '#99f6e4' }),
  chip(mlFront[0] + 168, mlFront[1] + 118, 'train.py (offline job)', { bg: '#451a03', border: '#92400e', fill: '#fde68a' })
);

// MongoDB drum --------------------------------------------------------------
{
  const { cx, cy, rx, ry, bodyH } = mongo;
  parts.push(
    `<path d="M ${n(cx - rx)} ${cy} L ${n(cx - rx)} ${n(cy + bodyH)} A ${rx} ${ry} 0 0 0 ${n(cx + rx)} ${n(cy + bodyH)} L ${n(cx + rx)} ${cy} Z" ` +
      `fill="url(#dbBody)" stroke="${PAL.db.edge}" stroke-width="1.4"/>`,
    `<path d="M ${n(cx - rx)} ${n(cy + bodyH * 0.38)} A ${rx} ${ry} 0 0 0 ${n(cx + rx)} ${n(cy + bodyH * 0.38)}" ` +
      `fill="none" stroke="#0b3f3a" stroke-opacity="0.55" stroke-width="1.4"/>`,
    `<path d="M ${n(cx - rx)} ${n(cy + bodyH * 0.72)} A ${rx} ${ry} 0 0 0 ${n(cx + rx)} ${n(cy + bodyH * 0.72)}" ` +
      `fill="none" stroke="#0b3f3a" stroke-opacity="0.55" stroke-width="1.4"/>`,
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${PAL.db.top}" stroke="${PAL.db.edge}" stroke-width="1.4"/>`,
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.62}" ry="${ry * 0.62}" fill="#0d9488" fill-opacity="0.55"/>`,
    text(cx, cy + 5, 'MongoDB', { size: 15, weight: 800, fill: '#022c22' }),
    text(cx, cy + bodyH + 34, 'Mongoose ODM · users · farms · runs · history', { size: 13, weight: 600, fill: '#94a3b8' })
  );
}

// Dataset / training card ---------------------------------------------------
{
  const { x, y, w, h } = datasetCard;
  parts.push(
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="#0b1526" fill-opacity="0.96" stroke="#f59e0b" stroke-opacity="0.5" stroke-width="1.5"/>`,
    text(x + 20, y + 30, 'TRAINING ARTIFACT', { size: 13, weight: 800, fill: '#fbbf24', anchor: 'start', ls: 2 }),
    text(x + 20, y + 58, 'Dataset/  GOOD 10 · BAD 6  →  train.py', { size: 15, weight: 700, fill: '#f8fafc', anchor: 'start' }),
    text(x + 20, y + 84, 'models/mangosense_cnn.pth  (MobileNetV3, frozen backbone)', { size: 14, weight: 600, fill: '#cbd5e1', anchor: 'start' }),
    text(x + 20, y + 110, 'stratified 60/20/20 · seed 42 · test set never trained on', { size: 13, weight: 600, fill: '#94a3b8', anchor: 'start' }),
    chip(x + w - 96, y + 122, '75% test acc*', { bg: '#451a03', border: '#b45309', fill: '#fde68a', size: 13, h: 22 })
  );
}

// Legend --------------------------------------------------------------------
{
  const x = 40;
  const y = 878;
  const items = [
    ['#34d399', 'Web tier'],
    ['#38bdf8', 'API tier'],
    ['#a78bfa', 'ML tier'],
    ['#2dd4bf', 'Storage'],
    ['#fbbf24', 'Training'],
  ];
  parts.push(
    `<rect x="${x}" y="${y}" width="470" height="116" rx="16" fill="#0b1526" fill-opacity="0.92" stroke="#1e293b" stroke-width="1.4"/>`,
    text(x + 16, y + 26, 'LEGEND', { size: 13, weight: 800, fill: '#64748b', anchor: 'start', ls: 2 })
  );
  // one swatch row (5 items fit the 440px inner width)
  items.forEach(([color, label], i) => {
    const px = x + 16 + i * 88;
    const py = y + 54;
    parts.push(
      `<rect x="${px}" y="${py - 11}" width="13" height="13" rx="4" fill="${color}"/>`,
      text(px + 20, py, label, { size: 13, weight: 600, fill: '#cbd5e1', anchor: 'start' })
    );
  });
  parts.push(text(x + 16, y + 82, 'animated dashes = live request path', { size: 13, weight: 600, fill: '#64748b', anchor: 'start' }));
  parts.push(text(x + 16, y + 102, '* 16-image dataset — honest limits in the README', { size: 13, weight: 600, fill: '#64748b', anchor: 'start' }));
}

// ---------------------------------------------------------------------------
// Emit SVG
// ---------------------------------------------------------------------------
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="archTitle archDesc" font-family="ui-sans-serif, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif">
  <title id="archTitle">MangoSense isometric system architecture</title>
  <desc id="archDesc">Animated 3D-style diagram: a React 19 single-page app sends multipart images with a bearer JWT to an Express REST API, which stores documents in MongoDB and forwards images to a FastAPI PyTorch ML service. The ML service runs an OpenCV quality gate, a binary MobileNetV3 CNN and a fusion yield step. A training card shows the offline train.py job that produced mangosense_cnn.pth from a 16-image GOOD/BAD dataset.</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#070c18"/>
      <stop offset="0.55" stop-color="#0a1224"/>
      <stop offset="1" stop-color="#0b1526"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.62" cy="0.28" r="0.75">
      <stop offset="0" stop-color="#10b981" stop-opacity="0.14"/>
      <stop offset="0.45" stop-color="#0ea5e9" stop-opacity="0.07"/>
      <stop offset="1" stop-color="#0b1526" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="dbBody" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0f766e"/>
      <stop offset="0.45" stop-color="#14b8a6"/>
      <stop offset="1" stop-color="#0b5f57"/>
    </linearGradient>
    <clipPath id="floor"><ellipse cx="750" cy="520" rx="730" ry="380"/></clipPath>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#38bdf8"/>
    </marker>
    <marker id="arrowGreen" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#2dd4bf"/>
    </marker>
    <marker id="arrowViolet" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#a78bfa"/>
    </marker>
    <style>
      .flow {
        stroke-dasharray: 12 10;
        animation: flow 1.1s linear infinite;
      }
      @keyframes flow { to { stroke-dashoffset: -22; } }
      .packet { animation: blink 3.2s ease-in-out infinite; }
      @keyframes blink { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
      @media (prefers-reduced-motion: reduce) {
        .flow { animation: none; }
        .packet { animation: none; opacity: 0.9; }
        .packet animateMotion { display: none; }
      }
    </style>
  </defs>
  <g>
    ${parts.join('\n    ')}
  </g>
</svg>
`;

mkdirSync(OUT_DIR, { recursive: true });
const outFile = join(OUT_DIR, 'architecture-3d.svg');
writeFileSync(outFile, svg, 'utf8');
console.log(`wrote ${outFile} (${svg.length} bytes)`);
