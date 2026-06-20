export interface Penulis {
  id?: number;
  name: string;
  email?: string;
  wa_number?: string;
  province?: string;
  city?: string;
  job?: string;
  institution?: string;
  data_source?: string;
  email_valid: number; // 0 = false, 1 = true
  wa_valid: number;
  followup_status?: string;
  notes?: string;
  created_at: string;
}

export interface Penerbit {
  id?: number;
  name: string;
  city?: string;
  instagram?: string;
  facebook?: string;
  email?: string;
  wa_number?: string;
  linkedin?: string;
  twitter?: string;
  tiktok?: string;
  wa_valid: number;
  email_valid: number;
  cooperation_status?: string;
  created_at: string;
}

export interface NaskahOrder {
  id?: number;
  naskah_id_code?: string;
  title: string;
  penulis_id?: number;
  penerbit_id?: number;
  package_type?: string;
  order_type?: string;
  copies?: number;
  book_size?: string;
  initial_request?: string;
  revised_request?: string;
  legal_type?: string;
  shipping_address?: string;
  status: string;
  created_at: string;
}

export interface Layouter {
  id?: number;
  name: string;
  role: string;
  is_active: number;
  weekly_target: number;
  notes?: string;
  created_at: string;
}

export interface WorkflowEvent {
  id?: number;
  naskah_order_id: number;
  event_name: string;
  completed_date?: string;
  pic_name?: string;
  notes?: string;
  proof_path_or_link?: string;
  status: string;
}
