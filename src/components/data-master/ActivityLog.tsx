import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { ActivityLogEntry } from '../../types/data-master.types';

export default function ActivityLog() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await invoke<ActivityLogEntry[]>('get_activity_log', { limit: 200 });
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

  const filtered = filter
    ? logs.filter(l => l.entity_type.includes(filter) || l.description.toLowerCase().includes(filter.toLowerCase()))
    : logs;

  const actionColors: Record<string, string> = {
    CREATE: 'var(--accent-green, #10b981)',
    UPDATE: 'var(--accent-blue, #3b82f6)',
    DELETE: 'var(--accent-red, #ef4444)',
  };

  return (
    <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 600 }}>Activity Log</h2>

      <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          placeholder="Filter entity/deskripsi..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border-color, #d0d0d0)',
            background: 'var(--bg-card, #fff)',
            fontSize: '13px',
            flex: 1,
            maxWidth: '300px',
          }}
        />
        <button
          onClick={loadLogs}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: '1px solid var(--border-color, #d0d0d0)',
            background: 'var(--bg-card, #fff)',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Refresh
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Memuat...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            {filter ? 'Tidak ada hasil filter' : 'Belum ada aktivitas'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color, #e0e0e0)' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600 }}>Waktu</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600 }}>Tipe</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600, position: 'sticky', right: 0, background: 'var(--bg-card, #fff)', zIndex: 2, boxShadow: '-2px 0 4px rgba(0,0,0,0.06)' }}>Aksi</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Deskripsi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color, #f0f0f0)' }}>
                  <td style={{ padding: '6px 10px', whiteSpace: 'nowrap', color: 'var(--text-secondary, #666)' }}>
                    {new Date(log.created_at).toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'var(--bg-panel, #f0f0f0)',
                      fontSize: '12px',
                    }}>
                      {log.entity_type}
                    </span>
                  </td>
                  <td style={{ padding: '6px 10px', whiteSpace: 'nowrap', position: 'sticky', right: 0, background: 'var(--bg-card, #fff)', zIndex: 1, boxShadow: '-2px 0 4px rgba(0,0,0,0.06)' }}>
                    <span style={{
                      color: '#fff',
                      background: actionColors[log.action] || '#6b7280',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '6px 10px' }}>{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
