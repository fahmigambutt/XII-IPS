# XII IPS Memories

Yearbook hardcover 3D untuk XII IPS angkatan **2025/2026/2027**, dibangun berdasarkan [brief asli](docs/PROMPTWEB.md) dan revisi pengguna terbaru. Buku memakai **cover kain merah vintage, kertas tua, dan latar meja kayu**. Pengalaman membaca berlangsung di dalam buku 3D: tidak ada mode baca HTML, panel **IN THIS BOOK**, tombol lewati intro, atau tautan untuk melompat bab.

Frontend memakai Vite, JavaScript ES Modules, Three.js, dan GSAP. Backend memakai Express, SQLite lokal, dan penyimpanan berkas di disk; tidak memerlukan layanan database berbayar.

## Menjalankan di Windows

Pasang Node.js 22.13 atau lebih baru; Node.js 24/26 disarankan untuk SQLite bawaan. Buka PowerShell di folder proyek:

```powershell
npm install
npm run dev
```

Buka **http://127.0.0.1:5173**. Peluncur memberi backend port kosong secara otomatis dan menampilkan alamatnya di terminal; Vite meneruskan `/api` dan `/uploads` ke alamat tersebut. Tutup dengan `Ctrl+C`. Port frontend 5173 harus tersedia. Aplikasi lain pada port 3001 dapat tetap berjalan.

Tersedia juga peluncur PowerShell: `./MULAI-WEBSITE.ps1`. Jika tab browser masih memperlihatkan desain lama, tekan **Ctrl+F5** setelah server siap. Untuk produksi, bangun ulang dengan `npm run build` sebelum memulai server hasil revisi.

Database dan aset dibuat otomatis di `data/`. Jangan hapus direktori ini jika ingin mempertahankan perubahan dan pesan. Folder `data/`, `node_modules/`, `.env`, serta hasil build tidak dimasukkan ke Git.

## Akun admin dan penggantian ID/password

Akun disimpan di database lokal `data/`, yang tidak diunggah ke GitHub. Setelah clone, buat akun melalui `./BUAT-ADMIN.ps1` atau langkah CLI di bawah. Akun yang sudah ada pada komputer asal tetap tersimpan di komputer tersebut.

Tombol **ADMIN** berada di kiri bawah ketika buku tertutup. Masuk dengan akun yang dibuat, lalu buka **Pengaturan → Ganti ID dan password** untuk mengubahnya. Masukkan password saat ini, ID baru, password baru, dan pengulangan password. Password pengganti harus **12–256 karakter**. Setelah tersimpan, sesi browser lain diakhiri; browser yang sedang dipakai menerima sesi baru.

Akun tersimpan sebagai hash **scrypt** pada server. Kredensial akun tidak ditanam di JavaScript frontend. Dashboard dan seluruh API pengelolaan tetap memeriksa autentikasi server walaupun URL dibuka langsung. Akun/password tidak termasuk backup konten.

Untuk membuat akun tambahan dari komputer server, tersedia `./BUAT-ADMIN.ps1` atau perintah manual berikut. Pembuatan akun normal juga mensyaratkan password minimal 12 karakter dan meminta password secara tersembunyi:

```powershell
$env:ADMIN_USERNAME = 'pengelola'
$yearbookPassword = Read-Host 'Password admin (minimal 12 karakter)' -AsSecureString
$yearbookCredential = [System.Net.NetworkCredential]::new('', $yearbookPassword)
$env:ADMIN_PASSWORD = $yearbookCredential.Password
npm run admin:create
Remove-Item Env:ADMIN_PASSWORD
Remove-Variable yearbookCredential,yearbookPassword
```

Untuk mengganti password akun yang sudah ada melalui CLI, atur variabel yang sama lalu jalankan `npm run admin:create -- --replace`. Semua sesi lama akun tersebut dicabut.

Jika memakai salinan proyek dengan direktori `data/` yang benar-benar baru, pasangan awal yang diminta pengguna dapat dibuat dengan flag eksplisit berikut. Pengecualian ini hanya berlaku untuk pasangan tepat `admin` / `admin`; penggantian melalui dashboard tetap memakai aturan 12 karakter.

```powershell
$env:ADMIN_USERNAME = 'admin'
$env:ADMIN_PASSWORD = 'admin'
npm run admin:create -- --requested-bootstrap
Remove-Item Env:ADMIN_PASSWORD,Env:ADMIN_USERNAME
```

## Isi dan pengelolaan

Pemetaan editorial berjumlah tepat 12 halaman:

