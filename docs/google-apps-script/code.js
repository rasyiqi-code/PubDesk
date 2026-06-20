/**
 * PubDesk - Google Apps Script Backend (Sheets & Drive Integration)
 * 
 * Cara Penggunaan:
 * 1. Buka Google Sheets Anda.
 * 2. Klik Ekstensi -> Apps Script.
 * 3. Hapus kode bawaan, lalu salin dan tempel kode di bawah ini.
 * 4. Atur Token Keamanan Anda di Menu Setelan Proyek -> Properti Proyek (Project Properties):
 *    - Tambahkan Properti Baru:
 *      Nama Properti: AUTH_TOKEN
 *      Nilai: TokenRahasiaAnda (Ganti dengan token acak pilihan Anda)
 * 5. Klik Deploy -> Deployment Baru (New Deployment).
 * 6. Pilih Jenis: Aplikasi Web (Web App).
 * 7. Setel Pengaturan:
 *    - Jalankan Sebagai: Saya (Email Anda)
 *    - Siapa yang memiliki akses: Siapa saja (Anyone)
 * 8. Klik Deploy, berikan izin akses Google Drive & Sheets jika diminta, lalu salin URL Web App yang dihasilkan.
 */

// Konfigurasi nama lembar data
const SHEET_NAME = "Invoices";
const FOLDER_NAME = "PubDesk Invoices";
const DEFAULT_TOKEN = "PubDesk_Secret_Token_2026"; // Fallback token jika AUTH_TOKEN di properti proyek belum di-set

/**
 * Validasi token autentikasi dari request payload/parameter
 */
function isValidToken(token) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const configuredToken = scriptProperties.getProperty("AUTH_TOKEN") || DEFAULT_TOKEN;
  return token === configuredToken;
}

/**
 * Mendapatkan atau membuat folder penyimpanan di Google Drive secara otomatis
 */
function getOrCreateFolder() {
  const folders = DriveApp.getFoldersByName(FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(FOLDER_NAME);
}

/**
 * Inisialisasi Lembar Kerja (Membuat Sheet dan Header jika belum ada)
 */
function initSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    // Header kolom
    sheet.appendRow([
      "No. Invoice",
      "Tanggal",
      "Pelanggan",
      "WhatsApp",
      "Alamat",
      "Rincian Item (JSON)",
      "Ongkos Kirim",
      "Biaya Admin",
      "Total",
      "File URL",
      "Dibuat Pada"
    ]);
    // Format header menjadi tebal
    sheet.getRange("A1:K1").setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Menangani Request GET (Membaca data seluruh Invoice)
 */
function doGet(e) {
  try {
    const token = e.parameter.auth_token;
    const action = e.parameter.action;

    if (!isValidToken(token)) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Token autentikasi tidak valid"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "get_invoices") {
      const sheet = initSheet(SHEET_NAME);
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) {
        return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
      }

      const headers = data[0];
      const rows = data.slice(1).map(row => {
        let obj = {};
        headers.forEach((h, i) => {
          // Format header nama kolom ke snake_case agar rapi di JavaScript
          const key = h.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
          obj[key] = row[i];
        });
        return obj;
      });

      return ContentService.createTextOutput(JSON.stringify(rows))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Aksi tidak dikenali"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Menangani Request POST (Menyimpan data & file PDF baru)
 */
function doPost(e) {
  // Gunakan LockService untuk mencegah konflik penulisan ganda dan penomoran invoice yang berantakan
  const lock = LockService.getScriptLock();
  try {
    // Tunggu giliran maksimal 15 detik jika ada request bersamaan
    lock.waitLock(15000);

    const payload = JSON.parse(e.postData.contents);
    const token = payload.auth_token;

    if (!isValidToken(token)) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Token autentikasi tidak valid"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (payload.action === "create_invoice") {
      const sheet = initSheet(SHEET_NAME);
      
      // 1. Tentukan nomor invoice otomatis jika tidak dikirim dari klien
      let invoiceNo = payload.invoice_no;
      if (!invoiceNo) {
        invoiceNo = generateNextInvoiceNo(sheet);
      }

      // 2. Simpan file biner PDF ke Google Drive
      let fileUrl = "";
      if (payload.file_base64) {
        const folder = getOrCreateFolder();
        const base64Data = payload.file_base64;
        const decodedBytes = Utilities.base64Decode(base64Data);
        
        const fileName = payload.file_name || `Invoice-${invoiceNo.replace(/\//g, "_")}.pdf`;
        const mimeType = payload.file_mime_type || "application/pdf";
        
        const blob = Utilities.newBlob(decodedBytes, mimeType, fileName);
        const file = folder.createFile(blob);
        fileUrl = file.getUrl();
      }

      // 3. Tulis data ke Google Sheets
      sheet.appendRow([
        invoiceNo,
        payload.tanggal || new Date().toISOString().split("T")[0],
        payload.pelanggan || "",
        payload.whatsapp || "",
        payload.alamat || "",
        JSON.stringify(payload.items || []),
        payload.shipping_cost || 0,
        payload.admin_fee || 0,
        payload.total || 0,
        fileUrl,
        new Date().toISOString()
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Invoice dan berkas berhasil disimpan",
        invoice_no: invoiceNo,
        file_url: fileUrl
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Aksi tidak dikenali"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Gagal memproses request: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    // Bebaskan kunci kunci (lock) agar antrean request berikutnya bisa berjalan
    lock.releaseLock();
  }
}

/**
 * Menghasilkan nomor urut invoice berikutnya secara otomatis (Fallback Generator)
 * Format default: INV/YYYY/0001
 */
function generateNextInvoiceNo(sheet) {
  const lastRow = sheet.getLastRow();
  const currentYear = new Date().getFullYear();
  if (lastRow <= 1) {
    return `INV/${currentYear}/0001`;
  }

  const lastInvoice = sheet.getRange(lastRow, 1).getValue(); // Membaca kolom No. Invoice
  const parts = String(lastInvoice).split("/");
  
  if (parts.length >= 3) {
    const currentNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(currentNum)) {
      const nextNum = ("0000" + (currentNum + 1)).slice(-4);
      return `INV/${currentYear}/${nextNum}`;
    }
  }

  // Jika format nomor lama tidak sesuai standar, buat baru secara acak
  const randomSuffix = ("0000" + Math.floor(Math.random() * 9999)).slice(-4);
  return `INV/${currentYear}/${randomSuffix}`;
}
