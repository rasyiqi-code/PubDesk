# Analisis PubHub Desktop (PubDesk)

> **Tanggal:** 21 Juni 2026
> **Platform:** Linux (Tauri v2 + React 19 + TypeScript + SQLite)

---

## 1. Ringkasan Proyek

**PubHub Desktop (PubDesk)** adalah aplikasi desktop **Tauri v2 + React 19 + TypeScript** yang berfungsi sebagai **"Publishing Command Center"** untuk penerbitan Indonesia. Aplikasi ini dirancang *offline-first* sebagai lapisan organisasi file cerdas dan otomatisasi di atas sistem file penerbitan yang sudah ada. Target pengguna: staf marketing admin, editor, dan karyawan penerbitan.

- **Package name:** `pubhub-desktop` v0.1.0
- **Identifier:** `com.rasyiqi.pubhub-desktop`
- **App data directory:** `{FOLDERID_LocalAppData}/pubhub`
- **Database file:** `pubhub.db` (SQLite)
- **Package manager:** Bun
- **Build tools:** Vite 7 + Cargo (Rust)

---

## 2. Fitur Utama

### Module 1: Invoice Generator ✅ Selesai

- CRUD invoice
- Preview real-time dengan html2canvas + jsPDF
- **4 template bawaan:**
  - `penerbitan_buku.json` — Penerbitan Buku (Tanpa Ongkir)
  - `penerbitan_buku_ongkir.json` — Penerbitan Buku (Dengan Ongkir)
  - `cetak_buku_ongkir.json` — Cetak Buku (Dengan Ongkir)
  - `pengajuan_haki.json` — Pengajuan HAKI
- Setiap template memiliki kolom tabel, formula, warna, header/footer, info bank, dan field tanda tangan yang dapat dikustomisasi
- Invoice Profile yang dapat dikustomisasi (disimpan di localStorage)
- Sinkronisasi cloud ke Google Sheets via Google Apps Script

### Module 2: Invoice Manager ✅ Selesai

- Jelajahi semua invoice yang dibuat
- Cari/filter invoice
- Muat invoice kembali ke generator untuk diedit

### Module 3: Invoice Insight ✅ Selesai

- Dashboard analitik invoice
- Metrik: total, lunas, belum_lunas, bermasalah, dp

### Module 4: Smart Folders / File Manager ✅ Selesai

- Jelajahi file sistem lokal
- **Integrasi Google Drive** dengan dukungan multi-akun:
  - OAuth 2.0 loopback server di port 50007
  - Navigasi folder virtual: Drive Saya, Shared with me
  - Download file on-demand
- Kategorisasi file: invoice, service, pdf, spreadsheet, text, image, presentation, gdrive, other
- Sistem tag file (tabel `tags` + `file_tags`)
- File watcher (Rust `notify` crate) untuk monitoring file lokal real-time
- Tampilan list/grid

### Module 5: Master Data (CRM) ✅ Selesai

| Entitas | Deskripsi |
|---------|-----------|
| **Penulis** | CRM dengan nama, email, WA, provinsi, kota, pekerjaan, institusi, sumber data, validasi email/WA, status follow-up |
| **Penerbit** | CRM dengan media sosial (IG, FB, Twitter, TikTok, LinkedIn), validasi email/WA, status kerja sama |
| **Naskah Orders** | Manajemen pesanan dengan genre, halaman, sinopsis, tipe pesanan, eksemplar, ukuran buku, tipe legalitas, assignment tim, revisi, alamat pengiriman, link toko |
| **Tim** | Anggota tim dengan role, departemen, status aktif, target mingguan |
| **Legalitas** | ISBN, E-ISBN, QRCBN, QRSBN, HAKI dengan tanggal pengajuan, revisi, status |
| **Pelanggan** | Manajemen pelanggan |
| **Layanan** | Katalog layanan dengan harga |

### Module 6: Intelligent File Indexing Pipeline ✅ Selesai (Backend Rust)

