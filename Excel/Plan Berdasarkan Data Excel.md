# 1. Konsep Utama Sistem

Sistem sebaiknya tidak mengikuti nama file Excel satu per satu. Sistem harus mengikuti **alur bisnis penerbitan**.

Struktur besarnya:

```text
1. Master Database
   Menyimpan data utama: penulis, penerbit, buku, layouter, legalitas, link distribusi.

2. Operational Timeline
   Mengelola proses kerja harian: DP, naskah masuk, layout, cover, ISBN, HAKI, cetak, upload, resi.

3. Monitoring & Reporting
   Menampilkan progres, keterlambatan, beban kerja, legalitas, upload, distribusi, dan publikasi.
```

Objek pusatnya adalah:

```text
Naskah / Buku / Order
```

Semua proses harus terhubung ke satu ID utama:

```text
Naskah_ID
```

Jangan memakai judul buku sebagai kunci utama, karena judul bisa sama, berubah, atau ditulis tidak konsisten.

---

# 2. Basis File Excel yang Dipakai

| File Excel                               | Isi Utama                                                                                                           | Dijadikan Fitur                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **DATABASE PENULIS INDONESIA.xlsx**      | Database calon/mitra penulis, kontak, provinsi, email, WA, jabatan, sumber data, keterangan email/WA                | Database Penulis + CRM Penulis              |
| **Database penerbit .xlsx**              | Database penerbit, kota/asal, IG, FB, email, WA, LinkedIn, Twitter, TikTok, validasi WA/email                       | Database Penerbit + CRM Penerbit            |
| **Alur Naskah.xlsx**                     | Timeline proses naskah: DP, naskah masuk, layout, cover, ISBN/QRCBN/QRSBN, HAKI, cetak, Playbook, Shopee, OMP, resi | Operational Timeline utama                  |
| **Naskah Hana.xlsx**                     | Naskah masuk, penerbit, judul buku, layouter, tanggal, naskah konversi, evaluasi training layouter                  | Database Naskah Masuk + Assignment Layouter |
| **PENGAJUAN ISBN QRCBN QRSBN HAKI.xlsx** | E-ISBN, ISBN, QRCBN, QRSBN, HAKI, revisi, status, tanggal pengajuan, Playbook, penerbit khusus                      | Legalitas Buku + Tracking Pengajuan         |
| **UPLOAD PLAYBOOK.xlsx**                 | Judul, nama penulis, link Playbook, nama layouter                                                                   | Database Buku Digital + Upload Playbook     |
| **Link Buku shopee .xlsx**               | Judul buku, nama penulis, link Shopee                                                                               | Database Marketplace + Upload Shopee        |
| **Link Google Scholar.xlsx**             | Judul, link Google Scholar, tanggal unduhan, jumlah unduhan                                                         | Database Scholar + Monitoring Publikasi     |

---

# 3. Fitur Database

## A. Database Penulis

Kolom yang ditemukan:

```text
Tanggal
No.
Nama
Kota / Asal Provinsi
Informasi Dari
Email
No. Telpon/Whatsapp
Jabatan
Keterangan Email & WA
```

### Fitur yang Dibutuhkan

| Fitur                     | Fungsi                                                                 |
| ------------------------- | ---------------------------------------------------------------------- |
| Tambah/Edit Penulis       | Input nama, email, WA, provinsi, jabatan, sumber data                  |
| Import Penulis dari Excel | Import dari sheet FILE MENTAH dan sheet provinsi                       |
| Deteksi Duplikat          | Berdasarkan nama, email, dan WA                                        |
| Validasi Kontak           | Email valid/tidak, WA aktif/tidak                                      |
| Segmentasi Penulis        | Dosen, guru, peneliti, mahasiswa, umum                                 |
| Filter Provinsi           | Berdasarkan Jawa Barat, Jawa Timur, Riau, Lampung, dll                 |
| Riwayat Follow-up         | Catat kapan penulis dihubungi                                          |
| Status Penulis            | Prospek, aktif, tidak aktif, sudah dihubungi, tertarik, tidak tertarik |

### Field Sistem

| Field                 | Wajib               |
| --------------------- | ------------------- |
| Penulis_ID            | Ya                  |
| Nama Penulis          | Ya                  |
| Email                 | Tidak, tapi penting |
| WhatsApp              | Tidak, tapi penting |
| Provinsi/Kota         | Ya                  |
| Jabatan/Profesi       | Tidak               |
| Instansi              | Tambahan baru       |
| Sumber Data           | Ya                  |
| Status Validasi Email | Ya                  |
| Status Validasi WA    | Ya                  |
| Status Follow-up      | Ya                  |
| Catatan               | Tidak               |

---

## B. Database Penerbit

Kolom yang ditemukan:

```text
No.
Nama Penerbit
Kota / Asal
Instagram
Facebook
Email
No. Whatsapp / Telp
LinkedIn
Twitter
TikTok
Validasi Whatsapp
Validasi Email
```

### Fitur yang Dibutuhkan

