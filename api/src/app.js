const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { defaultSections } = require('./defaults');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

// ---------------------------------------------------------------- config
const isProd = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  // Jangan pernah pakai secret kosong/umum. Di dev kita pakai secret acak
  // (token hilang saat restart, tapi tidak bisa dipalsukan).
  console.error('[fatal] JWT_SECRET kosong. Set JWT_SECRET di environment.');
  return crypto.randomBytes(32).toString('hex');
})();
if (isProd && !process.env.JWT_SECRET) console.error('[fatal] Production tanpa JWT_SECRET: semua login akan gagal (fail-closed).');

const ALLOWED_ORIGINS = (process.env.WEB_ORIGIN || '')
  .split(',').map((s) => s.trim().replace(/\/+$/, '')).filter(Boolean);

app.use((q, r, n) => {
  r.setHeader('X-Content-Type-Options', 'nosniff');
  r.setHeader('X-Frame-Options', 'DENY');
  r.setHeader('Referrer-Policy', 'no-referrer');
  r.setHeader('Cache-Control', 'no-store');
  n();
});

// CORS allowlist: jangan pernah `origin: true` (mencerminkan semua origin).
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // curl / server-to-server
    if (!isProd && /^http:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin.replace(/\/+$/, ''))) return cb(null, true);
    return cb(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

app.use(express.json({ limit: '256kb' }));

// ---------------------------------------------------------------- helpers
const wrap = (f) => (q, r, n) => f(q, r, n).catch(n);

const sign = (u) => jwt.sign({ id: u.id }, JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' });

const auth = (q, r, n) => {
  const header = q.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return r.status(401).json({ error: 'Sesi berakhir. Masuk lagi.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    if (!payload || !Number.isInteger(payload.id)) throw new Error('payload tidak valid');
    q.user = payload;
    n();
  } catch {
    r.status(401).json({ error: 'Sesi berakhir. Masuk lagi.' });
  }
};

// Rate limit sederhana (per instance) untuk endpoint auth.
const buckets = new Map();
const rateLimit = ({ windowMs, max }) => (q, r, n) => {
  const now = Date.now();
  if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
  const key = `${q.ip}|${q.path}`;
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return n();
  }
  if (++b.count > max) {
    r.setHeader('Retry-After', String(Math.ceil((b.reset - now) / 1000)));
    return r.status(429).json({ error: 'Terlalu banyak percobaan. Coba lagi nanti.' });
  }
  n();
};
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

const SLUG_RE = /^[a-z0-9-]{3,40}$/;
const RESERVED = ['api', 'editor', 'templates', 'demo', 'login', 'logout', 'admin'];
const SECTION_TYPES = ['hero', 'about', 'faq', 'footer'];
const PRESETS = ['fade-up', 'slide-left', 'zoom', 'none'];
const FONTS = [
  'Inter, system-ui, sans-serif',
  'Georgia, serif',
  'ui-monospace, monospace',
  'system-ui, sans-serif',
];
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

const isPrimitive = (v) =>
  v === null || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v)) ||
  (typeof v === 'string' && v.length <= 5000);

const isFlatObject = (v) =>
  isPlainObject(v) && Object.keys(v).length <= 20 &&
  Object.keys(v).every((k) => k.length <= 60 && isPrimitive(v[k]));

// Content dirender langsung sebagai teks React. Objek di posisi teks akan
// membuat halaman publik crash, jadi hanya izinkan primitive, array primitive,
// atau array objek datar (mis. stats/items).
function isSafeContent(content) {
  if (!isPlainObject(content)) return false;
  const keys = Object.keys(content);
  if (keys.length === 0 || keys.length > 30) return false;
  return keys.every((k) => {
    if (k.length > 60) return false;
    const v = content[k];
    if (isPrimitive(v)) return true;
    if (Array.isArray(v)) return v.length <= 50 && v.every((x) => isPrimitive(x) || isFlatObject(x));
    return false;
  });
}

function cleanTheme(theme) {
  if (!isPlainObject(theme)) return null;
  const { primary, bg, text, font, radius, dark } = theme;
  if (![primary, bg, text].every((c) => typeof c === 'string' && HEX_RE.test(c))) return null;
  if (typeof font !== 'string' || !FONTS.includes(font)) return null;
  if (typeof radius !== 'number' || !Number.isFinite(radius) || radius < 0 || radius > 64) return null;
  if (typeof dark !== 'boolean') return null;
  return { primary, bg, text, font, radius: Math.round(radius), dark };
}

function cleanSections(sections) {
  if (!Array.isArray(sections) || sections.length === 0 || sections.length > 20) return null;
  const out = [];
  const seen = new Set();
  for (const s of sections) {
    if (!isPlainObject(s)) return null;
    const { id, type, variant, visible, content, motion } = s;
    if (typeof id !== 'string' || id.length < 1 || id.length > 60 || seen.has(id)) return null;
    if (!SECTION_TYPES.includes(type)) return null;
    if (typeof visible !== 'boolean') return null;
    if (!isPlainObject(content) || !isSafeContent(content)) return null;
    if (JSON.stringify(content).length > 20000) return null;
    const m = isPlainObject(motion) ? motion : {};
    const preset = m.preset === undefined ? 'fade-up' : m.preset;
    if (!PRESETS.includes(preset)) return null;
    const duration = m.duration === undefined ? 0.6 : m.duration;
    if (typeof duration !== 'number' || !Number.isFinite(duration) || duration < 0 || duration > 5) return null;
    seen.add(id);
    out.push({
      id, type, visible, content,
      ...(typeof variant === 'string' && variant.length <= 40 ? { variant } : {}),
      motion: { preset, duration },
    });
  }
  return out;
}

// ---------------------------------------------------------------- routes
app.get('/', (_, r) => r.json({ ok: true }));

