# MASTER PROMPT ULTRA-REALISTIC: XII IPS 3D INTERACTIVE YEARBOOK 2025/2026/2027

> **VERSI PRODUKSI — PHOTOREALISTIC WEB 3D / REALISTIC PAGE PHYSICS / FULLY FUNCTIONAL CMS**
>
> Dokumen ini adalah instruksi implementasi untuk coding agent. Pertahankan identitas, seluruh 32 nama siswa, dan fungsi Admin Dashboard dari brief asli. Jangan menyatakan sebuah fitur selesai tanpa mengimplementasikan serta mengujinya. Hasil harus meyakinkan secara visual **dan** dapat dijalankan, bukan sekadar gambar konsep atau animasi demo.

## SEBELUM PROMPT UTAMA — SARAN AGENT SKILLS GITHUB DAN REFERENSI ENGINEERING 3D

### A. Agent Skills yang bisa dipasang pada coding agent (diprioritaskan)

**1. Three.js Skills — kumpulan skill komunitas untuk coding agent 3D**

- GitHub: https://github.com/cesartevisual/threejs-skills
- Ini adalah *Agent Skills* komunitas, **bukan dokumentasi resmi atau produk dari tim Three.js**. Gunakan sebagai panduan kerja yang melengkapi dokumentasi resmi, bukan sebagai jaminan hasil.
- Instalasi dari direktori proyek (setelah memeriksa isi repositori dan `SKILL.md`):

```bash
npx skills add cesartevisual/threejs-skills
```

- Untuk coding agent yang mendukung pemilihan skill secara spesifik:

```bash
npx skills add cesartevisual/threejs-skills --skill threejs-web
npx skills add cesartevisual/threejs-skills --skill threejs-materials
npx skills add cesartevisual/threejs-skills --skill threejs-lighting
npx skills add cesartevisual/threejs-skills --skill threejs-animation
npx skills add cesartevisual/threejs-skills --skill threejs-interaction
npx skills add cesartevisual/threejs-skills --skill threejs-shaders
npx skills add cesartevisual/threejs-skills --skill threejs-performance
npx skills add cesartevisual/threejs-skills --skill threejs-testing
```

**Skill yang wajib dibaca saat relevan:** `threejs-web`, `threejs-scene`, `threejs-geometry`, `threejs-materials`, `threejs-lighting`, `threejs-animation`, `threejs-interaction`, `threejs-assets`, `threejs-performance`, `threejs-debugging`, `threejs-testing`, `threejs-accessibility`, `threejs-postprocessing`. Gunakan `threejs-shaders` bila implementasi deformasi kertas menggunakan shader. Gunakan `threejs-r3f` **hanya jika** proyek memilih React Three Fiber.

**2. Vercel Agent Skills — pedoman performa React dan audit antarmuka**

- GitHub: https://github.com/vercel-labs/agent-skills
- Jika menggunakan React + React Three Fiber, baca `react-best-practices` untuk meminimalkan render tidak perlu, *bundle bloat*, dan loading *waterfall*.
- Untuk semua pilihan stack, gunakan `web-design-guidelines` saat mengaudit navigasi, formulir admin, aksesibilitas, dan responsivitas.

```bash
npx skills add vercel-labs/agent-skills --skill web-design-guidelines
# Jalankan berikut hanya jika React dipakai:
npx skills add vercel-labs/agent-skills --skill react-best-practices
```

> **Catatan:** Skill AI bukan library yang otomatis membangun buku 3D. Coding agent harus membaca isi `SKILL.md` yang sesuai, lalu menerapkan tekniknya ke source code dan menguji hasil. Jangan mengeksekusi skrip tak dikenal tanpa audit; sebaiknya pin versi/commit untuk proyek produksi.

### B. Library dan sumber engineering yang sudah mapan (BUKAN Agent Skills)

Berikut repositori yang relevan bagi engineer web 3D. **Jangan menganggap repositori library sebagai direktori Agent Skills.**

| Teknologi | GitHub resmi | Kegunaan nyata dalam yearbook |
|---|---|---|
| **Three.js** | https://github.com/mrdoob/three.js | Kamera, PBR material, mesh, render, bayangan, texture, GPU picking. **Fondasi wajib.** |
| **React Three Fiber (opsional)** | https://github.com/pmndrs/react-three-fiber | Jika proyek memilih React: scene 3D berbasis komponen dan lifecycle yang terstruktur. |
| **Drei (opsional)** | https://github.com/pmndrs/drei | Utilitas kamera, environment, loading, kontrol, dan helper untuk R3F. |
| **GSAP** | https://github.com/greensock/GSAP | Timeline sinematik, pembukaan hardcover, kamera, dan sinkronisasi progress page turn. |
| **postprocessing (opsional)** | https://github.com/pmndrs/postprocessing | Color grading, subtle ambient occlusion, dan efek optik terkendali tanpa *overprocessing*. |
| **glTF Transform (jika memakai model GLB/GLTF)** | https://github.com/donmccurdy/glTF-Transform | Optimasi mesh, pengurangan ukuran aset, dan kompresi tekstur untuk produksi. |

**Instruksi wajib untuk coding agent, sebelum mulai:**

1. Periksa struktur proyek yang sudah ada; tentukan secara eksplisit satu stack render utama. Default untuk brief asli ini: **Vite + JavaScript modern + Three.js + GSAP + backend/database**. Jangan berpindah ke React tanpa alasan teknis yang nyata. React Three Fiber + Drei hanya alternatif jika dipilih konsisten dari awal.
2. Baca dokumentasi/API yang cocok dengan versi package yang terpasang, bukan menebak nama fitur atau mengimpor helper yang tidak tersedia.
3. Gunakan *reference footage* atau pengamatan buku fisik yang sah sebagai acuan: lipatan sampul, gravitasi lembar, kontak bayangan, distribusi cahaya, dan penurunan kecepatan saat kertas mendarat.
4. Tentukan *quality bar*: buku tampak sebagai objek fisik saat diam, bergerak, dibuka, dibalik, dan ditutup; tidak ada halaman yang hanya ditukar dengan CSS atau tekstur yang mendadak muncul.
5. **Photorealistic** berarti *plausible physical appearance* dalam batas render real-time. Jangan mengklaim path tracing, simulasi fisika sempurna, atau 60 FPS di semua perangkat tanpa bukti pengujian.
6. Setelah implementasi, lakukan inspeksi di browser, *visual QA*, dan tes input mouse, touch, keyboard, admin, serta pesan anonim. Cantumkan temuan dan keterbatasan nyata.

---

# PROMPT UTAMA — SPESIFIKASI WEBSITE YEARBOOK 3D


## 0. SKILL YANG DIPERLUKAN

Bertindaklah sebagai tim profesional yang terdiri dari:

Senior Frontend Developer

Three.js Developer

3D Web Developer

WebGL Developer

GSAP Animation Specialist

UI/UX Designer

Graphic Designer

Motion Designer

Backend Developer

Database Engineer

Responsive Web Designer

Performance Optimization Engineer

Software Engineer

Audio Designer

Gabungkan seluruh keahlian tersebut untuk membuat website yearbook 3D yang interaktif, sinematik, responsif, dan memiliki kualitas visual profesional.

Jangan hanya membuat desain atau prototype. Bangun website yang benar-benar berfungsi.

## 1. IDENTITAS WEBSITE

Nama website:

XII IPS MEMORIES

Judul utama yearbook:

XII IPS

Tahun angkatan:

2025/2026/2027

Tagline:

OUR MEMORIES, OUR STORY

Konsep utama:

Buat website yearbook digital berbentuk buku hardcover 3D yang dapat dibuka, dibalik halamannya, dan ditutup kembali oleh pengunjung.

Website harus memberikan pengalaman seperti sedang memegang dan membaca buku kenangan kelas secara langsung.

**Definisi realisme:** tujuan desain adalah *believable real-world hardcover book*, bukan sekadar ikon buku 3D. Saat kamera mendekat, terlihat perbedaan material karton hardcover, kain/linen atau kulit sintetis, lem penjilidan, muka dan tepi halaman, rongga dekat punggung buku, serta permukaan kertas yang memantulkan cahaya secara halus. Semua detail mengikuti transformasi objek dan konsisten dari setiap sudut pandang.

**Urutan prioritas visual:** (1) siluet dan ketebalan benda, (2) gerak membuka sampul sesuai engsel, (3) deformasi halaman yang meyakinkan, (4) bayangan kontak dan lighting, (5) keterbacaan isi dan navigasi, (6) detail material serta efek sinematik. Jangan mengorbankan prioritas 1–5 demi debu, bloom, atau efek dekoratif.

## 2. KONSEP VISUAL DAN DESAIN

Gunakan gaya visual:

Watercolor nostalgic aesthetic.

Vintage scrapbook.

Elegant editorial design.

Cinematic storytelling.

Realistic hardcover book.

Realistic paper texture.

Soft natural lighting.

Warm nostalgic atmosphere.

Palet warna utama:

Cream.

Ivory.

Beige.

Soft brown.

Sage green.

Muted gold.

Warm white.

Elemen visual:

Tekstur kertas asli.

Ornamen bunga watercolor.

Garis dekoratif tipis.

Bingkai foto vintage.

Efek debu dan partikel cahaya.

Bayangan lembut.

Efek cahaya hangat.

Detail hardcover yang realistis.

Tipografi:

Gunakan serif elegan untuk judul.

Gunakan font yang mudah dibaca untuk isi.

Gunakan kombinasi tipografi editorial yang konsisten.

Pastikan tulisan tetap terbaca pada smartphone.

Hindari desain yang terlalu ramai, warna mencolok, dan animasi yang mengganggu konten.

## 2A. ART DIRECTION ULTRA-REALISTIC — PHYSICAL REFERENCE DAN MATERIAL

