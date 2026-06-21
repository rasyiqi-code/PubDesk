import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Task } from '../../types/workflow.types';
import { useUniqueValues } from '../../hooks/useUniqueValues';
import { StatCard } from '../../ui/molecules/StatCard';
import { Button } from '../../ui/atoms/Button';
import { Badge } from '../../ui/atoms/Badge';
import { FilterBar, FilterGroup, FilterDivider } from '../../ui/molecules/FilterBar';
import { tableStyles } from '../../ui/molecules/DataTable';

interface Legalitas {
  id: number;
  naskah_id: number;
  naskah_title?: string;
  legal_type: string;
  status: string;
}

const LaporanOperasional: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [legalitasList, setLegalitasList] = useState<Legalitas[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [periode, setPeriode] = useState('Bulan Ini');
  const [filterPic, setFilterPic] = useState('');
  const [filterPenerbit, setFilterPenerbit] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [taskData, legalitasData] = await Promise.all([
        invoke<Task[]>('get_tasks'),
        invoke<Legalitas[]>('get_legalitas').catch(() => [])
      ]);
      setTasks(taskData);
      setLegalitasList(legalitasData);
    } catch (err) {
      console.error('Error fetching laporan data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isOverdue = (task: Task) => {
    if (task.status === 'Selesai') return false;
    if (!task.due_date) return false;
    const due = new Date(task.due_date);
    due.setHours(0, 0, 0, 0);
    return due.getTime() < today.getTime();
  };

  // Metrics Calculation
  const filteredTasks = tasks.filter(t => {
    if (filterPic && t.pic_name !== filterPic) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    return true;
  });

  const activeTasks = filteredTasks.filter(t => t.status !== 'Selesai' && t.status !== 'Batal');
  const finishedTasks = filteredTasks.filter(t => t.status === 'Selesai');
  const overdueTasks = filteredTasks.filter(isOverdue);
  const prosesLegalitas = legalitasList.filter(l => l.status === 'Diajukan' || l.status === 'Revisi' || l.status === 'Proses');

  // Beban Kerja Tim
  const bebanKerja: Record<string, number> = {};
  activeTasks.forEach(t => {
    const pic = t.pic_name || 'Tanpa PIC';
    bebanKerja[pic] = (bebanKerja[pic] || 0) + 1;
  });
  const bebanKerjaArr = Object.entries(bebanKerja).sort((a, b) => b[1] - a[1]);

  const uniquePics = useUniqueValues(tasks, 'pic_name');
  const uniqueStatuses = useUniqueValues(tasks, 'status');

  const handleExport = () => {
    alert("Mengekspor data ke Excel... (Fitur segera hadir)");
  };

  return (
    <div className="module-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg-dark)' }}>
      {/* Filter Bar Terstandar (Full Width, No Header) */}
      <FilterBar style={{ borderRadius: 0, border: 'none', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <FilterGroup>
          <Badge 
            label={periode === 'Semua' ? 'Periode' : `Periode: ${periode}`} 
            variant={periode === 'Semua' ? 'neutral' : 'accent'} 
            style={{ marginRight: '4px' }} 
          />
          <select value={periode} onChange={e => setPeriode(e.target.value)} className="compact-select" style={{ minWidth: '110px' }}>
            <option value="Semua">Semua Waktu</option>
            <option value="Bulan Ini">Bulan Ini</option>
            <option value="Tahun Ini">Tahun Ini</option>
          </select>
        </FilterGroup>

        <FilterDivider />

        <FilterGroup>
          <Badge 
            label={filterPic === '' ? 'PIC' : `PIC: ${filterPic}`} 
            variant={filterPic === '' ? 'neutral' : 'accent'} 
            style={{ marginRight: '4px' }} 
          />
          <select value={filterPic} onChange={e => setFilterPic(e.target.value)} className="compact-select" style={{ minWidth: '100px' }}>
            <option value="">Semua PIC</option>
            {uniquePics.map(pic => <option key={pic as string} value={pic as string}>{pic}</option>)}
          </select>
        </FilterGroup>

        <FilterDivider />

        <FilterGroup>
          <Badge 
            label={filterPenerbit === '' ? 'Penerbit' : `Penerbit: ${filterPenerbit === 'penerbit_a' ? 'Penerbit A' : filterPenerbit}`} 
            variant={filterPenerbit === '' ? 'neutral' : 'accent'} 
            style={{ marginRight: '4px' }} 
          />
          <select value={filterPenerbit} onChange={e => setFilterPenerbit(e.target.value)} className="compact-select" style={{ minWidth: '120px' }}>
            <option value="">Semua Penerbit</option>
            <option value="penerbit_a">Penerbit A</option>
          </select>
        </FilterGroup>

        <FilterDivider />

        <FilterGroup>
          <Badge 
            label={filterStatus === '' ? 'Status' : `Status: ${filterStatus}`} 
            variant={filterStatus === '' ? 'neutral' : 'accent'} 
            style={{ marginRight: '4px' }} 
          />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="compact-select" style={{ minWidth: '110px' }}>
            <option value="">Semua Status</option>
            {uniqueStatuses.map(s => <option key={s as string} value={s as string}>{s}</option>)}
          </select>
        </FilterGroup>

        <div style={{ flex: 1 }}></div>

        <Button onClick={handleExport} variant="primary" size="sm" icon={<span>📥</span>}>
          Export Excel
        </Button>
      </FilterBar>

      <div style={{ overflowY: 'auto', flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Memuat laporan...</div>
        ) : (
          <>
            {/* Metric Cards Terstandar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <StatCard label="Naskah Aktif" value={activeTasks.length} color="#3b82f6" />
              <StatCard label="Tugas Selesai" value={finishedTasks.length} color="#22c55e" />
              <StatCard label="Tugas Overdue" value={overdueTasks.length} color="#ef4444" />
              <StatCard label="Legalitas Diproses" value={prosesLegalitas.length} color="#a855f7" />
            </div>

            {/* Beban Kerja Tim Terstandar */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Beban Kerja Tim (Tugas Aktif)</h3>
              {bebanKerjaArr.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Tidak ada beban kerja saat ini.</div>
              ) : (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {bebanKerjaArr.map(([pic, count]) => (
                    <div key={pic} style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-panel)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{pic}</span>
                      <Badge label={`${count} tugas`} variant={count > 3 ? "warning" : "info"} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Task Terlambat Terstandar */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', marginBottom: '10px' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Task Terlambat (Overdue)</h3>
                {overdueTasks.length > 0 && <Badge label={`${overdueTasks.length} Terlambat`} variant="danger" />}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyles.table}>
                  <thead style={tableStyles.thead}>
                    <tr style={tableStyles.headerRow}>
                      <th style={tableStyles.th}>Judul Naskah</th>
                      <th style={tableStyles.th}>Tahap</th>
                      <th style={tableStyles.th}>PIC</th>
                      <th style={tableStyles.th}>Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdueTasks.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          🎉 Hebat! Tidak ada tugas yang terlambat.
                        </td>
                      </tr>
                    ) : (
                      overdueTasks.map(task => (
                        <tr
                          key={task.id}
                          style={tableStyles.row}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <td style={tableStyles.tdTitle}>{task.naskah_title || `Naskah #${task.naskah_id}`}</td>
                          <td style={tableStyles.td}>{task.step_name}</td>
                          <td style={tableStyles.td}>{task.pic_name || '-'}</td>
                          <td style={tableStyles.td}>
                            <Badge
                              label={task.due_date ? new Date(task.due_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}) : '-'}
                              variant="danger"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LaporanOperasional;
