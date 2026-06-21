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
  | 'activity-log';

export interface AppState {
  activeModule: AppModule;
}
