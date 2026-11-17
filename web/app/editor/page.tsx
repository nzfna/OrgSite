'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Renderer } from '../../components/Renderer';
import { api, clearSession, getOrgId, getToken } from '../../lib/api';
import { THEMES, TEMPLATE_LIST, sampleOrg } from '../../lib/sample';
import type { Org, Preset } from '../../lib/types';

type OwnedOrg = Org & { id: number };

const FONTS = [['Inter, system-ui, sans-serif', 'Sans'], ['Georgia, serif', 'Serif'], ['ui-monospace, monospace', 'Mono']];
const PRESETS: Preset[] = ['fade-up', 'slide-left', 'zoom', 'none'];

export default function Editor() {
  const router = useRouter();
  const [org, setOrg] = useState<Org>(sampleOrg());
  const [msg, setMsg] = useState('');
  const [signedIn, setSignedIn] = useState(false);

  // Muat situs milik user (kalau sudah masuk) supaya "Simpan" tidak menimpa
  // situs asli dengan data contoh.
  useEffect(() => {
    const t = new URLSearchParams(location.search).get('template');
    if (t) setOrg(sampleOrg(t));
    const token = getToken(), id = getOrgId();
    if (!token) return;
    setSignedIn(true);
    api<OwnedOrg[]>('/orgs/mine', { token })
      .then((orgs) => {
        const mine = id ? orgs.find((o) => String(o.id) === id) : orgs[0];
        if (!mine) return;
        if (!id) localStorage.setItem('orgId', String(mine.id));
        setOrg(mine);
      })
      .catch(() => setMsg('Sesi berakhir. Silakan masuk lagi.'));
  }, []);

  const set = (p: Partial<Org>) => setOrg((o) => ({ ...o, ...p }));
  const theme = (p: Partial<Org['theme']>) => set({ theme: { ...org.theme, ...p } });
  const patch = (i: number, f: (s: Org['sections'][0]) => Org['sections'][0]) => set({ sections: org.sections.map((s, j) => (j === i ? f(s) : s)) });
  const move = (i: number, d: number) => { const a = [...org.sections], j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; set({ sections: a }); };

  async function save() {
    const token = getToken(), id = getOrgId();
    if (!token || !id) return setMsg('Masuk dan buat situs dulu agar bisa disimpan.');
    setMsg('Menyimpan…');
    try {
      const saved = await api<OwnedOrg>(`/orgs/${id}`, {
        method: 'PUT', token,
        body: { template: org.template, theme: org.theme, sections: org.sections },
      });
      setOrg(saved);
      setMsg('Tersimpan.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal menyimpan.');
    }
  }

  function logout() {
    clearSession();
    setSignedIn(false);
    router.push('/login');
  }

  return (<div className="ed">
    <aside>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <b>Editor</b>
        {signedIn
          ? <button onClick={logout}>Keluar</button>
          : <Link href="/login">Masuk</Link>}
      </div>
      <label>Template</label>
      <select value={org.template} onChange={(e) => set({ template: e.target.value, theme: THEMES[e.target.value] ?? org.theme })}>
        {TEMPLATE_LIST.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}</select>
      <div className="box"><b>Tema</b>
        <div className="row"><div><label>Warna utama</label><input type="color" value={org.theme.primary} onChange={(e) => theme({ primary: e.target.value })} /></div>
          <div><label>Latar</label><input type="color" value={org.theme.bg} onChange={(e) => theme({ bg: e.target.value })} /></div>
          <div><label>Teks</label><input type="color" value={org.theme.text} onChange={(e) => theme({ text: e.target.value })} /></div></div>
        <label>Font</label><select value={org.theme.font} onChange={(e) => theme({ font: e.target.value })}>{FONTS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select>
        <label>Sudut membulat: {org.theme.radius}px</label><input type="range" min={0} max={32} value={org.theme.radius} onChange={(e) => theme({ radius: +e.target.value })} />
        <label className="row"><input style={{ width: 'auto' }} type="checkbox" checked={org.theme.dark} onChange={(e) => theme({ dark: e.target.checked })} /> Mode gelap</label>
      </div>
      {org.sections.map((s, i) => (<div className="box" key={s.id}>
        <div className="row"><b style={{ flex: 1 }}>{s.type}</b>
          <button onClick={() => move(i, -1)} aria-label="Naik">↑</button><button onClick={() => move(i, 1)} aria-label="Turun">↓</button>
          <label className="row" style={{ margin: 0 }}><input style={{ width: 'auto' }} type="checkbox" checked={s.visible} onChange={(e) => patch(i, (x) => ({ ...x, visible: e.target.checked }))} />Tampil</label></div>
        {Object.entries(s.content).filter(([, v]) => typeof v === 'string').map(([k, v]) => (
          <div key={k}><label>{k}</label><input value={v as string} onChange={(e) => patch(i, (x) => ({ ...x, content: { ...x.content, [k]: e.target.value } }))} /></div>))}
        <label>Animasi</label>
        <select value={s.motion.preset} onChange={(e) => patch(i, (x) => ({ ...x, motion: { ...x.motion, preset: e.target.value as Preset } }))}>{PRESETS.map((p) => <option key={p}>{p}</option>)}</select>
      </div>))}
      <button className="save" onClick={save}>Simpan</button><p role="status">{msg}</p>
    </aside>
    <main><Renderer key={JSON.stringify(org.sections.map((s) => s.motion)) + org.template} org={org} /></main>
  </div>);
}
