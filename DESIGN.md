# Alfamart — arahan desain dan naskah

Ditinjau 15 Oktober 2026. Ini konsep presentasi produk Nuratech untuk Alfamart, bukan situs korporat resmi atau klaim implementasi yang sudah berjalan.

## Referensi yang diperiksa

- Portal Tenant Alfamart: https://tenant.alfamart.co.id/
- Stylesheet portal tenant: https://tenant.alfamart.co.id/static/css/uiux.css
- Waralaba Alfamart: https://waralaba.alfamart.co.id/
- Artikel sumber foto gerai: https://alfamart.co.id/news-detail/perbaikan-layanan-memberikan-kenyamanan-belanja-menjadi-fokus-alfamart-2018

Homepage korporat mengembalikan pemeriksaan browser saat riset. Karena itu warna dan font diambil dari stylesheet portal tenant yang dapat diperiksa, bukan disebut sebagai panduan merek korporat resmi.

## Warna

| Peran | Warna | Dasar |
|---|---|---|
| Latar utama | #FFFFFF | Keputusan desain: putih dominan agar presentasi mudah dipindai |
| Aksi utama | #BB1724 | Navbar dan bagian portal tenant resmi |
| Informasi / identitas sekunder | #005DA6 | Link dan tombol portal tenant resmi |
| Aksen | #FFC604 | Border aksen portal tenant resmi; jangan dipakai sebagai teks di atas putih |
| Latar sekunder | #F8F9FB | Latar portal tenant resmi |
| Teks judul | #173859 | Adaptasi navy untuk keterbacaan |
| Teks pendukung | #637083 | Adaptasi netral untuk paragraf |

Merah untuk CTA dan penekanan; biru untuk informasi dan section ekosistem; kuning sebagai garis kecil. Warna status sukses/peringatan/error tetap semantik. Foto gerai membawa merah-kuning merek tanpa membuat semua bidang berwarna pekat.

## Tipografi dan logo

Portal tenant mengimpor Nunito dari Google Fonts. Clone menggunakan Nunito 400–800, judul tebal tanpa serif dekoratif, paragraf 16–17 px di hero, dan ruang antarbaris lega. Font fallback: system-ui, sans-serif. Google Fonts memerlukan koneksi internet; fallback tetap tersedia.

Logo asli dipakai sebagai gambar tanpa digambar ulang atau diubah proporsinya. Versi warna pada putih, versi putih pada footer biru. Favicon berasal dari portal tenant.

## Gambar

Hero memakai video gerai yang diberikan pengguna (`gemini_generated_video_936eb5c6.mp4`, H.264 1280×720, 10 detik). Video diputar tanpa suara dan berulang, dengan overlay gelap untuk kontras teks. Poster berasal dari frame pertama video. Preferensi reduced motion menampilkan poster, dan playback berhenti saat tab tersembunyi. Foto gerai resmi tetap dipakai pada login dan bagian solusi. Banner tenant resmi ditampilkan utuh dengan object-fit contain agar teks dalam gambar tidak terpotong. Foto gerai berasal dari artikel arsip; bukan representasi kondisi seluruh gerai saat ini. Video bandara dan semua aset perjalanan dari clone telah dibuang.

| File lokal | URL sumber |
|---|---|
| static/images/alfamart/logo.png | https://tenant.alfamart.co.id/static/images/logo_alfamart.png |
| static/images/alfamart/logo-white.png | https://tenant.alfamart.co.id/static/images/alfa_putih.png |
| static/images/alfamart/store.jpg | https://alfamart.co.id/storage/page/January2020/r1ChtKmS7XQnN5if9uFY.jpg |
| static/images/alfamart/tenant.jpg | https://tenant.alfamart.co.id/static/images/header_tenant.jpg |
| static/favicon.ico | https://tenant.alfamart.co.id/static/images/favico.ico |

Aset disimpan lokal agar tampilan tidak bergantung pada hotlink. Hak merek dan materi tetap milik pemiliknya.

## Naskah dan kebutuhan desain

Portal tenant membahas penyewaan ruang usaha di area gerai; portal waralaba menekankan kemudahan operasional dan dukungan mitra. Konteks tersebut sesuai dengan modul tenant, vendor, tagihan, dan pengangkutan yang sudah ada. Clone tidak mengklaim fitur POS, stok, loyalitas, atau integrasi Alfagift yang belum dibangun.

Naskah baru ditulis untuk presentasi Direksi:
- Hero: “Setiap gerai. Satu arah. Tumbuh bersama.”
- Nilai utama: visibilitas operasional, koordinasi tim, informasi terpusat.
- Tenant: “Peluang usaha, tertata sejak awal.”
- Operasional: “Gerai siap melayani setiap hari.”
- Komersial: “Tagihan tertib. Informasi lebih jelas.”
- Kebersihan: “Lingkungan terawat, layanan nyaman.”

CTA mengarah ke solusi dan ruang kerja yang tersedia. Hindari metrik jumlah gerai, klaim penghematan, hasil implementasi, serta janji real-time tanpa data pendukung. Footer menandai halaman sebagai konsep presentasi Nuratech. Tab solusi, menu mobile, tautan anchor, dan alur login tetap bekerja; konsol memerlukan API khusus yang belum dikonfigurasi.
