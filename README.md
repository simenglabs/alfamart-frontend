# Alfamart · Retail Workspace

Clone frontend InJourney untuk konsep presentasi Alfamart. SvelteKit + TypeScript; landing, login, dan konsol staff. Proyek sumber dan deployment InJourney tidak diubah.

## Menjalankan

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

## API

Landing dapat dibuka tanpa API. Konsol Alfamart memakai API production InJourney melalui `/api`. Akun, role, serta data tersimpan pada backend InJourney yang sama. Sesi browser memakai key `alfamart-staff-session`.

## Validasi dan build

```sh
npm run check
npm run build
```

Output statis: `build/`. Web server perlu fallback ke `index.html` untuk rute SPA.

Analisis desain, keputusan naskah, dan sumber aset: [DESIGN.md](DESIGN.md).

## Deployment aktif

- URL: https://alfamart.nuratech.id
- Server: `ubuntu@43.134.29.174`
- Folder statis: `/home/ubuntu/alfamart/frontend`
- Host Caddy: `/etc/caddy/Caddyfile`, root domain Alfamart diarahkan ke folder tersebut.
- InJourney tetap menggunakan `/home/ubuntu/injourney/frontend`.
- Backup konfigurasi sebelum pemisahan: `/etc/caddy/Caddyfile.before-alfamart-20261015T0106`.
- Deploy 15 Oktober 2026: landing, video hero, dan route API `/api/*` aktif. API diteruskan ke backend InJourney pada port lokal 8080. Backup web: `/home/ubuntu/alfamart/frontend-before-video-20261015T013749Z.tar.gz`. Backup konfigurasi Caddy sebelum proxy API: `/etc/caddy/Caddyfile.before-alfamart-api-20261015T0138`.

## API saat development lokal

Frontend lokal memakai backend production InJourney melalui proxy Vite: `.env.development.local` menetapkan `VITE_API_URL=/api`, dan `vite.config.ts` meneruskan `/api` ke `https://injourney-api.nuratech.id`; di domain Alfamart, Caddy meneruskan `/api/*` langsung ke backend InJourney. Jalankan `npm run dev -- --host 127.0.0.1 --port 5174 --strictPort`. Akun dan data mengikuti InJourney; aksi simpan memengaruhi data server tersebut. Konfigurasi env development tidak dimasukkan ke build production secara otomatis.