| Fitur                      | Fungsi                                            |
| -------------------------- | ------------------------------------------------- |
| Tambah/Edit Penerbit       | Menyimpan identitas penerbit                      |
| Import Penerbit dari Excel | Import dari DATA MENTAH dan sheet provinsi/negara |
| Validasi Kontak            | Cek WA/email aktif atau tidak                     |
| Database Media Sosial      | IG, FB, TikTok, Twitter, LinkedIn                 |
| Klasifikasi Penerbit       | Indie, mayor, kampus, komunitas, luar negeri      |
| CRM Penerbit               | Follow-up kerja sama                              |
| Status Kerja Sama          | Belum kontak, prospek, aktif, tidak aktif         |

### Field Sistem

| Field                 | Wajib |
| --------------------- | ----- |
| Penerbit_ID           | Ya    |
| Nama Penerbit         | Ya    |
| Kota/Provinsi/Negara  | Ya    |
| Email                 | Tidak |
| WhatsApp/Telp         | Tidak |
| Instagram             | Tidak |
| Facebook              | Tidak |
| TikTok                | Tidak |
| LinkedIn              | Tidak |
| Twitter               | Tidak |
| Status Validasi WA    | Ya    |
| Status Validasi Email | Ya    |
| Status Kerja Sama     | Ya    |

---

## C. Database Buku/Naskah

Ini adalah database inti sistem.

### Field Utama

| Field             | Sumber                                                         |
| ----------------- | -------------------------------------------------------------- |
| Naskah_ID         | Tambahan sistem                                                |
| Judul Buku        | Alur Naskah, Naskah Hana, Legalitas, Playbook, Shopee, Scholar |
| Nama Penulis      | Alur Naskah, Legalitas, Playbook, Shopee                       |
| Penulis_ID        | Relasi ke Database Penulis                                     |
| Penerbit_ID       | Relasi ke Database Penerbit                                    |
| Nama Penerbit     | Alur Naskah sheet SPT/Penerbit, Naskah Hana                    |
| Jenis Paket       | Alur Naskah sheet KBM/SPT                                      |
| Jenis Order       | Alur Naskah sheet Penerbit                                     |
| Jumlah Eksemplar  | Alur Naskah                                                    |
| Ukuran Buku       | Alur Naskah                                                    |
| Request Awal      | Alur Naskah                                                    |
| Perubahan Request | Alur Naskah                                                    |
| Jenis Legalitas   | ISBN/QRCBN/QRSBN                                               |
| Alamat Kirim      | Alur Naskah                                                    |
| Status Buku       | Dihitung otomatis dari timeline                                |

---

## D. Database Tim Produksi

Sheet penting:

```text
Naskah Masuk
Laporan evaluasi training layouter
Naskah Konversi
```

Kolom pada Naskah Masuk:

```text
No.
Penerbit
Judul Buku
Layouter
Tanggal
```

### Fitur yang Dibutuhkan

| Fitur                | Fungsi                                      |
| -------------------- | ------------------------------------------- |
| Database Layouter    | Menyimpan nama layouter                     |
| Assignment Naskah    | Menugaskan naskah ke layouter               |
| Beban Kerja Layouter | Hitung jumlah naskah per layouter           |
| Riwayat Pekerjaan    | Daftar buku yang pernah dikerjakan          |
| Evaluasi Training    | Target ACC, capaian mingguan, evaluasi      |
| Naskah Konversi      | Tracking konversi tesis, skripsi, disertasi |

### Field Sistem

| Field                   | Wajib |
| ----------------------- | ----- |
| Tim_ID                  | Ya    |
| Nama Tim/Layouter       | Ya    |
| Role                    | Ya    |
| Status Aktif            | Ya    |
| Kapasitas Pekerjaan     | Tidak |
| Target Mingguan/Bulanan | Tidak |
| Catatan Evaluasi        | Tidak |

---

## E. Database Legalitas Buku

Sheet yang ditemukan:

```text
E-ISBN
ISBN
QRCBN
QRSBN
HAKI
playbook
unived
undiksha
Penerbit Gemulun
Penerbit Edwrite Indonesia Publ
```

Kolom umum:

```text
No.
Judul Buku
Nama Penulis
Tanggal Pengajuan
Keterangan
REVISI SBLM PENGAJUAN
REVISI PERPUSNAS
PR
```

### Fitur yang Dibutuhkan

| Fitur                         | Fungsi                                   |
| ----------------------------- | ---------------------------------------- |
| Pengajuan ISBN                | Tracking ISBN cetak                      |
| Pengajuan E-ISBN              | Tracking ISBN digital                    |
| Pengajuan QRCBN               | Tracking QRCBN                           |
| Pengajuan QRSBN               | Tracking QRSBN                           |
| Pengajuan HAKI                | Tracking hak cipta                       |
| Revisi Sebelum Pengajuan      | Catatan revisi internal                  |
| Revisi Perpusnas              | Catatan revisi dari Perpusnas            |
| Status Legalitas              | Pengajuan, revisi, ditolak, sudah keluar |
| Upload Bukti Legalitas        | File sertifikat/barcode/dokumen          |
| Legalitas per Penerbit Khusus | Unived, Undiksha, Gemulun, Edwrite       |

