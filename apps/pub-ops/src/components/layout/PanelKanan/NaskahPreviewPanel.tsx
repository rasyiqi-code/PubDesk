import React, { useMemo } from 'react';
import { useDataMasterContext } from '../../../contexts/DataMasterContext';
import { useWorkflowContext } from '../../../contexts/WorkflowContext';
import { useAppContext } from '../../../contexts/AppContext';
import { Badge, getStatusVariant } from '../../../ui/atoms/Badge';
import { InfoRow } from '../../../ui/molecules/InfoRow';
import { SectionCard } from '../../../ui/molecules/SectionCard';

interface NaskahPreviewPanelProps {
  naskahId: number | null;
}

const NaskahPreviewPanel: React.FC<NaskahPreviewPanelProps> = ({ naskahId }) => {
  const { naskah, penulis, penerbit } = useDataMasterContext();
  const { tasks, setSelectedTaskId } = useWorkflowContext();
  const { setActiveModule, setRightPanelVisible } = useAppContext();

  const naskahData = useMemo(() => {
    if (!naskahId) return null;
    return naskah.find((n) => n.id === naskahId) || null;
  }, [naskah, naskahId]);

  const penulisData = useMemo(() => {
    if (!naskahData?.penulis_id) return null;
    return penulis.find((p) => p.id === naskahData.penulis_id) || null;
  }, [naskahData, penulis]);

  const penerbitData = useMemo(() => {
    if (!naskahData?.penerbit_id) return null;
    return penerbit.find((p) => p.id === naskahData.penerbit_id) || null;
  }, [naskahData, penerbit]);

  const completeness = useMemo(() => {
    if (!naskahData) return 0;
    const fields = [
      naskahData.naskah_id_code, naskahData.genre, naskahData.total_pages,
      naskahData.synopsis, naskahData.book_size, naskahData.legal_type,
      naskahData.penulis_id, naskahData.penerbit_id, naskahData.order_type, naskahData.copies,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [naskahData]);

  if (!naskahId || !naskahData) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        background: 'var(--bg-panel)', justifyContent: 'center', alignItems: 'center',
        padding: '20px', gap: '12px',
      }}>
        <div style={{ fontSize: '40px', opacity: 0.3 }}>📚</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', fontWeight: '500', lineHeight: '1.5' }}>
          Pilih naskah dari tabel<br />untuk melihat rincian lengkap
        </p>
      </div>
    );
  }

  const titleInitial = naskahData.title.charAt(0).toUpperCase();
  const completenessColor = completeness >= 80 ? '#22c55e' : completeness >= 50 ? '#f59e0b' : '#f87171';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', overflowY: 'auto' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', position: 'sticky', top: 0, zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff', fontSize: '18px', fontWeight: '700', flexShrink: 0,
            boxShadow: '0 4px 10px rgba(99,102,241,0.3)',
          }}>
            {titleInitial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 6px 0', lineHeight: '1.4', wordBreak: 'break-word' }}>
              {naskahData.title}
            </h4>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
              {naskahData.naskah_id_code && (
                <span style={{ padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', background: 'rgba(99,102,241,0.12)', color: '#818cf8', fontFamily: 'monospace' }}>
                  {naskahData.naskah_id_code}
                </span>
              )}
              {naskahData.genre && (
                <span style={{ padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', background: 'rgba(6,182,212,0.12)', color: '#22d3ee', textTransform: 'uppercase' }}>
                  {naskahData.genre}
                </span>
              )}
              <Badge label={naskahData.status} variant={getStatusVariant(naskahData.status)} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            <span>Kelengkapan Data</span>
            <span style={{ fontWeight: '600', color: completenessColor }}>{completeness}%</span>
          </div>
          <div style={{ height: '4px', borderRadius: '2px', background: 'var(--border)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${completeness}%`, borderRadius: '2px', background: completenessColor, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {naskahData.synopsis && (
          <SectionCard title="Sinopsis">
            <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.7', fontStyle: 'italic', opacity: 0.9 }}>
              &ldquo;{naskahData.synopsis}&rdquo;
            </div>
          </SectionCard>
        )}

        <SectionCard title="📖 Identitas Naskah">
          {naskahData.naskah_id_code && (
            <InfoRow label="Kode ID" value={<span style={{ fontFamily: 'monospace', color: '#818cf8' }}>{naskahData.naskah_id_code}</span>} />
          )}
          <InfoRow label="Genre" value={naskahData.genre || '—'} />
          <InfoRow label="Jumlah Halaman" value={naskahData.total_pages ? `${naskahData.total_pages} hlm` : '—'} />
          <InfoRow label="Ukuran Buku" value={naskahData.book_size || '—'} />
          <InfoRow label="Legalitas" value={naskahData.legal_type || '—'} noBorder />
        </SectionCard>

        {naskahData.store_links && (
          <SectionCard title="🌐 Toko Online / Distribusi">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(() => {
                try {
                  const links = JSON.parse(naskahData.store_links);
                  if (Array.isArray(links) && links.length > 0) {
                    return links.map((link: { platform: string; url: string }, idx: number) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border)',
                          borderRadius: '8px', textDecoration: 'none', color: 'var(--text-primary)',
                          transition: 'background 0.2s ease', cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-surface)'}
                      >
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>{link.platform || 'Link'}</span>
                        <span style={{ fontSize: '12px', color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                          Buka ↗
                        </span>
                      </a>
                    ));
                  }
                  return <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Belum ada link toko online</div>;
                } catch {
                  return <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Data link tidak valid</div>;
                }
              })()}
            </div>
          </SectionCard>
        )}

        <SectionCard title="✍️ Penulis">
          {penulisData ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '12px', fontWeight: '700', flexShrink: 0,
                }}>
                  {penulisData.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{penulisData.name}</div>
                  {penulisData.job && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>{penulisData.job}</div>}
                </div>
              </div>
              {penulisData.institution && <InfoRow label="Institusi" value={penulisData.institution} />}
              {penulisData.address && <InfoRow label="Alamat" value={penulisData.address} />}
              {penulisData.wa_number && (
                <InfoRow label="WhatsApp" value={
                  <span style={{ color: '#4ade80' }}>
                    {penulisData.wa_number}
                    {penulisData.wa_valid === 1 && <span style={{ marginLeft: '4px', fontSize: '10px' }}>✓</span>}
                  </span>
                } />
              )}
              {penulisData.email && (
                <InfoRow label="Email" value={
                  <span style={{ fontSize: '11px' }}>
                    {penulisData.email}
                    {penulisData.email_valid === 1 && <span style={{ marginLeft: '4px', color: '#4ade80', fontSize: '10px' }}>✓</span>}
                  </span>
                } />
              )}
              {penulisData.followup_status && <InfoRow label="Status Followup" value={penulisData.followup_status} noBorder />}
            </>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '4px 0' }}>
              Belum ada penulis yang dipilih
            </div>
          )}
        </SectionCard>

        <SectionCard title="🏢 Penerbit Mitra">
          {penerbitData ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '12px', fontWeight: '700', flexShrink: 0,
                }}>
                  {penerbitData.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{penerbitData.name}</div>
                  {penerbitData.cooperation_status && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>{penerbitData.cooperation_status}</div>}
                </div>
              </div>
              {penerbitData.address && <InfoRow label="Alamat" value={penerbitData.address} />}
              {penerbitData.wa_number && (
                <InfoRow label="WhatsApp" value={
                  <span style={{ color: '#4ade80' }}>
                    {penerbitData.wa_number}
                    {penerbitData.wa_valid === 1 && <span style={{ marginLeft: '4px', fontSize: '10px' }}>✓</span>}
                  </span>
                } />
              )}
              {penerbitData.email && (
                <InfoRow label="Email" value={
                  <span style={{ fontSize: '11px' }}>
                    {penerbitData.email}
                    {penerbitData.email_valid === 1 && <span style={{ marginLeft: '4px', color: '#4ade80', fontSize: '10px' }}>✓</span>}
                  </span>
                } />
              )}
              {penerbitData.notes && <InfoRow label="Catatan" value={penerbitData.notes} noBorder />}
            </>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '4px 0' }}>
              Belum ada penerbit yang dipilih
            </div>
          )}
        </SectionCard>

        <SectionCard title="🏭 Tasks Produksi">
          {(() => {
            const relatedTasks = tasks.filter((t) => t.naskah_id === naskahData.id);
            if (relatedTasks.length === 0) {
              return (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>
                  Belum ada task produksi untuk naskah ini
                </div>
              );
            }
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {relatedTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      padding: '10px 12px', background: 'var(--bg-surface)',
                      border: '1px solid var(--border)', borderRadius: '8px',
                      cursor: 'pointer', transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-surface)'}
                    onClick={() => {
                      if (task.id) {
                        setSelectedTaskId(task.id);
                        setRightPanelVisible(true);
                        setActiveModule('produksi-list');
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '13px' }}>{task.step_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {task.pic_name || '—'}
                          {task.pic_name && task.due_date && ' · '}
                          {task.due_date ? new Date(task.due_date).toLocaleDateString('id-ID') : '—'}
                        </div>
                      </div>
                      <Badge label={task.status} variant={getStatusVariant(task.status)} />
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </SectionCard>

        <SectionCard title="📦 Detail Penerbitan">
          <InfoRow label="Tipe Order" value={naskahData.order_type || '—'} />
          <InfoRow label="Jumlah Cetak" value={naskahData.copies ? `${naskahData.copies} eksemplar` : '—'} noBorder />
        </SectionCard>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <span>ID: <strong style={{ fontFamily: 'monospace' }}>#{naskahData.id}</strong></span>
          <span>Dibuat: <strong>{naskahData.created_at ? new Date(naskahData.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</strong></span>
        </div>
      </div>
    </div>
  );
};

export default NaskahPreviewPanel;