### A. Ukuran dan konstruksi fisik buku

- Gunakan satu sistem satuan konsisten (misalnya meter). Contoh acuan ukuran yearbook: **satu sisi sampul 0,24 m × 0,30 m**, dengan area engsel punggung yang masuk akal; ini adalah **acuan visual**, bukan ukuran wajib.
- Sampul mempunyai bidang depan dan belakang terpisah, ketebalan board sekitar **2–3 mm** masing-masing, *spine* dan engsel yang jelas, rounded edges sangat halus, lipatan material di tepi, serta tepi halaman sedikit tidak seragam.
- Hindari tumpukan kertas dengan ketebalan berlebihan. Untuk buku dengan sedikit halaman, berikan ketebalan lembar dan *spine* yang **seimbang secara visual**, bukan balok tebal seperti novel 500 halaman.
- Saat buku tertutup, sampul depan dan belakang sejajar, lembar di tengahnya tertutup rapi; saat dibuka, halaman kanan-kiri membentuk kemiringan kecil karena akar kertas di dekat jilid tidak benar-benar datar.
- Model *spine* mempunyai sedikit lengkung dan *hinge line*. Transformasi cover harus diputar dari posisi engsel, **bukan dari pusat geometrinya**.
- Tepi lembar tidak harus 100% identik; beri variasi mikro sangat halus pada pola serat dan *edge shading*, tanpa noise mencolok.

### B. Material PBR dan tekstur mikro

- Gunakan *physically based rendering*: albedo/base-color, roughness, normal/bump, dan ambient occlusion seperlunya. Semua sumber tekstur harus legal dipakai dan diberi atribusi jika diperlukan.
- Cover bergaya linen, fabric bookcloth, atau embossed matte; tekstur *weave* sangat halus, bukan corak kain besar. Foil/gold emboss cukup pada judul/ornamen, dengan respons kilau bergantung sudut pandang.
- Kertas berwarna ivory hangat, sifat matte dengan *microfiber grain* halus; hindari permukaan putih bersih seperti layar LED atau glossy seperti plastik.
- Gunakan nilai material sebagai titik awal kalibrasi, **bukan angka mutlak**: paper roughness umumnya tinggi, cover matte medium-to-high roughness; sesuaikan dengan HDRI dan pencahayaan nyata.
- Gunakan foto/ilustrasi di halaman sebagai bagian tekstur permukaan kertas dengan UV benar. Jangan menambahkan glow atau bayangan pada gambar seakan foto melayang di depan kertas kecuali itu memang kolase polaroid berlapis dengan ketebalan dan kontak bayangan.
- Tekstur foto tidak boleh *washed out*, posterized, sangat tajam secara artifisial, atau blur karena resolusi terlalu rendah.

### C. Tata cahaya seperti sesi foto produk sungguhan

- Buat lingkungan studio hangat: **large soft key light**, fill yang lebih lemah, subtle rim/back light, dan environment lighting yang konsisten. Cahaya harus menerangi cover dan halaman dengan arah masuk akal.
- Render *contact shadow* di antara lembar, di dekat gutter, di bawah halaman terangkat, dan di bawah buku. Bayangan berubah posisi, bentuk, dan tingkat kelembutan saat geometri bergerak.
- Pakai penanganan warna yang benar (input warna/tekstur sRGB sesuai kebutuhan, output color space yang tepat, tone mapping konsisten). Evaluasi highlight agar tidak clip, kontras cukup pada teks, dan kertas tetap tampak ivory.
- Efek *bloom*, vignette, depth of field, film grain, dan partikel hanya tambahan **subtle**. Pada mode membaca, kurangi blur dan postprocessing agar foto/nama siswa tetap tajam.
- Hindari visual yang mengkhianati realisme: cahaya berkedip tanpa sumber, material terlalu metalik, partikel menembus objek, shadow mengambang, ambient occlusion terlalu gelap, dan cover tanpa ketebalan.

### D. Komposisi sinematik yang tetap fungsional

- Mulai dengan shot 3/4 untuk memperlihatkan volume hardcover, lalu kamera berpindah ke framing reading mode yang lebih frontal.
- Pergerakan kamera memakai ease halus, dengan *anticipation* dan *settling* kecil; jangan memakai shake berlebihan atau putaran 360° yang mengganggu.
- Saat pengunjung menggeser posisi pointer, boleh ada *parallax* mikro terhadap buku tetapi batasi sehingga teks tidak bergerak liar.
- Pastikan *safe framing*: ujung buku dan halaman tidak terpotong saat animasi, bahkan ketika layar berubah rasio.

**Visual rejection criteria:** model menyerupai dua persegi CSS, cover tidak memiliki ketebalan, halaman tidak memiliki muka-belakang, bayangan tidak sinkron, font terlihat menyatu/mepet tepi, atau animasi menyerupai presentasi slide. Semua itu harus diperbaiki sebelum menganggap fitur selesai.

## 3. INTRO DAN LOADING SCREEN

Ketika pengunjung membuka website, tampilkan loading screen sinematik.

Teks utama hanya:

WELCOME TO XII IPS

Jangan tampilkan informasi tambahan yang tidak diperlukan pada loading screen.

Tambahkan:

Background bernuansa cream atau beige.

Animasi teks yang elegan.

Partikel cahaya yang bergerak perlahan.

Transisi fade-in dan fade-out.

Loading progress yang halus jika diperlukan.

Setelah seluruh aset utama siap, tampilkan sebuah buku hardcover 3D.

## 3A. STORYBOARD INTRO YANG MASUK AKAL SECARA FISIK

1. **Preload:** muat geometri cover, material inti, tekstur halaman pertama, dan font minimum terlebih dahulu. Jangan menahan loading sampai seluruh foto 32 siswa dimuat.
2. **Establishing shot:** buku terlihat dari sudut diagonal dengan bayangan lembut pada permukaan/dudukan yang meyakinkan. Jika desain memilih buku melayang, gunakan floating ringan dengan kontak bayangan terpisah hanya bila ada surface yang terlihat; jangan membuat bayangan seolah ada lantai saat buku benar-benar berada di ruang kosong.
3. **Dolly-in:** kamera dan/atau buku bergerak melalui lintasan halus dengan percepatan/deselerasi masuk akal; hindari perubahan skala objek mendadak sebagai pengganti gerakan kamera.
4. **Hover state:** cover merespons pointer melalui perubahan sudut cahaya yang subtil, bukan memantul seperti mainan.
5. **Open book:** engsel bereaksi sedikit sebelum sampul membuka; lembar paling atas mengikuti pergerakan dengan delay kecil; kamera pindah ke posisi baca; teks tampil tajam.
6. **Skip intro:** sediakan tombol lewati intro untuk akses cepat. Jika `prefers-reduced-motion`, langsung tampilkan keadaan terbuka atau gunakan transisi minimal.

**Timing awal yang dapat disesuaikan setelah review:** entrance sekitar 1–2 detik, membuka cover sekitar 0,8–1,5 detik, membalik halaman sekitar 0,7–1,2 detik. Jangan memperpanjang gerakan demi efek dramatis jika membuat navigasi lambat.

## 4. ANIMASI BUKU 3D

Buat sebuah buku hardcover 3D dengan tampilan realistis.

Buku harus memiliki:

Sampul depan.

Sampul belakang.

Punggung buku.

Ketebalan halaman.

Tekstur permukaan hardcover.

Tumpukan lembaran kertas.

Bayangan realistis.

Pencahayaan sinematik.

Animasi awal:

Buku muncul dari kejauhan.

Buku bergerak terbang menuju bagian tengah layar.

Buku berhenti tepat di tengah.

Buku melayang secara perlahan.

Kamera sedikit mendekat.

Tampilkan petunjuk agar pengunjung mengeklik buku untuk membukanya.

Ketika pengunjung mengeklik buku:

Sampul depan terbuka secara realistis.

Buku bergerak mengikuti engsel pada punggungnya.

Halaman pertama terlihat.

Kamera menyesuaikan sudut pandang.

Transisi menuju pengalaman membaca berlangsung halus.

Teks pada sampul depan:

XII IPS

2025/2026/2027

OUR MEMORIES, OUR STORY

Buat desain sampul yang elegan dan memiliki kesan buku kenangan kelas premium.

## 4A. HARD COVER, HINGE, BINDING, DAN PAGE STACK — WAJIB REAL 3D

**Model fisik minimum:** `BackCover`, `Spine`, `FrontCover`, `PageStackLeft`, `PageStackRight`, `ActiveTurningLeaf`, `PaperEdges`, `GutterShadow`. Pisahkan material dan transform masing-masing. Untuk halaman aktif gunakan sisi depan dan belakang yang berbeda, bukan satu plane tunggal dengan satu gambar yang diputar 180°.

- Punggung buku, sampul, dan tumpukan kertas harus punya parent/rig yang jelas. Pastikan pivot cover tepat pada sendi jilid, koordinat dalam ruang lokal dan ruang dunia konsisten, serta tidak ada *gimbal-like jump*.
- Saat cover dibuka, tepi sampul menggambarkan busur sepanjang engsel; ketebalan sampul tetap terlihat dan tidak menembus tumpukan kertas.
- Halaman aktif diangkat dari tumpukan kanan/kiri; volume dan tinggi tumpukan berubah secara bertahap sesuai jumlah lembar yang sudah dibalik.
- Hanya lembar aktif yang deformasi detail; tumpukan halaman dapat berupa geometri gabungan, tetapi perlu menunjukkan perubahan ketinggian dan shading.
- Tambahkan *gutter occlusion* dan bayangan kecil pada lipatan dekat jilid. Jangan membuat dua halaman membentuk bidang datar sempurna ketika dibuka.
- Jika menggunakan file GLB buatan Blender, siapkan UV, normals, material slots, dan LOD yang benar. Namun *page deformation* tetap perlu implementasi dinamis di runtime.
- Gunakan model high-quality secukupnya; poligon yang banyak tanpa pengaruh visual tidak membuat hasil lebih realistis.

