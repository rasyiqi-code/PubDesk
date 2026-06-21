import React, { useMemo } from 'react';
import { useWorkflowContext } from '../../contexts/WorkflowContext';
import { useAppContext } from '../../contexts/AppContext';
import { Badge, getStatusVariant } from '../../ui/atoms/Badge';
import { formatDateLong } from '../../utils/format';
import { Task } from '../../types/workflow.types';

const STAT_CARDS = [
  { key: 'aktif', label: 'Aktif', color: '#3b82f6', icon: '⚡' },
  { key: 'deadlineDekat', label: 'Deadline Dekat', color: '#f59e0b', icon: '⏳' },
  { key: 'terlambat', label: 'Terlambat', color: '#ef4444', icon: '🚨' },
  { key: 'revisi', label: 'Menunggu Revisi', color: '#f97316', icon: '🔄' },
  { key: 'approval', label: 'Menunggu Approval', color: '#8b5cf6', icon: '✅' },
  { key: 'selesaiMingguIni', label: 'Selesai Minggu Ini', color: '#22c55e', icon: '🎉' },
] as const;

type StatKey = typeof STAT_CARDS[number]['key'];

const DashboardProduksi: React.FC = () => {
  const { tasks, isLoading, setSelectedTaskId } = useWorkflowContext();
  const { setActiveModule, setRightPanelVisible } = useAppContext();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isOverdue = (task: Task) => {
    if (task.status === 'Selesai' || !task.due_date) return false;
    const due = new Date(task.due_date);
    due.setHours(0, 0, 0, 0);
    return due.getTime() < today.getTime();
  };

  const isDeadlineDekat = (task: Task) => {
    if (task.status === 'Selesai' || !task.due_date) return false;
    const due = new Date(task.due_date);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  };

  const isSelesaiMingguIni = (task: Task) => {
    if (task.status !== 'Selesai' || !task.completed_date) return false;
    const diffDays = Math.floor((today.getTime() - new Date(task.completed_date).getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const stats = useMemo((): Record<StatKey, number> => ({
    aktif: tasks.filter(t => t.status === 'Proses' || t.status === 'Belum Mulai').length,
    deadlineDekat: tasks.filter(isDeadlineDekat).length,
    terlambat: tasks.filter(t => isOverdue(t) || t.status === 'Terlambat').length,
    revisi: tasks.filter(t => t.status === 'Menunggu Revisi').length,
    approval: tasks.filter(t => t.status === 'Menunggu Approval').length,
    selesaiMingguIni: tasks.filter(isSelesaiMingguIni).length,
  }), [tasks]);

  // Cari tugas mendesak (Urgent/Tinggi dan belum selesai, atau Terlambat)
  const urgentTasks = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'Selesai' && (t.priority === 'Urgent' || t.priority === 'Tinggi' || isOverdue(t)))
      .slice(0, 5);
  }, [tasks]);

  // Statistik per tahap/step
  const stepStats = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.forEach(t => {
      if (t.status !== 'Selesai' && t.step_name) {
        map[t.step_name] = (map[t.step_name] || 0) + 1;
      }
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [tasks]);

  const totalUnfinished = tasks.filter(t => t.status !== 'Selesai').length;

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
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🏭</span>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Dashboard Produksi Naskah</span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          Ringkasan aktivitas, status alur naskah, dan daftar pekerjaan mendesak.
        </span>
      </div>

      {/* Konten Dashboard yang scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Grid Stat Cards terpadu tanpa space/gap dan tidak membulat (siku) */}
      <div style={{ 
        display: 'flex', 
        background: 'var(--bg-card)', 
        border: '1px solid var(--border)', 
        borderRadius: '0px', 
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        {STAT_CARDS.map((card, idx) => {
          const isLast = idx === STAT_CARDS.length - 1;
          const value = stats[card.key];
          return (
            <div 
              key={card.key} 
              style={{ 
                flex: 1,
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                borderRight: isLast ? 'none' : '1px solid var(--border)',
                transition: 'background 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-panel)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {/* Garis aksen warna kecil di sisi atas */}
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                height: '3px', 
                background: card.color 
              }} />
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {card.label}
                </span>
                <span style={{ fontSize: '16px', opacity: 0.6 }}>{card.icon}</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '8px' }}>
                {value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Section Utama */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 320px', 
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Kolom Kiri: Tugas Mendesak & Navigasi Cepat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Box Tugas Mendesak */}
          <div style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border)', 
            borderRadius: '12px', 
            padding: '20px' 
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🚨 Perhatian Khusus (Mendesak / Terlambat)
            </h2>
            
            {isLoading ? (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>Memuat data...</div>
            ) : urgentTasks.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px', fontSize: '14px' }}>
                🎉 Bagus! Tidak ada tugas mendesak atau terlambat saat ini.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {urgentTasks.map(task => {
                  const overdue = isOverdue(task);
                  return (
                    <div 
                      key={task.id}
                      onClick={() => {
                        if (task.id) {
                          setSelectedTaskId(task.id);
                          setRightPanelVisible(true);
                        }
                      }}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '12px 16px', 
                        borderRadius: '8px', 
                        background: 'var(--bg-panel)',
                        border: overdue ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'transform 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.borderColor = overdue ? '#ef4444' : 'var(--accent)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = overdue ? 'rgba(239, 68, 68, 0.2)' : 'var(--border)';
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '70%' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {task.naskah_title || `Naskah #${task.naskah_id}`}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <span>{task.step_name}</span>
                          <span>•</span>
                          <span style={{ color: overdue ? '#ef4444' : 'inherit', fontWeight: overdue ? '600' : 'normal' }}>
                            {overdue ? `Terlambat (Deadline: ${formatDateLong(task.due_date)})` : `Deadline: ${formatDateLong(task.due_date)}`}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge label={task.status} variant={getStatusVariant(task.status)} />
                        <span style={{ 
                          fontSize: '11px', 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          background: '#ef4444', 
                          color: '#ffffff',
                          fontWeight: '600'
                        }}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions / Navigasi */}
          <div style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border)', 
            borderRadius: '12px', 
            padding: '20px' 
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
              ⚡ Navigasi Cepat Produksi
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {[
                { module: 'tambah-tugas' as const, label: 'Tambah Tugas Baru', desc: 'Buat workflow baru', icon: '➕' },
                { module: 'produksi-board' as const, label: 'Board Kanban', desc: 'Atur naskah visual', icon: '🎨' },
                { module: 'produksi-list' as const, label: 'Daftar Tugas', desc: 'Pantau semua tugas', icon: '📄' },
                { module: 'produksi-kendala' as const, label: 'Revisi & Kendala', desc: 'Kelola hambatan', icon: '⚠️' },
                { module: 'produksi-approval' as const, label: 'Approval Tugas', desc: 'Validasi hasil kerja', icon: '✅' },
                { module: 'pekerjaan-saya' as const, label: 'Tugas Saya', desc: 'Pekerjaan saya pribadi', icon: '📋' },
              ].map(act => (
                <button
                  key={act.module}
                  onClick={() => setActiveModule(act.module)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-panel)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.background = 'var(--bg-card)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.background = 'var(--bg-panel)';
                  }}
                >
                  <span style={{ fontSize: '20px', marginBottom: '4px' }}>{act.icon}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{act.label}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{act.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Distribusi Tahap Workflow */}
        <div style={{ 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border)', 
          borderRadius: '12px', 
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            📊 Alokasi Tahap Produksi
          </h2>

          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
            Total Naskah Aktif: <strong style={{ color: 'var(--text-primary)' }}>{totalUnfinished} naskah</strong>
          </div>

          {totalUnfinished === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              Tidak ada data tugas aktif saat ini.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Visual Ringkas dengan SVG Donut/Pie Minimalis */}
              <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                <svg width="120" height="120" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--border)" strokeWidth="3" />
                  {(() => {
                    let accumulatedPercent = 0;
                    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#374151'];
                    return stepStats.slice(0, 5).map((step, idx) => {
                      const percent = (step.count / totalUnfinished) * 100;
                      const strokeDasharray = `${percent} ${100 - percent}`;
                      const strokeDashoffset = 100 - accumulatedPercent;
                      accumulatedPercent += percent;
                      return (
                        <circle
                          key={step.name}
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke={colors[idx % colors.length]}
                          strokeWidth="3.2"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                        />
                      );
                    });
                  })()}
                </svg>
              </div>

              {/* Legend & Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {stepStats.map((step, idx) => {
                  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#374151'];
                  const color = colors[idx % colors.length];
                  const percent = totalUnfinished > 0 ? Math.round((step.count / totalUnfinished) * 100) : 0;
                  return (
                    <div key={step.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '75%' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                        <span style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {step.name}
                        </span>
                      </div>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>
                        {step.count} ({percent}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
};

export default DashboardProduksi;
