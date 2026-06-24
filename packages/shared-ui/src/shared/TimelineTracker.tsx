import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface ActivityLogEntry {
  id?: number;
  entity_type: string;
  entity_id?: number;
  action: string;
  description: string;
  performed_by?: number;
  performed_by_name?: string;
  old_value?: string;
  new_value?: string;
  module?: string;
  created_at: string;
}

interface TimelineTrackerProps {
  entityType: string;
  entityId: number | null | undefined;
  relatedIds?: {
    naskahIds?: number[];
    invoiceIds?: number[];
    taskIds?: number[];
    legalitasIds?: number[];
    performedByTimId?: number | null;
  };
}

const ACTION_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  CREATE:  { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#10b981' },
  UPDATE:  { bg: 'rgba(59, 130, 246, 0.15)',  border: '#3b82f6', text: '#3b82f6' },
  DELETE:  { bg: 'rgba(239, 68, 68, 0.15)',   border: '#ef4444', text: '#ef4444' },
  LOGIN:   { bg: 'rgba(168, 85, 247, 0.15)',  border: '#a855f7', text: '#a855f7' },
  LOGOUT:  { bg: 'rgba(107, 114, 128, 0.15)', border: '#6b7280', text: '#6b7280' },
  default: { bg: 'rgba(107, 114, 128, 0.15)', border: '#6b7280', text: '#6b7280' },
};

// Pemetaan nama tipe entitas ke label bahasa Indonesia
const ENTITY_LABELS: Record<string, string> = {
  contact:        'Kontak',
  book:           'Buku',
  invoice:        'Invoice',
  file:           'Berkas',
  service:        'Layanan',
  penulis:        'Penulis',
  penerbit:       'Penerbit',
  naskah:         'Naskah',
  tim:            'Anggota Tim',
  legalitas:      'Legalitas',
  workflow_event: 'Alur Naskah',
  session:        'Sesi Login',
  task:           'Tugas Produksi',
};

// Ekstrak nama field dari format "field_name: value"
function parseKV(raw?: string): { field: string; value: string } | null {
  if (!raw) return null;
  const colonIdx = raw.indexOf(':');
  if (colonIdx === -1) return { field: '', value: raw.trim() };
  return {
    field: raw.slice(0, colonIdx).trim(),
    value: raw.slice(colonIdx + 1).trim(),
  };
}

// Warna badge status berdasarkan konten nilai
function getStatusColor(val: string): string {
  const lower = val.toLowerCase();
  if (['lunas', 'paid', 'approved', 'selesai', 'done', 'aktif', 'synced'].some(k => lower.includes(k)))
    return '#10b981';
  if (['pending', 'draft', 'menunggu', 'belum', 'proses'].some(k => lower.includes(k)))
    return '#f59e0b';
  if (['ditolak', 'rejected', 'gagal', 'failed', 'hapus', 'batal'].some(k => lower.includes(k)))
    return '#ef4444';
  if (['revisi', 'review', 'koreksi'].some(k => lower.includes(k)))
    return '#8b5cf6';
  return '#3b82f6';
}

