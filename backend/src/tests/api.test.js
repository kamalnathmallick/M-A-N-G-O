process.env.NODE_ENV = 'test';

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import zlib from 'node:zlib';
import mongoose from 'mongoose';

import app from '../server.js';
import { connectDB, getDBStatus } from '../config/db.js';
import { evaluateRules, THRESHOLDS, RECOMMENDATION_RULES } from '../config/recommendationRules.js';

let server;
let baseUrl;
let serverPort;
let dbOnline = false;
let mlOnline = false;

// Unique suffix so repeated runs (with a live MongoDB) never collide on emails
const runId = `${Date.now().toString(36)}-${Math.round(Math.random() * 1e6)}`;

// Users are registered in `before` — they work with OR without MongoDB
// (the backend falls back to an in-memory auth store when Mongo is offline).
let userA;
let userB;
let createdFarmId = null;
let createdHistoryId = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const api = async (path, { method = 'GET', token = null, body = null, headers = {} } = {}) => {
  const finalHeaders = { ...headers };
  if (token) finalHeaders.Authorization = `Bearer ${token}`;
  if (body !== null && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: finalHeaders,
    body: body !== null ? JSON.stringify(body) : undefined
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    // Non-JSON response
  }
  return { status: res.status, json, headers: res.headers };
};

const registerUser = async (label) => {
  const email = `${label}-${runId}@example.com`;
  const r = await api('/auth/register', {
    method: 'POST',
    body: { name: `${label} Tester`, email, password: 'secret123' }
  });
  if (r.status !== 201 || !r.json?.data?.token) {
    throw new Error(`register(${label}) failed: ${r.status} ${JSON.stringify(r.json)}`);
  }
  return { email, token: r.json.data.token, user: r.json.data.user };
};

// --- Deterministic CRC32 + PNG encoder (pure Node, no new dependencies) -----
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const pngChunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
};

/**
 * A real, decodable 128x128 RGB PNG of deterministic mid-brightness noise.
 *
 * The ML service quality-gates every upload (min 100x100, Laplacian blur
 * variance >= 60, mean brightness within 30..245), so an 8-byte fake JPEG
 * header is rejected whenever the ML service is online — which made the
 * upload/history/images tests fail in the DB+ML-online configuration while
 * passing offline. Noise satisfies all three gates; the LCG keeps bytes
 * identical across runs.
 */
const makeTestPng = (size = 128) => {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  let pos = 0;
  let seed = 0x12345678;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  for (let y = 0; y < size; y += 1) {
    raw[pos] = 0; // scanline filter: none
    pos += 1;
    for (let x = 0; x < size; x += 1) {
      raw[pos] = 60 + Math.floor(rand() * 100); // R (mean ~110)
      raw[pos + 1] = 60 + Math.floor(rand() * 100); // G
      raw[pos + 2] = 60 + Math.floor(rand() * 100); // B
      pos += 3;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor RGB
  // [10] compression, [11] filter method, [12] interlace — all 0
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
};

const buildImageForm = ({ fileCount = 2, type = 'image/png', name = 'bud_sample.png', fields = {} } = {}) => {
  const fd = new FormData();
  const png = makeTestPng();
  for (let i = 0; i < fileCount; i += 1) {
    fd.append('images', new Blob([png], { type }), `${i}-${name}`);
  }
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value);
  }
  return fd;
};

const postForm = async (path, formData, token) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${path}`, { method: 'POST', headers, body: formData });
  let json = null;
  try {
    json = await res.json();
  } catch {
    // Non-JSON response
  }
  return { status: res.status, json };
};

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------
test.before(async () => {
  // Attempt a real MongoDB connection so the suite exercises real-DB paths
  // when Mongo is running, and the offline fallbacks when it is not.
  await connectDB();
  dbOnline = getDBStatus().isConnected;

  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      serverPort = server.address().port;
      baseUrl = `http://localhost:${serverPort}/api`;
      resolve();
    });
  });

  const health = await fetch(`${baseUrl}/health`).then((r) => r.json());
  mlOnline = health?.mlService?.online === true;

  userA = await registerUser('usera');
  userB = await registerUser('userb');
});

test.after(async () => {
  await new Promise((resolve) => {
    if (server) server.close(resolve);
    else resolve();
  });
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

// ===========================================================================
// 1. Health, CORS
// ===========================================================================
test('Health check endpoint returns healthy status', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.status, 'healthy');
  assert.equal(json.service, 'MangoSense MEAN Backend');
  assert.ok(json.database);
  assert.ok(json.mlService);
});

