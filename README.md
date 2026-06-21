# PocketGo: Track Your Money

MVP personal finance PWA untuk melacak uang, melihat Safe to Spend, memproyeksikan cashflow, dan memantau utang/paylater.

## Menjalankan lokal

```bash
npm install
npm run dev
```

Tanpa environment Supabase, aplikasi berjalan dalam mode lokal dan menyimpan data di `localStorage`. Tidak ada data contoh yang dimasukkan otomatis.

## Supabase

1. Buat project Supabase.
2. Jalankan migration di `supabase/migrations/`.
3. Salin `.env.example` menjadi `.env.local`.
4. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.

Migration menyediakan:

- Seluruh tabel inti PRD.
- RLS untuk setiap tabel milik pengguna.
- Trigger saldo wallet terpusat.
- RPC transfer atomik (`create_transfer`, `update_transfer`, `delete_transaction`).
- Transfer dua baris dengan `transfer_group_id` yang sama.

Saat Supabase terkonfigurasi, aplikasi menggunakan Supabase sebagai source of truth. Route keuangan hanya dapat dibuka setelah session tersedia. `localStorage` hanya digunakan ketika environment Supabase tidak dikonfigurasi.

## Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Tambahkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` sebagai environment variables.
- Tambahkan URL produksi Netlify ke Supabase Authentication → URL Configuration → Redirect URLs.
- `netlify.toml` sudah menyediakan SPA rewrite ke `index.html`.

## Perintah kualitas

```bash
npm run test
npm run lint
npm run build
npm run test:rls
npm run test:cloud
```