### Field Sistem

| Field             | Wajib               |
| ----------------- | ------------------- |
| Legalitas_ID      | Ya                  |
| Naskah_ID         | Ya                  |
| Jenis Legalitas   | Ya                  |
| Tanggal Pengajuan | Ya                  |
| Status Pengajuan  | Ya                  |
| Nomor Legalitas   | Tidak, tapi penting |
| Tanggal Keluar    | Tidak               |
| Revisi Internal   | Tidak               |
| Revisi Perpusnas  | Tidak               |
| Catatan PR        | Tidak               |
| File Bukti        | Tidak               |
| PIC Pengajuan     | Ya                  |

Catatan penting:
Pada Excel, beberapa sheet legalitas memakai baris bulan seperti **SEPTEMBER**, **OKTOBER**, **NOVEMBER** di tengah tabel. Saat import, sistem harus membaca baris itu sebagai **periode**, bukan sebagai data buku.

---

## F. Database Buku Digital / Playbook

Sumber:

* **UPLOAD PLAYBOOK.xlsx**
* Sheet **playbook** pada file **PENGAJUAN ISBN QRCBN QRSBN HAKI.xlsx**

Kolom dari UPLOAD PLAYBOOK:

```text
NO
Judul
Nama Penulis
Link Playbook
Nama Layouter
```

### Fitur yang Dibutuhkan

| Fitur                  | Fungsi                                   |
| ---------------------- | ---------------------------------------- |
| Database Link Playbook | Menyimpan link buku di Google Play Books |
| Upload Playbook        | Proses upload buku digital               |
| Validasi Link          | Cek link sudah ada/belum                 |
| Status Upload          | Belum upload, proses, live, error        |
| PIC Upload             | Siapa yang upload                        |
| Relasi Layouter        | Siapa yang menyiapkan file               |

### Field Sistem

| Field          | Wajib           |
| -------------- | --------------- |
| Digital_ID     | Ya              |
| Naskah_ID      | Ya              |
| Judul Buku     | Ya              |
| Nama Penulis   | Ya              |
| Link Playbook  | Ya setelah live |
| Nama Layouter  | Tidak           |
| Tanggal Upload | Ya              |
| Status Upload  | Ya              |
| Catatan Error  | Tidak           |

---

## G. Database Marketplace / Shopee

Sumber: **Link Buku shopee .xlsx**

Kolom yang terbaca:

```text
Judul Buku
Nama Penulis
Link Buku Shopee
```

Pada file ini, baris header belum terlalu rapi karena kolom pertama berisi judul tetapi header-nya kosong. Di sistem, kolom pertama harus dianggap sebagai **Judul Buku**.

### Fitur yang Dibutuhkan

| Fitur                | Fungsi                                        |
| -------------------- | --------------------------------------------- |
| Database Link Shopee | Menyimpan link produk buku                    |
| Upload Produk Shopee | Tracking proses upload marketplace            |
| Validasi Link Produk | Cek link aktif/tidak                          |
| Status Produk        | Aktif, tidak aktif, stok kosong, perlu revisi |
| Harga dan Stok       | Tambahan baru yang belum ada di Excel         |
| Foto Produk          | Tambahan baru                                 |
| Deskripsi Produk     | Tambahan baru                                 |

### Field Sistem

| Field                | Wajib                  |
| -------------------- | ---------------------- |
| Marketplace_ID       | Ya                     |
| Naskah_ID            | Ya                     |
| Judul Buku           | Ya                     |
| Nama Penulis         | Ya                     |
| Link Shopee          | Ya setelah upload      |
| Harga                | Tidak, tapi disarankan |
| Stok                 | Tidak, tapi disarankan |
| Status Produk        | Ya                     |
| Tanggal Upload       | Ya                     |
| Tanggal Cek Terakhir | Tidak                  |

---

## H. Database Google Scholar

Sumber: **Link Google Scholar.xlsx**

Struktur yang ditemukan:

```text
Judul
Google Scholar 2026
Tanggal Unduhan
Jumlah Unduhan
```

Catatan: file ini memakai header bertingkat. Baris pertama seperti judul kategori, sedangkan header operasional ada di baris kedua.

### Fitur yang Dibutuhkan

| Fitur                 | Fungsi                               |
| --------------------- | ------------------------------------ |
| Database Link Scholar | Menyimpan link Google Scholar        |
| Monitoring Scholar    | Cek apakah buku/artikel sudah muncul |
| Monitoring Unduhan    | Catat jumlah unduhan                 |
| Monitoring Sitasi     | Tambahan baru                        |
| Status Indeks         | Sudah terindeks, belum, link rusak   |
| Riwayat Pengecekan    | Menyimpan tanggal cek berkala        |

### Field Sistem