**Aturan data vs fisik:** daftar 12 halaman konten di bawah ini adalah **nomor editorial/navigasi**. Halaman 1 merupakan cover hardcover, bukan selembar kertas. Halaman 2–12 adalah konten dalam buku; jika jumlah sisi fisik harus genap, boleh ada satu *blank endpaper* nonkonten di bagian akhir. Blank endpaper **tidak dihitung sebagai halaman ke-13** dan tidak boleh memuat siswa/pesan tambahan.

## 5. STRUKTUR DAN ISI HALAMAN

Buat total 12 halaman utama.

Setiap halaman harus memiliki desain, komposisi, dan konten yang sesuai dengan fungsinya.

### HALAMAN 1. COVER

Tampilkan sampul depan buku dengan tulisan:

XII IPS

2025/2026/2027

OUR MEMORIES, OUR STORY

Gunakan desain hardcover vintage yang elegan.

### HALAMAN 2. TABLE OF CONTENTS

Buat daftar isi yang menarik dan interaktif.

Daftar isi mencakup:

Our Homeroom Teacher

Our Togetherness

Our Class Memories (bagian dari galeri halaman 4–6)

Meet the Students

Anonymous Messages

Our Last Goodbye

Setiap bagian dapat diklik untuk menuju halaman yang dituju.

Gunakan animasi navigasi yang halus dan tetap mempertahankan pengalaman membaca buku.

### HALAMAN 3. OUR HOMEROOM TEACHER

Tampilkan profil wali kelas.

Data resmi:

Nama: Perdini Adma Sari, S.Pd.

Sediakan bagian untuk:

Foto wali kelas.

Nama lengkap.

Mata pelajaran.

Pesan dan kesan.

Ucapan khusus untuk siswa.

Gunakan desain elegan dengan bingkai foto vintage.

Foto dan informasi tambahan harus dapat diubah melalui Admin Dashboard.

Jangan membuat foto atau informasi pribadi palsu.

Jika foto belum tersedia, tampilkan placeholder.

### HALAMAN 4-6. OUR TOGETHERNESS

Bagian ini berisi foto kebersamaan kelas.

Setiap halaman harus menampilkan minimal 3 foto.

Gunakan variasi layout seperti:

Scrapbook collage.

Foto polaroid.

Foto dengan bingkai vintage.

Foto berukuran besar dengan caption.

Susunan foto yang dinamis.

Setiap foto dapat memiliki:

Caption.

Tanggal kegiatan.

Keterangan singkat.

Tambahkan animasi ketika halaman dibuka.

Foto harus dapat ditambahkan, diganti, dihapus, dan diurutkan melalui Admin Dashboard.

Jangan menggunakan foto palsu sebagai foto kenangan asli.

Jika foto belum tersedia, gunakan placeholder yang jelas.

### HALAMAN 7-10. MEET THE STUDENTS

Bagian ini menampilkan seluruh siswa kelas XII IPS.

Jumlah siswa resmi: 32 orang.

Gunakan 8 siswa pada setiap halaman.

Pembagian:

Halaman 7: Siswa 1-8.

Halaman 8: Siswa 9-16.

Halaman 9: Siswa 17-24.

Halaman 10: Siswa 25-32.

Setiap siswa harus memiliki:

Foto potret.

Nama lengkap.

Bingkai foto yang konsisten.

Animasi masuk yang halus.

Gunakan layout seperti yearbook profesional.

Pastikan seluruh foto memiliki ukuran dan proporsi yang konsisten.

Nama siswa harus sesuai daftar resmi. Jangan mengubah ejaan atau urutannya.

### DAFTAR SISWA RESMI

AHMAD KUSYAIRI

AISYAH

AISYATURRIDHA

ALIFAH HUSNA

ANITA ZAHRA

ARNITA NUR ZAHRA

AZIZAH

FAHMI ADRIAN

FATIA ZAHWA ALYA

INDAH SRI RAHAYU

ISNAWATI

M. ALFIANOR

M. FAUZAN RAHMAN

MADINA

MAULIDA

MONESA JAHRA

MUHAMMAD FARID FADHILLAH

MUHAMMAD IQBAL

MUHAMMAD NIZAR

MUHAMMAD RAYYAN KHALI S

NAILA MAHFUZHA

NAUFA NOR AZHORA

NOOR ALMIRA LAILA

NOR ASSYIFA

NUR AZIZAH

NURRIPA SABILA

RAISYA SABILA

RIANTI DWI ANGGITA

SHAYESHA SHABRINA SHARON

SHERA AZZAHRA

UMARUL AL-FAJRI

ZASKIA

Penting:

Jangan menambahkan siswa lain.

Jangan menghapus siswa.

Jangan mengganti nama.

Jangan mengubah urutan.

Jangan membuat foto wajah fiktif seolah-olah merupakan foto siswa asli.

Gunakan placeholder sampai foto asli dimasukkan.

Pastikan seluruh 32 siswa tampil tepat satu kali.

Admin harus dapat mengganti foto dan mengedit informasi siswa melalui dashboard.

### HALAMAN 11. ANONYMOUS MESSAGES

Buat fitur pesan anonim untuk seluruh siswa.

Pengunjung dapat menulis pesan tanpa menampilkan identitas pengirim.

Fitur harus memiliki:

Kolom nama penerima.

Pilihan penerima dari daftar 32 siswa resmi.

Kolom untuk menulis pesan.

Tombol kirim.

Animasi surat atau kertas ketika pesan dikirim.

Tampilan pesan yang sudah diterima.

Desain seperti surat kenangan.

Pengirim tidak perlu mengisi nama.

Pengirim dapat memilih salah satu siswa sebagai penerima.

Pesan harus ditampilkan dengan desain yang rapi dan mudah dibaca.

Tambahkan:

Validasi kolom pesan.

Batas panjang pesan.

Pencegahan pesan kosong.

Perlindungan spam.

Moderasi pesan.

Pencegahan konten yang tidak pantas.

Untuk prototipe lokal **yang jelas berlabel demo**, localStorage boleh dipakai sementara. **Versi publik wajib** menggunakan backend + database dengan moderasi server-side, kontrol rate-limit, dan sanitasi konten.

Namun, jika website akan digunakan secara publik oleh banyak orang, gunakan backend dan database agar pesan dapat tersimpan dan dibagikan antarperangkat.

Jangan menganggap localStorage sebagai database publik.

Admin Dashboard harus memiliki fitur untuk melihat, menyetujui, menyembunyikan, dan menghapus pesan anonim.

### HALAMAN 12. OUR LAST GOODBYE — FAREWELL & CLOSING

Halaman ini adalah penutup emosional dari yearbook, **bukan halaman yang boleh hilang**.

- Judul: **OUR LAST GOODBYE**.
- Tampilkan teks perpisahan kelas yang dapat diedit admin. Jangan mengarang fakta, tanggal, sekolah, atau pengalaman spesifik yang belum disediakan; gunakan contoh teks netral dengan label sebagai placeholder jika diperlukan.
- Sediakan area foto perpisahan/kelas terakhir, tetapi gunakan placeholder sampai foto resmi diunggah.
- Tata letak editorial bersih: satu visual kuat, ruang kosong elegan, ornamen watercolor yang tidak mengganggu keterbacaan, dan paragraf cukup singkat.
- Animasi buka lebih pelan namun tetap bisa dilewati. Sediakan tombol jelas **Tutup Buku** untuk menutup cover dan kembali ke tampilan awal. Jangan menutup buku otomatis ketika pembaca masih melihat halaman terakhir.
- Jika pengunjung menutup buku, daftar pesan dan pengaturan tidak hilang. Pengunjung boleh membuka buku kembali dan berpindah ke halaman lain.

**Pemetaan daftar isi final:** Wali Kelas → 3; Our Togetherness / Our Class Memories → 4–6; Meet the Students → 7–10; Anonymous Messages → 11; Our Last Goodbye → 12. Halaman 1 cover, halaman 2 daftar isi. Pastikan navigasi daftar isi memakai mapping ini dan seluruh nomor editorial tetap konsisten.

## 6. SISTEM NAVIGASI BUKU

Buat sistem navigasi yang nyaman dan mudah digunakan.

Fitur:

Next Page.

Previous Page.

Drag halaman menggunakan mouse.

Swipe halaman menggunakan sentuhan.

Navigasi melalui daftar isi.

Indikator nomor halaman.

Tombol fullscreen.

Petunjuk interaksi.

Tombol audio on/off.

Ketentuan:

Pengunjung dapat membaca halaman secara berurutan.

Pengunjung dapat kembali ke halaman sebelumnya.

Navigasi tidak boleh melewati batas halaman.

Nomor halaman harus selalu sesuai.

Jangan menjalankan beberapa animasi pergantian halaman secara bersamaan.

Navigasi harus bekerja di desktop dan smartphone.

## 6A. DETAIL ANIMASI PERGANTIAN HALAMAN 3D (REALISTIC PAGE TURNING)

Buat sistem pergantian halaman 3D yang realistis dan menyerupai buku hardcover fisik berkualitas premium.

Jangan menggunakan pergantian halaman instan, slide biasa, atau sekadar mengganti gambar. Setiap halaman harus memiliki gerakan fisik seperti lembaran kertas sungguhan.

### A. Gerakan Dasar Membalik Halaman

Ketika pengunjung menekan tombol Next Page:

Kursor atau jari mulai menarik sudut kanan halaman.

Sudut halaman terangkat perlahan.

