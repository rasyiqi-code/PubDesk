import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { ActivityLogEntry } from '../../types/data-master.types';
import { useAuth } from '../../contexts/AuthContext';

// Pemetaan warna aksi
const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  CREATE: { bg: '#10b981', text: '#fff' },
  UPDATE: { bg: '#3b82f6', text: '#fff' },
  DELETE: { bg: '#ef4444', text: '#fff' },
  LOGIN: { bg: '#8b5cf6', text: '#fff' },
  LOGOUT: { bg: '#6b7280', text: '#fff' },
};

// Pemetaan label entitas lebih informatif
const ENTITY_LABELS: Record<string, string> = {
  contact: 'Kontak',
  book: 'Buku',
  invoice: 'Invoice',
  file: 'Berkas',
  service: 'Layanan',
  penulis: 'Penulis',
  penerbit: 'Penerbit',
  naskah: 'Naskah',
  tim: 'Anggota Tim',
  legalitas: 'Legalitas',
  workflow_event: 'Alur Naskah',
  session: 'Sesi Login',
  task: 'Tugas Produksi',
};

// Warna avatar
const AVATAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface FilterState {
  search: string;
  entityType: string;
  action: string;
  performedBy: string; // nama karyawan
}

export default function ActivityLog() {
  const { currentUser, logout } = useAuth();
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterState>({
    search: '',
    entityType: '',
    action: '',
    performedBy: '',
  });

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await invoke<ActivityLogEntry[]>('get_activity_log', { limit: 500 });
      setLogs(data);
    } catch (e) {
      console.error('Gagal memuat activity log:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Daftar unik karyawan dari log
  const uniquePerformers = useMemo(() => {
    const names = new Set<string>();
    logs.forEach(l => { if (l.performed_by_name) names.add(l.performed_by_name); });
    return Array.from(names).sort();
  }, [logs]);

  // Daftar unik tipe entitas dari log
  const uniqueEntities = useMemo(() => {
    const types = new Set<string>();
    logs.forEach(l => { if (l.entity_type) types.add(l.entity_type); });
    return Array.from(types).sort();
  }, [logs]);

  // Filter logs
  const filtered = useMemo(() => {
    return logs.filter(l => {
      const searchLower = filter.search.toLowerCase();
      const matchesSearch = !filter.search ||
        l.description.toLowerCase().includes(searchLower) ||
        (l.performed_by_name?.toLowerCase().includes(searchLower)) ||
        (l.entity_type.toLowerCase().includes(searchLower)) ||
        (l.old_value?.toLowerCase().includes(searchLower)) ||
        (l.new_value?.toLowerCase().includes(searchLower));
      const matchesEntity = !filter.entityType || l.entity_type === filter.entityType;
      const matchesAction = !filter.action || l.action === filter.action;
      const matchesPerformer = !filter.performedBy || l.performed_by_name === filter.performedBy;
      return matchesSearch && matchesEntity && matchesAction && matchesPerformer;
    });
  }, [logs, filter]);

  // Statistik ringkas
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayLogs = logs.filter(l => l.created_at.startsWith(today));
    const byUser: Record<string, number> = {};
    todayLogs.forEach(l => {
      const name = l.performed_by_name || 'Sistem';
      byUser[name] = (byUser[name] || 0) + 1;
    });
    return { todayTotal: todayLogs.length, byUser };
  }, [logs]);

  const selectStyle: React.CSSProperties = {
    padding: '5px 8px',
    border: '1px solid var(--border)',
    borderRadius: '0px',
    background: 'var(--bg-panel)',
    color: 'var(--text-primary)',
    fontSize: '12px',
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-dark)' }}>
      {/* Header Bar Seragam */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-panel)',
        height: 44,
        boxSizing: 'border-box',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>📋</span>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Activity Log Karyawan</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: getAvatarColor(currentUser.tim_name),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: '700', color: '#fff',
              }}>
                {getInitials(currentUser.tim_name)}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {currentUser.tim_name}
              </span>
              <button
                onClick={logout}
                style={{
                  fontSize: '11px', padding: '3px 10px',
                  border: '1px solid var(--border)', borderRadius: '0px',
                  background: 'transparent', color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                Ganti User
              </button>
            </div>
          )}
          <button
            onClick={loadLogs}
            style={{
              fontSize: '12px', padding: '4px 12px',
              border: '1px solid var(--border)', borderRadius: '0px',
              background: 'var(--bg-card)', color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Statistik hari ini */}
      <div style={{
        display: 'flex', flexWrap: 'wrap',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
        flexShrink: 0,
      }}>
        <div style={{
          padding: '12px 20px',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', gap: '2px',
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Aksi Hari Ini</span>
          <span style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.todayTotal}</span>
        </div>
        {Object.entries(stats.byUser).slice(0, 5).map(([name, count]) => (
          <div key={name} style={{
            padding: '12px 20px',
            borderRight: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: '2px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%',
                background: getAvatarColor(name),
                fontSize: '9px', fontWeight: '700', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {getInitials(name)}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{name}</span>
            </div>
            <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>{count} aksi</span>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{
        display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap',
        padding: '10px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-panel)',
        flexShrink: 0,
      }}>
        <input
          placeholder="🔍 Cari deskripsi, karyawan, nilai..."
          value={filter.search}
          onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
          style={{
            padding: '5px 10px',
            border: '1px solid var(--border)',
            borderRadius: '0px',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            flex: '1',
            minWidth: '200px',
          }}
        />
        <select
          value={filter.performedBy}
          onChange={e => setFilter(f => ({ ...f, performedBy: e.target.value }))}
          style={selectStyle}
        >
          <option value="">👤 Semua Karyawan</option>
          {uniquePerformers.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select
          value={filter.entityType}
          onChange={e => setFilter(f => ({ ...f, entityType: e.target.value }))}
          style={selectStyle}
        >
          <option value="">📦 Semua Entitas</option>
          {uniqueEntities.map(t => (
            <option key={t} value={t}>{ENTITY_LABELS[t] ?? t}</option>
          ))}
        </select>
        <select
          value={filter.action}
          onChange={e => setFilter(f => ({ ...f, action: e.target.value }))}
          style={selectStyle}
        >
          <option value="">⚡ Semua Aksi</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="LOGIN">LOGIN</option>
          <option value="LOGOUT">LOGOUT</option>
        </select>
        {(filter.search || filter.entityType || filter.action || filter.performedBy) && (
          <button
            onClick={() => setFilter({ search: '', entityType: '', action: '', performedBy: '' })}
            style={{
              ...selectStyle,
              color: '#ef4444',
              borderColor: '#ef4444',
              background: 'rgba(239,68,68,0.06)',
            }}
          >
            ✕ Reset
          </button>
        )}
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
          {filtered.length} / {logs.length} catatan
        </span>
      </div>

      {/* Tabel Log */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Memuat riwayat aktivitas...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            {logs.length === 0 ? 'Belum ada aktivitas tercatat.' : 'Tidak ada hasil sesuai filter.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-card)', position: 'sticky', top: 0, zIndex: 2 }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--text-secondary)', width: '140px' }}>Waktu</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--text-secondary)', width: '160px' }}>Karyawan</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--text-secondary)', width: '70px' }}>Aksi</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--text-secondary)', width: '100px' }}>Entitas</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-secondary)' }}>Deskripsi &amp; Perubahan</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => {
                const actionStyle = ACTION_COLORS[log.action] ?? { bg: '#6b7280', text: '#fff' };
                const performer = log.performed_by_name;
                return (
                  <tr
                    key={log.id}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-panel)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Waktu */}
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--text-secondary)', verticalAlign: 'top' }}>
                      {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>

                    {/* Karyawan */}
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                      {performer ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '26px', height: '26px', borderRadius: '50%',
                            background: getAvatarColor(performer),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '10px', fontWeight: '700', color: '#fff', flexShrink: 0,
                          }}>
                            {getInitials(performer)}
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{performer}</div>
                            {log.module && (
                              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{log.module}</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>— Sistem —</span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        background: actionStyle.bg,
                        color: actionStyle.text,
                        fontSize: '11px',
                        fontWeight: '600',
                        borderRadius: '0px',
                      }}>
                        {log.action}
                      </span>
                    </td>

                    {/* Entitas */}
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        background: 'var(--bg-panel)',
                        color: 'var(--text-secondary)',
                        fontSize: '11px',
                        borderRadius: '0px',
                        border: '1px solid var(--border)',
                      }}>
                        {ENTITY_LABELS[log.entity_type] ?? log.entity_type}
                        {log.entity_id ? ` #${log.entity_id}` : ''}
                      </span>
                    </td>

                    {/* Deskripsi & Perubahan */}
                    <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginBottom: log.old_value || log.new_value ? '6px' : '0' }}>
                        {log.description}
                      </div>
                      {/* Tampilkan perubahan old → new jika ada */}
                      {(log.old_value || log.new_value) && (
                        <div style={{
                          display: 'flex', alignItems: 'flex-start', gap: '6px',
                          background: 'var(--bg-dark)', borderRadius: '0px',
                          padding: '6px 8px', fontSize: '11px',
                          borderLeft: '3px solid var(--border)',
                        }}>
                          {log.old_value && (
                            <span style={{
                              background: 'rgba(239,68,68,0.12)', color: '#ef4444',
                              padding: '2px 6px', fontFamily: 'monospace',
                              whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                            }}>
                              − {log.old_value}
                            </span>
                          )}
                          {log.old_value && log.new_value && (
                            <span style={{ color: 'var(--text-secondary)', padding: '2px 0' }}>→</span>
                          )}
                          {log.new_value && (
                            <span style={{
                              background: 'rgba(16,185,129,0.12)', color: '#10b981',
                              padding: '2px 6px', fontFamily: 'monospace',
                              whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                            }}>
                              + {log.new_value}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
