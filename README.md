# NodeWave Delivery Web

Next.js 16 App Router dashboard yang mengonsumsi `NEXT_PUBLIC_BE_URL`. Halaman utama:

- `/login` — autentikasi tanpa kredensial atau shortcut akun seed di layar.
- `/dashboard` — project metrics, tenant-specific view, board dependency-aware, editor project/task khusus PM, attachment artifact, dan audit preview.

Client state autentikasi disimpan melalui Zustand. Server tetap menjadi sumber kebenaran untuk izin: UI hanya merender tombol dari field `permissions`, lalu setiap mutation divalidasi ulang oleh API.

Kredensial akun seed Nusa, Aruna, PM, dan tim internal hanya tersedia di `README.md` root serta `DEPLOYMENT.md`. Form login selalu dimulai dalam keadaan kosong.

Jalankan `bun run dev` untuk development atau `bun run build && bun run start` untuk production preview.

## Query API

Frontend mengirim kontrak NodeWave secara langsung: `filters`, `searchFilters`, dan `rangedFilters` diserialisasi dengan `JSON.stringify`, sedangkan pagination memakai `page` + `rows` dan sorting memakai `orderKey` + `orderRule`. Board tidak memakai alias query nonstandar.

## Deployment Vercel

Import private repository frontend melalui dashboard Vercel, lalu isi:

```text
NEXT_PUBLIC_BE_URL=https://DOMAIN-BACKEND/api
```

Setelah frontend memperoleh production URL, salin origin tersebut ke `FRONTEND_URL` pada service backend Railway dan redeploy backend agar CORS menerima frontend production.