const probeCors = (origin) =>
  new Promise((resolve, reject) => {
    const reqHttp = http.request(
      { host: 'localhost', port: serverPort, path: '/api/health', headers: { Origin: origin } },
      (res) => {
        resolve(res.headers['access-control-allow-origin'] ?? null);
        res.resume();
      }
    );
    reqHttp.on('error', reject);
    reqHttp.end();
  });

test('CORS honours allow-list (unknown origin blocked, dev origin allowed)', async () => {
  const allowed = await probeCors('http://localhost:5173');
  assert.equal(allowed, 'http://localhost:5173');

  const blocked = await probeCors('http://evil.example.com');
  assert.equal(blocked, null, 'origin outside the allow-list must not receive CORS access');
});

// ===========================================================================
// 2. Auth (register / login / me / bad password)
// ===========================================================================
test('Auth: register returns token + user without leaking the password', async () => {
  const email = `fresh-${runId}@example.com`;
  const r = await api('/auth/register', {
    method: 'POST',
    body: { name: 'Fresh User', email, password: 'password123' }
  });
  assert.equal(r.status, 201);
  assert.equal(r.json.success, true);
  assert.ok(r.json.data.token);
  assert.equal(r.json.data.user.email, email);
  assert.equal(r.json.data.user.password, undefined);
  assert.ok(r.json.data.user.id);
});

test('Auth: duplicate registration is rejected with 409', async () => {
  const email = `dupe-${runId}@example.com`;
  const first = await api('/auth/register', {
    method: 'POST',
    body: { name: 'Dupe', email, password: 'password123' }
  });
  assert.equal(first.status, 201);
  const second = await api('/auth/register', {
    method: 'POST',
    body: { name: 'Dupe Again', email, password: 'password123' }
  });
  assert.equal(second.status, 409);
  assert.equal(second.json.success, false);
});

test('Auth: register with missing fields / short password returns 400', async () => {
  const missing = await api('/auth/register', { method: 'POST', body: { name: 'No Email' } });
  assert.equal(missing.status, 400);
  assert.equal(missing.json.success, false);

  const shortPw = await api('/auth/register', {
    method: 'POST',
    body: { name: 'Short', email: `short-${runId}@example.com`, password: 'abc' }
  });
  assert.equal(shortPw.status, 400);
  assert.equal(shortPw.json.success, false);
});

test('Auth: login with valid credentials returns a token', async () => {
  const r = await api('/auth/login', {
    method: 'POST',
    body: { email: userA.email, password: 'secret123' }
  });
  assert.equal(r.status, 200);
  assert.equal(r.json.success, true);
  assert.ok(r.json.data.token);
  assert.equal(r.json.data.user.email, userA.email);
});

test('Auth: login with wrong password returns 401', async () => {
  const r = await api('/auth/login', {
    method: 'POST',
    body: { email: userA.email, password: 'definitely-wrong' }
  });
  assert.equal(r.status, 401);
  assert.equal(r.json.success, false);
  assert.ok(!r.json.message || !r.json.message.toLowerCase().includes('stack'));
});

test('Auth: login with unknown email returns 401', async () => {
  const r = await api('/auth/login', {
    method: 'POST',
    body: { email: `nobody-${runId}@example.com`, password: 'password123' }
  });
  assert.equal(r.status, 401);
});

test('Auth: GET /auth/me works with token, rejects without / with garbage', async () => {
  const ok = await api('/auth/me', { token: userA.token });
  assert.equal(ok.status, 200);
  assert.equal(ok.json.data.user.email, userA.email);

  const noToken = await api('/auth/me');
  assert.equal(noToken.status, 401);
  assert.equal(noToken.json.success, false);

  const badToken = await api('/auth/me', { token: 'not-a-real-jwt' });
  assert.equal(badToken.status, 401);
  // Never leak token/JWT internals
  assert.ok(!JSON.stringify(badToken.json).includes('jwt malformed'));
});

// ===========================================================================
// 3. /api/users (new router)
// ===========================================================================
test('Users: GET /users and GET /users/me return the current user, auth required', async () => {
  for (const path of ['/users', '/users/me']) {
    const unauth = await api(path);
    assert.equal(unauth.status, 401, `${path} must require auth`);

    const ok = await api(path, { token: userB.token });
    assert.equal(ok.status, 200);
    assert.equal(ok.json.data.user.email, userB.email);
    assert.equal(ok.json.data.user.password, undefined);
  }
});

