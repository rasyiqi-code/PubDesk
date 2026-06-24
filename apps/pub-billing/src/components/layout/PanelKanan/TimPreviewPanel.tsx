import React, { useMemo } from 'react';
import { useDataMasterContext } from '../../../contexts/DataMasterContext';
import { Badge } from '../../../ui/atoms/Badge';
import { InfoRow } from '../../../ui/molecules/InfoRow';
import { SectionCard } from '../../../ui/molecules/SectionCard';

interface TimPreviewPanelProps {
  timId: number | null;
}

const ROLE_GRADIENT: Record<string, string> = {
  'Layouter': 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
  'Desainer Cover': 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
  'Editor Naskah': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  'Proofreader': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  'Manajer Produksi': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  'Marketing': 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
  'Keuangan': 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
  'Admin': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  'Fotografer': 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
  'Illustrator': 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
};

const TimPreviewPanel: React.FC<TimPreviewPanelProps> = ({ timId }) => {
  const { tim } = useDataMasterContext();

  const memberData = useMemo(() => {
    if (!timId) return null;
    return tim.find((l) => l.id === timId) || null;
  }, [tim, timId]);

  const completeness = useMemo(() => {
    if (!memberData) return 0;
    const fields = [
      memberData.name,
      memberData.role,
      memberData.department,
      memberData.notes,
      memberData.wa_number,
      memberData.email,
      memberData.address
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [memberData]);

  if (!timId || !memberData) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        background: 'var(--bg-panel)', justifyContent: 'center', alignItems: 'center',
        padding: '20px', gap: '12px',
      }}>
        <div style={{ fontSize: '40px', opacity: 0.3 }}>👥</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', fontWeight: '500', lineHeight: '1.5' }}>
          Pilih anggota tim dari tabel<br />untuk melihat profil lengkap
        </p>
      </div>
    );
  }

  const nameInitial = memberData.name.charAt(0).toUpperCase();
  const gradient = ROLE_GRADIENT[memberData.role] || 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
  const completenessColor = completeness >= 80 ? '#22c55e' : completeness >= 50 ? '#f59e0b' : '#f87171';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', overflowY: 'auto' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', position: 'sticky', top: 0, zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff', fontSize: '18px', fontWeight: '700', flexShrink: 0,
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
          }}>
            {nameInitial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 6px 0', lineHeight: '1.4', wordBreak: 'break-word' }}>
              {memberData.name}
            </h4>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ padding: '1px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                {memberData.role}
              </span>
              {memberData.department && (
                <span style={{ padding: '1px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', background: 'rgba(6,182,212,0.12)', color: '#22d3ee' }}>
                  {memberData.department}
                </span>
              )}
              <Badge label={memberData.is_active === 1 ? 'Aktif' : 'Nonaktif'} variant={memberData.is_active === 1 ? 'success' : 'neutral'} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            <span>Kelengkapan Profil</span>
            <span style={{ fontWeight: '600', color: completenessColor }}>{completeness}%</span>
          </div>
          <div style={{ height: '4px', borderRadius: '2px', background: 'var(--border)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${completeness}%`, borderRadius: '2px', background: completenessColor, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {memberData.notes && (
          <SectionCard title="Keahlian &amp; Catatan">
            <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.7', fontStyle: 'italic', opacity: 0.9 }}>
              &ldquo;{memberData.notes}&rdquo;
            </div>
          </SectionCard>
        )}

        <SectionCard title="👤 Profil Anggota">
          <InfoRow label="Peran / Jabatan" value={memberData.role} />
          <InfoRow label="Divisi" value={memberData.department || '—'} />
          <InfoRow
            label="Status"
            value={<Badge label={memberData.is_active === 1 ? 'Aktif' : 'Nonaktif'} variant={memberData.is_active === 1 ? 'success' : 'neutral'} />}
            noBorder
          />
        </SectionCard>

        <SectionCard title="📞 Informasi Kontak">
          <InfoRow label="No. WhatsApp" value={memberData.wa_number || '—'} />
          <InfoRow label="Email Resmi" value={memberData.email || '—'} />
          <InfoRow label="Alamat Lengkap" value={memberData.address || '—'} noBorder />
        </SectionCard>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <span>ID: <strong style={{ fontFamily: 'monospace' }}>#{memberData.id}</strong></span>
          <span>
            Bergabung:{' '}
            <strong>
              {memberData.created_at
                ? new Date(memberData.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                : '—'}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimPreviewPanel;
