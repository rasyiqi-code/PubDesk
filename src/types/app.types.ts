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
  | 'customer-form'
  | 'customer-manager'
  | 'crm-penulis'
  | 'crm-penerbit'
  | 'naskah-orders'
  | 'layouters';

export interface AppState {
  activeModule: AppModule;
}