- **Ekstraksi Teks:** DOCX, XLSX, XLS, PDF, TXT, MD
- **Ekstraksi Entitas:** Deteksi otomatis judul buku, nama penulis/editor, nomor bab, ISBN
- **Klasifikasi Otomatis:** `naskah`, `kontrak`, `aset`, `other`
- **TF-IDF Vectorization:** Vektorisasi untuk semantic search
- **Deteksi Duplikat:** SHA-256 hash
- **Deteksi Versi:** Cosine similarity > 0.80
- **Graph Relations:** `related_to`, `part_of`, `version_of`, `duplicate_of`
- **Behavioral Indexing:** Hitung akses, recency boost
- **Auto-Summarization:** Sentence-rank heuristic
- **Global Semantic Search:** Keyword match + TF-IDF + sinyal behavioral

### Module 7: Cloud Integration ✅ Selesai

- **Google Drive:** OAuth 2.0, multi-akun, browser file virtual
- **Google Apps Script:** Web App API bridge ke Google Sheets + Google Drive untuk penyimpanan/retrieval invoice (Base64 PDF upload)

### Module 8: Pre-Order Extractor ⏳ Rencana

- Ekstraksi data order dari chat WhatsApp menggunakan regex/AI

### Module 9: Ledger (Buku Besar) ⏳ Rencana

- Pembukuan virtual / general ledger

### Module 10: Settings ✅ Selesai

- Kustomisasi profil invoice
- Manajemen folder yang dipantau
- Manajemen akun Google Drive (multi-akun OAuth)
- Konfigurasi Google Apps Script (URL + auth token)

---

## 3. Skema Database (SQLite via rusqlite)

### 3.1 Tabel Relasi Dasar

**contacts**
```sql
CREATE TABLE contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    wa_number TEXT,
    email TEXT,
    address TEXT,
    type TEXT NOT NULL DEFAULT 'customer',
    created_at TEXT NOT NULL
);
```

**books**
```sql
CREATE TABLE books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    isbn TEXT,
    regular_price REAL NOT NULL,
    po_price REAL NOT NULL,
    weight_grams INTEGER NOT NULL DEFAULT 0,
    author_id INTEGER REFERENCES contacts(id),
    cover_path TEXT
);
```

**projects**
```sql
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    book_id INTEGER REFERENCES books(id),
    status TEXT NOT NULL DEFAULT 'draft',
    deadline TEXT
);
```

### 3.2 Tabel Manajemen File

**files**
```sql
CREATE TABLE files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL UNIQUE,
    filename TEXT NOT NULL,
    type TEXT NOT NULL,
    project_id INTEGER REFERENCES projects(id),
    status TEXT NOT NULL DEFAULT 'draft',
    version_label TEXT,
    last_modified TEXT NOT NULL,
    modified_by TEXT,
    is_readonly BOOLEAN NOT NULL DEFAULT 0,
    description TEXT,
    responsible_parties TEXT,
    version_similarity REAL
);
```

**tags**
```sql
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);
```

**file_tags** (junction)
```sql
CREATE TABLE file_tags (
    file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (file_id, tag_id)
);
```

**watch_folders**
```sql
CREATE TABLE watch_folders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
);
```

### 3.3 Tabel Indexing Pipeline

**file_entities**
```sql
CREATE TABLE file_entities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_value TEXT NOT NULL
);
```
Entity types: `hash`, `judul`, `penulis`, `bab`, `ISBN`, `summary`

**file_embeddings**
```sql
CREATE TABLE file_embeddings (
    file_id INTEGER PRIMARY KEY REFERENCES files(id) ON DELETE CASCADE,
    vector BLOB NOT NULL
);
```

**file_relations**
```sql
CREATE TABLE file_relations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
    target_file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL,
    confidence REAL NOT NULL
);
```
Relation types: `version_of`, `duplicate_of`, `related_to`, `part_of`

