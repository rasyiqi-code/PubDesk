/**
 * Tipe data domain: Kontak (pelanggan, penulis, dll)
 */

export interface Contact {
  id?: number;
  name: string;
  wa_number?: string;
  email?: string;
  address?: string;
  province?: string;
  city?: string;
  job?: string;
  institution?: string;
  data_source?: string;
  email_valid?: number;
  wa_valid?: number;
  followup_status?: string;
  notes?: string;
  type: string;
  created_at: string;
  updated_at?: string;
}