| Field               | Wajib         |
| ------------------- | ------------- |
| Scholar_ID          | Ya            |
| Naskah_ID           | Ya            |
| Judul               | Ya            |
| Link Google Scholar | Ya            |
| Tanggal Unduhan/Cek | Ya            |
| Jumlah Unduhan      | Tidak         |
| Jumlah Sitasi       | Tambahan baru |
| Status Indeks       | Ya            |

---

# 4. Fitur Operational Berbasis Timeline

Ini bagian paling penting.

File **Alur Naskah.xlsx** menunjukkan bahwa operasional tidak disimpan sebagai status manual, tetapi sebagai **tanggal milestone**.

Contoh:

```text
Tanggal DP
Tanggal naskah masuk
Layout Selesai
Cover Selesai
Pengajuan ISBN/QRCBN/QRSBN
Keluarnya ISBN/QRCBN/QRSBN
HAKI diajukan admin
HAKI keluar
NAIK CETAK
Upload Playbook
Upload Shopee
Resi dikirim
```

Maka desain sistemnya:

```text
Satu naskah memiliki banyak event timeline.
Setiap event punya tanggal selesai.
Status otomatis dibaca dari ada/tidaknya tanggal.
```

---

## A. Template Timeline KBM

Sumber: sheet **KBM** pada **Alur Naskah.xlsx**

Timeline lengkap:

| Fase               | Step Timeline                        |
| ------------------ | ------------------------------------ |
| Pembayaran         | DP Masuk                             |
| Pembayaran         | Pelunasan                            |
| Intake             | Naskah Masuk                         |
| Data Order         | Jenis Paket                          |
| Data Order         | Jumlah Eksemplar                     |
| Data Order         | Ukuran                               |
| Request            | Request Penulis                      |
| Request            | Perubahan/Tambahan Request           |
| Legalitas Awal     | Pilihan ISBN/QRCBN/QRSBN             |
| Layout             | Naskah Dibagi ke Koordinator Layout  |
| Layout             | Layout Selesai                       |
| Cover              | Naskah Dibagi ke Koordinator Cover   |
| Cover              | Cover Selesai                        |
| Dokumen            | Surat Keaslian Diterima dari Penulis |
| Legalitas          | Pengajuan ISBN/QRCBN/QRSBN           |
| Legalitas          | ISBN/QRCBN/QRSBN Keluar              |
| HAKI               | HAKI Diajukan Admin                  |
| HAKI               | HAKI Keluar                          |
| Approval Cetak     | Naskah Di-ACC Cetak oleh Penulis     |
| Cetak              | Naik Cetak                           |
| Administrasi Akhir | JotForm Dibagi                       |
| Administrasi Akhir | Testimoni Dibagi                     |
| Administrasi Akhir | Sertifikat Dibagi                    |
| Distribusi Digital | Upload Playbook                      |
| Distribusi Digital | Link Playbook Dikirim ke Penulis     |
| Marketplace        | Upload Shopee                        |
| Marketplace        | Link Shopee Dikirim ke Penulis       |
| OMP                | Upload OMP                           |
| OMP                | Link OMP Dikirim ke Penulis          |
| Pengiriman         | Resi Dikirim ke Marketing            |
| Pengiriman         | Resi Dikirim ke Penulis              |

---

## B. Template Timeline Penerbit

Sumber: sheet **Penerbit** pada **Alur Naskah.xlsx**

Timeline ini lebih pendek dan fokus pada order dari penerbit.

| Fase           | Step Timeline                       |
| -------------- | ----------------------------------- |
| Pembayaran     | DP Masuk                            |
| Pembayaran     | Pelunasan                           |
| Intake         | Naskah Masuk                        |
| Identitas      | Penerbit                            |
| Identitas      | Nama Penulis                        |
| Identitas      | Judul                               |
| Order          | Jenis Orderan Layout/Cover/Cetak    |
| Order          | Kuantitas Eksemplar/Satuan          |
| Order          | Ukuran                              |
| Request        | Request Penerbit                    |
| Request        | Perubahan/Tambahan Request Penerbit |
| Layout         | Naskah Dibagi ke Koordinator Layout |
| Layout         | Layout Selesai                      |
| Cover          | Naskah Dibagi ke Koordinator Cover  |
| Cover          | Cover Selesai                       |
| HAKI           | HAKI Diajukan Admin                 |
| HAKI           | Nomor/Tanggal HAKI Keluar           |
| Approval Cetak | Naskah Di-ACC Cetak                 |
| Cetak          | Naik Cetak                          |
| Pengiriman     | Resi Dikirim ke Marketing           |
| Pengiriman     | Resi Dikirim ke Penulis             |

Catatan penting:
Kolom **“Nomor HAKI keluar”** sebaiknya dipisah menjadi dua field:

```text
Tanggal HAKI Keluar
Nomor HAKI
```

---

## C. Template Timeline SPT

Sumber: sheet **SPT** pada **Alur Naskah.xlsx**

Timeline SPT mirip KBM, tetapi punya **Nama Penerbit** dan pengiriman akhirnya ke **Penerbit**.

