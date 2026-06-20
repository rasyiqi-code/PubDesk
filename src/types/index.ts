/**
 * Entry point tipe data — re-export eksplisit dari tiap domain.
 *
 * CATATAN MIGRASI: File ini dipertahankan agar import lama tidak rusak.
 * Untuk kode baru, import langsung dari domain spesifik:
 *   import { Invoice } from '../types/invoice.types';
 *   import { File } from '../types/file.types';
 *   dst.
 *
 * Jangan tambahkan export baru di sini — tambahkan di file domain yang sesuai.
 */

export type { AppState, AppModule } from './app.types';
export type { File, Tag, WatchFolder } from './file.types';
export type {
  Invoice,
  InvoiceItem,
  InvoiceProfile,
  InvoiceTableColumn,
} from './invoice.types';
export type { Book, Project } from './book.types';
export type { Contact } from './contact.types';
export type { Service } from './service.types';
