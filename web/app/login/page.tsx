'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '../../lib/api';
import { TEMPLATE_LIST } from '../../lib/sample';

type Org = { id: number; name: string; slug: string };

const slugify = (v: string) =>
  v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'auth' | 'create'>('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [template, setTemplate] = useState(TEMPLATE_LIST[0].key);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function openEditor(token: string, orgs: Org[]) {
    if (orgs.length === 0) return setStep('create');
    localStorage.setItem('orgId', String(orgs[0].id));
    router.push('/editor');
  }

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api<Org[]>('/orgs/mine', { token }).then((orgs) => openEditor(token, orgs)).catch(() => {
      /* token kedaluwarsa: tetap di form masuk */
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitAuth(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      const { token } = await api<{ token: string }>(`/auth/${mode}`, {
        method: 'POST',
        body: { email, password },
      });
      localStorage.setItem('token', token);
      const orgs = await api<Org[]>('/orgs/mine', { token });
      await openEditor(token, orgs);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal masuk.');
    } finally {
      setBusy(false);
    }
  }

  async function submitOrg(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      const org = await api<Org>('/orgs', {
        method: 'POST',
        token: getToken() || undefined,
        body: { name, slug, template },
      });
      localStorage.setItem('orgId', String(org.id));
      router.push('/editor');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal membuat situs.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: '10vh 6vw', maxWidth: 460, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '.25rem' }}>
        {step === 'auth' ? (mode === 'login' ? 'Masuk' : 'Buat akun') : 'Buat situs'}
      </h1>
      <p style={{ color: '#555', marginTop: 0 }}>
        {step === 'auth' ? 'Masuk untuk menyimpan dan menerbitkan situs organisasi.' : 'Tentukan nama dan alamat situs kamu.'}
      </p>

      {step === 'auth' ? (
        <form onSubmit={submitAuth} style={{ display: 'grid', gap: '.7rem' }}>
          <label>Email</label>
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '.6rem' }} />
          <label>Password</label>
          <input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={8} maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '.6rem' }} />
          <button disabled={busy} style={{ padding: '.7rem', background: '#111', color: '#fff', border: 0, borderRadius: 8, cursor: 'pointer' }}>
            {busy ? 'Memproses…' : mode === 'login' ? 'Masuk' : 'Daftar'}
          </button>
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMsg(''); }}
            style={{ background: 'none', border: 0, color: '#1d4ed8', cursor: 'pointer', padding: '.3rem' }}>
            {mode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
          </button>
        </form>
      ) : (
        <form onSubmit={submitOrg} style={{ display: 'grid', gap: '.7rem' }}>
          <label>Nama organisasi</label>
          <input required maxLength={80} value={name}
            onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)); }}
            style={{ padding: '.6rem' }} />
          <label>Alamat situs</label>
          <input required pattern="[a-z0-9-]{3,40}" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} style={{ padding: '.6rem' }} />
          <small style={{ color: '#555' }}>Situs akan tersedia di /{slug || 'alamat-situs'} — huruf kecil, angka, dan strip.</small>
          <label>Template</label>
          <select value={template} onChange={(e) => setTemplate(e.target.value)} style={{ padding: '.6rem' }}>
            {TEMPLATE_LIST.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
          </select>
          <button disabled={busy} style={{ padding: '.7rem', background: '#111', color: '#fff', border: 0, borderRadius: 8, cursor: 'pointer' }}>
            {busy ? 'Membuat…' : 'Buat situs'}
          </button>
        </form>
      )}

      <p role="status" aria-live="polite" style={{ color: '#b91c1c' }}>{msg}</p>
    </main>
  );
}
