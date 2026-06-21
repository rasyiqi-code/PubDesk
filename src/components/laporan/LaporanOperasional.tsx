import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Task } from '../../types/workflow.types';
import { Tim } from '../../types/data-master.types';
import { useUniqueValues } from '../../hooks/useUniqueValues';
import { useAuth } from '../../contexts/AuthContext';
import { StatCard } from '../../ui/molecules/StatCard';
import { Button } from '../../ui/atoms/Button';
import { Badge } from '../../ui/atoms/Badge';
import { FilterBar, FilterGroup, FilterChip } from '../../ui/molecules/FilterBar';
import { DataTablePage, tableStyles } from '../../ui/molecules/DataTable';

interface Legalitas {
  id: number;
  naskah_id: number;
  naskah_title?: string;
  legal_type: string;
  status: string;
}

const LaporanOperasional: React.FC = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [legalitasList, setLegalitasList] = useState<Legalitas[]>([]);
  const [timList, setTimList] = useState<Tim[]>([]);
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
      const [taskData, legalitasData, timData] = await Promise.all([
        invoke<Task[]>('get_tasks'),
        invoke<Legalitas[]>('get_legalitas').catch(() => []),
        invoke<Tim[]>('get_tim').catch(() => [])
      ]);
      setTasks(taskData);
      setLegalitasList(legalitasData);
      setTimList(timData);
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

  // Metrik Personal untuk Insight Karyawan
  const startOfWeek = new Date();
  const currentDay = startOfWeek.getDay();
  const diffDays = startOfWeek.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Awal minggu (Senin)
  startOfWeek.setDate(diffDays);
  startOfWeek.setHours(0, 0, 0, 0);

  const myActiveTasks = tasks.filter(t => 
    t.pic_name === currentUser?.tim_name && 
    t.status !== 'Selesai' && 
    t.status !== 'Batal'
  );

  const myFinishedThisWeekTasks = tasks.filter(t => {
    if (t.pic_name !== currentUser?.tim_name) return false;
    if (t.status !== 'Selesai') return false;
    if (!t.completed_date) return false;
    const completedDate = new Date(t.completed_date);
    return completedDate >= startOfWeek;
  });

  const currentUserTimProfile = timList.find(t => t.id === currentUser?.tim_id);
  const myWeeklyTarget = currentUserTimProfile?.weekly_target || 5;

  const handleExport = () => {
    alert("Mengekspor data ke Excel... (Fitur segera hadir)");
  };

  return (
    <DataTablePage
      filterBar={
        <>
          <FilterBar>
            <FilterGroup label="🔍 Filter:">
              {/* Dropdown Kategori / Judul Filter */}
              <div style={{ display: 'inline-block' }}>
                <select
                  value={activeFilterType}
                  onChange={(e) => setActiveFilterType(e.target.value as any)}
                  style={{
                    borderRadius: '20px',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: 'var(--accent, #3b82f6)',
                    color: '#ffffff',
                    padding: '4px 12px 4px 8px',
                    fontSize: '12px',
                    height: '24px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    appearance: 'none',
                    textAlign: 'center',
                  }}
                >
                  <option value="periode" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>📅 Periode ▾</option>
                  <option value="pic" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>👤 PIC ▾</option>
                  <option value="penerbit" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>🏢 Penerbit ▾</option>
                  <option value="status" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>📋 Status ▾</option>
                </select>
              </div>

              <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 'bold' }}>:</span>

              {/* Opsi Nilai Filter Horizontal (Bukan Dropdown) */}
              {activeFilterType === 'periode' && (
                <>
                  <FilterChip label="Semua Waktu" active={periode === 'Semua'} onClick={() => setPeriode('Semua')} />
                  <FilterChip label="Bulan Ini" active={periode === 'Bulan Ini'} onClick={() => setPeriode('Bulan Ini')} />
                  <FilterChip label="Tahun Ini" active={periode === 'Tahun Ini'} onClick={() => setPeriode('Tahun Ini')} />
                </>
              )}

              {activeFilterType === 'pic' && (
                <>
                  <FilterChip label="Semua PIC" active={filterPic === ''} onClick={() => setFilterPic('')} />
                  {uniquePics.map(pic => (
                    <FilterChip
                      key={pic as string}
                      label={pic as string}
                      active={filterPic === pic}
                      onClick={() => setFilterPic(pic as string)}
                    />
                  ))}
                </>
              )}

              {activeFilterType === 'penerbit' && (
                <>
                  <FilterChip label="Semua Penerbit" active={filterPenerbit === ''} onClick={() => setFilterPenerbit('')} />
                  <FilterChip label="Penerbit A" active={filterPenerbit === 'penerbit_a'} onClick={() => setFilterPenerbit('penerbit_a')} />
                </>
              )}

              {activeFilterType === 'status' && (
                <>
                  <FilterChip label="Semua Status" active={filterStatus === ''} onClick={() => setFilterStatus('')} />
                  {uniqueStatuses.map(s => (
                    <FilterChip
                      key={s as string}
                      label={s as string}
                      active={filterStatus === s}
                      onClick={() => setFilterStatus(s as string)}
                    />
                  ))}
                </>
              )}
            </FilterGroup>

            <div style={{ flex: 1 }}></div>

            <Button onClick={handleExport} variant="primary" size="sm" icon={<span>📥</span>}>
              Export Excel
            </Button>
          </FilterBar>

          {/* StatCards Header - Berlatar Belakang var(--bg-card) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', padding: '12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <StatCard label="Naskah Aktif" value={activeTasks.length} color="#3b82f6" />
            <StatCard label="Tugas Selesai" value={finishedTasks.length} color="#22c55e" />
            <StatCard label="Tugas Overdue" value={overdueTasks.length} color="#ef4444" />
            <StatCard label="Legalitas Diproses" value={prosesLegalitas.length} color="#a855f7" />
          </div>
        </>
      }
    >
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px 0 0 0', background: 'var(--bg-dark)' }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Memuat laporan...</div>
        ) : (
          <>
            {/* Insight Anda - Tampil jika user login */}
            {currentUser && (
              <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Insight Anda ({currentUser.tim_name})</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: '16px', background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  {/* Target Mingguan */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderRight: '1px solid var(--border)', paddingRight: '16px' }}>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: '600' }}>Target Mingguan Saya</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '4px 0' }}>
                      <span style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>{myFinishedThisWeekTasks.length}</span>
                      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>/ {myWeeklyTarget} Selesai</span>
                    </div>
                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, (myFinishedThisWeekTasks.length / myWeeklyTarget) * 100)}%`, height: '100%', background: myFinishedThisWeekTasks.length >= myWeeklyTarget ? '#22c55e' : '#3b82f6', transition: 'width 0.3s ease' }}></div>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {myFinishedThisWeekTasks.length >= myWeeklyTarget ? '🎉 Target tercapai!' : `${myWeeklyTarget - myFinishedThisWeekTasks.length} tugas lagi untuk mencapai target.`}
                    </span>
                  </div>

                  {/* Tugas Aktif Saya */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: '600' }}>Tugas Aktif Saya ({myActiveTasks.length})</span>
                    {myActiveTasks.length === 0 ? (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '12px 0' }}>
                        🎉 Tidak ada tugas aktif untuk Anda saat ini. Selamat!
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '110px', overflowY: 'auto' }}>
                        {myActiveTasks.slice(0, 3).map(task => (
                          <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-panel)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
                              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {task.naskah_title || `Naskah #${task.naskah_id}`}
                              </span>
                              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Tahap: {task.step_name}</span>
                            </div>
                            {task.due_date && (
                              <Badge 
                                label={new Date(task.due_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})} 
                                variant={isOverdue(task) ? "danger" : "info"} 
                                size="sm" 
                              />
                            )}
                          </div>
                        ))}
                        {myActiveTasks.length > 3 && (
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            + {myActiveTasks.length - 3} tugas aktif lainnya. Gunakan filter PIC untuk melihat detail lengkap.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Beban Kerja Tim Terstandar tanpa container card */}
            <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Beban Kerja Tim (Tugas Aktif)</h3>
              {bebanKerjaArr.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Tidak ada beban kerja saat ini.</div>
              ) : (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {bebanKerjaArr.map(([pic, count]) => (
                    <div key={pic} style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', gap: '6px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-primary)' }}>{pic}</span>
                      <Badge label={`${count} tugas`} variant={count > 3 ? "warning" : "info"} size="sm" />
                    </div>
                  ))}
                </div>
              )}
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
    </DataTablePage>
  );
};

export default LaporanOperasional;