// ===========================================================================
// 4. Farms (CRUD + ownership + authorization)
// ===========================================================================
test('Farms: GET /farms requires auth', async () => {
  const r = await api('/farms');
  assert.equal(r.status, 401);
  assert.equal(r.json.success, false);
});

test('Farms: GET /farms returns farms with the contract shape', async () => {
  const r = await api('/farms', { token: userA.token });
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.json.data));
  assert.ok(r.json.data.length > 0, 'expects stored or demo farms');
  const farm = r.json.data[0];
  assert.ok(typeof farm.id === 'string');
  assert.ok(farm.name);
  assert.ok(Array.isArray(farm.plots));
  assert.ok(farm.plots.length > 0);
  // Every listed farm is either owned by this user or clearly marked demo
  for (const f of r.json.data) {
    assert.ok(f.isDemo === true || String(f.userId) === String(userA.user.id), 'farm list must be userId-scoped');
  }
});

test('Farms: GET /farms as second user never sees user A farms', async () => {
  const r = await api('/farms', { token: userB.token });
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.json.data));
  if (createdFarmId && dbOnline) {
    assert.ok(!r.json.data.some((f) => String(f.id) === String(createdFarmId)));
  }
  // Without stored farms, only clearly-marked demo farms are served
  for (const f of r.json.data) {
    if (!dbOnline) assert.equal(f.isDemo, true);
  }
});

test('Farms: demo id resolves with isDemo, unknown id returns 404', async () => {
  const demo = await api('/farms/farm-1', { token: userA.token });
  assert.equal(demo.status, 200);
  assert.equal(demo.json.data.isDemo, true);

  const unknown = await api('/farms/aaaaaaaaaaaaaaaaaaaaaaaa', { token: userA.token });
  assert.equal(unknown.status, 404);
  assert.equal(unknown.json.success, false);
});

test('Farms: POST validation (missing name/location -> 400)', async () => {
  const r = await api('/farms', { method: 'POST', token: userA.token, body: { name: 'No Location Farm' } });
  assert.equal(r.status, 400);
  assert.equal(r.json.success, false);
});

test('Farms: full CRUD for owner (or honest 503 when MongoDB is offline)', async () => {
  const createBody = {
    name: `Owned Farm ${runId}`,
    location: 'Ratnagiri, Maharashtra',
    season: 'Kharif 2026',
    plots: [{ id: 'plot-1', name: 'Plot 1', variety: 'Alphonso', treeCount: 100 }]
  };

  const create = await api('/farms', { method: 'POST', token: userA.token, body: createBody });

  if (!dbOnline) {
    // Writes must fail cleanly — never fake success without a database
    assert.equal(create.status, 503);
    assert.equal(create.json.success, false);
    return;
  }

  assert.equal(create.status, 201);
  assert.equal(create.json.data.name, createBody.name);
  assert.equal(create.json.data.season, 'Kharif 2026');
  assert.equal(create.json.data.isDemo, false);
  createdFarmId = create.json.data.id;

  // --- ownership: user B cannot read/edit/delete user A's farm ---
  const bGet = await api(`/farms/${createdFarmId}`, { token: userB.token });
  assert.equal(bGet.status, 403);
  const bPut = await api(`/farms/${createdFarmId}`, {
    method: 'PUT',
    token: userB.token,
    body: { name: 'Hijacked' }
  });
  assert.equal(bPut.status, 403);
  const bDelete = await api(`/farms/${createdFarmId}`, { method: 'DELETE', token: userB.token });
  assert.equal(bDelete.status, 403);

  // --- owner update, with mass-assignment attempt ---
  const update = await api(`/farms/${createdFarmId}`, {
    method: 'PUT',
    token: userA.token,
    body: {
      name: `Updated Farm ${runId}`,
      isDemo: true, // must be ignored (not whitelisted)
      userId: userB.user.id, // must be ignored (not whitelisted)
      unknownField: 'should vanish'
    }
  });
  assert.equal(update.status, 200);
  assert.equal(update.json.data.name, `Updated Farm ${runId}`);
  assert.equal(update.json.data.isDemo, false, 'isDemo must not be mass-assignable');
  assert.equal(String(update.json.data.userId), String(userA.user.id), 'userId must not be mass-assignable');
  assert.equal(update.json.data.unknownField, undefined);

  // --- updating a non-existent farm is a 404, not a fake success ---
  const missing = await api('/farms/bbbbbbbbbbbbbbbbbbbbbbbb', {
    method: 'PUT',
    token: userA.token,
    body: { name: 'Ghost' }
  });
  assert.equal(missing.status, 404);

  // --- owner delete ---
  const del = await api(`/farms/${createdFarmId}`, { method: 'DELETE', token: userA.token });
  assert.equal(del.status, 200);
  const afterDelete = await api(`/farms/${createdFarmId}`, { token: userA.token });
  assert.equal(afterDelete.status, 404);
  createdFarmId = null;
});