app.post('/auth/register', authLimiter, wrap(async (q, r) => {
  const email = typeof q.body.email === 'string' ? q.body.email.trim().toLowerCase() : '';
  const password = typeof q.body.password === 'string' ? q.body.password : '';
  if (!EMAIL_RE.test(email) || email.length > 254) return r.status(400).json({ error: 'Email tidak valid.' });
  if (password.length < 8 || password.length > 72) return r.status(400).json({ error: 'Password harus 8–72 karakter.' });
  try {
    const { rows: [u] } = await db.query(
      'insert into users(email,password_hash) values($1,$2) returning id',
      [email, await bcrypt.hash(password, 10)],
    );
    r.json({ token: sign(u) });
  } catch (e) {
    if (e.code === '23505') return r.status(409).json({ error: 'Email sudah terdaftar.' });
    throw e;
  }
}));

app.post('/auth/login', authLimiter, wrap(async (q, r) => {
  const email = typeof q.body.email === 'string' ? q.body.email.trim().toLowerCase() : '';
  const password = typeof q.body.password === 'string' ? q.body.password : '';
  if (!email || !password) return r.status(401).json({ error: 'Email atau password salah.' });
  const { rows: [u] } = await db.query('select * from users where email=$1', [email]);
  if (!u || !(await bcrypt.compare(password, u.password_hash))) {
    return r.status(401).json({ error: 'Email atau password salah.' });
  }
  r.json({ token: sign(u) });
}));

app.get('/templates', wrap(async (_, r) => r.json(
  (await db.query('select key,name,default_theme from templates order by name')).rows,
)));

app.post('/orgs', auth, wrap(async (q, r) => {
  const name = typeof q.body.name === 'string' ? q.body.name.trim() : '';
  const slug = typeof q.body.slug === 'string' ? q.body.slug.trim().toLowerCase() : '';
  const template = q.body.template;
  if (name.length < 1 || name.length > 80) return r.status(400).json({ error: 'Nama wajib diisi (maks. 80 karakter).' });
  if (!SLUG_RE.test(slug) || RESERVED.includes(slug)) {
    return r.status(400).json({ error: 'Alamat situs 3–40 karakter (huruf kecil, angka, strip) dan tidak boleh kata terlarang.' });
  }
  const { rows: [t] } = await db.query('select * from templates where key=$1', [template]);
  if (!t) return r.status(400).json({ error: 'Template tidak ditemukan.' });
  try {
    const { rows: [o] } = await db.query(
      'insert into organizations(owner_id,name,slug,template,theme,sections) values($1,$2,$3,$4,$5,$6) returning *',
      [q.user.id, name, slug, t.key, t.default_theme, JSON.stringify(defaultSections(name))],
    );
    r.status(201).json(o);
  } catch (e) {
    if (e.code === '23505') return r.status(409).json({ error: 'Alamat situs sudah dipakai.' });
    throw e;
  }
}));

app.get('/orgs/mine', auth, wrap(async (q, r) => r.json(
  (await db.query('select * from organizations where owner_id=$1 order by id desc', [q.user.id])).rows,
)));

app.put('/orgs/:id', auth, wrap(async (q, r) => {
  if (!/^\d{1,9}$/.test(q.params.id)) return r.status(404).json({ error: 'Situs tidak ditemukan.' });

  const updates = {
    template: undefined, theme: undefined, sections: undefined,
  };

  if (q.body.template !== undefined) {
    if (typeof q.body.template !== 'string') return r.status(400).json({ error: 'Template tidak valid.' });
    const { rows: [t] } = await db.query('select key from templates where key=$1', [q.body.template]);
    if (!t) return r.status(400).json({ error: 'Template tidak ditemukan.' });
    updates.template = t.key;
  }

  if (q.body.theme !== undefined) {
    const theme = cleanTheme(q.body.theme);
    if (!theme) return r.status(400).json({ error: 'Data tema tidak valid.' });
    updates.theme = JSON.stringify(theme);
  }

  if (q.body.sections !== undefined) {
    const sections = cleanSections(q.body.sections);
    if (!sections) return r.status(400).json({ error: 'Data bagian situs tidak valid.' });
    updates.sections = JSON.stringify(sections);
  }

  if (Object.values(updates).every((v) => v === undefined)) {
    return r.status(400).json({ error: 'Tidak ada perubahan.' });
  }

  const { rows: [o] } = await db.query(
    `update organizations
        set template = coalesce($1, template),
            theme    = coalesce($2::jsonb, theme),
            sections = coalesce($3::jsonb, sections),
            updated_at = now()
      where id = $4 and owner_id = $5
      returning *`,
    [updates.template, updates.theme, updates.sections, Number(q.params.id), q.user.id],
  );
  o ? r.json(o) : r.status(404).json({ error: 'Situs tidak ditemukan.' });
}));

app.get('/public/:slug', wrap(async (q, r) => {
  if (!SLUG_RE.test(q.params.slug) || RESERVED.includes(q.params.slug)) {
    return r.status(404).json({ error: 'Not found' });
  }
  const { rows: [o] } = await db.query(
    'select name,slug,template,theme,sections from organizations where slug=$1',
    [q.params.slug],
  );
  if (!o) return r.status(404).json({ error: 'Not found' });
  r.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60');
  r.json(o);
}));

app.use((_, r) => r.status(404).json({ error: 'Not found' }));

app.use((e, _q, r, _n) => {
  if (e.type === 'entity.parse.failed') return r.status(400).json({ error: 'Body JSON tidak valid.' });
  if (e.type === 'entity.too.large') return r.status(413).json({ error: 'Data terlalu besar.' });
  console.error(e);
  r.status(500).json({ error: 'Terjadi kesalahan di server.' });
});

module.exports = app;
