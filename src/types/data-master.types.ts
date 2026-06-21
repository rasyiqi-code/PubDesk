export interface Penulis {
  id?: number;
  name: string;
  email?: string;
  wa_number?: string;
  province?: string;
  city?: string;
  address?: string;
  job?: string;
  institution?: string;
  data_source?: string;
  email_valid: number; // 0 = false, 1 = true
  wa_valid: number;
  followup_status?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  is_customer?: boolean;
  is_customer_only?: boolean;
}

export interface Penerbit {
  id?: number;
  name: string;
  city?: string;
  province?: string;
  address?: string;
  notes?: string;
  instagram?: string;
  facebook?: string;
  email?: string;
  wa_number?: string;
  linkedin?: string;
  twitter?: string;
  tiktok?: string;
  wa_valid: number; // 0 = false, 1 = true
  email_valid: number;
  cooperation_status?: string;
  created_at: string;
  updated_at?: string;
}

export interface Naskah {
  id?: number;
  naskah_id_code?: string;
  title: string;
  penulis_id?: number;
  penerbit_id?: number;
  // Informasi naskah
  genre?: string;
  total_pages?: number;
  synopsis?: string;
  // Detail penerbitan
  order_type?: string;
  copies?: number;
  book_size?: string;
  legal_type?: string;
  assigned_team_ids?: string;
  initial_request?: string;
  revised_request?: string;
  shipping_address?: string;
  store_links?: string; // JSON string format: [{ platform, url }]
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface Tim {
  id?: number;
  name: string;
  role: string;
  department?: string; // Divisi/departemen: Produksi, Editorial, Desain, dst.
  is_active: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface WorkflowEvent {
  id?: number;
  naskah_id: number;
  event_name: string;
  completed_date?: string;
  pic_name?: string;
  notes?: string;
  proof_path_or_link?: string;
  status: string; // "Belum Dimulai", "Sedang Dikerjakan", "Selesai", "Terkendala"
  created_at: string;
  updated_at?: string;
}

export interface Legalitas {
  id?: number;
  naskah_id?: number;
  judul_buku: string;
  nama_penulis: string;
  tipe: string; // E-ISBN, ISBN, QRCBN, QRSBN, HAKI, dll.
  tanggal_pengajuan?: string;
  keterangan?: string;
  status: string; // "Diajukan", "Selesai", dll.
  created_at: string;
  updated_at?: string;
}

export interface ActivityLogEntry {
  id?: number;
  entity_type: string;
  entity_id?: number;
  action: string;
  description: string;
  created_at: string;
}
