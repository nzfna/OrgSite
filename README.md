# OrgSite

Website organisasi dalam hitungan menit: pilih template, ubah tema & animasi, terbitkan.

## Jalankan lokal
1. Neon: buat project, jalankan `api/schema.sql` di SQL editor.
2. `cd api && npm i` — salin `.env.example` ke `.env`, isi `DATABASE_URL`, `JWT_SECRET`, `WEB_ORIGIN` → `npm run dev` (port 4000).
3. `cd web && npm i && cp .env.example .env.local && npm run dev`.
4. Buka `/templates`, `/demo`, `/editor`, atau `/login` untuk mendaftar dan membuat situs.

Tes cepat API (tanpa database): `cd api && npm test`.

## Deploy Vercel
Dua project dari repo yang sama: Root Directory `api` dan `web`.
- Env `api`: `DATABASE_URL`, `JWT_SECRET` (string acak panjang), `WEB_ORIGIN` (URL project web, pisahkan dengan koma bila lebih dari satu).
- Env `web`: `NEXT_PUBLIC_API_URL` = URL project api.

## Tambah template
Buat `web/lib/templates/<nama>.tsx` (map type→komponen), daftarkan di `index.ts`, `TEMPLATE_LIST`, dan insert ke tabel `templates`.

## Catatan keamanan
- `WEB_ORIGIN` wajib diisi di production; CORS hanya mengizinkan origin tersebut.
- `JWT_SECRET` wajib diisi; tanpa itu autentikasi gagal (fail-closed).
- Endpoint `PUT /orgs/:id` memvalidasi template, tema (hex + font allowlist), dan struktur `sections` sebelum disimpan.
- `/auth/*` dibatasi 20 permintaan / 15 menit per IP (rate limit in-memory per instance).
- Token disimpan di `localStorage` (umur 7 hari). Untuk keamanan lebih tinggi, pindahkan ke cookie `httpOnly`.
- `.env*` tidak ikut ter-commit (lihat `.gitignore`).
