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
  | 'services';

export interface AppState {
  activeModule: AppModule;
}