Halaman mulai melengkung dari bagian tengah.

Bagian kertas bergerak dari kanan menuju kiri.

Halaman membentuk lengkungan 3D seperti kertas yang sedang dibalik.

Bagian belakang kertas terlihat ketika halaman berputar.

Bayangan halaman bergerak mengikuti posisi kertas.

Halaman melewati titik tengah buku.

Kertas perlahan jatuh dan menempel pada tumpukan halaman sebelah kiri.

Halaman berikutnya terlihat secara penuh.

Untuk tombol Previous Page, lakukan gerakan sebaliknya dari kiri menuju kanan.

### B. Efek Fisik Kertas

Setiap halaman harus memiliki karakteristik visual berikut:

Ketebalan kertas tipis tetapi tetap terlihat.

Permukaan kertas bertekstur.

Lengkungan halaman tidak kaku.

Bagian tengah kertas sedikit melengkung.

Sudut halaman sedikit terangkat.

Gerakan halaman memiliki efek elastis yang halus.

Terdapat bayangan lembut di bawah halaman.

Bagian belakang halaman memiliki tekstur kertas.

Halaman tidak boleh menembus halaman lain.

Halaman harus kembali ke posisi yang benar setelah animasi selesai.

Gunakan deformasi geometri riil melalui vertex manipulation atau shader displacement sesuai jalur render yang dipilih; transform `rotateY()` pada satu plane kaku tidak memenuhi standar realistis. Perbarui normals, muka-belakang, dan bayangan sesuai geometri.

Jika diperlukan, gunakan shader untuk menghasilkan efek lengkungan dan pencahayaan kertas.

### C. Animasi Bayangan dan Pencahayaan

Ketika halaman dibalik:

Bayangan halaman bergerak mengikuti lengkungan.

Area yang tertutup halaman menjadi sedikit lebih gelap.

Bagian bawah halaman memiliki ambient shadow.

Cahaya pada kertas berubah mengikuti sudut kemiringan.

Bayangan bergerak secara halus dari kanan menuju kiri.

Ketika halaman jatuh, bayangan perlahan menghilang.

Jangan membuat bayangan statis yang tidak mengikuti pergerakan halaman.

### D. Animasi Konten Halaman

Konten halaman juga harus memiliki animasi tersendiri.

Saat halaman mulai terangkat:

Konten pada halaman lama tetap terlihat.

Konten mengikuti permukaan halaman.

Jangan langsung menghilangkan teks atau foto.

Konten tidak boleh terlihat melayang terpisah dari kertas.

Saat halaman mulai terbuka:

Konten halaman berikutnya mulai terlihat.

Judul muncul dengan efek fade-in.

Foto muncul dengan sedikit jeda.

Caption muncul setelah foto.

Elemen dekoratif muncul secara bertahap.

Gunakan GSAP Timeline untuk menyelaraskan animasi halaman dan konten.

### E. Animasi Saat Pengunjung Menahan Halaman

Tambahkan interaksi drag halaman.

Ketika pengunjung menahan sudut halaman:

Halaman mengikuti posisi kursor.

Halaman melengkung secara dinamis.

Sudut halaman bergerak mengikuti arah tarikan.

Pengunjung dapat menahan halaman sebelum melepaskannya.

Ketika dilepas, halaman menyelesaikan putaran atau kembali ke posisi semula berdasarkan jarak dan kecepatan tarikan.

Pada smartphone, gunakan interaksi sentuh dengan perilaku yang sama.

### F. Efek Saat Halaman Berpindah

Tambahkan detail visual dan audio:

Efek suara kertas dibalik.

Suara lembut gesekan kertas.

Bayangan bergerak mengikuti halaman.

Sedikit gerakan buku saat halaman jatuh.

Animasi halaman terakhir memiliki efek yang lebih lambat.

Efek cahaya lembut ketika membuka halaman penting.

Audio harus opsional. Sediakan tombol untuk mengaktifkan atau menonaktifkan suara.

### G. Transisi Khusus Setiap Bagian

Buat karakter animasi yang sedikit berbeda untuk setiap bagian.

Cover menuju daftar isi: Gerakan membuka halaman pertama secara perlahan dan elegan.

Daftar isi menuju wali kelas: Halaman terbuka dengan transisi halus dan pencahayaan hangat.

Wali kelas menuju foto kebersamaan: Halaman dibalik dengan efek scrapbook yang lembut.

Foto kebersamaan menuju foto siswa: Gunakan gerakan halaman normal dengan sedikit efek zoom kamera.

Foto siswa menuju pesan anonim: Gerakan halaman lebih lambat, disertai animasi surat yang muncul.

Pesan anonim menuju halaman perpisahan: Gunakan transisi lebih emosional. Kamera sedikit mendekat dan cahaya berubah menjadi lebih hangat.

Halaman perpisahan: Gunakan animasi halaman yang lebih lambat sebelum buku ditutup.

### H. Navigasi dan Perilaku Sistem

Pastikan:

Tombol Next Page membalik satu halaman atau satu spread sesuai mode tampilan.

Tombol Previous Page bekerja dengan arah sebaliknya.

Pengunjung dapat membalik halaman dengan drag.

Pengunjung dapat menggunakan swipe pada smartphone.

Klik daftar isi dapat menuju bagian tertentu dengan animasi halaman berurutan atau animasi lompat halaman yang tetap realistis.

Nomor halaman berubah setelah animasi selesai.

Navigasi tidak dapat dijalankan berulang kali ketika animasi masih berlangsung.

Tidak terjadi konflik antara drag halaman dan klik foto.

Halaman terakhir tidak dapat melewati batas buku.

Halaman pertama tidak dapat dibalik ke arah yang salah.

### I. Optimasi Animasi

Targetkan animasi 60 FPS pada perangkat yang mendukung.

Gunakan:

GSAP untuk timeline dan pengaturan gerakan.

Three.js untuk mesh, material, kamera, dan pencahayaan.

RequestAnimationFrame melalui render loop yang efisien.

Pengelolaan objek 3D agar tidak terjadi memory leak.

Level of Detail jika dibutuhkan.

Optimasi jumlah polygon dan tekstur.

Penyesuaian kualitas efek untuk perangkat mobile.

Pada perangkat dengan GPU terbatas, kurangi detail deformasi dan efek partikel tanpa menghilangkan fungsi utama membalik halaman.

### J. Standar Kualitas Akhir

Animasi pergantian halaman harus memenuhi standar berikut:

Terlihat seperti lembaran kertas sungguhan.

Tidak terlihat seperti gambar yang hanya berputar.

Tidak ada halaman yang menembus halaman lain.

Tidak ada konten yang tertinggal di udara.

Tidak ada halaman yang tiba-tiba menghilang.

Gerakan tidak patah-patah.

Semua interaksi bekerja pada desktop dan smartphone.

Animasi tetap sinkron dengan posisi halaman dan nomor halaman.

Prioritaskan kualitas page-turning animation sebagai salah satu fitur utama website ini. Jangan menggantinya dengan transisi CSS sederhana.

## 6B. MESIN PAGE CURL — SPESIFIKASI GEOMETRI DAN RENDERING MENDALAM

Bagian ini **lebih tinggi prioritasnya** daripada partikel, audio latar, atau dekorasi tambahan. Gunakan real mesh deformation pada *turning leaf*, bukan fake flip berbasis CSS transform.

### A. Permukaan kertas yang harus dipertahankan

- Buat mesh lembar kertas dengan subdivisi cukup rapat dan adaptif (contoh awal: 32–64 segmen pada arah lebar dan 16–32 pada arah tinggi untuk desktop; mobile boleh lebih rendah setelah diuji). Pilih berdasarkan hasil visual/performa, bukan angka tetap.
- Satu lembar memiliki bidang **recto** dan **verso** dengan UV/materi berbeda. Render backside dengan orientasi teks yang benar, sehingga teks/foto tidak terbalik atau mirroring saat halaman berpindah.
- Titik pada tepi yang menempel ke tulang buku harus terikat pada *spine*; bagian bebas dari lembar boleh melengkung. Deformasi maksimum bukan di akar buku yang dijilid.
- Lembar melengkung sekaligus pada arah horizontal dan diagonal. Radius lengkungan menyesuaikan progress tarikan, posisi vertikal drag, dan kekakuan kertas.
- Buat *edge curl* lebih nyata dekat sudut yang ditarik; badan kertas tetap menahan bentuk. Jangan menghasilkan lekukan bergelombang tanpa sebab atau efek rubber jelly.
- Normals wajib diperbarui sesuai permukaan deformasi. Bila deformasi dilakukan di vertex shader, pertimbangkan normal, bounds, shadows/depth pass, dan interaksi picking agar semuanya sinkron.
- Bayangan dari lembar aktif harus mengikuti siluet aktual halaman. Jika *shadow map* penuh terlalu mahal, gunakan pendekatan gabungan: soft shadow yang mengikuti progress + ambient occlusion/gutter shadow, tanpa tampak seperti gambar statis.

### B. Kurva gerak dan ilusi berat kertas

