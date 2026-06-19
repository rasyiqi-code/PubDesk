export interface Contact {
  id?: number;
  name: string;
  wa_number?: string;
  address?: string;
  type: string;
  created_at: string;
}

export interface Book {
  id?: number;
  title: string;
  isbn?: string;
  regular_price: number;
  po_price: number;
  weight_grams: number;
  author_id?: number;
  cover_path?: string;
}

export interface Project {
  id?: number;
  title: string;
  book_id?: number;
  status: string;
  deadline?: string;
}

export interface File {
  id?: number;
  path: string;
  filename: string;
  type: string;
  project_id?: number;
  status: string;
  version_label?: string;
  last_modified: string;
  modified_by?: string;
  is_readonly: boolean;
}

export interface Tag {
  id?: number;
  name: string;
}

export interface InvoiceItem {
  book_id: number;
  book_title: string;
  quantity: number;
  price: number;
  discount: number;
  pages?: string;
  paper_type?: string;
  copyright_holder?: string;
  item_shipping_cost?: number;
  package_name?: string;
}

export interface Invoice {
  id?: number;
  created_at: string;
  customer_id?: number;
  items_json: string;
  shipping_cost: number;
  admin_fee: number;
  total: number;
  export_format?: string;
  file_path?: string;
}

export interface AppState {
  activeModule: 'invoice' | 'extractor' | 'files' | 'ledger' | 'settings' | 'books';
}

export interface InvoiceProfile {
  id: string;
  name: string;
  companyName: string;
  companyTagline: string;
  invoiceTitleText: string;
  accentColor: string;
  accentColorDark: string;
  headerBgColor: string;
  headerPrimaryColor: string;
  headerSecondaryColor: string;
  defaultHal: string;
  defaultLampiran: string;
  salamPembuka: string;
  actionLabel: string;
  tableType: 'kbm_cetak' | 'kbm_creator' | 'spt_mitra';
  notes: string[];
  showSpesifikasi: boolean;
  defaultSpesifikasi: string;
  signatureOffice: string;
  signatureLocation: string;
  signatureRole: string;
  signatureName: string;
  showBankInfo: boolean;
  bankName: string;
  bankAccountNo: string;
  bankAccountOwner: string;
  companyLogo?: string;
  signatureImg?: string;
  headerType?: 'logo_only' | 'logo_text' | 'text_only';
}
