import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Task } from '../../types/workflow.types';
import { useUniqueValues } from '../../hooks/useUniqueValues';
import { StatCard } from '../../ui/molecules/StatCard';
import { Button } from '../../ui/atoms/Button';
import { Badge } from '../../ui/atoms/Badge';
import { FilterBar, FilterGroup, FilterChip } from '../../ui/molecules/FilterBar';
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
  const [activeFilterType, setActiveFilterType] = useState<'periode' | 'pic' | 'penerbit' | 'status'>('periode');

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
    <div className="customer-list-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-dark)' }}>
      <FilterBar>
        <FilterGroup label="🔍 Filter:">
          {/* Dropdown Kategori / Judul Filter */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <FilterChip
              label={`${
                activeFilterType === 'periode' ? '📅 Periode' :
                activeFilterType === 'pic' ? '👤 PIC' :
                activeFilterType === 'penerbit' ? '🏢 Penerbit' :
                '📋 Status'
              } ▾`}
              active={true}
              onClick={() => {}}
            />
            <select
              value={activeFilterType}
              onChange={(e) => setActiveFilterType(e.target.value as any)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer',
                appearance: 'none',
              }}
            >
              <option value="periode">📅 Periode</option>
              <option value="pic">👤 PIC</option>
              <option value="penerbit">🏢 Penerbit</option>
              <option value="status">📋 Status</option>
            </select>
          </div>

          <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 'bold' }}>:</span>

          {/* Dropdown Nilai Filter (Badge yang berubah sesuai opsi yang dipilih) */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {activeFilterType === 'periode' && (
              <>
                <FilterChip
                  label={`${periode === 'Semua' ? 'Semua Waktu' : periode} ▾`}
                  active={periode !== 'Semua'}
                  onClick={() => {}}
                />
                <select
                  value={periode}
                  onChange={(e) => setPeriode(e.target.value)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    appearance: 'none',
                  }}
                >
                  <option value="Semua">Semua Waktu</option>
                  <option value="Bulan Ini">Bulan Ini</option>
                  <option value="Tahun Ini">Tahun Ini</option>
                </select>
              </>
            )}

            {activeFilterType === 'pic' && (
              <>
                <FilterChip
                  label={`${filterPic === '' ? 'Semua PIC' : filterPic} ▾`}
                  active={filterPic !== ''}
                  onClick={() => {}}
                />
                <select
                  value={filterPic}
                  onChange={(e) => setFilterPic(e.target.value)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    appearance: 'none',
                  }}
                >
                  <option value="">Semua PIC</option>
                  {uniquePics.map(pic => (
                    <option key={pic as string} value={pic as string}>{pic as string}</option>
                  ))}
                </select>
              </>
            )}

            {activeFilterType === 'penerbit' && (
              <>
                <FilterChip
                  label={`${filterPenerbit === '' ? 'Semua Penerbit' : filterPenerbit === 'penerbit_a' ? 'Penerbit A' : filterPenerbit} ▾`}
                  active={filterPenerbit !== ''}
                  onClick={() => {}}
                />
                <select
                  value={filterPenerbit}
                  onChange={(e) => setFilterPenerbit(e.target.value)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    appearance: 'none',
                  }}
                >
                  <option value="">Semua Penerbit</option>
                  <option value="penerbit_a">Penerbit A</option>
                </select>
              </>
            )}

            {activeFilterType === 'status' && (
              <>
                <FilterChip
                  label={`${filterStatus === '' ? 'Semua Status' : filterStatus} ▾`}
                  active={filterStatus !== ''}
                  onClick={() => {}}
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    appearance: 'none',
                  }}
                >
                  <option value="">Semua Status</option>
                  {uniqueStatuses.map(s => (
                    <option key={s as string} value={s as string}>{s as string}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        </FilterGroup>

        <div style={{ flex: 1 }}></div>

        <Button onClick={handleExport} variant="primary" size="sm" icon={<span>📥</span>}>
          Export Excel
        </Button>
      </FilterBar>

      <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px 0 0 0', background: 'var(--bg-dark)' }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Memuat laporan...</div>
        ) : (
          <>
            {/* Metric Cards Terstandar dengan padding kiri-kanan */}
            <div style={{ padding: '0 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <StatCard label="Naskah Aktif" value={activeTasks.length} color="#3b82f6" />
                <StatCard label="Tugas Selesai" value={finishedTasks.length} color="#22c55e" />
                <StatCard label="Tugas Overdue" value={overdueTasks.length} color="#ef4444" />
                <StatCard label="Legalitas Diproses" value={prosesLegalitas.length} color="#a855f7" />
              </div>
            </div>

            {/* Beban Kerja Tim Terstandar dengan padding kiri-kanan */}
            <div style={{ padding: '0 24px' }}>
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
            </div>

            {/* Task Terlambat Terstandar - FULL WIDTH */}
            <div style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', paddingBottom: '16px' }}>
              <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Task Terlambat (Overdue)</h3>
                {overdueTasks.length > 0 && <Badge label={`${overdueTasks.length} Terlambat`} variant="danger" />}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyles.table}>
                  <thead style={tableStyles.thead}>
                    <tr style={tableStyles.headerRow}>
                      <th style={{ ...tableStyles.th, paddingLeft: '24px' }}>Judul Naskah</th>
                      <th style={tableStyles.th}>Tahap</th>
                      <th style={tableStyles.th}>PIC</th>
                      <th style={{ ...tableStyles.th, paddingRight: '24px' }}>Deadline</th>
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
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <td style={{ ...tableStyles.tdTitle, paddingLeft: '24px' }}>{task.naskah_title || `Naskah #${task.naskah_id}`}</td>
                          <td style={tableStyles.td}>{task.step_name}</td>
                          <td style={task.pic_name ? tableStyles.td : tableStyles.tdMuted}>{task.pic_name || '-'}</td>
                          <td style={{ ...tableStyles.td, paddingRight: '24px' }}>
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