- Gunakan parameter `turnProgress` antara 0 dan 1, `dragX`, `dragY`, `velocity`, `curlAmount`, `paperStiffness`, dan `settleProgress`.
- Pada awal gerakan (0–20%), sudut/sisi lembar mulai terangkat dan timbul bayangan kecil. Di fase tengah (20–75%) lembar melewati puncak lengkungan dan muka-belakang dapat terlihat. Di fase akhir (75–100%) lembar melandai, jatuh, dan menyentuh tumpukan kiri dengan sedikit *settling*.
- Transisi harus **kontinu** pada posisi, rotasi, normals, dan shadow; hindari lonjakan saat progress melintasi 0.5.
- Gesekan atau gravitasi dapat dimodelkan secara *stylized physics* dengan easing/tween yang diturunkan dari posisi dan kecepatan, tidak harus simulasi finite element. Namun hasil harus punya *inertia* dan *settle*, tidak sekadar ease linear.
- Gerak balik (previous) merupakan invers arah deformasi yang benar; bukan sekadar memutar video animasi yang salah sisi.
- Collision sederhana harus mencegah penetrasi lembar ke tumpukan, cover, dan halaman sebelah. Gunakan clamp bentuk/tinggi minimal di zona berpotensi berpotongan.
- Ketika halaman dibalik cepat berulang, state machine mencegah race condition; halaman hanya berganti setelah animasi mencapai commit point. Selama animasi, tampilkan visual sementara yang konsisten.

### C. Drag, swipe, dan release yang terasa taktil

- Gunakan `PointerEvent` untuk pointer/touch yang sesuai, *pointer capture*, dan *raycasting* ke area sudut halaman dengan prioritas interaksi yang benar. Touch-action dikendalikan hanya pada area buku agar scroll halaman situs/admin tetap normal.
- Saat sudut halaman ditarik, lembar benar-benar mengikuti gerakan pointer pada lintasan fisik yang masuk akal; batas tarikan di-clamp agar tidak bisa merobek atau memutar halaman 720 derajat.
- Jika progress dan kecepatan melewati ambang, halaman menyelesaikan flip; jika tidak, kembali ke posisi asal dengan *spring settle* halus. Threshold ditentukan lewat tes mouse dan touch, bukan angka acak yang tidak teruji.
- Jika pengguna melepas pointer di luar canvas, terkena `pointercancel`, atau tab browser kehilangan fokus, selesaikan atau rollback state secara aman. Jangan meninggalkan buku setengah terbuka tanpa kontrol.
- Saat halaman melayang selama drag, nomor halaman editorial belum berubah. Update setelah commit flip sukses. Semua navigasi dan tombol akan tersinkron.
- Klik foto, teks, tombol, atau formulir di dalam halaman tidak boleh memicu drag secara tidak sengaja. Prioritaskan akses konten daripada gimmick.

### D. Render konten nyata pada muka-belakang kertas

- Konten bisa dibuat sebagai tekstur halaman dari canvas/SVG/layout yang dikomposit dengan resolusi cukup, atau metode lain yang benar-benar *menempel* pada mesh.
- Untuk elemen interaktif (misalnya tombol siswa dan form pesan anonim), pakai **HTML overlay yang diposisikan selaras di reading mode** atau interaksi terproyeksi dengan raycasting yang diuji. Saat halaman di-drag, overlay boleh sementara noninteraktif/disembunyikan secara sinkron, namun konten kertas yang terlihat pada mesh tetap lengkap, tidak hilang atau melayang.
- Teks dan gambar mesti tajam saat kamera zoom masuk. Terapkan mipmaps, anisotropy sesuai perangkat, pengaturan texture color space, serta batas resolusi agar tidak membebani VRAM.
- Jika ada konten berubah dari dashboard, regenerasi tekstur halaman yang terdampak dan invalidasi cache dengan benar. Tidak boleh membutuhkan refresh manual/ubah kode untuk melihat perubahan.
- Jangan hanya mengandalkan rasterisasi untuk aksesibilitas: sediakan semantik HTML/accessible reading mode untuk teks, foto, daftar isi, dan pesan.

### E. Sinematografi page turn dan suara fisik

- Selama page turn, kamera sangat stabil; bila ada zoom, amplitudo kecil dan tidak membuat posisi kursor meleset.
- Pencahayaan dan shadow harus berubah sesuai sudut kertas, bukan mengikuti timeline terpisah yang tidak cocok dengan geometri saat drag.
- Suara *paper rustle* hanya ketika user mengaktifkan audio, dengan variasi volume kecil mengikuti energi kecepatan gerakan. Hindari sound effect keras atau loop mencolok.
- Jangan menjalankan *vignette pulse*, *bloom flash*, glow emas, atau screen shake setiap kali halaman berganti.

### F. Kriteria gagal untuk page turning

Tolak hasil jika salah satu berikut masih terjadi: lembar menembus tumpukan, backside tercermin, konten tertinggal di posisi lama, bayangan menggantung, cover lepas dari punggung, buku berkedip saat pindah state, nomor berubah lebih dulu, page turn hanya berupa `rotateY()` pada bidang kaku, interaksi drag tersangkut, atau foto/tulisan mendadak hilang di tengah pembalikan.

## 6C. STATE MACHINE BUKU DAN KONTRAK INTERAKSI

Implementasikan state eksplisit, misalnya:

```text
LOADING -> INTRO -> CLOSED_IDLE -> OPENING -> READING
READING -> DRAGGING -> (SNAP_BACK | SETTLING) -> READING
READING -> TURNING_NEXT / TURNING_PREV -> READING
READING -> CLOSING -> CLOSED_IDLE
CLOSED_IDLE -> ADMIN_LOGIN -> ADMIN_DASHBOARD -> CLOSED_IDLE
```

- `currentEditorialPage` adalah satu sumber kebenaran. Bedakan dari `physicalLeafIndex` serta `openCoverState`.
- Tombol Next, Previous, daftar isi, swipe, drag, dan aksesibilitas keyboard harus memanggil controller navigasi yang sama.
- Hentikan input turn lain saat `TURNING` atau `SETTLING`. Sediakan pembatalan/rollback aman saat kehilangan context WebGL.
- Saat membuka foto detail atau mengetik pesan anonim, *drag controller* wajib nonaktif untuk area tersebut.
- Saat berpindah ke admin, hentikan animasi, event listener, dan render loop yang tak dipakai agar tidak membebani dashboard.
- Tombol ADMIN hanya ditampilkan saat keadaan `CLOSED_IDLE` sesuai brief asli; jangan menjadikan visibilitas tombol sebagai proteksi autentikasi.

## 7. INTERAKSI DAN DETAIL ANIMASI

Gunakan GSAP untuk mengatur animasi antarelemen.

Tambahkan animasi:

Fade-in dan fade-out.

Parallax ringan.

Camera movement.

Floating animation.

Smooth zoom.

Text reveal.

Image reveal.

Particle animation.

Hover interaction.

Scroll atau swipe interaction jika diperlukan.

Semua animasi harus memiliki tujuan visual.

Hindari animasi berlebihan yang menghambat pembacaan.

## 8. AUDIO DAN SUASANA

Tambahkan audio opsional untuk memperkuat suasana.

Jenis audio:

Suara halaman dibalik.

Suara kertas.

Ambient background music.

Efek suara saat buku dibuka.

Efek suara saat buku ditutup.

Ketentuan:

Jangan memutar audio otomatis sebelum interaksi pengguna.

Sediakan tombol audio on/off.

Gunakan volume yang lembut.

Pastikan audio tidak mengganggu pembacaan.

Jika file audio belum tersedia, gunakan placeholder.

## 9. SISTEM DATA DINAMIS

Jangan menulis seluruh konten secara langsung di dalam komponen utama.

Buat sistem data yang terpisah agar konten mudah diperbarui.

Gunakan struktur data modular.

Contoh struktur:

public/ assets/ images/ teacher/ students/ memories/ audio/ textures/ src/ components/ Book3D.js BookCover.js PageTurn.js PageContent.js Navigation.js LoadingScreen.js AudioController.js pages/ CoverPage.js ContentsPage.js TeacherPage.js MemoriesPage.js StudentsPage.js AnonymousMessagesPage.js FarewellPage.js admin/ AdminLogin.js AdminDashboard.js AdminSidebar.js AdminOverview.js AdminTeacher.js AdminStudents.js AdminMemories.js AdminMessages.js AdminSettings.js data/ teacher.js students.js memories.js messages.js styles/ global.css book.css pages.css responsive.css admin.css services/ messageService.js contentService.js uploadService.js main.js index.html package.json README.md

Struktur tersebut dapat disesuaikan dengan kebutuhan implementasi.

Buat file data wali kelas:

export const teacher = { name: "Perdini Adma Sari, S.Pd.", subject: "", photo: "", message: "" };

Buat file data siswa berdasarkan daftar resmi 32 siswa.

Setiap siswa memiliki struktur:

{ id: 1, name: "AHMAD KUSYAIRI", photo: "" }

Lanjutkan sampai seluruh 32 siswa sesuai urutan resmi.

Buat file data kenangan yang memungkinkan penambahan foto dan caption.

Pastikan:

Nama siswa mudah diperbarui.

Foto siswa mudah diganti.

Foto kebersamaan dapat ditambah.

Caption dapat diedit.

Pesan anonim dapat dikelola.

Konten tidak perlu diubah langsung dari kode komponen utama.

Semua perubahan dari Admin Dashboard tersimpan ke penyimpanan data yang digunakan website.

## 9A. KONTEN DINAMIS DAN REALISME — PIPELINE TEKSTUR HALAMAN

Buat pemisahan yang tegas antara **konten** (`teachers`, `students`, `memories`, `messages`, `pageContent`) dan **presentasi** (layout editorial, texture generator, UI overlay, mesh materials).

