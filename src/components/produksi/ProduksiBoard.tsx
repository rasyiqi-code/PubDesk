import React, { useState } from 'react';
import { useWorkflowContext } from '../../contexts/WorkflowContext';
import { useAppContext } from '../../contexts/AppContext';

const ProduksiBoard: React.FC = () => {
  const { tasks, isLoading, setSelectedTaskId } = useWorkflowContext();
  const { setRightPanelVisible } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [filterPic, setFilterPic] = useState('');
  const [filterTahap, setFilterTahap] = useState('');
  const [filterPenerbit, setFilterPenerbit] = useState('');
  const [filterDeadline, setFilterDeadline] = useState('');

  const filteredTasks = tasks.filter(t => {
    if (searchTerm && !(t.naskah_title || '').toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterPic && t.pic_name !== filterPic) return false;
    if (filterTahap && t.step_name !== filterTahap) return false;
    // Penerbit filter (mock) and Deadline filter
    return true;
  });

  const columns = [
    { id: 'Belum Mulai', label: 'Belum Mulai', color: '#64748b', bg: '#f1f5f9' },
    { id: 'Proses', label: 'Proses', color: '#3b82f6', bg: '#eff6ff' },
    { id: 'Menunggu Revisi', label: 'Menunggu Revisi', color: '#f59e0b', bg: '#fffbeb' },
    { id: 'Menunggu Approval', label: 'Approval', color: '#8b5cf6', bg: '#f5f3ff' },
    { id: 'Selesai', label: 'Done', color: '#22c55e', bg: '#f0fdf4' }
  ];

  const uniquePics = Array.from(new Set(tasks.map(t => t.pic_name).filter(Boolean)));
  const uniqueTahap = Array.from(new Set(tasks.map(t => t.step_name).filter(Boolean)));

  return (
    <div className="module-content" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '28px', fontWeight: '700' }}>Produksi Naskah &gt; Board Produksi</h2>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <select value={filterPic} onChange={e => setFilterPic(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
          <option value="">[PIC]</option>
          {uniquePics.map(pic => <option key={pic as string} value={pic as string}>{pic}</option>)}
        </select>
        <select value={filterTahap} onChange={e => setFilterTahap(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
          <option value="">[Tahap]</option>
          {uniqueTahap.map(tahap => <option key={tahap as string} value={tahap as string}>{tahap}</option>)}
        </select>
        <select value={filterPenerbit} onChange={e => setFilterPenerbit(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
          <option value="">[Penerbit]</option>
        </select>
        <select value={filterDeadline} onChange={e => setFilterDeadline(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
          <option value="">[Deadline]</option>
        </select>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
          <input type="text" placeholder="Cari..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', flex: 1, overflowX: 'auto', paddingBottom: '8px' }}>
        {isLoading ? (
          <div style={{ width: '100%', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Memuat board...</div>
        ) : (
          columns.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} style={{ flex: '0 0 300px', background: 'var(--bg-panel)', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{ padding: '16px', borderBottom: `2px solid ${col.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: col.bg }}>
                <span style={{ fontWeight: '600', color: col.color }}>{col.label}</span>
                <span style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{colTasks.length}</span>
              </div>
              <div style={{ padding: '12px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {colTasks.map(task => (
                  <div
                    key={task.id}
                    style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', cursor: 'pointer' }}
                    onDoubleClick={() => {
                      if (task.id) {
                        setSelectedTaskId(task.id);
                        setRightPanelVisible(true);
                      }
                    }}
                  >
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>{task.naskah_title || `Naskah #${task.naskah_id}`}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{task.step_name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                      <span style={{ background: 'var(--bg-panel)', padding: '4px 8px', borderRadius: '4px', color: 'var(--text-primary)' }}>PIC: {task.pic_name || '-'}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{task.due_date ? new Date(task.due_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}) : '-'}</span>
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', marginTop: '20px' }}>Kosong</div>}
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
};

export default ProduksiBoard;