**file_stats**
```sql
CREATE TABLE file_stats (
    file_id INTEGER PRIMARY KEY REFERENCES files(id) ON DELETE CASCADE,
    access_count INTEGER NOT NULL DEFAULT 0,
    last_accessed TEXT,
    active_project_boost INTEGER NOT NULL DEFAULT 0
);
```

### 3.4 Tabel Invoice

**invoices**
```sql
CREATE TABLE invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    customer_id INTEGER REFERENCES contacts(id),
    items_json TEXT NOT NULL,
    shipping_cost REAL NOT NULL DEFAULT 0,
    admin_fee REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL,
    export_format TEXT,
    file_path TEXT,
    sync_status TEXT DEFAULT 'pending',
    cloud_file_url TEXT
);
```

**services**
```sql
CREATE TABLE services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'other'
);
```

### 3.5 Tabel Master Data (CRM)

**penulis**
```sql
CREATE TABLE penulis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    wa_number TEXT,
    province TEXT,
    city TEXT,
    job TEXT,
    institution TEXT,
    data_source TEXT,
    email_valid INTEGER NOT NULL DEFAULT 0,
    wa_valid INTEGER NOT NULL DEFAULT 0,
    followup_status TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    address TEXT
);
```

**penerbit**
```sql
CREATE TABLE penerbit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT,
    instagram TEXT,
    facebook TEXT,
    email TEXT,
    wa_number TEXT,
    linkedin TEXT,
    twitter TEXT,
    tiktok TEXT,
    wa_valid INTEGER NOT NULL DEFAULT 0,
    email_valid INTEGER NOT NULL DEFAULT 0,
    cooperation_status TEXT,
    created_at TEXT NOT NULL,
    address TEXT,
    notes TEXT,
    province TEXT
);
```

**naskah**
```sql
CREATE TABLE naskah (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    naskah_id_code TEXT UNIQUE,
    title TEXT NOT NULL,
    penulis_id INTEGER REFERENCES penulis(id),
    penerbit_id INTEGER REFERENCES penerbit(id),
    package_type TEXT,
    order_type TEXT,
    copies INTEGER,
    book_size TEXT,
    initial_request TEXT,
    revised_request TEXT,
    legal_type TEXT,
    shipping_address TEXT,
    store_links TEXT,
    status TEXT NOT NULL DEFAULT 'Belum Dimulai',
    created_at TEXT NOT NULL,
    genre TEXT,
    total_pages INTEGER,
    synopsis TEXT,
    assigned_team_ids TEXT
);
```

**workflow_events**
```sql
CREATE TABLE workflow_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    naskah_id INTEGER REFERENCES naskah(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    completed_date TEXT,
    pic_name TEXT,
    notes TEXT,
    proof_path_or_link TEXT,
    status TEXT NOT NULL DEFAULT 'Belum Dimulai'
);
```

**tim**
```sql
CREATE TABLE tim (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Layouter',
    is_active INTEGER NOT NULL DEFAULT 1,
    weekly_target INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL,
    department TEXT
);
```

**legalitas**
```sql
CREATE TABLE legalitas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    naskah_id INTEGER REFERENCES naskah(id) ON DELETE SET NULL,
    judul_buku TEXT NOT NULL,
    nama_penulis TEXT NOT NULL,
    tipe TEXT NOT NULL,
    tanggal_pengajuan TEXT,
    keterangan TEXT,
    status TEXT NOT NULL DEFAULT 'Diajukan',
    created_at TEXT NOT NULL
);
```

---

## 4. Arsitektur Sistem

