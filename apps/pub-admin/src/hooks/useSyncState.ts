import { invoke } from '@tauri-apps/api/core';
import { Book } from '../types/book.types';
import { Contact } from '../types/contact.types';
import { Service } from '../types/service.types';
import { File } from '../types/file.types';
import { Invoice } from '../types/invoice.types';

interface UseSyncStateProps {
  contacts: Contact[];
  loadContacts: () => Promise<void>;
  books: Book[];
  loadBooks: () => Promise<void>;
  services: Service[];
  loadServices: () => Promise<void>;
  files: File[];
  loadFiles: () => Promise<void>;
  invoices: Invoice[];
  loadInvoices: () => Promise<void>;
}

// ─── Helper: update status sync ke DB lokal ──────────────────────────────────

async function updateLocalSyncStatus(
  tableName: string,
  id: number,
  cloudFileUrl?: string | null
) {
  await invoke('update_sync_status', {
    tableName,
    id,
    syncStatus: 'synced',
    cloudFileUrl: cloudFileUrl ?? null,
  });
}

// ─── Helper: upload cover buku ke Google Drive jika masih base64 ──────────────

async function resolveBookCoverPath(
  b: Book,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gasService: any
): Promise<string> {
  const currentCoverPath = b.cover_path || '';
  if (!currentCoverPath.startsWith('data:')) return currentCoverPath;

  try {
    const match = currentCoverPath.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
    if (!match) return '';

    const mimeType = match[1];
    const base64Data = match[2];
    const fileExt = mimeType.split('/')[1] || 'png';
    const fileName = `Cover-${b.id ?? 'new'}-${b.title.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;

    console.log(`[Sync Books] Mengunggah cover base64 ke Google Drive untuk: ${b.title}`);
    const uploadResult = await gasService.uploadFileToCloud(fileName, base64Data, 'Covers', mimeType);

    if (uploadResult?.file_url) {
      // Perbarui cover_path lokal di SQLite menjadi URL cloud
      if (b.id) {
        await invoke('update_book', { book: { ...b, cover_path: uploadResult.file_url } });
      }
      return uploadResult.file_url;
    }
  } catch (uploadErr) {
    console.error(`Gagal mengunggah cover untuk buku ${b.title}:`, uploadErr);
  }
  return '';
}

// ─── Sync per-entity helpers ─────────────────────────────────────────────────

async function syncContacts(
  contacts: Contact[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gasService: any,
  reload: () => Promise<void>
) {
  if (!contacts.length) return;
  const payload = contacts.map((c) => ({
    id: c.id,
    name: c.name,
    wa_number: c.wa_number || '',
    email: c.email || '',
    address: c.address || '',
    province: c.province || '',
    city: c.city || '',
    job: c.job || '',
    institution: c.institution || '',
    data_source: c.data_source || '',
    email_valid: c.email_valid,
    wa_valid: c.wa_valid,
    followup_status: c.followup_status || '',
    notes: c.notes || '',
    type: c.type,
    created_at: c.created_at,
    updated_at: c.updated_at || c.created_at,
  }));
  await gasService.upsertRecordsToCloud('Contacts', payload);
  for (const c of contacts) {
    if (c.id) await updateLocalSyncStatus('contacts', c.id);
  }
  await reload();
}

async function syncBooks(
  books: Book[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gasService: any,
  reload: () => Promise<void>
) {
  if (!books.length) return;
  const processedBooks = await Promise.all(
    books.map(async (b) => ({
      id: b.id,
      title: b.title,
      isbn: b.isbn || '',
      regular_price: b.regular_price,
      po_price: b.po_price,
      weight_grams: b.weight_grams,
      author_id: b.author_id || '',
      cover_path: await resolveBookCoverPath(b, gasService),
      created_at: b.created_at || new Date().toISOString(),
      updated_at: b.updated_at || b.created_at || new Date().toISOString(),
    }))
  );
  await gasService.upsertRecordsToCloud('Books', processedBooks);
  for (const pb of processedBooks) {
    if (pb.id) await updateLocalSyncStatus('books', pb.id, pb.cover_path || null);
  }
  await reload();
}

async function syncServices(
  services: Service[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gasService: any,
  reload: () => Promise<void>
) {
  if (!services.length) return;
  const payload = services.map((s) => ({
    id: s.id,
    name: s.name,
    price: s.price,
    description: s.description || '',
    category: s.category,
    created_at: s.created_at || new Date().toISOString(),
    updated_at: s.updated_at || s.created_at || new Date().toISOString(),
  }));
  await gasService.upsertRecordsToCloud('Services', payload);
  for (const s of services) {
    if (s.id) await updateLocalSyncStatus('services', s.id);
  }
  await reload();
}

async function syncFiles(
  files: File[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gasService: any,
  reload: () => Promise<void>
) {
  const cloudFiles = files.filter(
    (f) =>
      f.path.startsWith('gdrive://') ||
      f.path.startsWith('http://') ||
      f.path.startsWith('https://')
  );
  if (!cloudFiles.length) return;
  const payload = cloudFiles.map((f) => ({
    id: f.id,
    path: f.path,
    filename: f.filename,
    type: f.type,
    project_id: f.project_id || '',
    status: f.status,
    version_label: f.version_label || '',
    last_modified: f.last_modified,
    modified_by: f.modified_by || '',
    is_readonly: f.is_readonly ? 1 : 0,
    description: f.description || '',
    responsible_parties: f.responsible_parties || '',
    created_at: f.created_at || f.last_modified,
    updated_at: f.updated_at || f.last_modified,
  }));
  await gasService.upsertRecordsToCloud('Files', payload);
  for (const f of cloudFiles) {
    if (f.id) await updateLocalSyncStatus('files', f.id);
  }
  await reload();
}

async function syncInvoices(
  invoices: Invoice[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gasService: any,
  reload: () => Promise<void>
) {
  if (!invoices.length) return;
  const payload = invoices.map((inv) => ({
    id: inv.id,
    created_at: inv.created_at,
    customer_id: inv.customer_id || '',
    items_json: inv.items_json,
    shipping_cost: inv.shipping_cost,
    admin_fee: inv.admin_fee,
    total: inv.total,
    export_format: inv.export_format || '',
    file_path: inv.file_path || '',
    sync_status: 'synced',
    cloud_file_url: inv.cloud_file_url || '',
  }));
  await gasService.upsertRecordsToCloud('Invoices', payload);
  for (const inv of invoices) {
    if (inv.id) await updateLocalSyncStatus('invoices', inv.id, inv.cloud_file_url || null);
  }
  await reload();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncPenerbit(penerbit: any[], gasService: any) {
  if (!penerbit.length) return;
  const payload = penerbit.map((p) => ({
    id: p.id, name: p.name, city: p.city || '', instagram: p.instagram || '',
    facebook: p.facebook || '', email: p.email || '', wa_number: p.wa_number || '',
    linkedin: p.linkedin || '', twitter: p.twitter || '', tiktok: p.tiktok || '',
    wa_valid: p.wa_valid, email_valid: p.email_valid,
    cooperation_status: p.cooperation_status || 'Aktif',
    address: p.address || '', notes: p.notes || '', province: p.province || '',
    created_at: p.created_at, updated_at: p.updated_at || p.created_at,
  }));
  await gasService.upsertRecordsToCloud('Penerbit', payload);
  for (const p of penerbit) {
    if (p.id) await updateLocalSyncStatus('penerbit', p.id);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncNaskah(naskah: any[], gasService: any) {
  if (!naskah.length) return;
  const payload = naskah.map((n) => ({
    id: n.id, naskah_id_code: n.naskah_id_code || '', title: n.title,
    penulis_id: n.penulis_id || '', penerbit_id: n.penerbit_id || '',
    package_type: n.package_type || '', order_type: n.order_type || '',
    copies: n.copies || 0, book_size: n.book_size || '',
    initial_request: n.initial_request || '', revised_request: n.revised_request || '',
    legal_type: n.legal_type || '', shipping_address: n.shipping_address || '',
    store_links: n.store_links || '', status: n.status, genre: n.genre || '',
    total_pages: n.total_pages || 0, synopsis: n.synopsis || '',
    assigned_team_ids: n.assigned_team_ids || '',
    created_at: n.created_at, updated_at: n.updated_at || n.created_at,
  }));
  await gasService.upsertRecordsToCloud('Naskah', payload);
  for (const n of naskah) {
    if (n.id) await updateLocalSyncStatus('naskah', n.id);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncTim(tim: any[], gasService: any) {
  if (!tim.length) return;
  const payload = tim.map((t) => ({
    id: t.id, name: t.name, role: t.role, is_active: t.is_active,
    weekly_target: t.weekly_target || 0, notes: t.notes || '',
    department: t.department || '', pin: t.pin || '',
    created_at: t.created_at, updated_at: t.updated_at || t.created_at,
  }));
  await gasService.upsertRecordsToCloud('Tim', payload);
  for (const t of tim) {
    if (t.id) await updateLocalSyncStatus('tim', t.id);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncLegalitas(legalitas: any[], gasService: any) {
  if (!legalitas.length) return;
  const payload = legalitas.map((l) => ({
    id: l.id, naskah_id: l.naskah_id || '', judul_buku: l.judul_buku,
    nama_penulis: l.nama_penulis, tipe: l.tipe,
    tanggal_pengajuan: l.tanggal_pengajuan || '', keterangan: l.keterangan || '',
    status: l.status, nomor_dokumen: l.nomor_dokumen || '',
    tanggal_keluar: l.tanggal_keluar || '', tanggal_revisi: l.tanggal_revisi || '',
    pic_id: l.pic_id || '', rejection_reason: l.rejection_reason || '',
    proof_path_or_link: l.proof_path_or_link || '',
    created_at: l.created_at, updated_at: l.updated_at || l.created_at,
  }));
  await gasService.upsertRecordsToCloud('Legalitas', payload);
  for (const l of legalitas) {
    if (l.id) await updateLocalSyncStatus('legalitas', l.id, l.proof_path_or_link || null);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncTasks(tasks: any[], gasService: any) {
  if (!tasks.length) return;
  const payload = tasks.map((t) => ({
    id: t.id, naskah_id: t.naskah_id, step_name: t.step_name,
    step_order: t.step_order || 0, assigned_team_id: t.assigned_team_id || '',
    status: t.status, priority: t.priority || 'Normal',
    start_date: t.start_date || '', due_date: t.due_date || '',
    completed_date: t.completed_date || '', notes: t.notes || '',
    proof_path_or_link: t.proof_path_or_link || '',
    created_at: t.created_at, updated_at: t.updated_at || t.created_at,
  }));
  await gasService.upsertRecordsToCloud('Tasks', payload);
  for (const t of tasks) {
    if (t.id) await updateLocalSyncStatus('tasks', t.id, t.proof_path_or_link || null);
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface DataMasterPayload {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  penulis: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  penerbit: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  naskah: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tim: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  legalitas: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  services: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tasks: any[];
}

export function useSyncState({
  contacts,
  loadContacts,
  books,
  loadBooks,
  services,
  loadServices,
  files,
  loadFiles,
  invoices,
  loadInvoices,
}: UseSyncStateProps) {
  const updateSyncStatus = async (
    tableName: string,
    id: number,
    syncStatus: string,
    cloudFileUrl?: string
  ) => {
    try {
      await invoke('update_sync_status', {
        tableName,
        id,
        syncStatus,
        cloudFileUrl: cloudFileUrl ?? null,
      });
      if (tableName === 'contacts') await loadContacts();
      else if (tableName === 'books') await loadBooks();
      else if (tableName === 'services') await loadServices();
      else if (tableName === 'files') await loadFiles();
      else if (tableName === 'invoices') await loadInvoices();
    } catch (error) {
      console.error(`Failed to update sync status for ${tableName} id ${id}:`, error);
    }
  };

  const syncAllDataToCloud = async (dataMaster: DataMasterPayload) => {
    const { googleAppsScriptService } = await import('../services/googleAppsScript');
    if (!googleAppsScriptService.isConfigured()) {
      return { success: false, message: 'Google Apps Script belum dikonfigurasi di Pengaturan!' };
    }

    try {
      await syncContacts(contacts, googleAppsScriptService, loadContacts);
      await syncBooks(books, googleAppsScriptService, loadBooks);
      await syncServices(services, googleAppsScriptService, loadServices);
      await syncFiles(files, googleAppsScriptService, loadFiles);
      await syncInvoices(invoices, googleAppsScriptService, loadInvoices);
      await syncPenerbit(dataMaster.penerbit, googleAppsScriptService);
      await syncNaskah(dataMaster.naskah, googleAppsScriptService);
      await syncTim(dataMaster.tim, googleAppsScriptService);
      await syncLegalitas(dataMaster.legalitas, googleAppsScriptService);
      await syncTasks(dataMaster.tasks, googleAppsScriptService);

      return {
        success: true,
        message: 'Seluruh data master dan operasional berhasil disinkronkan ke Cloud Google Sheets!',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Error during bulk sync:', err);
      return { success: false, message: `Gagal sinkronisasi cloud: ${msg}` };
    }
  };

  const syncModuleDataToCloud = async (moduleName: string, dataMaster: DataMasterPayload) => {
    const { googleAppsScriptService } = await import('../services/googleAppsScript');
    if (!googleAppsScriptService.isConfigured()) {
      return { success: false, message: 'Google Apps Script belum dikonfigurasi di Pengaturan!' };
    }

    // Mapping modul → fungsi sync + nama sheet untuk pesan sukses
    type SyncFn = () => Promise<void>;
    const MODULE_MAP: Record<string, { sheetName: string; fn: SyncFn }> = {
      kontak: { sheetName: 'Contacts', fn: () => syncContacts(contacts, googleAppsScriptService, loadContacts) },
      books: { sheetName: 'Books', fn: () => syncBooks(books, googleAppsScriptService, loadBooks) },
      services: { sheetName: 'Services', fn: () => syncServices(services, googleAppsScriptService, loadServices) },
      files: { sheetName: 'Files', fn: () => syncFiles(files, googleAppsScriptService, loadFiles) },
      invoice: { sheetName: 'Invoices', fn: () => syncInvoices(invoices, googleAppsScriptService, loadInvoices) },
      'invoice-manager': { sheetName: 'Invoices', fn: () => syncInvoices(invoices, googleAppsScriptService, loadInvoices) },
      penerbit: { sheetName: 'Penerbit', fn: () => syncPenerbit(dataMaster.penerbit, googleAppsScriptService) },
      naskah: { sheetName: 'Naskah', fn: () => syncNaskah(dataMaster.naskah, googleAppsScriptService) },
      tim: { sheetName: 'Tim', fn: () => syncTim(dataMaster.tim, googleAppsScriptService) },
      legalitas: { sheetName: 'Legalitas', fn: () => syncLegalitas(dataMaster.legalitas, googleAppsScriptService) },
      'produksi-board': { sheetName: 'Tasks', fn: () => syncTasks(dataMaster.tasks, googleAppsScriptService) },
      'produksi-list': { sheetName: 'Tasks', fn: () => syncTasks(dataMaster.tasks, googleAppsScriptService) },
      'produksi-kendala': { sheetName: 'Tasks', fn: () => syncTasks(dataMaster.tasks, googleAppsScriptService) },
      'produksi-approval': { sheetName: 'Tasks', fn: () => syncTasks(dataMaster.tasks, googleAppsScriptService) },
      'tambah-tugas': { sheetName: 'Tasks', fn: () => syncTasks(dataMaster.tasks, googleAppsScriptService) },
      'edit-tugas': { sheetName: 'Tasks', fn: () => syncTasks(dataMaster.tasks, googleAppsScriptService) },
    };

    const entry = MODULE_MAP[moduleName];
    if (!entry) {
      return { success: false, message: 'Halaman ini tidak mendukung sinkronisasi data kustom.' };
    }

    console.log(`[Sync Module] Memulai sinkronisasi modul: ${moduleName} -> Sheet: ${entry.sheetName}`);

    try {
      await entry.fn();
      return { success: true, message: `Data ${entry.sheetName} berhasil disinkronkan ke Cloud Google Sheets!` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Error during module ${moduleName} sync:`, err);
      return { success: false, message: `Gagal sinkronisasi cloud ${moduleName}: ${msg}` };
    }
  };

  return {
    updateSyncStatus,
    syncAllDataToCloud,
    syncModuleDataToCloud,
  };
}
