/**
 * Tipe data domain: Aplikasi (module routing, app state)
 */

export type AppModule =
  | 'home'
  | 'tim'
  | 'activity-log'
  | 'settings-p2p'
  | 'settings-gas'
  | 'settings-data-reset';

export interface AppState {
  activeModule: AppModule;
}
