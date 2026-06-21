/**
 * Service untuk integrasi Google Apps Script (Google Sheets & Google Drive)
 */
import { invoke } from '@tauri-apps/api/core';

export interface GASInvoiceItem {
  item_title: string;
  quantity: number;
  price: number;
}

export interface GASInvoicePayload {
  invoice_no?: string;
  tanggal: string;
  pelanggan: string;
  whatsapp: string;
  alamat?: string;
  items: GASInvoiceItem[];
  shipping_cost: number;
  admin_fee: number;
  total: number;
}

const STORAGE_KEYS = {
  URL: 'pubdesk_gas_url',
  TOKEN: 'pubdesk_gas_token'
};

const DEFAULT_URL = 'https://script.google.com/macros/s/AKfycbxiHG--yIAwOapvGkkK57-E6dQfAKzHO_vbB8JgdYvIZa5VbC3sibRMmJ_nIlcttZMyWA/exec';
const DEFAULT_TOKEN = 'PubDesk_Secret_Token_2026';

/**
 * Konversi byte array ke Base64 string secara efisien
 */
function bytesToBase64(bytes: number[] | Uint8Array): string {
  let binary = '';
  const len = bytes.length;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Parse response dari GAS dengan validasi — mencegah error "<" token
 * jika GAS mengembalikan HTML (redirect/error page) alih-alih JSON
 */
function parseGasResponse(responseText: string): any {
  const trimmed = responseText.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    const preview = trimmed.substring(0, 200);
    console.error('[GAS] Response bukan JSON:', preview);
    throw new Error(
      trimmed.toLowerCase().includes('<html') || trimmed.startsWith('<')
        ? 'Google Apps Script mengembalikan halaman HTML — kemungkinan URL sudah kadaluwarsa atau perlu di-deploy ulang.'
        : `Response tidak valid dari server: ${preview}`
    );
  }
  return JSON.parse(trimmed);
}

export const googleAppsScriptService = {
  /**
   * Mendapatkan konfigurasi URL dan Token dari localStorage
   */
  getSettings() {
    const url = localStorage.getItem(STORAGE_KEYS.URL) || DEFAULT_URL;
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN) || DEFAULT_TOKEN;
    return { url, token };
  },

  /**
   * Menyimpan konfigurasi URL dan Token ke localStorage
   */
  saveSettings(url: string, token: string) {
    localStorage.setItem(STORAGE_KEYS.URL, url.trim());
    localStorage.setItem(STORAGE_KEYS.TOKEN, token.trim());
  },

  /**
   * Mengecek apakah konfigurasi URL sudah terisi
   */
  isConfigured(): boolean {
    const { url } = this.getSettings();
    return url.length > 0;
  },

  /**
   * Mengirim data Invoice beserta berkas PDF fisiknya ke Google Apps Script
   */
  async sendInvoiceToCloud(
    invoiceData: GASInvoicePayload,
    pdfBytes: number[] | Uint8Array,
    fileName?: string
  ) {
    const { url, token } = this.getSettings();
    if (!url) {
      throw new Error('URL Web App Google Apps Script belum dikonfigurasi di Setelan.');
    }

    // Konversi file biner ke format base64
    let fileBase64 = '';
    if (pdfBytes && pdfBytes.length > 0) {
      fileBase64 = bytesToBase64(pdfBytes);
    }

    const payload = {
      auth_token: token,
      action: 'create_invoice',
      ...invoiceData,
      file_base_64: fileBase64,
      file_name: fileName || `Invoice-${invoiceData.invoice_no?.replace(/\//g, '_') || 'DRAF'}.pdf`,
      file_mime_type: 'application/pdf'
    };

    // Melakukan request native menggunakan Rust backend (Bebas dari CORS block!)
    const responseText = await invoke<string>('call_gas_api', {
      url,
      method: 'POST',
      payloadJson: JSON.stringify(payload)
    });

    const result = parseGasResponse(responseText);
    if (result.status === 'error') {
      throw new Error(result.message || 'Terjadi kesalahan dari Google Apps Script');
    }

    return {
      success: true,
      invoiceNo: result.invoice_no,
      fileUrl: result.file_url
    };
  },

  /**
   * Mengambil data list invoice yang tercatat di Google Sheets
   */
  async getInvoicesFromCloud() {
    return this.getRecordsFromCloud('Invoices');
  },

  /**
   * Mengirim batch records ke Google Sheets secara bulk
   */
  async upsertRecordsToCloud(sheetName: string, records: any[]) {
    const { url, token } = this.getSettings();
    if (!url) {
      throw new Error('URL Web App Google Apps Script belum dikonfigurasi.');
    }

    const payload = {
      auth_token: token,
      action: 'upsert_records',
      sheet_name: sheetName,
      records: records
    };

    const responseText = await invoke<string>('call_gas_api', {
      url,
      method: 'POST',
      payloadJson: JSON.stringify(payload)
    });

    const result = parseGasResponse(responseText);
    if (result.status === 'error') {
      throw new Error(result.message || 'Terjadi kesalahan dari Google Apps Script');
    }

    return {
      success: true,
      message: result.message
    };
  },

  /**
   * Mengambil data seluruh baris dari sheet tertentu di Google Sheets
   */
  async getRecordsFromCloud(sheetName: string) {
    const { url, token } = this.getSettings();
    if (!url) {
      throw new Error('URL Web App Google Apps Script belum dikonfigurasi.');
    }

    const requestUrl = `${url}?auth_token=${encodeURIComponent(token)}&action=get_records&sheet_name=${encodeURIComponent(sheetName)}`;

    const responseText = await invoke<string>('call_gas_api', {
      url: requestUrl,
      method: 'GET',
      payloadJson: null
    });

    const data = parseGasResponse(responseText);
    if (data && data.status === 'error') {
      throw new Error(data.message || 'Terjadi kesalahan dari Google Apps Script');
    }

    return data as Array<Record<string, any>>;
  },

  /**
   * Menghapus record tertentu berdasarkan ID di Google Sheets
   */
  async deleteRecordFromCloud(sheetName: string, id: number) {
    const { url, token } = this.getSettings();
    if (!url) {
      throw new Error('URL Web App Google Apps Script belum dikonfigurasi.');
    }

    const payload = {
      auth_token: token,
      action: 'delete_record',
      sheet_name: sheetName,
      id: id
    };

    const responseText = await invoke<string>('call_gas_api', {
      url,
      method: 'POST',
      payloadJson: JSON.stringify(payload)
    });

    const result = parseGasResponse(responseText);
    if (result.status === 'error') {
      throw new Error(result.message || 'Terjadi kesalahan dari Google Apps Script');
    }

    return {
      success: true,
      message: result.message
    };
  },

  /**
   * Mengunggah file biner (Base64) ke Google Drive
   */
  async uploadFileToCloud(fileName: string, fileBase64: string, subfolder: string, mimeType: string) {
    const { url, token } = this.getSettings();
    if (!url) {
      throw new Error('URL Web App Google Apps Script belum dikonfigurasi.');
    }

    const payload = {
      auth_token: token,
      action: 'upload_file',
      file_name: fileName,
      file_base_64: fileBase64,
      subfolder: subfolder,
      file_mime_type: mimeType
    };

    const responseText = await invoke<string>('call_gas_api', {
      url,
      method: 'POST',
      payloadJson: JSON.stringify(payload)
    });

    const result = parseGasResponse(responseText);
    if (result.status === 'error') {
      throw new Error(result.message || 'Terjadi kesalahan dari Google Apps Script');
    }

    return {
      success: true,
      file_url: result.file_url,
      file_id: result.file_id
    };
  }
};