- Setiap halaman punya ID tetap, layout template, daftar aset, versi konten, serta fungsi generate/refresh tekstur permukaan.
- Foto siswa tetap memakai daftar 32 identitas resmi. Untuk gambar kosong gunakan placeholder editorial bertekstur kertas/ikon siluet netral; jangan menciptakan wajah sintetis untuk tokoh nyata.
- Buat *crop editor* gambar dengan preview dan dukungan object-position agar wajah tidak terpotong. Jangan otomatis melakukan perubahan wajah atau menambah atribut pribadi.
- Pastikan metadata foto (caption, alt text, tanggal hanya jika tersedia) dapat diedit. Tidak perlu mempublikasikan EXIF/geolokasi foto asli.
- Saat admin mengganti konten, lakukan validasi, simpan database terlebih dahulu, baru invalidasi texture cache dan informasikan perubahan ke pengunjung melalui mekanisme update yang masuk akal.
- Sediakan rasio/resolusi aman untuk foto portrait, kartu siswa, kolase dan hero farewell. Asset original bisa disimpan pada object storage, sementara website memakai turunan terkompresi.
- Untuk publikasi pelajar, hindari penampilan nomor telepon, alamat, tanggal lahir, akun pribadi, dan informasi sensitif tanpa persetujuan yang relevan.
- Definisikan *fallback* ketika foto belum tersedia, API gagal, cache stale, dan jaringan lambat; halaman harus tetap bisa dibaca.

## 10. ADMIN DASHBOARD TERINTEGRASI

Buat Admin Dashboard yang menjadi bagian dari website yang sama.

Jangan membuat website admin terpisah dengan domain atau proyek berbeda.

Admin Dashboard harus dapat digunakan untuk mengedit dan mengelola seluruh isi website yearbook tanpa perlu mengubah source code secara manual.

Dashboard hanya dapat diakses oleh admin yang sudah berhasil login.

### A. Tombol Admin Kecil di Pojok Kiri Bawah

Tambahkan tulisan atau tombol kecil di pojok kiri bawah layar dengan label:

ADMIN

Atau:

ADMIN PANEL

Perilaku tombol:

Saat buku sedang terbuka dan pengunjung membaca halaman, tombol admin tidak ditampilkan.

Saat pengunjung menutup buku dan buku kembali ke tampilan sampul depan, tampilkan tulisan kecil ADMIN di pojok kiri bawah layar.

Tombol muncul dengan animasi fade-in yang halus.

Ukurannya kecil dan tidak mengganggu tampilan buku.

Gunakan warna yang sesuai dengan tema website.

Tombol tetap terlihat jelas ketika dibutuhkan.

Pada smartphone, posisikan tombol agar tidak tertutup navigasi sistem atau elemen lainnya.

Ketika buku dibuka kembali, sembunyikan tombol admin dengan animasi fade-out.

Tombol ADMIN tersebut berfungsi sebagai pintu masuk menuju halaman login Admin Dashboard.

Jangan tampilkan tombol admin secara mencolok kepada pengunjung umum.

### B. Halaman Login Admin

Ketika tombol ADMIN diklik, tampilkan halaman login dengan desain yang tetap mengikuti tema yearbook.

Sediakan:

Input username atau email.

Input password.

Tombol login.

Tombol tampilkan atau sembunyikan password.

Validasi login.

Pesan kesalahan jika login gagal.

Fitur logout.

Proteksi halaman dashboard.

Ketentuan keamanan:

Gunakan autentikasi backend.

Jangan menyimpan password admin dalam JavaScript frontend.

Jangan menanam password atau kredensial rahasia di source code publik.

Gunakan password hashing yang aman.

Gunakan session atau token autentikasi yang aman.

Lindungi seluruh endpoint pengelolaan data.

Batasi percobaan login untuk mencegah brute force.

Pastikan pengunjung biasa tidak dapat mengakses fitur admin hanya dengan membuka URL dashboard.

Jika backend belum dikonfigurasi, siapkan struktur autentikasi yang dapat dihubungkan ke backend.

### C. Tampilan Utama Admin Dashboard

Setelah berhasil login, tampilkan dashboard profesional.

Gunakan desain admin modern dengan warna cream, ivory, beige, dan aksen sage green agar tetap selaras dengan yearbook.

Layout dashboard:

Sidebar navigasi di sebelah kiri.

Header dashboard.

Area konten utama.

Ringkasan data.

Tombol aksi.

Form edit.

Tabel atau daftar data.

Notifikasi berhasil atau gagal.

Buat dashboard responsif untuk desktop dan smartphone.

Menu sidebar:

Overview

Edit Cover

Edit Wali Kelas

Kelola Siswa

Kelola Foto Kebersamaan

Kelola Pesan Anonim

Edit Halaman

Pengaturan Website

Backup dan Restore

Logout

### D. Overview Dashboard

Tampilkan ringkasan:

Jumlah siswa.

Jumlah foto siswa yang sudah diunggah.

Jumlah foto kebersamaan.

Jumlah pesan anonim.

Jumlah pesan yang menunggu moderasi.

Status website.

Gunakan kartu statistik yang sederhana dan mudah dibaca.

### E. Edit Cover

Admin dapat:

Mengubah judul yearbook.

Mengubah tahun angkatan.

Mengubah tagline.

Mengganti desain atau gambar cover.

Mengubah gambar atau tekstur sampul jika diperlukan.

Sediakan preview sebelum perubahan diterapkan.

### F. Edit Wali Kelas

Admin dapat:

Mengubah nama wali kelas.

Mengubah mata pelajaran.

Mengunggah foto wali kelas.

Mengubah pesan wali kelas.

Mengubah keterangan tambahan.

Data awal harus menggunakan:

Perdini Adma Sari, S.Pd.

### G. Kelola Siswa

Tampilkan seluruh 32 siswa resmi dalam daftar yang mudah dikelola.

Admin dapat:

Mengunggah foto siswa.

Mengganti foto siswa.

Menghapus foto siswa.

Mengedit informasi siswa.

Mengatur keterangan atau deskripsi siswa.

Melihat preview profil siswa.

Ketentuan penting:

Seluruh 32 siswa resmi harus tetap tersedia.

Jangan menghapus atau mengubah daftar siswa secara otomatis.

Jangan mengubah urutan siswa tanpa tindakan admin.

Jangan membuat siswa tambahan secara otomatis.

Perubahan nama harus dilakukan secara sadar melalui dashboard.

Jika foto belum tersedia, tampilkan placeholder.

Sediakan pencarian berdasarkan nama agar admin mudah menemukan siswa.

### H. Kelola Foto Kebersamaan

Admin dapat:

Mengunggah banyak foto sekaligus.

Menambahkan satu foto.

Mengganti foto.

Menghapus foto.

Mengubah caption.

Mengubah tanggal kegiatan.

Mengatur urutan foto.

Memindahkan foto ke halaman lain.

Melihat preview sebelum menyimpan.

Pastikan foto yang ditambahkan dapat muncul otomatis pada halaman yearbook sesuai pengaturan admin.

### I. Kelola Pesan Anonim

Admin dapat:

Melihat seluruh pesan yang masuk.

Melihat nama penerima.

Menyetujui pesan.

Menolak pesan.

Menyembunyikan pesan.

Menghapus pesan.

Mencari pesan berdasarkan nama penerima.

Melihat pesan yang menunggu moderasi.

Jangan tampilkan identitas pengirim kepada pengunjung.

Pesan yang belum disetujui tidak boleh langsung tampil di yearbook.

### J. Edit Seluruh Halaman

Sediakan fitur pengelolaan konten untuk seluruh halaman yang memungkinkan admin mengubah:

Judul halaman.

Subjudul.

Teks.

Caption.

Foto.

Ornamen dekoratif.

Informasi tambahan.

Urutan konten jika sesuai.

Pastikan admin dapat melihat preview perubahan sebelum menyimpannya.

### K. Pengaturan Website

Sediakan pengaturan untuk:

Mengaktifkan atau menonaktifkan audio.

Mengatur volume audio.

Mengganti background music.

Mengatur kualitas efek visual.

Mengaktifkan atau menonaktifkan partikel.

Mengatur informasi yearbook.

Mengatur tampilan halaman.

Mengatur status fitur pesan anonim.

Pengaturan harus tersimpan dan diterapkan pada tampilan pengunjung.

### L. Backup dan Restore

Sediakan fitur:

Backup data website.

Export data siswa.

Export data foto dan informasi terkait jika memungkinkan.

Export pesan anonim.

Import data dari file backup.

Restore data dari backup.

Gunakan format yang sesuai, misalnya JSON untuk data dan arsip untuk file aset.

Tambahkan konfirmasi sebelum proses restore karena proses tersebut dapat mengganti data yang sudah ada.

### M. Sistem Penyimpanan

Gunakan backend dan database untuk menyimpan perubahan admin secara permanen.

Jangan hanya menyimpan perubahan di state frontend atau localStorage jika website digunakan secara publik.

Gunakan sistem upload file yang aman untuk gambar dan audio.

Ketentuan:

Validasi jenis file.

Batasi ukuran file.

Gunakan nama file yang aman.

Optimalkan gambar setelah upload.

Simpan metadata file.

Lindungi endpoint upload.

Pastikan perubahan dapat dilihat pengunjung setelah disimpan.

Jika menggunakan layanan backend seperti Supabase atau layanan lain, buat integrasi secara benar dan sertakan panduan konfigurasi.

### N. Preview dan Publikasi

Setiap perubahan konten sebaiknya memiliki tombol:

Preview.

Simpan.

Batalkan.

Setelah admin menyimpan perubahan, tampilkan notifikasi bahwa perubahan berhasil.

Sediakan mekanisme agar perubahan yang sudah disimpan tampil di website pengunjung tanpa harus mengedit source code atau membangun ulang proyek secara manual.

### O. Standar Admin Dashboard

Pastikan:

Dashboard mudah dipahami.

Semua menu berfungsi.

Semua form memiliki validasi.

Semua tombol berfungsi.

Perubahan data tersimpan.

Admin dapat mengelola seluruh konten.

Pengunjung biasa tidak dapat mengakses dashboard.

Dashboard nyaman digunakan pada smartphone.

Tidak ada data yang hilang tanpa konfirmasi.

Tampilkan pesan error yang jelas jika penyimpanan gagal.

