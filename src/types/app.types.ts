/**
 * Tipe data domain: Aplikasi (module routing, app state)
 */

export type AppModule =
  | 'invoice'
  | 'invoice-manager'
  | 'invoice-insight'
  | 'extractor'
  | 'files'
  | 'ledger'
  | 'settings'
  | 'books'
  | 'services'
  | 'kontak'
  | 'penulis'
  | 'penerbit'
  | 'naskah'
  | 'tim'
  | 'legalitas'
  | 'pelanggan'
  | 'activity-log'
  | 'pekerjaan-saya'
  | 'produksi-board'
  | 'produksi-list'
  | 'produksi-kendala'
  | 'produksi-approval'
  | 'produksi-timeline'
  | 'laporan-operasional'
  | 'import-data'
  | 'tambah-tugas'
  | 'edit-tugas'
  | 'produksi-parent'
  | 'master-data-parent'
  | 'invoice-parent'
  | 'files-parent';

export interface AppState {
  activeModule: AppModule;
}
