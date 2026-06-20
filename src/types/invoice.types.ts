/**
 * Tipe data domain: Invoice
 */

export interface InvoiceTableColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'formula';
  width?: string;
  align?: 'left' | 'center' | 'right';
  formula?: string;
}

export interface InvoiceItem {
  book_id: number;
  item_title: string;
  quantity: number;
  price: number;
  discount: number;
  pages?: string;
  paper_type?: string;
  copyright_holder?: string;
  item_shipping_cost?: number;
  package_name?: string;
  [key: string]: any; // Mendukung properti dinamis tambahan
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
  sync_status?: string;
  cloud_file_url?: string;
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
  tableType: string;
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
  tableColumns?: InvoiceTableColumn[];
}