## 11. RESPONSIVE DESIGN

Website harus berjalan dengan baik di:

Desktop.

Laptop.

Tablet.

Smartphone Android.

Smartphone iOS.

Pada desktop:

Buku tampil besar dan berada di tengah.

Gunakan perspektif 3D yang jelas.

Navigasi menggunakan mouse dan keyboard.

Pada smartphone:

Sesuaikan ukuran buku dengan layar.

Gunakan swipe untuk membalik halaman.

Tombol navigasi mudah disentuh.

Ukuran teks tetap terbaca.

Kurangi efek 3D yang terlalu berat.

Pastikan tidak terjadi overflow horizontal.

Admin Dashboard memiliki navigasi mobile yang nyaman.

Jangan membuat versi mobile hanya dengan mengecilkan tampilan desktop.

Sesuaikan komposisi buku dan halaman dengan ukuran layar.

## 12. TEKNOLOGI YANG DIGUNAKAN

Gunakan teknologi berikut sesuai kebutuhan:

Frontend:

HTML5.

CSS3.

JavaScript modern.

Vite.

3D:

Three.js.

WebGL.

Mesh deformation.

Custom shader jika diperlukan.

Animation:

GSAP.

GSAP Timeline.

Backend:

Node.js jika diperlukan.

Database untuk penyimpanan pesan dan konten.

API untuk komunikasi frontend dan backend.

Autentikasi admin.

Penyimpanan aset untuk foto dan audio.

Pilih teknologi yang stabil dan sesuai kebutuhan.

Jangan menambahkan library yang tidak diperlukan.

## 12A. ARSITEKTUR RENDER YANG DIHARAPKAN

**Pilih satu jalur implementasi — jangan mencampur paradigma secara serampangan.**

**Jalur default (sesuai brief lama):** Vite + JavaScript ES Modules + Three.js + GSAP + CSS/HTML semantik + Node.js backend/API dan database. Pecah ke modul `BookRig`, `CoverHinge`, `PageMesh`, `PageCurlSolver`, `PageTextureRenderer`, `PageTurnController`, `CameraRig`, `LightingRig`, `InteractionController`, `ContentRepository`, `AdminDashboard`, `AudioManager`, `QualityManager`.

**Jalur alternatif jika ada alasan teknis kuat:** React + R3F + Drei + GSAP. Tetap satu sumber state untuk page turn, jangan memicu React rerender setiap frame deformasi. Update geometry/shader uniforms dalam render loop. Cocokkan versi `react`, `@react-three/fiber`, dan `@react-three/drei`.

**Aturan integrasi:**

1. Semua mesh, material, dan texture punya owner jelas serta `dispose()` saat tidak dipakai. Hapus event listener dan GSAP timeline di unmount/teardown.
2. Hindari pembuatan buffer geometry/material/texture baru pada setiap `requestAnimationFrame`.
3. Pakai satu renderer/canvas untuk pengalaman buku, dan render hanya selama animasi atau saat ada state/scene yang berubah bila arsitektur memungkinkan.
4. Hindari dua sumber gerakan yang saling bertentangan. GSAP mengatur parameter progress; PageCurlSolver menghitung pose; Three.js merender pose tersebut.
5. Interaksi aksesibilitas memakai elemen DOM nyata dan *focus management*, bukan hanya objek 3D yang tidak bisa dijangkau keyboard.
6. Pisahkan backend/API secara aman; client tidak menyimpan kredensial rahasia. Status koneksi data nyata harus dibedakan dari demo offline.

## 13. OPTIMASI DAN PERFORMA

Pastikan website berjalan lancar.

Target:

Animasi mendekati 60 FPS pada perangkat yang mendukung.

Loading aset secara bertahap.

Lazy loading untuk foto.

Kompresi gambar.

Optimasi tekstur 3D.

Penggunaan memori yang efisien.

Penghapusan objek 3D yang tidak digunakan.

Pengurangan efek visual pada perangkat lemah.

Penanganan error.

Fallback jika WebGL tidak tersedia.

Gunakan format gambar yang efisien seperti WebP atau AVIF jika sesuai.

Jangan memuat seluruh foto resolusi tinggi sekaligus.

Pastikan animasi utama tetap berfungsi pada perangkat dengan kemampuan GPU terbatas.

## 13A. PERFORMANCE BUDGET, QUALITY TIERS, DAN ERROR RECOVERY

Target kualitas harus diukur di perangkat nyata, tidak boleh hanya diucapkan dalam prompt.

| Level | Perangkat contoh | Target pengalaman |
|---|---|---|
| **High** | Desktop/laptop GPU memadai | Deformasi halaman detail, material PBR lengkap, bayangan dinamis, postprocessing subtil. Target **60 FPS** jika perangkat mendukung. |
| **Balanced** | Laptop umum/tablet kuat | Kurangi subdivision, anisotropy, shadow resolution dan efek postprocessing; buku dan drag tetap berfungsi. |
| **Lite** | Smartphone kelas menengah/rendah | Mesh lebih sederhana, render pixel ratio dibatasi, nonaktifkan partikel/DOF/bloom, tetapi pertahankan siluet dan gerak lembar. |
| **Fallback** | Tanpa WebGL/context lost/reduced motion | Mode membaca HTML/CSS yang dapat digunakan penuh dan tetap memperlihatkan 12 halaman editorial. |

- Buat tes dan pencatatan **FPS rata-rata, 1% low (bila instrumentasi tersedia), waktu startup, jumlah draw calls, triangles, JS heap perkiraan, GPU texture memory perkiraan, dan ukuran aset**. Laporkan metrik yang benar-benar diukur.
- *Adaptive quality* boleh menurunkan pixel ratio, shadow detail, subdivision dan efek tambahan jika frame time memburuk berkelanjutan. Tidak boleh menghapus kontrol utama atau konten.
- Gunakan resolusi tekstur sesuai jarak kamera; jangan memuat 32 foto portrait kualitas penuh pada initial load. Prioritaskan cover + halaman aktif + tetangga, kemudian prefetch bertahap.
- Gunakan cache dengan batas ukuran, *object URL cleanup*, browser image decode, dan penanganan abort request saat halaman berpindah.
- Jika context WebGL hilang, beri notifikasi aksesibel dan pulihkan bila mungkin; bila gagal, tampilkan reading fallback tanpa kehilangan data.
- Tinjau konsumsi baterai di mobile: batasi render idle, hentikan animasi saat tab tak aktif, tidak memaksa efek terus-menerus.
- Jangan memaksa penggunaan postprocessing jika membuat teks/foto blur, frame rate anjlok, atau rendering tidak konsisten antarperangkat.

## 14. AKSESIBILITAS DAN KENYAMANAN

Sediakan:

Navigasi keyboard.

Tombol yang memiliki label jelas.

Kontras teks yang cukup.

Alternatif tampilan jika WebGL tidak tersedia.

Dukungan prefers-reduced-motion.

Area tombol yang mudah disentuh.

Pesan error yang mudah dipahami.

Pastikan website tetap dapat digunakan tanpa harus mengandalkan animasi.

## 15. KUALITAS DAN STANDAR IMPLEMENTASI

Ikuti standar berikut:

Jangan membuat website yang hanya berupa mockup.

Jangan membuat tombol yang tidak berfungsi.

Jangan membuat navigasi palsu.

Jangan menggunakan gambar siswa fiktif.

Jangan mengubah daftar nama resmi.

Jangan menghilangkan fitur yang sudah diminta.

Jangan mengganti animasi page turning dengan slide biasa.

Jangan membuat halaman terlalu ramai.

Jangan membuat tampilan mobile berantakan.

Pastikan setiap halaman memiliki konten yang benar.

Pastikan seluruh foto dan data dapat diperbarui.

Pastikan fitur pesan anonim memiliki validasi.

Pastikan animasi buku dan halaman berjalan sesuai urutan.

Pastikan semua interaksi dapat diuji.

Pastikan Admin Dashboard benar-benar terhubung ke data website.

Jangan membuat dashboard yang hanya berupa tampilan tanpa fungsi.

Pastikan perubahan admin tersimpan secara permanen.

Pastikan autentikasi dan keamanan admin diterapkan.

Gunakan arsitektur kode modular dan mudah dipelihara.

## 15A. VISUAL QA DAN TES PENERIMAAN YANG DAPAT DIBUKTIKAN

**Wajib membuat checklist dan benar-benar menjalankan tes, bukan hanya menuliskannya:**

1. **Closed cover inspection:** kamera depan, 3/4 kiri, 3/4 kanan; cover memiliki tebal, sudut fisik, spine, bahan matte, dan highlight realistis.
2. **Opening inspection:** rekam/lihat beberapa frame pada progress 0%, 25%, 50%, 75%, 100%; engsel akurat, sampul tidak memotong halaman.
3. **Page-turn inspection:** uji frame pada progress 0%, 10%, 30%, 50%, 70%, 90%, 100%; periksa UV recto/verso, curvature, normals, contact shadow, dan collision.
4. **User drag inspection:** tarik pendek lalu lepas (rollback), tarik lebih jauh (commit), gerak lambat, gerak cepat, drag diagonal, pointer keluar canvas, `pointercancel`, swipe kiri/kanan.
5. **Reading inspection:** zoom desktop dan smartphone, baca seluruh teks, pastikan 32 nama sesuai, placeholder tidak menjadi wajah palsu, dan konten halaman tidak terpotong.
6. **Navigation inspection:** 1 sampai 12 dan kembali, TOC jump, keyboard, batas halaman, tidak ada *double turn*, tombol tutup, dan buka ulang.
7. **CMS inspection:** login/logout, autentikasi dan proteksi API, edit cover/wali kelas/siswa/foto/caption/farewell, upload, preview, simpan, refresh, validasi, backup/restore.
8. **Anonymous messages inspection:** pilih satu dari 32 penerima, validasi, anti-spam, status pending, moderasi sebelum tayang, pencegahan XSS serta submit ulang.
9. **Cross-device inspection:** desktop dengan mouse, Android touch, iPhone/iOS touch (jika perangkat tersedia), tablet, orientasi portrait/landscape, zoom browser.
10. **Perf inspection:** periksa FPS, long tasks, memory growth setelah 30+ flip, dan kestabilan rendering pada mode High/Balanced/Lite.
11. **Failure inspection:** offline, gambar tidak ditemukan, backend tidak terhubung, WebGL context lost, pemutaran audio diblokir, *reduced motion*.

