process.env.JWT_SECRET = 'test-secret-test-secret-test-secret';
process.env.WEB_ORIGIN = 'http://localhost:3000';
process.env.NODE_ENV = 'development';

const jwt = require('jsonwebtoken');
const app = require('./src/app');

const server = app.listen(0, async () => {
  const base = `http://127.0.0.1:${server.address().port}`;
  const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { algorithm: 'HS256' });
  let fail = 0;
  const check = (name, cond, extra) => {
    console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : ` -> ${extra}`}`);
    if (!cond) fail++;
  };

  const req = async (path, opts = {}) => {
    const res = await fetch(base + path, opts);
    const body = await res.json().catch(() => null);
    return { status: res.status, body, headers: res.headers };
  };

  let r = await req('/');
  check('GET / ok', r.status === 200 && r.body.ok === true, JSON.stringify(r.body));
  check('security headers', r.headers.get('x-content-type-options') === 'nosniff' && r.headers.get('x-frame-options') === 'DENY');

  r = await req('/', { headers: { Origin: 'http://localhost:3000' } });
  check('CORS allowed origin', r.headers.get('access-control-allow-origin') === 'http://localhost:3000');
  r = await req('/', { headers: { Origin: 'https://evil.example' } });
  check('CORS blocked origin', r.headers.get('access-control-allow-origin') === null);

  r = await req('/nope');
  check('404 JSON', r.status === 404 && r.body.error === 'Not found', JSON.stringify(r.body));

  r = await req('/orgs/mine');
  check('401 without token', r.status === 401, r.status);
  r = await req('/orgs/mine', { headers: { Authorization: 'Bearer not-a-jwt' } });
  check('401 with bad token', r.status === 401, r.status);

  r = await req('/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bukan-email', password: 'rahasia123' }),
  });
  check('reject invalid email', r.status === 400, JSON.stringify(r.body));

  r = await req('/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'a@b.co', password: 'pendek' }),
  });
  check('reject short password', r.status === 400, JSON.stringify(r.body));

  r = await req('/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"email":',
  });
  check('invalid JSON -> 400', r.status === 400, r.status);

  const authHeader = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  r = await req('/orgs/abc', { method: 'PUT', headers: authHeader, body: JSON.stringify({ theme: {} }) });
  check('PUT non-numeric id -> 404', r.status === 404, r.status);

  r = await req('/orgs/1', {
    method: 'PUT', headers: authHeader,
    body: JSON.stringify({ theme: { primary: 'red;}body{display:none', bg: '#fff', text: '#000', font: 'x', radius: 8, dark: false } }),
  });
  check('reject malicious/invalid theme', r.status === 400, r.status);

  r = await req('/orgs/1', {
    method: 'PUT', headers: authHeader,
    body: JSON.stringify({ sections: [{ id: 'x', type: 'script', visible: true, content: {}, motion: { preset: 'none' } }] }),
  });
  check('reject unknown section type', r.status === 400, r.status);

  r = await req('/orgs/1', {
    method: 'PUT', headers: authHeader,
    body: JSON.stringify({ sections: [{ id: 'x', type: 'hero', visible: true, content: { title: { evil: true } }, motion: { preset: 'none' } }] }),
  });
  check('reject object-as-content (prevents render crash)', r.status === 400, r.status);

  r = await req('/public/BAD_SLUG');
  check('public slug validation -> 404', r.status === 404, r.status);

  r = await req('/orgs/1', { method: 'PUT', headers: authHeader, body: JSON.stringify({}) });
  check('empty update -> 400', r.status === 400, r.status);

  server.close();
  console.log(fail === 0 ? '\nSemua smoke test lulus.' : `\n${fail} test gagal.`);
  process.exit(fail === 0 ? 0 : 1);
});
