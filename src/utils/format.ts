/**
 * Utilitas format — fungsi pemformatan yang berulang di banyak komponen.
 * Sebelumnya diduplikasi di: InvoiceManager, BookManager, ServiceManager,
 * InvoiceInsight, InvoiceGenerator, dll.
 */

/**
 * Format angka ke format mata uang Rupiah (IDR).
 * Contoh: 150000 → "Rp 150.000"
 */
export const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format string ISO tanggal ke format lokal Indonesia.
 * Contoh: "2024-06-20T12:00:00Z" → "20/6/2024"
 */
export const formatDate = (isoString: string): string => {
  if (!isoString) return '-';
  try {
    return new Date(isoString).toLocaleDateString('id-ID');
  } catch {
    return isoString;
  }
};

/**
 * Format string ISO ke tanggal + waktu lokal Indonesia.
 * Contoh: "2024-06-20T12:00:00Z" → "20/6/2024, 19.00"
 */
export const formatDateTime = (isoString: string): string => {
  if (!isoString) return '-';
  try {
    return new Date(isoString).toLocaleString('id-ID');
  } catch {
    return isoString;
  }
};

/**
 * Singkat ukuran file dalam bytes ke format mudah dibaca.
 * Contoh: 1500000 → "1,4 MB"
 */
export const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