**Bukti yang harus diserahkan:** screenshot sudut cover, screenshot spread terbuka, rangkaian 3–5 frame deformasi halaman, capture/tabel hasil tes fungsional, serta daftar fitur yang benar-benar berjalan. Jika tidak dapat menjalankan browser/device test, nyatakan secara eksplisit belum diuji; jangan menuliskan PASS palsu.

## 16. OUTPUT DAN HASIL AKHIR

Bangun proyek website lengkap dengan struktur folder yang jelas.

Berikan:

Seluruh source code.

File HTML, CSS, dan JavaScript.

File konfigurasi proyek.

Komponen buku 3D.

Sistem animasi page turning.

Seluruh halaman yearbook.

Sistem navigasi.

Sistem data wali kelas.

Sistem data 32 siswa.

Sistem galeri foto.

Fitur pesan anonim.

Sistem audio opsional.

Admin Dashboard lengkap.

Sistem login dan autentikasi admin.

Fitur upload dan pengelolaan foto.

Fitur edit seluruh halaman.

Sistem backup dan restore.

Responsive design.

File README berisi panduan instalasi dan penggunaan.

Pastikan proyek dapat dijalankan secara lokal.

Sertakan perintah instalasi dan menjalankan proyek, misalnya:

npm install

npm run dev

Jika menggunakan backend, sertakan juga instruksi konfigurasi database, environment variables, dan menjalankan server.

Jangan memberikan source code yang terpotong.

Jangan menghilangkan file penting.

Jika terdapat fitur yang belum dapat dijalankan karena membutuhkan foto, audio, kredensial, atau konfigurasi eksternal, sediakan placeholder dan jelaskan cara mengisinya.

## 17. TAHAP PENGERJAAN

Kerjakan proyek dengan urutan berikut:

Buat struktur folder dan konfigurasi proyek.

Buat desain dasar dan loading screen.

Buat model buku hardcover 3D.

Buat animasi buku terbang menuju kamera.

Buat animasi membuka dan menutup buku.

Implementasikan sistem realistic page turning.

Buat seluruh 12 halaman.

Masukkan data resmi wali kelas dan 32 siswa.

Buat sistem galeri foto.

Buat fitur pesan anonim.

Buat sistem navigasi.

Buat Admin Dashboard.

Buat sistem login dan autentikasi.

Hubungkan dashboard ke database.

Buat fitur pengelolaan seluruh konten.

Buat fitur backup dan restore.

Tambahkan tombol ADMIN kecil di pojok kiri bawah ketika buku tertutup.

Tambahkan audio opsional.

Implementasikan responsive design.

Optimalkan performa.

Uji seluruh fitur dan perbaiki error.

Jangan berhenti setelah membuat tampilan awal.

Lanjutkan sampai seluruh fungsi utama selesai.

## 18. KRITERIA KEBERHASILAN

Website dinyatakan berhasil jika:

Loading screen tampil sesuai konsep.

Buku 3D dapat terbang menuju tengah layar.

Buku dapat dibuka dan ditutup.

Buku memiliki tampilan hardcover yang realistis.

Halaman dapat dibalik dengan animasi kertas 3D.

Pengunjung dapat menggunakan mouse, touch, dan navigasi tombol.

Seluruh 12 halaman dapat diakses.

Profil wali kelas tampil dengan benar.

Seluruh 32 siswa tampil tepat satu kali dan sesuai urutan.

Galeri foto dapat menampilkan foto dan caption.

Pesan anonim dapat dikirim dengan memilih penerima.

Navigasi daftar isi berfungsi.

Audio dapat diaktifkan dan dinonaktifkan.

Tombol ADMIN muncul ketika buku sudah tertutup.

Tombol ADMIN tersembunyi ketika buku terbuka.

Login admin berfungsi.

Admin Dashboard dapat diakses dengan aman.

Admin dapat mengedit seluruh konten website.

Admin dapat mengunggah dan mengganti foto.

Admin dapat mengelola pesan anonim.

Perubahan admin tersimpan di database.

Tampilan responsif di desktop dan smartphone.

Website tetap berjalan dengan performa yang baik.

Setelah pembaca **menekan tombol Tutup Buku** dari halaman terakhir, buku menutup dengan animasi masuk akal dan dapat kembali ke tampilan awal; jangan auto-close tanpa tindakan pengguna.

## 19. INSTRUKSI KHUSUS ADMIN DASHBOARD

Prioritaskan Admin Dashboard sebagai bagian penting dari website.

Saya ingin website ini dapat dikelola sendiri setelah selesai dibuat.

Saya tidak ingin harus membuka kode program setiap kali ingin mengganti foto, mengedit nama, menambahkan kenangan, atau mengubah tulisan.

Semua pengelolaan harus dilakukan melalui satu Admin Dashboard yang terintegrasi dengan website utama.

Tombol masuk dashboard harus berupa tulisan kecil ADMIN di pojok kiri bawah yang muncul ketika buku berada dalam keadaan tertutup.

Ketika tombol tersebut diklik, arahkan admin ke halaman login. Setelah login berhasil, tampilkan dashboard lengkap.

Pastikan dashboard memiliki fungsi nyata, bukan sekadar desain visual.

## 20. PRIORITAS UTAMA

Buat pengalaman membaca yearbook 3D yang realistis, elegan, interaktif, dan emosional.

Fokuskan kualitas pada:

Model buku 3D.

Animasi pembukaan buku.

Realistic page turning.

Desain seluruh halaman.

Pengalaman membaca di smartphone.

Kelengkapan data resmi kelas.

Fitur pesan anonim.

Admin Dashboard yang berfungsi penuh.

Kemudahan mengedit seluruh konten tanpa mengubah source code.

Keamanan dan penyimpanan data.

Hasil akhirnya harus terasa seperti sebuah buku kenangan kelas XII IPS yang benar-benar dapat dibuka dan dibaca secara digital, sekaligus mudah dikelola melalui Admin Dashboard.


## 21. URUTAN PRIORITAS UNTUK CODING AGENT — JANGAN BERHENTI DI MOCKUP

Jalankan pekerjaan dalam milestone yang saling bisa diuji:

**M1 — Physical object:** hardcover + spine + hinge + page stack + studio lighting, dengan screenshot 3 sudut. Jangan menambah efek dekoratif dulu.

**M2 — Realistic paper:** recto/verso + deformasi dua dimensi + shadow + drag/release + state machine. Ini adalah tolok ukur utama. Jika belum realistis, lakukan iterasi visual sebelum menambahkan banyak konten.

**M3 — Editorial content:** petakan 12 halaman secara benar, muat 32 nama siswa, wali kelas, placeholder foto, page 12 farewell, TOC interaktif, responsivitas.

**M4 — Data & CMS:** real API/database, login aman, upload dan pengelolaan, pesan anonim termoderasi, backup/restore.

**M5 — Polish & shipping:** quality tiers, audio opsional, accessibility, fallback WebGL, build produksi, dokumentasi dan tes menyeluruh.

Jangan menuliskan komentar `TODO` untuk fitur yang dinyatakan selesai. Jika ada komponen yang membutuhkan resource eksternal (foto, soundtrack, credential database), buat batas integrasi, placeholder, validasi, dan petunjuk konfigurasi yang dapat dicoba.

## 22. DEFINITION OF DONE — STANDAR KELULUSAN VISUAL DAN TEKNIS

| Aspek | Kriteria hasil akhir |
|---|---|
| Cover | Tebal dan berengsel; material mempunyai respon cahaya mikro; 3D bukan ilusi CSS. |
| Buku terbuka | Ada spine, gutter, bayangan kontak, tebal tumpukan yang masuk akal. |
| Balik halaman | Deformasi kertas bertahap, dua sisi konten benar, kecepatan terukur, tidak interpenetrasi, tidak ada geometri meloncat. |
| Interaksi | Mouse, drag, swipe, keyboard, tombol, dan TOC konsisten dan tidak balapan state. |
| Konten | Semua 12 halaman editorial tersedia termasuk farewell; semua 32 siswa tepat sekali sesuai urutan aslinya. |
| Dashboard | Edit konten, upload, preview, login aman, penyimpanan persistent, dan perubahan tampil di buku. |
| Pesan anonim | Pengirim anonim, penerima benar, validasi, rate-limit dan moderasi sebelum tampil. |
| Responsif | Desktop dan smartphone layak pakai tanpa clipping, teks kecil tak terbaca, atau kontrol tersembunyi. |
| Performa | Ada pengukuran dan tier kualitas; fallback nyata bila GPU/WebGL tak memadai. |
| Delivery | Source code utuh, konfigurasi, README, langkah install, tes yang telah dijalankan, dan keterbatasan yang diakui. |

**Instruksi akhir:** jika visual buku belum tampak sebagai objek fisik saat screenshot diam, atau page turning masih terlihat seperti *card flip*, jangan menyebutnya *ultra-realistic*. Perbaiki geometri, material, cahaya, dan deformasi terlebih dahulu. Kesetiaan pada data resmi, keamanan dashboard, dan fungsi pengunjung harus tetap dijaga.