| Halaman | Isi |
| --- | --- |
| 1 | Cover hardcover |
| 2 | Daftar isi tercetak, tanpa navigasi lompat bab |
| 3 | Wali kelas: Perdini Adma Sari, S.Pd. |
| 4–6 | Foto kebersamaan, minimal tiga slot foto tiap halaman |
| 7–10 | Seluruh 32 siswa resmi, delapan siswa per halaman |
| 11 | Pesan anonim |
| 12 | Perpisahan dan tombol Tutup Buku |

Satu endpaper dekoratif dapat terlihat pada buku fisik; itu bukan halaman konten ke-13. Daftar siswa awal mengikuti ejaan dan urutan dalam brief. Tidak ada foto wajah sintetis atau foto kenangan rekaan. Foto yang belum diunggah ditandai **FOTO BELUM DITAMBAHKAN**. Teks perpisahan awal berlabel contoh.

Dashboard menyediakan pengubahan cover, profil wali kelas, foto/nama/keterangan siswa, galeri beserta urutan dan halaman, judul/subjudul/teks/ornamen halaman, perpisahan, pengaturan visual/audio, serta moderasi pesan. Preview perubahan sebelum menyimpan; data yang disimpan muncul dari API tanpa membangun ulang frontend. Identitas siswa tetap memakai 32 ID yang sama; pengubahan nama dilakukan secara sadar oleh admin.

Unggah JPG, PNG, atau WebP; gambar diubah menjadi WebP dan metadata asli dibuang. Gunakan kontrol posisi foto untuk mengatur crop tanpa mengubah wajah. Gambar potret dengan pencahayaan baik dan rasio sekitar 4:5 disarankan. Audio opsional menerima MP3, WAV, atau OGG. Batas unggahan server adalah **12 MB per berkas**. Musik latar belum disertakan; unggah audio berizin melalui dashboard. Suara kertas dibuat dengan Web Audio dan baru aktif sesudah interaksi pengguna.

Pesan dikirim tanpa nama pengirim, hanya penerima dari 32 siswa dan isi pesan. Form tulis pesan dan kumpulan surat yang sudah disetujui dapat dibuka saat halaman **11** sedang terlihat. Dialog surat hanya untuk fitur pesan; bukan mode membaca buku terpisah. Pesan baru berstatus **pending** dan tidak tampil sampai disetujui admin. Tersedia validasi panjang, honeypot, penyaringan konten dasar, pembatasan pengiriman, serta tindakan setujui/tolak/sembunyikan/hapus. Penyaringan dasar tidak menggantikan penilaian moderator.

## Membaca buku 3D

Klik sampul atau **Buka buku kenangan**. Buku selalu dimulai dari halaman **2**. Baca berurutan dengan roda scroll mouse, tombol sebelumnya/berikutnya, tombol panah keyboard, atau drag/swipe halaman. Daftar isi hanya tercetak pada kertas; nomor kemajuan bukan tombol lompat halaman. Intro tidak mempunyai tombol skip.

Pada desktop, buku memperlihatkan dua halaman sekaligus: **2–3 → 4–5 → 6–7 → 8–9 → 10–11 → 12**. Pada ponsel, kamera memusatkan satu halaman dan bergerak berurutan: **2 → 3 → 4 → … → 12**, tetap dalam scene 3D yang sama.

| Kontrol | Fungsi |
| --- | --- |
| Scroll mouse / tombol panah / tombol sebelumnya-berikutnya | Membuka halaman berurutan |
| Drag halaman / swipe satu jari | Membalik atau berpindah fokus halaman |
| Tombol `+` dan `−`, tombol keyboard `+`/`−`, atau Ctrl+scroll | Memperbesar dan memperkecil isi buku |
| Pinch dua jari | Zoom dan menggeser posisi pada layar sentuh |
| Shift+drag sesudah zoom, atau drag dengan tombol kanan mouse | Menggeser posisi buku |
| **Atur ulang** | Mengembalikan zoom dan posisi kamera |
| **Tutup buku** / Escape | Menutup cover; saat dibuka kembali, mulai lagi dari halaman 2 |

Klik foto asli yang sudah diunggah pada permukaan kertas untuk memperbesarnya dalam lightbox. Placeholder tidak dianggap foto asli. Galeri dengan lebih dari tiga foto disusun menjadi grid pada tekstur halaman sehingga foto tambahan tetap tampil dalam buku 3D.

Animasi memakai controller yang sama agar input tidak menjalankan beberapa flip sekaligus. Nomor halaman berubah setelah perpindahan selesai. Halaman perpisahan tidak menutup otomatis. Audio bersifat opsional dan tidak menyala sebelum diaktifkan pengguna. Preferensi `prefers-reduced-motion` mengurangi gerakan tanpa mengalihkan isi ke mode HTML.