| Fase               | Step Timeline                        |
| ------------------ | ------------------------------------ |
| Identitas          | Nama Penerbit                        |
| Pembayaran         | DP Masuk                             |
| Pembayaran         | Pelunasan                            |
| Intake             | Naskah Masuk                         |
| Identitas Buku     | Nama Penulis                         |
| Identitas Buku     | Judul                                |
| Paket              | Jenis Paket                          |
| Paket              | Jumlah Eksemplar                     |
| Paket              | Ukuran                               |
| Request            | Request Penulis                      |
| Request            | Perubahan/Tambahan Request           |
| Legalitas Awal     | Pilihan ISBN/QRCBN/QRSBN             |
| Layout             | Naskah Dibagi ke Koordinator Layout  |
| Layout             | Layout Selesai                       |
| Cover              | Naskah Dibagi ke Koordinator Cover   |
| Cover              | Cover Selesai                        |
| Dokumen            | Surat Keaslian Diterima dari Penulis |
| Legalitas          | Pengajuan ISBN/QRCBN/QRSBN           |
| Legalitas          | ISBN/QRCBN/QRSBN Keluar              |
| HAKI               | HAKI Diajukan Admin                  |
| HAKI               | Nomor/Tanggal HAKI Keluar            |
| Approval Cetak     | Naskah Di-ACC Cetak oleh Penulis     |
| Cetak              | Naik Cetak                           |
| Administrasi Akhir | JotForm Dibagi                       |
| Administrasi Akhir | Testimoni Dibagi                     |
| Administrasi Akhir | Sertifikat Dibagi                    |
| Distribusi Digital | Upload Playbook                      |
| Distribusi Digital | Link Playbook Dikirim ke Penulis     |
| Marketplace        | Upload Shopee                        |
| Marketplace        | Link Shopee Dikirim ke Penulis       |
| OMP                | Upload OMP                           |
| OMP                | Link OMP Dikirim ke Penulis          |
| Pengiriman         | Resi Dikirim ke Marketing            |
| Pengiriman         | Resi Dikirim ke Penerbit             |

---

# 5. Cara Kerja Status Otomatis

Karena datanya berbasis tanggal selesai, status tidak perlu banyak dipilih manual.

| Kondisi                                    | Status Sistem                 |
| ------------------------------------------ | ----------------------------- |
| Tanggal step terisi                        | Selesai                       |
| Step kosong, step sebelumnya selesai       | Aktif / Menunggu Diproses     |
| Step kosong, step sebelumnya belum selesai | Belum Dimulai                 |
| Step kosong dan melewati SLA               | Terlambat                     |
| Step tidak termasuk paket layanan          | Tidak Berlaku / Skip          |
| Step pernah diisi lalu diubah              | Ada riwayat edit di audit log |

Contoh:

```text
DP Masuk: 25-01-2025 → Selesai
Naskah Masuk: 12-01-2025 → Selesai
Layout Dibagi: 13-11-2025 → Selesai
Layout Selesai: kosong → Aktif
Cover Dibagi: kosong → Belum Dimulai
```

Catatan teknis:
Angka seperti `45682`, `45974`, `46127` pada Excel adalah **serial date Excel**. Saat migrasi, sistem harus otomatis mengubahnya menjadi format tanggal normal.

---

# 6. Struktur UI Operasional Timeline

## A. Halaman Daftar Naskah

Tampilan awal berupa list semua order/naskah.

Kolom yang ditampilkan:

| Kolom          | Isi                                  |
| -------------- | ------------------------------------ |
| Kode/Naskah_ID | ID unik                              |
| Judul Buku     | Dari database naskah                 |
| Penulis        | Relasi ke database penulis           |
| Penerbit       | Relasi ke database penerbit          |
| Alur           | KBM / Penerbit / SPT                 |
| Paket/Order    | Nusantara, Layout, Cover, Cetak, dll |
| Tahap Saat Ini | Dihitung otomatis                    |
| Progress       | Persentase step selesai              |
| PIC Terakhir   | User yang menangani step aktif       |
| Deadline       | Dari SLA                             |
| Status         | On Track / Terlambat / Selesai       |

Filter wajib:

```text
Alur
Penerbit
Penulis
Tahap saat ini
Status terlambat
PIC
Layouter
Jenis legalitas
Bulan/tahun
Status cetak
Status upload
```

---

## B. Halaman Detail Naskah

Detail naskah harus memiliki 4 panel.

### 1. Informasi Buku

```text
Judul
Nama Penulis
Penerbit
Jenis Paket
Jumlah Eksemplar
Ukuran
Request Penulis/Penerbit
Perubahan Request
Alamat Kirim
```

### 2. Timeline Visual

Contoh:

```text
✓ DP Masuk
✓ Naskah Masuk
✓ Naskah Dibagi ke Koordinator Layout
● Layout Selesai
○ Cover Dibagi
○ Cover Selesai
○ Pengajuan ISBN/QRCBN/QRSBN
○ HAKI
○ Naik Cetak
○ Upload Playbook
○ Upload Shopee
○ Resi Dikirim
```

Keterangan visual:

```text
Hijau = selesai
Biru = sedang aktif
Abu-abu = belum mulai
Merah = terlambat
Kuning = revisi/perlu perhatian
```

### 3. Catatan dan File

```text
Catatan request
Catatan revisi layout
Catatan revisi cover
File naskah
File cover
File final
File bukti legalitas
Link Playbook
Link Shopee
Link Google Scholar
```

### 4. Riwayat Perubahan

```text
Siapa yang mengubah
Kapan diubah
Step apa yang diubah
Tanggal lama
Tanggal baru
Catatan perubahan
```

---

# 7. Action Button pada Timeline

Setiap step timeline harus punya tombol aksi.

| Tombol         | Fungsi                               |
| -------------- | ------------------------------------ |
| Tandai Selesai | Isi tanggal selesai                  |
| Assign PIC     | Menentukan penanggung jawab          |
| Tambah Catatan | Menambah catatan proses              |
| Upload Bukti   | Upload file/bukti/link               |
| Revisi         | Menandai ada revisi                  |
| Lewati Step    | Untuk step yang tidak termasuk paket |
| Edit Tanggal   | Memperbaiki tanggal                  |
| Lihat Riwayat  | Audit trail perubahan                |

Form saat klik **Tandai Selesai**:

```text
Tanggal selesai
PIC
Catatan
File/link bukti
Status tambahan: normal / revisi / bermasalah
```

---

# 8. Modul Operational Lengkap

## A. CRM Penulis

Sumber: **DATABASE PENULIS INDONESIA.xlsx**

Fitur:

```text
Import database penulis
Validasi email dan WA
Follow-up penulis
Catatan komunikasi
Reminder follow-up
Status prospek
Konversi menjadi order/naskah
```

Status CRM:

```text
Belum dihubungi
Sudah dihubungi
Tertarik
Negosiasi
Deal
Tidak tertarik
Tidak aktif
Kontak tidak valid
```

---

## B. CRM Penerbit

Sumber: **Database penerbit .xlsx**

Fitur:

```text
Import database penerbit
Validasi kontak
Follow-up kerja sama
Catat jenis kerja sama
Upload dokumen MoU/kontrak
Konversi menjadi order penerbit/SPT
```

Jenis kerja sama:

```text
ISBN
QRCBN/QRSBN
HAKI
Layout
Cover
Cetak
Playbook
Distribusi Shopee
Paket lengkap
```

---

## C. Intake Order/Naskah

Sumber: **Alur Naskah.xlsx**

Fitur:

```text
Input order baru
Pilih alur: KBM / Penerbit / SPT
Pilih penulis
Pilih penerbit
Input judul
Input paket
Input jumlah eksemplar
Input ukuran
Input request
Input alamat kirim
Generate timeline otomatis berdasarkan alur
```

---

## D. Pembayaran

Sumber: kolom:

```text
Tanggal DP
Tanggal Pelunasan / Pelunasan
```

Fitur:

```text
Catat DP
Catat pelunasan
Upload bukti transfer
Status pembayaran otomatis
Laporan pembayaran
Reminder pelunasan
```

Status pembayaran:

```text
Belum DP
Sudah DP
Belum lunas
Lunas
Refund / batal
```

---

## E. Produksi Layout dan Cover

Sumber:

* **Alur Naskah.xlsx**
* **Naskah Hana.xlsx**

Fitur:

```text
Assign ke koordinator layout
Assign ke layouter
Tanggal mulai layout
Tanggal selesai layout
Assign cover
Tanggal selesai cover
Catatan revisi
File hasil layout
File hasil cover
Monitoring beban kerja layouter
```

---

## F. Legalitas

Sumber:

* **Alur Naskah.xlsx**
* **PENGAJUAN ISBN QRCBN QRSBN HAKI.xlsx**

Fitur:

```text
Pengajuan ISBN
Pengajuan E-ISBN
Pengajuan QRCBN
Pengajuan QRSBN
Pengajuan HAKI
Catatan revisi sebelum pengajuan
Catatan revisi Perpusnas
Status ditolak/revisi/sudah keluar
Upload bukti legalitas
Nomor legalitas
```

Status legalitas:

```text
Belum diajukan
Pengajuan
Revisi internal
Revisi Perpusnas
Ditolak
Sudah keluar
Selesai
```

---

## G. Cetak dan Pengiriman

Sumber: **Alur Naskah.xlsx**

Kolom:

```text
Naskah di ACC Cetak
Alamat Kirim Buku Cetakan
NAIK CETAK
Resi Di Kirim Ke Marketing
Resi Di Kirim Ke Penulis/Penerbit
```

Fitur:

```text
ACC cetak
Input jumlah cetak
Input vendor cetak
Tanggal naik cetak
Input alamat kirim
Input ekspedisi
Input nomor resi
Kirim resi ke marketing
Kirim resi ke penulis/penerbit
Tracking status pengiriman
```

---

## H. Upload Playbook

Sumber:

* **Alur Naskah.xlsx**
* **UPLOAD PLAYBOOK.xlsx**
* Sheet playbook pada file legalitas