// ===========================================================================
// 5. Weather (protect + demo flags)
// ===========================================================================
test('Weather: endpoints require auth', async () => {
  for (const path of ['/weather/current', '/weather/forecast', '/weather/summary']) {
    const r = await api(path);
    assert.equal(r.status, 401, `${path} must require auth`);
  }
});

test('Weather: current telemetry includes isDemo flag', async () => {
  const r = await api('/weather/current', { token: userA.token });
  assert.equal(r.status, 200);
  assert.ok(r.json.data.temperature !== undefined);
  assert.ok(r.json.data.humidity !== undefined);
  assert.equal(typeof r.json.data.isDemo, 'boolean');
  // WEATHER_PROVIDER defaults to mock in .env.example -> demo flagged honestly
  if (!process.env.WEATHER_PROVIDER || process.env.WEATHER_PROVIDER === 'mock') {
    assert.equal(r.json.data.isDemo, true);
  }
});

test('Weather: 15-day forecast returns 15 entries, each carrying isDemo', async () => {
  const r = await api('/weather/forecast', { token: userA.token });
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.json.data));
  assert.equal(r.json.data.length, 15);
  for (const entry of r.json.data) {
    assert.equal(typeof entry.isDemo, 'boolean', 'every forecast entry must declare isDemo');
  }
  if (!process.env.WEATHER_PROVIDER || process.env.WEATHER_PROVIDER === 'mock') {
    assert.ok(r.json.data.every((e) => e.isDemo === true), 'fallback forecast must be flagged isDemo');
  }
});

test('Weather: summary includes isDemo flag', async () => {
  const r = await api('/weather/summary', { token: userA.token });
  assert.equal(r.status, 200);
  assert.equal(typeof r.json.data.isDemo, 'boolean');
});

// ===========================================================================
// 6. Recommendations (rule-based)
// ===========================================================================
test('Recommendation rules: thresholds exported and evaluateRules works', () => {
  assert.equal(typeof THRESHOLDS.budHealthLow, 'number');
  assert.equal(typeof THRESHOLDS.rainProbHigh, 'number');
  assert.ok(Array.isArray(RECOMMENDATION_RULES));
  assert.ok(RECOMMENDATION_RULES.length >= 5);

  const nutrition = evaluateRules({ budHealth: 50, flowerDropRiskScore: 0, maxRainProb: 0, humidity: 40, pestPressureScore: 0 });
  assert.ok(nutrition.some((r) => r.category === 'NUTRITION'), 'low bud health must trigger the nutrition rule');

  const calm = evaluateRules({ budHealth: 95, flowerDropRiskScore: 0, maxRainProb: 0, humidity: 40, pestPressureScore: 0 });
  assert.ok(calm.some((r) => r.category === 'POLLINATION'));
  assert.ok(!calm.some((r) => r.category === 'WATER'), 'low risk must not trigger irrigation');

  const rainy = evaluateRules({ budHealth: 95, flowerDropRiskScore: 0, maxRainProb: 80, humidity: 40, pestPressureScore: 0 });
  assert.ok(rainy.some((r) => r.id === 'rule-rain-window-pre-rain-protection'));
});

test('Recommendations: GET /recommendations requires auth and returns rule output', async () => {
  const unauth = await api('/recommendations');
  assert.equal(unauth.status, 401);

  const r = await api('/recommendations', { token: userA.token });
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.json.data));
  assert.ok(r.json.data.length >= 3, `expected rule-generated recommendations, got ${r.json.data.length}`);
  const rec = r.json.data[0];
  for (const key of ['id', 'category', 'title', 'priority', 'priorityColor', 'shortText', 'fullExplanation', 'actionRequired', 'timing', 'icon', 'badge', 'organicAlternative']) {
    assert.ok(key in rec, `recommendation missing key: ${key}`);
  }
  assert.equal(typeof rec.isDemo, 'boolean');
});

