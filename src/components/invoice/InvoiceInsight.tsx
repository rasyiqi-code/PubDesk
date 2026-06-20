import React, { useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Invoice } from '../../types';

const InvoiceInsight: React.FC = () => {
  const { invoices } = useAppContext();

  // Format harga Rupiah
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  // Parse file_path (metadata JSON)
  const getInvoiceMetadata = (invoice: Invoice) => {
    try {
      if (invoice.file_path) {
        return JSON.parse(invoice.file_path);
      }
    } catch (e) {
      console.error('Gagal memuat metadata invoice:', e);
    }
    return {
      paymentStatus: 'PENDING'
    };
  };

  const stats = useMemo(() => {
    let totalLunas = 0;
    let totalBelumLunas = 0;
    let totalPending = 0;
    let countLunas = 0;
    let countBelumLunas = 0;
    let countPending = 0;

    invoices.forEach((inv) => {
      const metadata = getInvoiceMetadata(inv);
      const status = metadata.paymentStatus || 'PENDING';
      if (status === 'LUNAS') {
        totalLunas += inv.total;
        countLunas++;
      } else if (status === 'BELUM LUNAS') {
        totalBelumLunas += inv.total;
        countBelumLunas++;
      } else {
        totalPending += inv.total;
        countPending++;
      }
    });

    const grandTotal = totalLunas + totalBelumLunas + totalPending;
    const totalCount = invoices.length;

    return {
      count: totalCount,
      lunas: totalLunas,
      belumLunas: totalBelumLunas,
      pending: totalPending,
      grandTotal,
      countLunas,
      countBelumLunas,
      countPending
    };
  }, [invoices]);

  // Persentase pembulatan rasio keuangan
  const percentLunas = stats.grandTotal > 0 ? (stats.lunas / stats.grandTotal) * 100 : 0;
  const percentBelumLunas = stats.grandTotal > 0 ? (stats.belumLunas / stats.grandTotal) * 100 : 0;
  const percentPending = stats.grandTotal > 0 ? (stats.pending / stats.grandTotal) * 100 : 0;

  // Visualisasi lingkaran SVG
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  
  // Hitung offset stroke SVG
  const strokeDashoffsetLunas = circumference - (percentLunas / 100) * circumference;
  const strokeDashoffsetBelumLunas = circumference - (percentBelumLunas / 100) * circumference;
  const strokeDashoffsetPending = circumference - (percentPending / 100) * circumference;

  return (
    <div className="invoice-insight" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>📊 Analisis & Statistik Invoice</h1>
      </div>

      {/* Ringkasan Statistik Kartu */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', flexShrink: 0 }}>
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Total Invoice Terbit</span>
          <strong style={{ fontSize: '24px', color: 'var(--text-primary)' }}>{stats.count} Lembar</strong>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Akumulasi omzet kotor: <strong>{formatPrice(stats.grandTotal)}</strong></span>
        </div>
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#16a34a' }}>Total Dana Diterima (Lunas)</span>
          <strong style={{ fontSize: '24px', color: '#16a34a' }}>{formatPrice(stats.lunas)}</strong>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Dari <strong>{stats.countLunas}</strong> invoice lunas</span>
        </div>
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#dc2626' }}>Total Piutang (Belum Lunas)</span>
          <strong style={{ fontSize: '24px', color: '#dc2626' }}>{formatPrice(stats.belumLunas)}</strong>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Dari <strong>{stats.countBelumLunas}</strong> invoice belum lunas</span>
        </div>
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#d97706' }}>Total Dana Tertunda (Pending)</span>
          <strong style={{ fontSize: '24px', color: '#d97706' }}>{formatPrice(stats.pending)}</strong>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Dari <strong>{stats.countPending}</strong> invoice pending</span>
        </div>
      </div>

      {/* Visualisasi Analytics Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', flexShrink: 0 }}>
        
        {/* Distribusi Pembayaran Donut Chart */}
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>📊 Distribusi Keuangan</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '20px', padding: '10px 0' }}>
            {/* SVG Donat */}
            <div style={{ position: 'relative', width: '150px', height: '150px' }}>
              <svg width="100%" height="100%" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background circle */}
                <circle cx="60" cy="60" r={radius} fill="transparent" stroke="var(--border)" strokeWidth="12" />
                
                {/* Pending segment */}
                {stats.pending > 0 && (
                  <circle 
                    cx="60" 
                    cy="60" 
                    r={radius} 
                    fill="transparent" 
                    stroke="#d97706" 
                    strokeWidth="12" 
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffsetPending}
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                )}
                
                {/* Belum Lunas segment */}
                {stats.belumLunas > 0 && (
                  <circle 
                    cx="60" 
                    cy="60" 
                    r={radius} 
                    fill="transparent" 
                    stroke="#dc2626" 
                    strokeWidth="12" 
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffsetBelumLunas}
                    style={{ transform: `rotate(${(percentPending * 3.6)}deg)`, transformOrigin: '60px 60px', transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                )}

                {/* Lunas segment */}
                {stats.lunas > 0 && (
                  <circle 
                    cx="60" 
                    cy="60" 
                    r={radius} 
                    fill="transparent" 
                    stroke="#16a34a" 
                    strokeWidth="12" 
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffsetLunas}
                    style={{ transform: `rotate(${((percentPending + percentBelumLunas) * 3.6)}deg)`, transformOrigin: '60px 60px', transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                )}
              </svg>
              
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Lunas</span>
                <strong style={{ fontSize: '18px', color: '#16a34a' }}>{percentLunas.toFixed(0)}%</strong>
              </div>
            </div>

            {/* Keterangan */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#16a34a', display: 'inline-block' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Lunas ({percentLunas.toFixed(1)}%)</span>
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{formatPrice(stats.lunas)}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#dc2626', display: 'inline-block' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Belum Lunas ({percentBelumLunas.toFixed(1)}%)</span>
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{formatPrice(stats.belumLunas)}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#d97706', display: 'inline-block' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pending ({percentPending.toFixed(1)}%)</span>
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{formatPrice(stats.pending)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Indikator Status & Kesehatan Penagihan */}
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>📈 Kesehatan Penagihan</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Persentase Pembayaran Berhasil</span>
                <strong style={{ color: 'var(--text-primary)' }}>{percentLunas.toFixed(1)}%</strong>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${percentLunas}%`, height: '100%', background: '#16a34a', borderRadius: '4px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Persentase Tunggakan Aktif</span>
                <strong style={{ color: 'var(--text-primary)' }}>{(percentBelumLunas + percentPending).toFixed(1)}%</strong>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${percentBelumLunas + percentPending}%`, height: '100%', background: '#dc2626', borderRadius: '4px' }} />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Rasio Kolektibilitas Layak:</span>
                <strong style={{ color: percentLunas >= 80 ? '#16a34a' : '#d97706' }}>
                  {percentLunas >= 80 ? 'Sangat Baik' : percentLunas >= 50 ? 'Cukup Baik' : 'Perlu Perhatian'}
                </strong>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                * Semakin tinggi tingkat persentase pembayaran berhasil, semakin sehat arus kas unit usaha penerbitan buku Anda.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InvoiceInsight;
