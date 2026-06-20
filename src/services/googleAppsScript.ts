/**
 * Service untuk integrasi Google Apps Script (Google Sheets & Google Drive)
 */

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
      file_base64: fileBase64,
      file_name: fileName || `Invoice-${invoiceData.invoice_no?.replace(/\//g, '_') || 'DRAF'}.pdf`,
      file_mime_type: 'application/pdf'
    };

    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' // Menggunakan text/plain agar browser tidak mengirim request preflight CORS OPTIONS yang rumit ke GAS
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
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
    const { url, token } = this.getSettings();
    if (!url) {
      throw new Error('URL Web App Google Apps Script belum dikonfigurasi.');
    }

    const requestUrl = `${url}?auth_token=${encodeURIComponent(token)}&action=get_invoices`;
    const response = await fetch(requestUrl, {
      method: 'GET',
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.status === 'error') {
      throw new Error(data.message || 'Terjadi kesalahan dari Google Apps Script');
    }

    return data as Array<Record<string, any>>;
  }
};