// ===========================================================================
// 7. Predictions (bud upload, latest, simulate)
// ===========================================================================
test('Predictions: endpoints require auth', async () => {
  const bud = await postForm('/predictions/bud', buildImageForm({ fileCount: 1 }), null);
  assert.equal(bud.status, 401);

  const latest = await api('/predictions/latest');
  assert.equal(latest.status, 401);

  const simulate = await api('/predictions/simulate', {
    method: 'POST',
    body: { budHealth: 78 }
  });
  assert.equal(simulate.status, 401);
});

test('Predictions: POST /predictions/bud with zero files returns 400', async () => {
  const fd = new FormData();
  fd.append('variety', 'Alphonso (Hapus)');
  fd.append('season', 'Kharif 2026');
  const r = await postForm('/predictions/bud', fd, userA.token);
  assert.equal(r.status, 400);
  assert.equal(r.json.success, false);
  assert.equal(r.json.message, 'At least one image is required.');
});

test('Predictions: POST /predictions/bud rejects wrong file type with 400', async () => {
  const fd = buildImageForm({ fileCount: 1, type: 'text/plain', name: 'notes.txt' });
  const r = await postForm('/predictions/bud', fd, userA.token);
  assert.equal(r.status, 400);
  assert.equal(r.json.success, false);
  assert.ok(r.json.message.includes('Invalid image file format'));
});

test('Predictions: POST /predictions/bud rejects more than 10 images with 400', async () => {
  const fd = buildImageForm({ fileCount: 11 });
  const r = await postForm('/predictions/bud', fd, userA.token);
  assert.equal(r.status, 400);
  assert.equal(r.json.success, false);
  assert.ok(r.json.message.includes('max 10'));
});

test('Predictions: valid bud upload returns flattened ML body + transport flags', async () => {
  const fd = buildImageForm({
    fileCount: 3,
    fields: {
      farmId: 'farm-1',
      plotId: 'plot-a',
      variety: 'Alphonso (Hapus)',
      floweringStage: 'Panicle Elongation & Bloom',
      canopyDirection: 'North',
      season: 'Kharif 2026'
    }
  });
  const r = await postForm('/predictions/bud', fd, userA.token);

  assert.equal(r.status, 200);
  const data = r.json.data;

  // Flattened contract §2 body (NOT { data: response.data })
  assert.ok(data.summary, 'response must expose summary at top level');
  assert.ok(Array.isArray(data.images), 'response must expose images at top level');
  assert.equal(data.images.length, 3);
  assert.equal(typeof data.summary.overallHealthScore, 'number');
  assert.equal(typeof data.summary.confidenceScore, 'number');
  assert.ok(data.summary.distribution);

  // Transport / persistence extras (§3)
  assert.equal(typeof data.isDemo, 'boolean');
  assert.equal(typeof data.fromMLService, 'boolean');
  assert.ok(data.predictionId);
  assert.ok(data.modelVersion.budModel);
  assert.ok(data.modelVersion.yieldModel);

  if (!mlOnline) {
    // ML service down -> demo fallback must be flagged and labelled honestly
    assert.equal(data.isDemo, true, 'fallback analysis must be flagged isDemo');
    assert.equal(data.fromMLService, false);
    assert.equal(data.is_demo, true);
    assert.ok(r.json.message.toLowerCase().includes('demo'), 'status message must disclose demo data was used');
    // Binary label set, no fabricated bud counts/boxes (contract §0)
    for (const img of data.images) {
      assert.ok(['Good Yield Potential', 'Poor Yield Potential'].includes(img.classification));
      assert.ok(['healthy', 'poor_yield', 'rejected'].includes(img.status));
      assert.equal(img.detectedBuds, undefined);
      assert.equal(img.boxes, undefined);
    }
  }
});