### 4.1 Technology Stack

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | React 19 + TypeScript 5.8 + Vite 7 |
| **State Management** | React Context + useReducer |
| **Desktop Bridge** | Tauri v2 (Rust) |
| **Backend** | Rust (via Tauri commands) |
| **Database** | SQLite via `rusqlite` 0.32 (bundled) |
| **File Watcher** | Rust `notify` 6.1.1 |
| **PDF Generation** | html2canvas 1.4.1 + jsPDF 4.2.1 |
| **Excel Parsing** | `calamine` 0.24 (Rust) |
| **DOCX Parsing** | `zip` 0.6 (Rust, unzip `word/document.xml`) |
| **Hashing** | `sha2` 0.10 (Rust) |
| **HTTP Client** | `reqwest` 0.12 (Rust) |
| **Cloud Sync** | Google Drive API v3 (OAuth 2.0) + Google Apps Script |
| **Spreadsheet Export** | `xlsx` 0.18.5 (frontend) |

### 4.2 Struktur Folder

```
pubhub-desktop/
├── index.html                        # Entry Vite
├── package.json                      # Dependencies Node
├── vite.config.ts                    # Konfigurasi Vite
├── tsconfig.json / tsconfig.node.json
├── bun.lock
│
├── src/                              # === REACT FRONTEND ===
│   ├── main.tsx                      # Entry point
│   ├── App.tsx                       # Root component dengan providers
│   ├── App.css / index.css           # Styles global
│   │
│   ├── types/                        # TypeScript interfaces
│   │   ├── app.types.ts
│   │   ├── book.types.ts
│   │   ├── contact.types.ts
│   │   ├── data-master.types.ts
│   │   ├── file.types.ts
│   │   ├── invoice.types.ts
│   │   └── service.types.ts
│   │
│   ├── contexts/                     # State management
│   │   ├── AppContext.tsx            # Global state + CRUD
│   │   ├── InvoiceContext.tsx        # State form invoice
│   │   ├── DataMasterContext.tsx     # CRM CRUD
│   │   └── FileContext.tsx           # State file
│   │
│   ├── components/                   # UI Components
│   │   ├── layout/                   # MainLayout, Sidebar, TopBar, PanelKanan
│   │   ├── invoice/                  # InvoiceGenerator, Preview, Manager, Insight
│   │   ├── books/                    # BookManager
│   │   ├── data-master/              # 14 file CRM (Penulis, Penerbit, dll)
│   │   ├── files/                    # FileManager, FileList, FileGrid, dll
│   │   ├── settings/                 # Settings, InvoiceSettings, GASCloudSettings
│   │   └── shared/                   # Toast, ConfirmDialog
│   │
│   ├── ui/                           # UI primitives reusable
│   │   ├── atoms/                    # Button, TextField, Select, Badge
│   │   └── molecules/                # Modal, Card, Accordion, TabBar
│   │
│   ├── data/                         # invoiceTemplates.ts
│   ├── services/                     # googleAppsScript.ts
│   ├── utils/                        # invoice.ts, pdfGenerator.ts, format.ts, dll
│   └── assets/                       # invoice-templates/*.json, react.svg
│
├── src-tauri/                        # === RUST BACKEND ===
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── build.rs
│   ├── capabilities/default.json
│   │
│   └── src/
│       ├── main.rs                   # Entry -> lib.rs run()
│       ├── lib.rs                    # Semua Tauri commands, OAuth server
│       │
│       ├── db/                       # Database layer
│       │   ├── mod.rs                # Database struct + CRUD methods
│       │   ├── models.rs             # Rust structs
│       │   ├── schema.rs             # CREATE TABLE + migrasi ad-hoc
│       │   └── error.rs              # DbError enum
│       │
│       ├── watcher.rs                # File system watcher (notify)
│       │
│       └── indexing/                 # Intelligent file indexing
│           ├── mod.rs
│           ├── types.rs
│           ├── extractor.rs          # Ekstraksi teks DOCX/XLSX/PDF
│           ├── nlp.rs                # TF-IDF, cosine similarity, summary
│           ├── classifier.rs         # Klasifikasi otomatis
│           ├── pipeline.rs           # Orchestrator pipeline
│           └── utils.rs              # SHA-256 hashing
│
├── docs/                             # Dokumentasi
└── Excel/                            # Sampel data Excel
```

