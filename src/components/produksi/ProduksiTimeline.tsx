import React from 'react';
import { useWorkflowContext } from '../../contexts/WorkflowContext';

const ProduksiTimeline: React.FC = () => {
  const { taskHistories, isLoading } = useWorkflowContext();

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'Selesai': return '#22c55e';
      case 'Proses': return '#3b82f6';
      case 'Menunggu Revisi': return '#f59e0b';
      case 'Menunggu Approval': return '#8b5cf6';
      case 'Terlambat': return '#ef4444';
      default: return '#64748b'; // Belum Mulai / null
    }
  };

  return (
    <div className="module-content" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '28px', fontWeight: '700' }}>Produksi Naskah &gt; Timeline Produksi</h2>
        <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: '15px' }}>
          Riwayat kronologis seluruh aktivitas perubahan tugas dan status produksi.
        </p>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', flex: 1, padding: '24px', overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>Memuat timeline...</div>
        ) : taskHistories.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>Belum ada riwayat produksi.</div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: '24px' }}>
            {/* Garis vertikal timeline */}
            <div style={{ position: 'absolute', left: '7px', top: '0', bottom: '0', width: '2px', background: 'var(--border)' }}></div>
            
            {taskHistories.map((h, index) => (
              <div key={index} style={{ position: 'relative', marginBottom: '24px', paddingLeft: '24px' }}>
                {/* Dot */}
                <div style={{ 
                  position: 'absolute', 
                  left: '-22px', 
                  top: '4px', 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%', 
                  background: getStatusColor(h.new_status),
                  border: '2px solid var(--bg-card)',
                  boxShadow: '0 0 0 1px var(--border)'
                }}></div>
                
                <div style={{ background: 'var(--bg-panel)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      {h.naskah_title || `Naskah #${h.task_id}`} - {h.step_name || 'Task'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {new Date(h.changed_at).toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{h.changed_by || 'Sistem'}</span> mengubah status dari{' '}
                    <span style={{ color: getStatusColor(h.old_status), fontWeight: '600' }}>{h.old_status || 'Kosong'}</span>{' '}
                    menjadi{' '}
                    <span style={{ color: getStatusColor(h.new_status), fontWeight: '600' }}>{h.new_status}</span>
                  </div>
                  {h.notes && (
                    <div style={{ background: 'var(--bg-card)', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', color: 'var(--text-primary)', borderLeft: '3px solid var(--accent)' }}>
                      {h.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProduksiTimeline;
