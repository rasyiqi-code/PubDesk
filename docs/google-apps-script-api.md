# Spesifikasi API Google Apps Script (Google Sheets & Google Drive)

Dokumen ini menjelaskan rancangan API Web App Google Apps Script yang berfungsi sebagai jembatan penyimpanan cloud antara aplikasi desktop PubDesk dengan Google Sheets dan Google Drive.

---

## 1. Konsep Umum & Keamanan

### Endpoint
Endpoint API berupa URL Web App yang dihasilkan setelah men-deploy proyek Google Apps Script. 
*   **Format URL**: `https://script.google.com/macros/s/{SCRIPT_ID}/exec`

### Keamanan (Autentikasi)
Karena Google Apps Script Web App di-deploy dengan pengaturan akses **"Anyone"** (untuk menghindari kerepotan pengaturan OAuth2 OAuth Client di sisi desktop), keamanan request dijaga menggunakan **Pre-shared API Key** (Token Rahasia) yang dikirimkan di dalam payload JSON.
*   Nama Parameter: `auth_token`
*   Apps Script akan mencocokkan nilai `auth_token` ini dengan User Property yang tersimpan secara aman di dalam *Script Properties* Google Apps Script. Jika token tidak cocok, API mengembalikan response status `401 Unauthorized`.

---

## 2. API Endpoints

### A. POST / (Simpan Data & File)
Digunakan untuk mencatat data transaksi/invoice baru ke Google Sheets sekaligus mengunggah berkas PDF invoice fisik ke folder Google Drive.

#### Request Body
*   Content-Type: `application/json`
*   Payload:
    ```json
    {
      "auth_token": "YOUR_SECRET_TOKEN",
      "action": "create_invoice",
      "invoice_no": "INV/2026/0001",
      "tanggal": "2026-06-20",
      "pelanggan": "Nama Penulis",
      "whatsapp": "08123456789",
      "alamat": "Alamat Rumah",
      "items": [
        {
          "item_title": "Paket Penerbitan Nusantara",
          "quantity": 1,
          "price": 2500000
        }
      ],
      "shipping_cost": 50000,
      "admin_fee": 5000,
      "total": 2555000,
      "file_name": "Invoice-INV_2026_0001.pdf",
      "file_mime_type": "application/pdf",
      "file_base64": "JVBERi0xLjQKJc..." 
    }
    ```

#### Parameter Penjelasan:
| Field | Tipe | Deskripsi | Wajib |
| :--- | :--- | :--- | :--- |
| `auth_token` | `string` | Token keamanan rahasia. | Ya |
| `action` | `string` | Aksi yang dijalankan (`create_invoice`). | Ya |
| `invoice_no` | `string` | Nomor invoice (jika kosong, akan di-generate otomatis oleh sistem GAS). | Tidak |
| `tanggal` | `string` | Tanggal penerbitan invoice. | Ya |
| `pelanggan` | `string` | Nama pelanggan/penulis. | Ya |
| `whatsapp` | `string` | Nomor WhatsApp pelanggan. | Ya |
| `alamat` | `string` | Alamat pengiriman pelanggan. | Tidak |
| `items` | `array` | Daftar item pesanan. | Ya |
| `shipping_cost`| `number` | Biaya pengiriman. | Ya |
| `admin_fee` | `number` | Biaya administrasi global. | Ya |
| `total` | `number` | Total keseluruhan pembayaran invoice. | Ya |
| `file_name` | `string` | Nama file PDF invoice yang akan disimpan di Google Drive. | Tidak |
| `file_mime_type`|`string` | MIME type berkas (contoh: `application/pdf`). | Tidak |
| `file_base64` | `string` | Berkas biner dalam format Base64 string. | Tidak |

#### Responses

##### `200 OK` (Berhasil Disimpan)
```json
{
  "status": "success",
  "message": "Invoice dan berkas berhasil disimpan",
  "invoice_no": "INV/2026/0001",
  "file_url": "https://drive.google.com/file/d/1A2B3C.../view?usp=drivesdk"
}
```

##### `401 Unauthorized` (Token Tidak Valid)
```json
{
  "status": "error",
  "message": "Token autentikasi tidak valid"
}
```

##### `500 Internal Server Error` (Gagal Memproses)
```json
{
  "status": "error",
  "message": "Gagal menyimpan: Error: Folder Drive tidak ditemukan"
}
```

---

### B. GET / (Membaca Data / Sinkronisasi Pull)
Digunakan untuk mengambil data seluruh invoice dari Google Sheets untuk keperluan validasi atau pembaruan cache lokal di SQLite.

#### Query Parameters
*   `auth_token`: `YOUR_SECRET_TOKEN` (Wajib)
*   `action`: `get_invoices` (Wajib)

#### Responses

##### `200 OK`
```json
[
  {
    "no_invoice": "INV/2026/0001",
    "tanggal": "2026-06-20",
    "pelanggan": "Nama Penulis",
    "whatsapp": "08123456789",
    "alamat": "Alamat Rumah",
    "total": 2555000,
    "file_url": "https://drive.google.com/file/d/1A2B3C.../view?usp=drivesdk",
    "created_at": "2026-06-20T03:57:48.000Z"
  }
]
```

##### `401 Unauthorized`
```json
{
  "status": "error",
  "message": "Token autentikasi tidak valid"
}
```
