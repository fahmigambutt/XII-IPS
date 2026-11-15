# Verifikasi revisi: buku merah vintage 3D

Revisi ini mengikuti permintaan terbaru: 3D saja, buku lebih besar, kain merah vintage, kertas tua, meja kayu, pembacaan berurutan tanpa lompat bab, serta akun lokal yang dapat diganti dari dashboard. Laporan ini menggantikan hasil antarmuka lama yang mempunyai mode baca HTML.

## Hasil yang dijalankan

| Pemeriksaan | Hasil | Bukti |
| --- | --- | --- |
| `npm test` | **18 lulus** | API, auth/CSRF, proxy, persistensi, upload, moderasi, backup/restore, akun admin, dan geometri kertas |
| `npm run build` | **Lulus** | Hasil produksi di `dist/`; peringatan chunk Three.js sekitar 502 kB mentah bukan kegagalan build |
| `node scripts/revision-qa.mjs` | **8 lulus** | [revision-results.json](qa/revision-results.json) |
| `node scripts/admin-qa.mjs` | **15 lulus** | [admin-results.json](qa/admin-results.json) |
| `npm run test:production` | **6 lulus** | [production-results.json](qa/production-results.json) |
| Akun lokal yang diminta | **Lulus** | Login melalui proxy Vite dan logout berhasil; password tersimpan sebagai hash scrypt dan tidak disertakan dalam repository |
| Penggantian akun | **Lulus** | Tes API dan Chrome terisolasi: password saat ini diverifikasi, ID/password berubah, sesi dirotasi, kredensial lama ditolak |

Semua tes database/browser selain verifikasi login lokal memakai direktori sementara. Konten kelas, foto, dan pesan yang tersimpan tidak ditimpa oleh pengujian.

## Perbaikan yang dibuktikan

- Buku tetap terlihat selama pembukaan dan penutupan. Sampel frame mencatat canvas terlihat, objek terlihat, objek berada dalam frame, dan renderer tidak dipause.
- Panel dan pengaktifan otomatis mode baca sudah dihapus. Mengklik halaman biasa tetap berada di scene 3D.
- Seluruh kertas kiri berada dalam grup engsel bersama sampul. Penutupan dari halaman tengah maupun akhir tidak meninggalkan lembar di luar hardcover.
- Penutupan saat zoom 125% diuji; framing berubah berkelanjutan hingga sampul tertutup.
- Kamera tidak lagi berganti ukuran secara mendadak pada progress 0,2. Layout canvas tetap memenuhi viewport sepanjang animasi.
- Buku terbuka terukur **1150 × 764 px** pada viewport **1440 × 960 px**, sekitar 80% lebar layar.
- Pembacaan desktop bergerak satu spread, ponsel satu halaman editorial. Scroll, tombol, keyboard, serta swipe sentuh 2→3 dan 3→4 benar-benar diuji.
- Panel IN THIS BOOK, mode baca, tombol skip, tautan TOC, dan titik kemajuan yang bisa diklik tidak tersedia. Membuka ulang selalu kembali ke halaman 2.
- Zoom membesarkan mesh 3D; reset mengembalikan framing. Pada ponsel, screenshot 125% diambil setelah tween selesai.
- Tidak ditemukan exception JavaScript dalam alur revisi, dashboard, atau produksi yang diuji.

## Bukti visual

- [Cover merah di meja kayu](qa/revision-closed-desktop.png).
- [Buku terbuka desktop](qa/revision-opening-desktop.png).
- [Setelah ditutup dari tengah](qa/revision-closing-middle.png).
- [Halaman terakhir](qa/revision-final-page.png).
- [Setelah ditutup dari akhir](qa/revision-closing-final.png).
- [Tampilan 3D ponsel](qa/revision-open-mobile.png).
- [Zoom 125% ponsel](qa/revision-zoom-mobile.png).
- [Sampul setelah ditutup di ponsel](qa/revision-close-mobile.png).
- [Seluruh tekstur vintage](qa/vintage-textures.png).

Berkas screenshot transisi merupakan keadaan pada saat capture selesai; pemeriksaan kontinu selama transisi menggunakan sampel frame pada JSON. Log memuat progress engsel, jarak kamera, jumlah render, dan status visibilitas.

## Dashboard dan konten

Sembilan menu CMS, preview/batal/simpan, pencarian 32 siswa, upload PNG→WebP, crop 0%, bulk upload galeri, urutan/pemindahan halaman, moderasi, farewell, pengaturan, backup/restore beserta aset, ekspor, dan logout tetap lulus. Form akun baru berada di **Pengaturan → Ganti ID dan password**. Password pengganti 12–256 karakter; perubahan mengakhiri sesi lama dan menerbitkan sesi baru untuk browser saat ini.

Semua 32 nama resmi tetap mengikuti data awal. Foto asli belum tersedia sehingga placeholder dipertahankan. Foto yang dimuat dapat diperbesar dari permukaan buku. Foto galeri tambahan ikut ditata pada tekstur kertas. Form pesan dan surat yang diterima tersedia ketika halaman 11 dibaca; keduanya merupakan fitur pesan, bukan mode baca buku terpisah.

## Lingkungan dan batas

Pengujian menggunakan Node.js 26.13, Three.js r181, Vite 7.3.8, dan Chrome headless pada Windows. Ponsel memakai emulasi sentuh 390 × 844, bukan perangkat fisik. Metrik rinci terdapat dalam JSON; pada sampel interaksi terakhir FPS keseluruhan desktop sekitar 47 dan emulasi sentuh sekitar 57. Sampel mencakup pembuatan tekstur dan inspeksi screenshot, sehingga tidak dianggap benchmark GPU atau jaminan 60 FPS.

Tekstur interior desktop kini 1536 × 1920, ponsel 1024 × 1280, dengan cache maksimum 7 canvas. Estimasi cache RGBA dengan mipmap desktop sekitar 105 MiB dan ponsel 46,7 MiB; bukan VRAM total. Tekstur kayu, environment, shadowmap, buffer, dan driver menambah penggunaan memori.

Safari, Firefox, Android/iOS fisik, pembaca layar, kumpulan foto kelas penuh, dan reverse proxy HTTPS publik belum diuji. Jika WebGL tidak tersedia atau context hilang, pengguna mendapat penjelasan dan tombol muat ulang 3D; tidak ada pengalihan ke mode baca HTML. Simulasi kertas menggunakan deformasi geometri real-time, bukan simulasi mekanik sempurna.

Jalankan ulang `npm test`, `npm run build`, `npm run test:browser`, dan `npm run test:production` setelah mengubah kode/dependensi.