### 4.3 Pattern Arsitektur

```
┌─────────────────────────────────────────────┐
│  React Frontend (Vite + React 19)            │
│                                              │
│  AppContext ──► DataMasterContext            │
│       │              │                      │
│       ├── InvoiceContext                     │
│       │                                      │
│  invoke('command', {params})                 │
│       │                                      │
├───────┴─────────────────────────────────────┤
│  Tauri IPC Bridge                            │
├───────┬─────────────────────────────────────┤
│  Rust Backend                                │
│                                              │
│  #[tauri::command] fn get_xxx()              │
│       │                                      │
│  Database (SQLite via rusqlite)              │
│  File Watcher (notify)                       │
│  Indexing Pipeline                           │
│  OAuth Server (port 50007)                   │
└─────────────────────────────────────────────┘
```

### 4.4 API (Tauri Commands)

Tidak menggunakan REST/GraphQL. Komunikasi via **Tauri IPC** (`invoke`).

#### System
| Command | Fungsi |
|---------|--------|
| `greet` | Test hello world |
| `init_database` | Inisialisasi SQLite + buat tabel + start watcher |
| `start_oauth_server` | Start OAuth 2.0 loopback server |

#### Books / Services / Contacts / Invoices
| Command | Keterangan |
|---------|------------|
| `get_*` | Ambil semua data |
| `add_*` | Tambah data |
| `update_*` | Update data |
| `delete_*` | Hapus data |

Khusus invoice tambahan: `update_invoice_sync_status`

#### Files
| Command | Keterangan |
|---------|------------|
| `get_files`, `add_file`, `update_file`, `delete_file` | CRUD file record |
| `write_binary_file`, `create_physical_file` | Operasi file fisik |
| `open_file_physically`, `open_file_location_physically` | Buka file/folder di OS |
| `add_file_tag`, `remove_file_tag`, `get_file_tags`, `get_all_tags`, `get_all_file_tags` | Manajemen tag |

#### Watch Folders
| Command | Keterangan |
|---------|------------|
| `get_watch_folders` | Lihat folder terpantau |
| `add_watch_folder` | Tambah folder (auto-start watcher) |
| `remove_watch_folder` | Hapus folder |

#### Indexing Pipeline
| Command | Keterangan |
|---------|------------|
| `get_file_metadata` | Dapatkan entities + summary file |
| `get_related_files` | Dapatkan graph relations |
| `record_file_access` | Catat akses file |
| `global_semantic_search` | Search global ranking |

#### Google Apps Script
| Command | Keterangan |
|---------|------------|
| `call_gas_api` | Proxy call ke GAS Web App |

#### Data Master (CRM)
| Entitas | CRUD Commands |
|---------|---------------|
| Penulis | `get_penulis`, `add_penulis`, `update_penulis`, `delete_penulis` |
| Penerbit | `get_penerbit`, `add_penerbit`, `update_penerbit`, `delete_penerbit` |
| Naskah | `get_naskah`, `add_naskah`, `update_naskah`, `delete_naskah` |
| Tim | `get_tim`, `add_tim`, `update_tim`, `delete_tim` |
| Legalitas | `get_legalitas`, `add_legalitas`, `update_legalitas`, `delete_legalitas` |

---

## 5. Catatan Arsitektur Penting

1. **Offline-First**: Semua data di SQLite lokal. Google Drive / Cloud bersifat opsional.
2. **Database Lock Discipline**: Rust `Mutex<Option<Database>>`, tidak pernah hold lock saat I/O berat.
3. **Event-Driven**: File watcher → event `local-files-changed` → frontend reload otomatis.
4. **OAuth Loopback**: TCP server port 50007 tangkap redirect OAuth → tukar authorization code → token.
5. **Multi-Account GDrive**: localStorage menyimpan banyak akun dengan refresh token per akun.
6. **Lazy Indexing**: Pipeline jalan asinkron saat file baru terdeteksi.
7. **Invoice Templates**: JSON dengan kolom tabel, formula evaluasi, warna, header/footer kustom.

