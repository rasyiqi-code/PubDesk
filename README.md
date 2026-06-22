# PubHub Monorepo

Repositori ini menggunakan arsitektur **Monorepo Modular** berbasis **Bun Workspaces** untuk memisahkan aplikasi PubHub Desktop (PubDesk) menjadi beberapa aplikasi target mandiri yang saling berbagi komponen UI, utilitas, dan definisi tipe data.

---

## Struktur Repositori

```text
pubhub-monorepo/
├── packages/                          # === KODE BERSAMA (SHARED PACKAGES) ===
│   ├── shared-types/                  # Definisi tipe data TypeScript bersama
│   ├── shared-utils/                  # Utilitas umum (PDF generator, GAS Client, formatting)
│   └── shared-ui/                     # Komponen UI atom, molekul, & dialog bersama
│
└── apps/                              # === APLIKASI TARGET ===
    ├── pub-billing/                   # Aplikasi Keuangan & Invoice (Port Dev: 1420)
    ├── pub-files/                     # Aplikasi Indexer & Smart File Manager (Port Dev: 1422)
    └── pub-ops/                       # Aplikasi CRM & Produksi Naskah (Port Dev: 1424)
```

---

## Cara Menjalankan Aplikasi (Development)

Untuk menjalankan proses *development* Tauri, Anda harus masuk ke direktori aplikasi yang ingin dijalankan dan memanggil perintah `tauri dev` menggunakan Bun:

### 1. Menjalankan PubBilling (Keuangan & Invoicing)
```bash
cd apps/pub-billing && bun tauri dev
```

### 2. Menjalankan PubFiles (Smart Folders & Indexer)
```bash
cd apps/pub-files && bun tauri dev
```

### 3. Menjalankan PubOps (CRM & Produksi Naskah)
```bash
cd apps/pub-ops && bun tauri dev
```

---

## Panduan Pembangunan (Build Production Installer)

Untuk men-compile installer executable masing-masing aplikasi:

### Build PubBilling
```bash
cd apps/pub-billing && bun tauri build
```

### Build PubFiles
```bash
cd apps/pub-files && bun tauri build
```

### Build PubOps
```bash
cd apps/pub-ops && bun tauri build
```
