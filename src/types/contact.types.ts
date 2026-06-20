/**
 * Tipe data domain: Kontak (pelanggan, penulis, dll)
 */

export interface Contact {
  id?: number;
  name: string;
  wa_number?: string;
  address?: string;
  type: string;
  created_at: string;
}