---

## 6. Ringkasan Fitur (Ikhtisar)

### ✅ Sudah Selesai

**1. Invoice Generator & Manager**
- Buat/edit invoice dengan 4 template bawaan (Penerbitan Buku ± Ongkir, Cetak Buku, Pengajuan HAKI)
- Preview real-time, ekspor PDF (html2canvas + jsPDF)
- Kelola daftar invoice (cari, filter, edit)
- Dashboard analitik (total, lunas, belum lunas, bermasalah, DP)
- Profil invoice kustom (tersimpan di localStorage)

**2. Smart File Manager**
- Browser file lokal + Google Drive (multi-akun, OAuth 2.0)
- Kategorisasi file otomatis (invoice, pdf, spreadsheet, image, dll)
- Sistem tag
- File watcher real-time (Rust notify)
- Tampilan list/grid

**3. Intelligent File Indexing (Backend Rust)**
- Ekstraksi teks dari DOCX, XLSX, XLS, PDF, TXT, MD
- Deteksi otomatis judul buku, penulis, ISBN, nomor bab
- Klasifikasi file: naskah/kontrak/aset/other
- TF-IDF vectorization + semantic search
- Deteksi duplikat (SHA-256) dan versi (cosine similarity)
- Graph relasi antar file
- Auto-summarization

**4. Master Data / CRM**
- **Penulis** — data diri, kontak, validasi WA/email, follow-up
- **Penerbit** — profil lengkap + medsos (IG, FB, Twitter, TikTok, LinkedIn)
- **Naskah Orders** — order lengkap dengan genre, halaman, tim, revisi, alamat kirim, link toko
- **Tim** — anggota dengan role, departemen, target mingguan
- **Legalitas** — ISBN, E-ISBN, QRCBN, QRSBN, HAKI
- **Pelanggan & Layanan** — database pelanggan + katalog harga

**5. Cloud Sync**
- Google Drive (browser + download)
- Google Apps Script → sinkronisasi invoice ke Google Sheets + Drive (Base64 PDF)

**6. Settings**
- Atur folder yang dipantau
- Kelola akun Google Drive
- Konfigurasi GAS URL + token
- Kustomisasi profil invoice

### ⏳ Rencana (Belum Dibangun)

| Fitur | Keterangan |
|-------|-----------|
| **Pre-Order Extractor** | Ekstrak order dari chat WhatsApp (regex/AI) |
| **Ledger / Buku Besar** | Pembukuan virtual |

---

## 6. Analisis Kesiapan Fitur terhadap Data Excel

### 6.1 Database penerbit.xlsx

**Struktur:** 22+ sheet berdasarkan region (DATA MENTAH, JAWA BARAT, ACEH, dll), ~3.500+ baris.

| Kolom Excel | Field Model | Status |
|-------------|-------------|--------|
| Nama Penerbit | `Penerbit.name` | ✅ |
| Kota / Asal | `Penerbit.city`, `Penerbit.province` | ✅ |
| Instagram | `Penerbit.instagram` | ✅ |
| Facebook | `Penerbit.facebook` | ✅ |
| Email | `Penerbit.email` | ✅ |
| No. Whatsapp / Telp | `Penerbit.wa_number` | ✅ |
| Linkedln | `Penerbit.linkedin` | ✅ |
| Twitter | `Penerbit.twitter` | ✅ |
| Tiktok | `Penerbit.tiktok` | ✅ |
| Validasi Whatsapp ("Aktif"/"Tidak aktif") | `Penerbit.wa_valid` (0/1) | ⚠️ Tipe berbeda |
| Validasi Email | `Penerbit.email_valid` (0/1) | ⚠️ Tipe berbeda |