export const TimelineTracker: React.FC<TimelineTrackerProps> = ({ entityType, entityId, relatedIds }) => {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entityId && !relatedIds?.performedByTimId) {
      setLogs([]);
      return;
    }

    setLoading(true);
    // Ambil log aktivitas terakhir dari database Tauri
    invoke<ActivityLogEntry[]>('get_activity_log', { limit: 1000 })
      .then((data) => {
        // Filter di sisi frontend berdasarkan relasi yang ditentukan
        const filtered = data.filter((log) => {
          const logEntityId = log.entity_id;
          const logEntityType = log.entity_type.toLowerCase();

          // 1. Log langsung pada entitas tersebut
          if (entityId && logEntityType === entityType.toLowerCase() && logEntityId === entityId) {
            return true;
          }

          // 2. Log tindakan yang dilakukan oleh Tim ini
          if (relatedIds?.performedByTimId && log.performed_by === relatedIds.performedByTimId) {
            return true;
          }

          // 3. Log naskah terkait
          if (
            relatedIds?.naskahIds?.length &&
            logEntityType === 'naskah' &&
            logEntityId &&
            relatedIds.naskahIds.includes(logEntityId)
          ) {
            return true;
          }

          // 4. Log invoice terkait
          if (
            relatedIds?.invoiceIds?.length &&
            logEntityType === 'invoice' &&
            logEntityId &&
            relatedIds.invoiceIds.includes(logEntityId)
          ) {
            return true;
          }

          // 5. Log task terkait
          if (
            relatedIds?.taskIds?.length &&
            logEntityType === 'task' &&
            logEntityId &&
            relatedIds.taskIds.includes(logEntityId)
          ) {
            return true;
          }

          // 6. Log legalitas terkait
          if (
            relatedIds?.legalitasIds?.length &&
            logEntityType === 'legalitas' &&
            logEntityId &&
            relatedIds.legalitasIds.includes(logEntityId)
          ) {
            return true;
          }

          return false;
        });
        setLogs(filtered);
      })
      .catch((err) => {
        console.error('Gagal mengambil timeline activity log:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [entityType, entityId, relatedIds]);

  if (!entityId && !relatedIds?.performedByTimId) return null;

  return (
    <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
      <h5 style={{
        fontSize: '12px',
        fontWeight: '600',
        color: 'var(--text-secondary)',
        marginBottom: '16px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        🕒 Riwayat &amp; Timeline Aktivitas Terintegrasi
        {logs.length > 0 && (
          <span style={{
            marginLeft: 'auto',
            fontSize: '10px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '2px 8px',
            fontWeight: '500',
          }}>
            {logs.length} entri
          </span>
        )}
      </h5>

      {loading ? (
        <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
          Memuat riwayat...
        </div>
      ) : logs.length === 0 ? (
        <div style={{
          padding: '14px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '12px',
          background: 'var(--bg-card)',
          borderRadius: '8px',
          border: '1px dotted var(--border)',
          fontStyle: 'italic',
        }}>
          Belum ada riwayat aktivitas terintegrasi yang tercatat untuk entitas ini.
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          paddingLeft: '16px',
          borderLeft: '2px solid var(--border)',
          marginLeft: '8px',
          gap: '16px',
        }}>
          {logs.map((log) => {
            const style = ACTION_STYLES[log.action] || ACTION_STYLES.default;
            const dateStr = log.created_at
              ? new Date(log.created_at).toLocaleString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '-';

            const entityLabel = ENTITY_LABELS[log.entity_type] || log.entity_type;
            const isIndirect = log.entity_type.toLowerCase() !== entityType.toLowerCase();

            // Parse old_value / new_value untuk tampilan diff status
            const oldKV = parseKV(log.old_value);
            const newKV = parseKV(log.new_value);
            const statusChanged = (oldKV || newKV) && oldKV?.value !== newKV?.value;

            return (
              <div key={log.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {/* Bulatan timeline */}
                <div
                  style={{
                    position: 'absolute',
                    left: '-23px',
                    top: '4px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'var(--bg-panel)',
                    border: `2px solid ${style.border}`,
                    zIndex: 2,
                  }}
                  title={`${log.action} - ${entityLabel}`}
                />

                {/* Header Log */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {/* Badge aksi */}
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontWeight: '700',
                      background: style.bg,
                      color: style.text,
                      border: `1px solid ${style.border}`,
                      textTransform: 'uppercase',
                    }}>
                      {log.action}
                    </span>

                    {/* Badge entitas (jika log dari entitas lain) */}
                    {isIndirect && (
                      <span style={{
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontSize: '8px',
                        fontWeight: '600',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                      }}>
                        {entityLabel}
                      </span>
                    )}

                    {/* Badge modul asal */}
                    {log.module && (
                      <span style={{
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontSize: '8px',
                        fontWeight: '500',
                        background: 'rgba(99,102,241,0.12)',
                        border: '1px solid rgba(99,102,241,0.3)',
                        color: '#818cf8',
                        textTransform: 'uppercase',
                      }}>
                        {log.module}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {dateStr}
                  </span>
                </div>

                {/* Deskripsi */}
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                  {log.description}
                </div>

                {/* Diff status: old_value → new_value */}
                {statusChanged && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: 'wrap',
                    marginTop: '2px',
                  }}>
                    {/* Label field */}
                    {(oldKV?.field || newKV?.field) && (
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                        {oldKV?.field || newKV?.field}:
                      </span>
                    )}

                    {/* Nilai lama (dicoret merah) */}
                    {oldKV?.value && oldKV.value !== '-' && (
                      <span style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: 'rgba(239,68,68,0.1)',
                        color: '#f87171',
                        border: '1px solid rgba(239,68,68,0.3)',
                        textDecoration: 'line-through',
                        fontWeight: '500',
                      }}>
                        {oldKV.value}
                      </span>
                    )}

                    {/* Panah */}
                    {oldKV?.value && newKV?.value && oldKV.value !== '-' && (
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>→</span>
                    )}

                    {/* Nilai baru (berwarna sesuai kategori status) */}
                    {newKV?.value && (
                      <span style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: `${getStatusColor(newKV.value)}22`,
                        color: getStatusColor(newKV.value),
                        border: `1px solid ${getStatusColor(newKV.value)}44`,
                        fontWeight: '600',
                      }}>
                        {newKV.value}
                      </span>
                    )}
                  </div>
                )}

                {/* Hanya new_value tanpa perubahan (info tambahan) */}
                {!statusChanged && newKV?.value && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    {newKV.field && (
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                        {newKV.field}:
                      </span>
                    )}
                    <span style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: `${getStatusColor(newKV.value)}22`,
                      color: getStatusColor(newKV.value),
                      border: `1px solid ${getStatusColor(newKV.value)}44`,
                      fontWeight: '600',
                    }}>
                      {newKV.value}
                    </span>
                  </div>
                )}

                {/* Dilakukan oleh */}
                {log.performed_by_name && (
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    Oleh: {log.performed_by_name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
