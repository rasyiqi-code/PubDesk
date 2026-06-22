import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  /** Gunakan jika ingin override variant secara eksplisit via nilai string */
  statusValue?: string;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}

// Mapping status string ke variant — digunakan untuk badge status berkas dan invoice
const STATUS_VARIANT_MAP: Record<string, BadgeVariant> = {
  // Status task produksi
  'Belum Mulai': 'neutral',
  Proses: 'info',
  Selesai: 'success',
  'Menunggu Revisi': 'warning',
  'Menunggu Approval': 'accent',
  Terlambat: 'danger',
  // Status naskah
  'Belum Dimulai': 'neutral',
  'Sedang Dikerjakan': 'warning',
  Batal: 'danger',
  // Status followup kontak
  New: 'info',
  Contacted: 'warning',
  Interested: 'accent',
  Deal: 'success',
  Rejected: 'danger',
  Pelanggan: 'success',
  // Status kerjasama penerbit
  Aktif: 'success',
  Negosiasi: 'warning',
  Pasif: 'neutral',
  Berhenti: 'danger',
  Internal: 'accent',
  // Status berkas
  Tersimpan: 'success',
  final: 'success',
  approved: 'info',
  review: 'warning',
  draft: 'neutral',
  Cloud: 'neutral',
  // Status invoice
  LUNAS: 'success',
  BERMASALAH: 'warning',
  'BELUM LUNAS': 'danger',
  DP: 'info',
};

export const getStatusVariant = (status: string): BadgeVariant =>
  STATUS_VARIANT_MAP[status] ?? 'neutral';

const VARIANT_STYLE_MAP: Record<BadgeVariant, React.CSSProperties> = {
  success: {
    background: 'rgba(22, 163, 74, 0.15)',
    color: '#16a34a',
    border: '1px solid rgba(22, 163, 74, 0.3)',
  },
  warning: {
    background: 'rgba(217, 119, 6, 0.15)',
    color: '#d97706',
    border: '1px solid rgba(217, 119, 6, 0.3)',
  },
  danger: {
    background: 'rgba(220, 38, 38, 0.15)',
    color: '#dc2626',
    border: '1px solid rgba(220, 38, 38, 0.3)',
  },
  info: {
    background: 'rgba(30, 144, 255, 0.15)',
    color: '#1e90ff',
    border: '1px solid rgba(30, 144, 255, 0.3)',
  },
  neutral: {
    background: 'var(--bg-panel)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
  },
  accent: {
    background: 'var(--accent)',
    color: '#ffffff',
    border: 'none',
  },
};

const SIZE_STYLE_MAP = {
  sm: { padding: '2px 7px', fontSize: '10px', borderRadius: '4px' },
  md: { padding: '3px 8px', fontSize: '11px', borderRadius: '4px' },
};

/**
 * Komponen Badge atomik — untuk menampilkan status invoice, berkas, dll.
 * Otomatis memetakan string status ke warna yang sesuai via statusValue.
 */
export const Badge: React.FC<BadgeProps> = ({
  label,
  variant,
  statusValue,
  size = 'md',
  style,
}) => {
  // Tentukan variant: eksplisit > auto-detect dari statusValue > fallback neutral
  const resolvedVariant: BadgeVariant =
    variant ?? (statusValue ? (STATUS_VARIANT_MAP[statusValue] ?? 'neutral') : 'neutral');

  const baseStyle: React.CSSProperties = {
    display: 'inline-block',
    fontWeight: '700',
    whiteSpace: 'nowrap',
    ...SIZE_STYLE_MAP[size],
    ...VARIANT_STYLE_MAP[resolvedVariant],
    ...style,
  };

  return <span style={baseStyle}>{label}</span>;
};

/**
 * Helper langsung dari string status — shorthand untuk Badge dengan auto-detect
 */
export const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => <Badge label={status} statusValue={status} size={size} />;