**Masalah:**
1. **Multi-sheet region**: 22 sheet region + "DATA MENTAH". Semua sheet region punya struktur 10 kolom yang sama → bisa diagregasi. Tapi "DATA MENTAH" punya 13 kolom (+Validasi WA, Validasi Email). Sheet24 adalah tally validasi (tidak perlu di-import). Sheet25 kosong.
2. **Duplikasi**: Penerbit sama muncul di beberapa sheet (misal Deepublish di DATA MENTAH & YOGYAKARTA). Tidak ada dedup.
3. **Format nomor WA**: `0811-522-8223`, `+62 811-1450-436`, `(021) 30408570`, `0851-8301-6385; 0821...` — sangat bervariasi, ada yang multi-number.
4. **Header sheet tidak konsisten**: Sheet "DATA MENTAH" punya 13 kolom, sisanya 10 kolom; sheet "KALIMANTAN SELATAN" kolom ke-3 bernama "C" bukan "Asal".
5. **Validasi WA bertipe string** ("Aktif"/"Tidak aktif") **vs model integer** (0/1) — perlu mapping.

### 6.2 DATABASE PENULIS INDONESIA.xlsx

**Struktur:** 14+ sheet berdasarkan region + "FILE MENTAH" + sheet metadata, ~21.000+ baris.

| Kolom Excel | Field Model | Status |
|-------------|-------------|--------|
| Nama | `Penulis.name` | ✅ |
| Kota / ASAL PROVINSI | `Penulis.city`, `Penulis.province` | ✅ |
| Informasi Dari | `Penulis.data_source` | ✅ |
| Email | `Penulis.email` | ✅ |
| No. Telpon/Whatsapp | `Penulis.wa_number` | ✅ |
| Jabatan | `Penulis.job` | ✅ |
| Tanggal | — | ❌ Tidak ada |
| Keterangan Email & wa | — | ❌ Tidak ada |
| "C" (provinsi) | `Penulis.province` | ⚠️ Header ambigu |

**Masalah:**
1. **Skala besar** (21.000+ baris): Semua data dimuat `useState<Penulis[]>` di memori → potensi masalah performa (lazy load / virtual scroll belum diimplementasi).
2. **Email/phone kosong**: Ribuan baris berisi `"-"` sebagai placeholder.
3. **Multi-number WA**: Sama seperti penerbit, banyak format.
4. **Tanggal**: Tidak ada field tanggal di model (kolom "Tanggal" di FILE MENTAH).
5. **Sheet "C" sebagai provinsi**: Beberapa sheet (JAWA TIMUR, KALIMANTAN TENGAH, dll.) menggunakan huruf "C" sebagai header kolom provinsi — tidak human-readable.
6. **Sheet auxiliary (bukan data master)**:
   - **Sheet28** (12 baris): Hasil merge filter — artifact processing, bukan data master. Bisa diabaikan.
   - **Sheet25** (77 baris × 2 kolom): Tracking status `"ket"` + nomor ID → sudah tertampung di `followup_status` / `wa_valid` / `email_valid` (dengan konversi string→int).
   - **Sheet26** (74 baris × 7 kolom) & **Sheet27** (1.009 baris): Tracking pengiriman email/WA ("Terkirim"/"Tidak terkirim") — ini workflow/campaign activity, BUKAN master data. Model cukup `email_valid`/`wa_valid` sebagai status kontak.

### 6.3 Link Buku shopee.xlsx

**Struktur:** 1 sheet "Sheet1", ~3.000 baris, 6 kolom (hanya 3 terisi).

| Kolom Excel | Field Model | Status |
|-------------|-------------|--------|
| Judul Buku (kolom 1, tanpa header) | `Naskah.title` | ✅ |
| NAMA PENULIS | — (relasi `Naskah.penulis_id`) | ⚠️ Perlu lookup |
| LINK BUKU SHOPEE | `Naskah.store_links` (JSON `[{platform:"Shopee",url:"..."}]`) | ✅ |