Fitur:

```text
Upload file digital
Input link Playbook
Validasi link
Status live/error
PIC upload
Catatan masalah
```

---

## I. Upload Shopee

Sumber:

* **Alur Naskah.xlsx**
* **Link Buku shopee .xlsx**

Fitur:

```text
Input produk Shopee
Upload foto produk
Input harga
Input stok
Input link produk
Validasi link
Status produk aktif/tidak aktif
Kirim link ke penulis
```

---

## J. Upload OMP

Sumber: **Alur Naskah.xlsx**

Kolom:

```text
Upload OMP
Link OMP di Kirim ke Penulis
```

Fitur:

```text
Upload ke OMP
Input link OMP
Status upload
Kirim link ke penulis
```

---

## K. Monitoring Google Scholar

Sumber: **Link Google Scholar.xlsx**

Fitur:

```text
Input link Scholar
Tanggal cek
Jumlah unduhan
Jumlah sitasi
Status indeks
Catatan link rusak/tidak muncul
```

---

# 9. Role Pengguna

Aplikasi ini membutuhkan pembagian role.

| Role               | Hak Akses                                            |
| ------------------ | ---------------------------------------------------- |
| Super Admin        | Semua fitur                                          |
| Admin Database     | Kelola penulis, penerbit, buku                       |
| Marketing          | CRM penulis, CRM penerbit, follow-up, resi marketing |
| Admin Order        | Input order/naskah                                   |
| Admin Keuangan     | DP, pelunasan, bukti pembayaran                      |
| Koordinator Layout | Assign layout                                        |
| Layouter           | Update pekerjaan layout                              |
| Desainer Cover     | Update pekerjaan cover                               |
| Admin Legalitas    | ISBN, QRCBN, QRSBN, HAKI                             |
| Admin Cetak        | ACC cetak, naik cetak, vendor cetak                  |
| Admin Upload       | Playbook, OMP, Scholar                               |
| Admin Marketplace  | Shopee                                               |
| Viewer/Manajemen   | Dashboard dan laporan saja                           |

---

# 10. Dashboard yang Dibutuhkan

## Dashboard Utama

KPI:

```text
Total penulis
Total penerbit
Total naskah/order
Naskah aktif
Naskah selesai
Naskah terlambat
Pengajuan legalitas aktif
Buku sudah cetak
Buku sudah upload Playbook
Buku sudah upload Shopee
Buku sudah masuk Google Scholar
```

## Dashboard Timeline

```text
Jumlah naskah per tahap
Naskah yang berhenti di layout
Naskah yang berhenti di cover
Legalitas yang belum keluar
HAKI yang belum selesai
Naskah siap cetak
Naskah belum upload Playbook
Naskah belum upload Shopee
Naskah belum dikirim resi
```

## Dashboard Layouter

```text
Jumlah naskah per layouter
Naskah selesai per layouter
Naskah belum selesai
Rata-rata durasi layout
Capaian target training
```

## Dashboard Legalitas

```text
ISBN diajukan
ISBN keluar
QRCBN diajukan
QRCBN keluar
QRSBN diajukan
QRSBN keluar
HAKI diajukan
HAKI keluar
Revisi Perpusnas
Ditolak
```

---

# 11. Laporan yang Wajib Ada

| Laporan               | Isi                                                         |
| --------------------- | ----------------------------------------------------------- |
| Laporan Penulis       | Jumlah penulis, provinsi, validasi kontak, status follow-up |
| Laporan Penerbit      | Jumlah penerbit, provinsi/negara, status kerja sama         |
| Laporan Naskah        | Semua naskah/order dan status terkini                       |
| Laporan Timeline      | Riwayat step per naskah                                     |
| Laporan Produksi      | Layout, cover, revisi, selesai, terlambat                   |
| Laporan Legalitas     | ISBN/QRCBN/QRSBN/HAKI per status                            |
| Laporan Cetak         | ACC cetak, naik cetak, jumlah eksemplar                     |
| Laporan Pengiriman    | Resi, penerima, ekspedisi, status kirim                     |
| Laporan Playbook      | Buku sudah/belum upload                                     |
| Laporan Shopee        | Produk sudah/belum live                                     |
| Laporan Scholar       | Buku sudah/belum terindeks                                  |
| Laporan Beban Kerja   | Beban kerja layouter/admin/PIC                              |
| Laporan Keterlambatan | Naskah terlambat berdasarkan SLA                            |

---

# 12. Struktur Database yang Disarankan

Minimal tabel database:

```text
users
roles
penulis
penerbit
naskah_orders
workflow_templates
workflow_events
workflow_logs
payments
production_tasks
legalitas_pengajuan
digital_uploads
marketplace_links
scholar_links
layouters
files
notes
import_batches
```

Relasi inti:

```text
penulis 1..n naskah_orders
penerbit 1..n naskah_orders
naskah_orders 1..n workflow_events
naskah_orders 1..n legalitas_pengajuan
naskah_orders 1..n digital_uploads
naskah_orders 1..n marketplace_links
naskah_orders 1..n scholar_links
layouters 1..n production_tasks
```