test('Predictions: GET /predictions/latest returns MOCK_LATEST-shaped data', async () => {
  const r = await api('/predictions/latest?plotId=plot-a', { token: userA.token });
  assert.equal(r.status, 200);
  const data = r.json.data;
  assert.ok(data.expectedYieldMin !== undefined);
  assert.ok(data.expectedYieldMax !== undefined);
  assert.ok(data.expectedYieldAverage !== undefined);
  assert.ok(data.yieldUnit);
  assert.ok(data.budHealth !== undefined || data.factors);
  assert.ok(data.flowerDropRisk !== undefined || data.factors);
  assert.equal(typeof data.isDemo, 'boolean');
});

test('Predictions: simulate returns dynamic flattened yield, validates input', async () => {
  const ok = await api('/predictions/simulate', {
    method: 'POST',
    token: userA.token,
    body: { budHealth: 85, rainfallIntensity: 'Low', variety: 'Alphonso', pestControlActive: true }
  });
  assert.equal(ok.status, 200);
  assert.ok(ok.json.data.expectedYieldAverage > 0);
  assert.ok(ok.json.data.expectedYieldMin !== undefined);
  assert.ok(ok.json.data.dropRisk !== undefined);
  assert.equal(typeof ok.json.data.isDemo, 'boolean');
  if (!mlOnline) assert.equal(ok.json.data.isDemo, true);

  const bad = await api('/predictions/simulate', {
    method: 'POST',
    token: userA.token,
    body: { budHealth: 'not-a-number' }
  });
  assert.equal(bad.status, 400);
  assert.equal(bad.json.success, false);
});

// ===========================================================================
// 8. History (CRUD + auth + contract keys)
// ===========================================================================
test('History: GET /history requires auth', async () => {
  const r = await api('/history');
  assert.equal(r.status, 401);
  assert.equal(r.json.success, false);
});

test('History: GET /history returns records with the contract keys', async () => {
  const r = await api('/history', { token: userA.token });
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.json.data));
  assert.ok(r.json.data.length > 0, 'expects stored or demo records');
  const record = r.json.data[0];
  for (const key of ['id', 'date', 'plot', 'plotDetails', 'budHealth', 'flowerDropRisk', 'climateCondition', 'predictedYield', 'totalTonnes', 'sampleCount', 'keyObservation', 'isDemo']) {
    assert.ok(key in record, `history record missing key: ${key}`);
  }
  if (!dbOnline) {
    assert.ok(r.json.data.every((rec) => rec.isDemo === true), 'demo fallback records must be flagged');
  }
});

test('History: POST validation — invalid input rejected with 400', async () => {
  const noDate = await api('/history', {
    method: 'POST',
    token: userA.token,
    body: { plot: 'Plot A', budHealth: 78 }
  });
  assert.equal(noDate.status, 400);
  assert.equal(noDate.json.success, false);

  const badBudHealth = await api('/history', {
    method: 'POST',
    token: userA.token,
    body: { date: '24 Aug 2026', budHealth: 250 }
  });
  assert.equal(badBudHealth.status, 400);

  const badYield = await api('/history', {
    method: 'POST',
    token: userA.token,
    body: { date: '24 Aug 2026', expectedYieldMin: 'abc' }
  });
  assert.equal(badYield.status, 400);
});

test('History: POST persists for owner (or honest 503 when MongoDB is offline)', async () => {
  const body = {
    date: '24 Aug 2026',
    time: '09:30 AM',
    plot: 'Plot A',
    plotDetails: 'Plot A — 2.5 acres (Alphonso)',
    season: 'Kharif 2026',
    budHealth: 78,
    flowerDropRisk: 'Moderate',
    climateCondition: 'Unknown (live weather unavailable)',
    predictedYield: '4.8 – 5.4 t/acre',
    totalTonnes: '12.0 – 13.5 t',
    sampleCount: 4,
    keyObservation: 'Manual history entry from test suite.',
    classification: 'Good Yield Potential',
    confidence: 88.5,
    imageIds: ['img-1', 'img-2'],
    expectedYieldMin: 4.8,
    expectedYieldMax: 5.4,
    expectedYieldAverage: 5.1
  };
  const r = await api('/history', { method: 'POST', token: userA.token, body });

  if (!dbOnline) {
    assert.equal(r.status, 503, 'history writes must fail cleanly without a database');
    assert.equal(r.json.success, false);
    return;
  }

  assert.equal(r.status, 201);
  assert.equal(r.json.data.season, 'Kharif 2026');
  assert.equal(r.json.data.classification, 'Good Yield Potential');
  assert.equal(r.json.data.confidence, 88.5);
  assert.deepEqual(r.json.data.imageIds, ['img-1', 'img-2']);
  assert.equal(r.json.data.expectedYieldMin, 4.8);
  assert.equal(r.json.data.isDemo, false);
  assert.ok(r.json.data.modelVersion.budModel);
  assert.ok(r.json.data.modelVersion.yieldModel);
  createdHistoryId = r.json.data.id;

  // Ownership: user B cannot read user A's record
  const bGet = await api(`/history/${createdHistoryId}`, { token: userB.token });
  assert.equal(bGet.status, 403);

  const aGet = await api(`/history/${createdHistoryId}`, { token: userA.token });
  assert.equal(aGet.status, 200);
  assert.equal(aGet.json.data.id, createdHistoryId);
});