**Masalah:**
1. **Tidak ada ID naskah**: Hanya judul buku + nama penulis → perlu fuzzy match untuk menghubungkan ke entitas Naskah yang sudah ada.
2. **Tidak ada import flow**: Belum ada mekanisme upload Excel untuk mengisi `store_links`.
3. **Duplikasi judul**: Judul buku tidak unik; tanpa ID pasti riskan salah mapping.

### 6.4 Link Google Scholar.xlsx

**Struktur:** 1 sheet "Link GS", 408 baris, header multi-baris (row 1 & 2).

| Kolom Excel | Field Model | Status |
|-------------|-------------|--------|
| Judul | `Naskah.title` | ✅ |
| Google Scholar 2026 (URL) | `Naskah.store_links` (JSON `[{platform, url}]`) | ✅ Bisa ditampung |
| Tanggal Unduhan | — | ❌ Tidak ada |
| Jumlah Unduhan | — | ❌ Tidak ada |

**Masalah:**
1. **Header multi-baris**: Baris 1 berisi label umum, baris 2 berisi sub-header → perlu parser khusus.
2. **Dataset per-user Google Scholar**: Link Scholar mengarah ke user `user=f4zGDPAAAAAJ` (seorang penulis), bukan langsung ke buku — lebih cocok di entitas Penulis daripada Naskah. Tapi `store_links` di Naskah sudah cukup untuk menyimpan URL buku di Google Scholar.
3. **Tanggal & jumlah unduhan**: Metadata unduhan tidak diakomodasi.

### 6.5 UPLOAD PLAYBOOK.xlsx

**Struktur:** 1 sheet "Sheet1", ~1.998 baris, 5 kolom terisi.

| Kolom Excel | Field Model | Status |
|-------------|-------------|--------|
| Judul | `Naskah.title` | ✅ |
| Nama Penulis | — (relasi `Naskah.penulis_id`) | ⚠️ Perlu lookup |
| Link Playbook (Google Play Store) | `Naskah.store_links` (JSON) | ✅ |
| Nama Layouter | `Tim` → `assigned_team_ids` | ⚠️ String, perlu lookup ke ID Tim |

**Masalah:**
1. **Sama seperti Shopee**: Perlu fuzzy match judul+penulis ke entitas Naskah.
2. **Nama Layouter → lookup Tim**: `assigned_team_ids` menyimpan array ID tim. Nama "Hana" perlu dipetakan ke anggota Tim yang ada (sudah dikelola di menu Tim).
3. **Tidak ada kolom status atau tanggal**: Playbook sudah publish, tapi tidak ada timestamp.

### 6.6 Kesimpulan Umum

| Kategori | Status |
|----------|--------|
| **Model data** sudah mencakup 80% kolom Excel | ✅ |
| **Import bulk Excel** — belum ada fitur sama sekali | ❌ |
| **Deduplikasi** — belum ada logic deteksi duplikat | ❌ |
| **Normalisasi nomor WA** — belum ada parser | ❌ |
| **Multi-sheet / region** — belum ada agregator | ❌ |
| **Fuzzy match judul+penulis** — belum ada | ❌ |
| **Lazy load / virtual scroll** untuk 21k+ data | ❌ |
| **Mapping header ambigu ("C")** — butuh konfigurasi manual | ❌ |
| **Store links import** — bisa via JSON field, tapi tanpa UI | ⚠️ |

**Rekomendasi prioritas:**
1. Buat **Import Wizard** yang bisa baca `.xlsx` multi-sheet, petakan kolom ke field model (termasuk handle header ambigu seperti "C"), dan deteksi duplikat.
2. Tambahkan **normalizer nomor WA** (strip `-`, ` `, `()`, `+62` → `0`).
3. Implementasikan **lazy loading / pagination** untuk tabel besar (≥10.000 baris).
4. Untuk Link Shopee/Playbook/Google Scholar: buat fitur **match judul → Naskah** dengan konfirmasi manual jika ambigu.