---

# 13. Aturan Import dari Excel

Agar data Excel bisa masuk rapi ke sistem, perlu fitur **Import & Cleaning**.

## Aturan Import Wajib

| Masalah Excel                                             | Solusi Sistem                                   |
| --------------------------------------------------------- | ----------------------------------------------- |
| Tanggal masih serial Excel                                | Konversi otomatis ke tanggal normal             |
| Header tidak selalu rapi                                  | Mapping kolom manual saat import                |
| Ada sheet provinsi                                        | Digabung ke satu tabel penulis/penerbit         |
| Ada baris bulan seperti SEPTEMBER/OKTOBER                 | Dibaca sebagai periode, bukan data buku         |
| Ada kolom kosong                                          | Diabaikan                                       |
| Judul bisa sama                                           | Sistem buat Naskah_ID                           |
| Nama penulis panjang/banyak orang                         | Simpan sebagai teks + opsi pecah author         |
| Status “Sudah”, “Sudah Keluar”, “Pengajuan” tidak seragam | Normalisasi status                              |
| Kolom HAKI bercampur nomor/tanggal                        | Pisahkan nomor HAKI dan tanggal keluar          |
| Link bisa rusak                                           | Tambahkan validasi link                         |
| Data duplikat                                             | Deteksi berdasarkan nama/email/WA/judul/penulis |

---

# 14. Fitur yang Tidak Perlu Dibuat Terpisah

Agar sistem tidak membengkak, beberapa sheet jangan dijadikan modul sendiri.

| Sheet/File                         | Jangan Dibuat Seperti Ini               | Seharusnya                                          |
| ---------------------------------- | --------------------------------------- | --------------------------------------------------- |
| Sheet provinsi penulis             | Modul Jawa Barat, Jawa Timur, Riau, dll | Satu modul Database Penulis dengan filter provinsi  |
| Sheet provinsi penerbit            | Modul per provinsi                      | Satu modul Database Penerbit dengan filter provinsi |
| ISBN, E-ISBN, QRCBN, QRSBN, HAKI   | Lima sistem terpisah penuh              | Satu modul Legalitas dengan jenis pengajuan         |
| Unived, Undiksha, Gemulun, Edwrite | Modul terpisah                          | Subkategori/penerbit khusus dalam Legalitas         |
| Link Shopee                        | Modul toko besar                        | Cukup Marketplace Links + Upload Produk             |
| Link Google Scholar                | Modul akademik besar                    | Cukup Monitoring Scholar                            |

---

# 15. Prioritas Pembangunan Sistem

## Tahap 1 — Fondasi Database

```text
Database Penulis
Database Penerbit
Database Buku/Naskah
Database Layouter/Tim Produksi
Import Excel
```

## Tahap 2 — Timeline Operasional

```text
Order Naskah
Template Timeline KBM/Penerbit/SPT
Input tanggal selesai
Status otomatis
Progress otomatis
Audit log
```

## Tahap 3 — Produksi dan Legalitas

```text
Assignment layout
Assignment cover
Pengajuan ISBN
Pengajuan QRCBN
Pengajuan QRSBN
Pengajuan HAKI
Revisi dan bukti legalitas
```

## Tahap 4 — Distribusi

```text
Cetak
Pengiriman/resi
Upload Playbook
Upload Shopee
Upload OMP
Google Scholar
```

## Tahap 5 — Dashboard dan Laporan

```text
Dashboard progres
Laporan produksi
Laporan legalitas
Laporan upload
Laporan pengiriman
Laporan performa layouter
```

---

# 16. Kesimpulan Rancangan

Rancangan paling tepat berdasarkan file Excel Anda adalah:

```text
Sistem Penerbitan Berbasis Timeline Operasional
```

Dengan pusat data:

```text
Naskah_ID / Buku_ID
```

Dan fitur utama:

```text
1. Database Penulis
2. Database Penerbit
3. Database Buku/Naskah
4. Database Tim Produksi
5. CRM Penulis
6. CRM Penerbit
7. Order Naskah
8. Timeline Produksi KBM/Penerbit/SPT
9. Pembayaran
10. Layout dan Cover
11. Pengajuan ISBN/E-ISBN/QRCBN/QRSBN/HAKI
12. Cetak dan Pengiriman
13. Upload Playbook
14. Upload Shopee
15. Upload OMP
16. Monitoring Google Scholar
17. Dashboard
18. Laporan
19. Import Excel
20. Audit Log
```

Poin paling penting: **operasional jangan dibuat sebagai tabel panjang seperti Excel**. Di aplikasi, Excel **Alur Naskah** harus diubah menjadi sistem event:

```text
1 naskah = banyak event timeline
1 event = satu tahap + tanggal selesai + PIC + catatan + bukti
```

Dengan model ini, UI timeline bisa berjalan rapi, status bisa otomatis, laporan bisa akurat, dan semua file Excel lama tetap bisa dimigrasikan ke sistem baru.