test('History: demo record id resolves, unknown id returns 404', async () => {
  const demo = await api('/history/hist-1', { token: userA.token });
  assert.equal(demo.status, 200);
  assert.equal(demo.json.data.isDemo, true);

  const unknown = await api('/history/cccccccccccccccccccccccc', { token: userA.token });
  assert.equal(unknown.status, 404);
  assert.equal(unknown.json.success, false);
});

test('History: bud-upload run persisted a flagged history entry (MongoDB only)', async () => {
  if (!dbOnline) return; // writes are impossible without a database

  const r = await api('/history', { token: userA.token });
  assert.equal(r.status, 200);
  const budRecord = r.json.data.find(
    (rec) => rec.season === 'Kharif 2026' && rec.sampleCount === 3 && rec.plot === 'PLOT-A'
  );
  assert.ok(budRecord, 'expected a history record created by the bud upload');
  assert.equal(typeof budRecord.isDemo, 'boolean');
  if (!mlOnline) {
    assert.equal(budRecord.isDemo, true, 'history isDemo must reflect ML service state');
  }
  assert.ok(budRecord.classification);
  assert.equal(budRecord.imageIds.length, 3);
  assert.ok(budRecord.modelVersion.budModel);
  assert.ok(budRecord.modelVersion.yieldModel);
  // No fabricated favourable climate string when live weather is unavailable
  if (budRecord.climate.isLive === false) {
    assert.ok(budRecord.climateCondition.startsWith('Unknown'), 'climate must be unknown without live weather');
  }
});

// ===========================================================================
// 9. Images (new router)
// ===========================================================================
test('Images: GET /images requires auth and returns metadata envelope', async () => {
  const unauth = await api('/images');
  assert.equal(unauth.status, 401);

  const r = await api('/images', { token: userA.token });
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.json.data.images));
  if (dbOnline) {
    // The bud upload earlier in this suite persisted 3 image docs for user A
    assert.ok(r.json.data.images.length >= 3);
    for (const img of r.json.data.images) {
      assert.equal(String(img.userId), String(userA.user.id), 'images must be userId-scoped');
      assert.equal(img.detectedBuds, undefined, 'no fabricated bud counts may be emitted');
    }
  } else {
    assert.equal(r.json.data.images.length, 0, 'offline -> honest empty image list');
  }

  const filtered = await api('/images?farmId=farm-1', { token: userA.token });
  assert.equal(filtered.status, 200);
  assert.ok(Array.isArray(filtered.json.data.images));
});

// ===========================================================================
// 10. Dashboard
// ===========================================================================
test('Dashboard: requires auth and returns consolidated state', async () => {
  const unauth = await api('/dashboard');
  assert.equal(unauth.status, 401);

  const r = await api('/dashboard', { token: userA.token });
  assert.equal(r.status, 200);
  assert.ok(r.json.data.farmSummary);
  assert.ok(r.json.data.weather);
  assert.ok(Array.isArray(r.json.data.forecast));
  assert.ok(Array.isArray(r.json.data.topRecommendations));
  assert.ok(Array.isArray(r.json.data.recentAnalyses));
});

// ===========================================================================
// 11. Error handling hygiene
// ===========================================================================
test('Errors: unknown routes return the standard error envelope without stack traces', async () => {
  const r = await api('/definitely-not-a-route');
  assert.equal(r.status, 404);
  assert.equal(r.json.success, false);
  assert.ok(r.json.message);
  const raw = JSON.stringify(r.json);
  assert.ok(!raw.includes('at Object.'), 'must never leak stack traces');
  assert.ok(!raw.includes('.js:'), 'must never leak file/line details');
});
