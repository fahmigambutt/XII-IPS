# Backend dan deployment

Backend adalah proses Node.js dengan SQLite dan berkas lokal. Semua data berjalan tanpa kredensial database eksternal. Untuk petunjuk menjalankan dan membuat admin, gunakan [README](../README.md).

## Pengaturan produksi

1. Jalankan `npm ci`, lalu `npm run build` sebelum memulai backend.
2. Arahkan `DATA_DIR` ke direktori persisten yang dapat ditulis proses Node. Direktori ini berisi `yearbook.sqlite`, berkas WAL SQLite, dan `uploads/`.
3. Buat admin memakai `ADMIN_USERNAME` dan `ADMIN_PASSWORD` melalui `npm run admin:create`, kemudian hapus `ADMIN_PASSWORD` dari lingkungan proses.
4. Jalankan dengan `NODE_ENV=production`. Backend menyajikan `dist/`, `/api`, dan `/uploads` dari origin yang sama.
5. Untuk hosting HTTPS di belakang satu reverse proxy, atur `SECURE_COOKIES=true` dan `TRUST_PROXY=1`. Backend sebaiknya tetap mendengarkan alamat loopback; hanya proxy yang boleh mengaksesnya.

Contoh bagian konfigurasi Nginx saat backend di mesin yang sama:

```nginx
location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $remote_addr;
    client_max_body_size 120m;
}
```

Proxy harus mempertahankan host publik. Server membandingkan host pada header `Origin` dengan `Host` untuk permintaan yang mengubah data. Jika situs publik memakai port nonstandar, teruskan `$http_host` agar port juga dipertahankan. Jangan mengaktifkan `TRUST_PROXY=1` ketika backend dapat menerima koneksi langsung dari internet: alamat pengunjung untuk pembatasan percobaan harus berasal dari proxy tepercaya.

Variabel lingkungan dibaca langsung dari proses. Berkas `.env` tidak dibaca secara otomatis. Hosting statis atau filesystem sementara tidak cukup untuk implementasi ini.

## Batas penyimpanan dan sesi

- Login: maksimal 5 percobaan per alamat IP dalam 15 menit; login berhasil menghapus hitungan percobaan login pada IP tersebut.
- Pesan anonim: maksimal 5 percobaan per IP dalam 10 menit, termasuk permintaan yang gagal validasi. Pesan identik ke penerima yang sama ditolak selama 10 menit.
- Identitas IP tidak disimpan pada pesan. Kunci pembatasan percobaan adalah HMAC IP dengan salt acak yang disimpan di database; kunci ini tidak diekspor ke dashboard atau backup.
- Sesi admin berakhir setelah 8 jam. Logout mencabut sesi tersebut. Mengganti password memakai `--replace` mencabut seluruh sesi akun.
- Unggahan: maksimal 12 MB, satu berkas per permintaan. JPEG, PNG, dan WebP diproses ulang menjadi WebP maksimal 1800 × 1800, tanpa metadata EXIF. MP3, WAV, dan OGG diperiksa penanda formatnya. SVG tidak diterima.
- Ekspor JSON lengkap menyertakan maksimal 80 MB data aset sebelum pengodean base64. Untuk instalasi lebih besar, hentikan server lalu cadangkan seluruh direktori data.
- Restore mengganti konten serta pesan, mempertahankan akun admin dan sesi, dan memeriksa semua aset yang dirujuk. Berkas aset lama yang tidak lagi dirujuk tetap disimpan; bersihkan hanya setelah memiliki backup lengkap.

## Kontrak integrasi

Endpoint publik: `GET /api/content`, `GET /api/messages`, dan `POST /api/messages`. Endpoint pesan hanya mengembalikan pesan yang sudah disetujui; pengiriman baru menghasilkan status `pending`.

Login memakai `POST /api/auth/login` dengan JSON `{username,password}`. Login mengembalikan `{username,csrfToken}` dan memasang cookie sesi `HttpOnly; SameSite=Strict`. Klien memperoleh token sesi lagi melalui `GET /api/auth/session`. Seluruh mutasi admin, termasuk logout, harus mengirim header `x-csrf-token`. Jangan menyimpan password di frontend atau menambahkan CORS permisif.

`GET /api/admin/content` mengembalikan konten. `PUT /api/admin/content` menerima `{content}` dan mengembalikan konten yang sudah disimpan dengan `version` baru. Klien wajib mengganti versi lokalnya dengan respons tersebut. Versi lama ditolak dengan HTTP 409 untuk mencegah penimpaan perubahan dari sesi lain.

Unggahan memakai `POST /api/admin/upload` dengan `FormData` berisi field `file`; respons berisi `{url,bytes,mime}`. URL itu kemudian disimpan ke konten melalui endpoint konten. Upload sendiri belum mengubah buku.

Backup memakai `GET /api/admin/backup`. Restore menerima `POST /api/admin/restore` dengan `{backup}`; backup harus berasal dari format `xii-ips-yearbook/v1`. Kesalahan API berbentuk `{error:"Pesan yang dapat ditampilkan"}`.

Konfigurasi Vite menggunakan objek proxy dengan `changeOrigin:false`. Bentuk singkat proxy berupa string di Vite akan mengubah `Host` dan membuat mutasi browser ditolak server.
