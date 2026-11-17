import Link from 'next/link';

const btn = { background: '#111', color: '#fff', padding: '.8rem 1.4rem', borderRadius: 10, textDecoration: 'none' };

export default function Home() {
  return (<main style={{ padding: '14vh 8vw', maxWidth: 760 }}>
    <nav style={{ display: 'flex', gap: '1.2rem', marginBottom: '3rem', fontSize: '.95rem' }}>
      <Link href="/templates" style={{ color: 'inherit' }}>Template</Link>
      <Link href="/demo" style={{ color: 'inherit' }}>Demo</Link>
      <Link href="/editor" style={{ color: 'inherit' }}>Editor</Link>
      <Link href="/login" style={{ color: 'inherit', marginLeft: 'auto' }}>Masuk</Link>
    </nav>
    <h1 style={{ fontSize: 'clamp(2.2rem,6vw,4rem)', lineHeight: 1.05 }}>Website organisasi kamu, siap dalam sepuluh menit.</h1>
    <p style={{ fontSize: '1.15rem' }}>Pilih template, ubah warna dan animasi, lalu terbitkan.</p>
    <Link href="/templates" style={btn}>Pilih template</Link>
  </main>);
}