WebGL diperlukan untuk melihat buku. Jika WebGL tidak tersedia atau context terhenti, situs menampilkan status dan tombol **Muat ulang 3D**; tidak berpindah ke mode baca lain. Dashboard dan penyimpanan server tetap terpisah dari status render 3D.

## Backup dan restore

Menu **Backup dan Restore** mengekspor JSON berisi konten, pesan, serta aset yang disertakan oleh server. Simpan backup di tempat pribadi karena dapat berisi foto kelas dan pesan yang belum disetujui. Ekspor siswa dan pesan juga tersedia dari dashboard.

Restore meminta konfirmasi karena mengganti isi database. Server memvalidasi struktur, 32 ID siswa, metadata, dan berkas sebelum melakukan transaksi. Backup tidak membawa password atau sesi admin. Untuk salinan operasional lengkap, hentikan server lalu salin seluruh `data/` ke penyimpanan aman. Jangan mengandalkan menyalin hanya berkas SQLite saat server masih menulis dalam mode WAL.

## Build produksi

```powershell
npm run build
$env:NODE_ENV = 'production'
npm start
```

Backend produksi menyajikan hasil build `dist/` dan API pada port 3001; jika sudah dipakai, atur misalnya `$env:PORT = '3002'` sebelum `npm start`. Gunakan hosting dengan proses Node jangka panjang dan disk persisten; hosting statis saja tidak menjalankan database, login, atau upload ini. Proyek ini disiapkan sebagai aplikasi lokal dan **belum diterbitkan ke internet**.

Variabel lingkungan server:

| Variabel | Default / fungsi |
| --- | --- |
| `PORT` | `3001` |
| `HOST` | `127.0.0.1`; atur `0.0.0.0` hanya bila perlu diakses melalui jaringan/proxy |
| `DATA_DIR` | Direktori `data/` proyek; gunakan disk persisten dalam deployment |
| `NODE_ENV` | Atur `production` untuk menyajikan `dist/` |
| `SECURE_COOKIES` | Atur `true` bila situs publik memakai HTTPS |
| `TRUST_PROXY` | Atur `1` hanya jika memakai tepat satu reverse proxy tepercaya |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Hanya untuk perintah pembuatan/penggantian akun admin |

Server membaca variabel lingkungan proses; berkas `.env` tidak dimuat otomatis. Untuk akses publik, gunakan HTTPS dan cadangan disk persisten. Pembatasan IP bergantung pada konfigurasi reverse proxy yang benar. Publikasikan foto dan informasi siswa dengan persetujuan yang sesuai.

## Pemeriksaan

```powershell
npm test
npm run build
npm run test:browser
npm run test:production
```

Revisi ini lulus **18 tes API/geometri/akun**, **8 pemeriksaan browser revisi**, **15 pemeriksaan dashboard**, **6 pemeriksaan produksi**, dan **build produksi**. Status, screenshot, serta batas pemeriksaan tersedia di [docs/QA.md](docs/QA.md). Bukti terbaru menguji antarmuka 3D tanpa mode baca HTML.

Skrip browser memakai database sementara dan password acak yang dihapus sesudah pengujian; data kelas di `data/` tidak disentuh. Diperlukan Chrome yang terpasang, atau Chromium Playwright yang didukung skrip terkait. Target 60 FPS bukan jaminan di semua perangkat. Simulasi kertas memakai deformasi mesh real-time, bukan path tracing atau simulasi mekanik kertas sempurna.

## Struktur

- `src/BookRig.js`, `src/PageCurlSolver.js`: model hardcover, engsel, kamera, deformasi halaman, dan interaksi.
- `src/PageTextureRenderer.js`: tekstur cover/kertas vintage, layout editorial, dan area klik foto pada permukaan 3D.
- `src/page-content.js`: metadata halaman serta utilitas escaping/validasi URL gambar; tidak menyediakan mode baca untuk pengunjung.
- `src/admin.js`, `src/admin.css`: dashboard terintegrasi.
- `src/AudioManager.js`: audio opsional.
- `server/`: database, data awal resmi, validasi, autentikasi, upload, API, dan penyajian produksi.
- `scripts/`: server pengembangan, pembuatan admin, dan pemeriksaan browser.
- `tests/`: pengujian fungsi inti dan API.
- `docs/`: brief, laporan pemeriksaan, dan bukti visual.

Ornamen botanikal, permukaan meja kayu, serat kain merah, dan kertas tua dibuat secara prosedural. Font Cormorant Garamond dan DM Sans disertakan melalui Fontsource; salinan lisensi ada di `public/licenses/`. Panduan engineering komunitas: [Three.js Skills](https://github.com/cesartevisual/threejs-skills), yang bukan produk resmi Three.js.
