import React, { useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { formatPrice } from '../../utils/format';
import { getInvoiceMetadata } from '../../utils/invoice';

const InvoiceInsight: React.FC = () => {
  const { 
    invoices, 
    selectedInsightMetric, 
    setSelectedInsightMetric, 
    setRightPanelVisible 
  } = useAppContext();



  const stats = useMemo(() => {
    let totalLunas = 0;
    let totalBelumLunas = 0;
    let totalDp = 0;
    let totalBermasalah = 0;
    let countLunas = 0;
    let countBelumLunas = 0;
    let countDp = 0;
    let countBermasalah = 0;
    const uniqueCustomers = new Set();

    invoices.forEach((inv) => {
      const metadata = getInvoiceMetadata(inv);
      const status = metadata.paymentStatus || 'BERMASALAH';
      
      const customerName = (metadata.customerName || 'Umum').trim();
      if (customerName && customerName !== '-') {
        uniqueCustomers.add(customerName.toLowerCase());
      }

      if (status === 'LUNAS') {
        totalLunas += inv.total;
        countLunas++;
      } else if (status === 'BELUM LUNAS') {
        totalBelumLunas += inv.total;
        countBelumLunas++;
      } else if (status === 'DP') {
        totalDp += inv.total;
        countDp++;
      } else {
        totalBermasalah += inv.total;
        countBermasalah++;
      }
    });

    const grandTotal = totalLunas + totalBelumLunas + totalDp + totalBermasalah;
    const totalCount = invoices.length;

    return {
      count: totalCount,
      lunas: totalLunas,
      belumLunas: totalBelumLunas,
      dp: totalDp,
      bermasalah: totalBermasalah,
      grandTotal,
      countLunas,
      countBelumLunas,
      countDp,
      countBermasalah,
      uniqueCustomersCount: uniqueCustomers.size
    };
  }, [invoices]);

  // Persentase pembulatan rasio keuangan
  const percentLunas = stats.grandTotal > 0 ? (stats.lunas / stats.grandTotal) * 100 : 0;
  const percentBelumLunas = stats.grandTotal > 0 ? (stats.belumLunas / stats.grandTotal) * 100 : 0;
  const percentDp = stats.grandTotal > 0 ? (stats.dp / stats.grandTotal) * 100 : 0;
  const percentBermasalah = stats.grandTotal > 0 ? (stats.bermasalah / stats.grandTotal) * 100 : 0;

  // Visualisasi lingkaran SVG
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  // Rumus panjang busur SVG strokeDasharray
  const strokeLengthLunas = (percentLunas / 100) * circumference;
  const strokeLengthBelumLunas = (percentBelumLunas / 100) * circumference;
  const strokeLengthDp = (percentDp / 100) * circumference;
  const strokeLengthBermasalah = (percentBermasalah / 100) * circumference;

  // Sudut rotasi kumulatif
  const rotateBelumLunas = percentLunas * 3.6;
  const rotateDp = (percentLunas + percentBelumLunas) * 3.6;
  const rotateBermasalah = (percentLunas + percentBelumLunas + percentDp) * 3.6;

  const handleMetricClick = (metric: 'total' | 'lunas' | 'belum_lunas' | 'bermasalah' | 'dp') => {
    setSelectedInsightMetric(metric);
    setRightPanelVisible(true);
  };

  return (
    <div className="invoice-insight" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>📊 Analisis & Statistik Invoice</h1>
      </div>

      {/* Ringkasan Statistik Kartu */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', flexShrink: 0 }}>
        
        {/* Kartu Total */}
        <div 
          onClick={() => handleMetricClick('total')}
          style={{ 
            background: selectedInsightMetric === 'total' ? 'rgba(0, 0, 0, 0.04)' : 'var(--bg-panel)',
            border: selectedInsightMetric === 'total' ? '2px solid var(--accent)' : '1px solid var(--border)', 
            borderRadius: '12px', 
            padding: '18px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px', 
            boxShadow: selectedInsightMetric === 'total' ? '0 4px 12px rgba(0,0,0,0.06)' : '0 2px 8px rgba(0,0,0,0.02)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            transform: selectedInsightMetric === 'total' ? 'translateY(-2px)' : 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
            if (selectedInsightMetric !== 'total') e.currentTarget.style.borderColor = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = selectedInsightMetric === 'total' ? '0 4px 12px rgba(0,0,0,0.06)' : '0 2px 8px rgba(0,0,0,0.02)';
            if (selectedInsightMetric !== 'total') e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Total Invoice Terbit</span>
          <strong style={{ fontSize: '24px', color: 'var(--text-primary)' }}>{stats.count} Lembar</strong>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Akumulasi omzet kotor: <strong>{formatPrice(stats.grandTotal)}</strong></span>
        </div>

        {/* Kartu Lunas */}
        <div 
          onClick={() => handleMetricClick('lunas')}
          style={{ 
            background: selectedInsightMetric === 'lunas' ? 'rgba(22, 163, 74, 0.08)' : 'var(--bg-panel)',
            border: selectedInsightMetric === 'lunas' ? '2px solid #16a34a' : '1px solid var(--border)', 
            borderRadius: '12px', 
            padding: '18px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px', 
            boxShadow: selectedInsightMetric === 'lunas' ? '0 4px 12px rgba(22,163,74,0.1)' : '0 2px 8px rgba(0,0,0,0.02)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            transform: selectedInsightMetric === 'lunas' ? 'translateY(-2px)' : 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
            if (selectedInsightMetric !== 'lunas') e.currentTarget.style.borderColor = '#16a34a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = selectedInsightMetric === 'lunas' ? '0 4px 12px rgba(22,163,74,0.1)' : '0 2px 8px rgba(0,0,0,0.02)';
            if (selectedInsightMetric !== 'lunas') e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#16a34a' }}>Total Dana Diterima (Lunas)</span>
          <strong style={{ fontSize: '24px', color: '#16a34a' }}>{formatPrice(stats.lunas)}</strong>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Dari <strong>{stats.countLunas}</strong> invoice lunas</span>
        </div>

        {/* Kartu Belum Lunas */}
        <div 
          onClick={() => handleMetricClick('belum_lunas')}
          style={{ 
            background: selectedInsightMetric === 'belum_lunas' ? 'rgba(220, 38, 38, 0.08)' : 'var(--bg-panel)',
            border: selectedInsightMetric === 'belum_lunas' ? '2px solid #dc2626' : '1px solid var(--border)', 
            borderRadius: '12px', 
            padding: '18px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px', 
            boxShadow: selectedInsightMetric === 'belum_lunas' ? '0 4px 12px rgba(220,38,38,0.1)' : '0 2px 8px rgba(0,0,0,0.02)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            transform: selectedInsightMetric === 'belum_lunas' ? 'translateY(-2px)' : 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
            if (selectedInsightMetric !== 'belum_lunas') e.currentTarget.style.borderColor = '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = selectedInsightMetric === 'belum_lunas' ? '0 4px 12px rgba(220,38,38,0.1)' : '0 2px 8px rgba(0,0,0,0.02)';
            if (selectedInsightMetric !== 'belum_lunas') e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#dc2626' }}>Total Piutang (Belum Lunas)</span>
          <strong style={{ fontSize: '24px', color: '#dc2626' }}>{formatPrice(stats.belumLunas)}</strong>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Dari <strong>{stats.countBelumLunas}</strong> invoice belum lunas</span>
        </div>

        {/* Kartu DP */}
        <div 
          onClick={() => handleMetricClick('dp')}
          style={{ 
            background: selectedInsightMetric === 'dp' ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-panel)',
            border: selectedInsightMetric === 'dp' ? '2px solid #2563eb' : '1px solid var(--border)', 
            borderRadius: '12px', 
            padding: '18px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px', 
            boxShadow: selectedInsightMetric === 'dp' ? '0 4px 12px rgba(37,99,235,0.1)' : '0 2px 8px rgba(0,0,0,0.02)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            transform: selectedInsightMetric === 'dp' ? 'translateY(-2px)' : 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
            if (selectedInsightMetric !== 'dp') e.currentTarget.style.borderColor = '#2563eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = selectedInsightMetric === 'dp' ? '0 4px 12px rgba(37,99,235,0.1)' : '0 2px 8px rgba(0,0,0,0.02)';
            if (selectedInsightMetric !== 'dp') e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#2563eb' }}>Total Pembayaran DP</span>
          <strong style={{ fontSize: '24px', color: '#2563eb' }}>{formatPrice(stats.dp)}</strong>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Dari <strong>{stats.countDp}</strong> invoice DP</span>
        </div>

        {/* Kartu Bermasalah */}
        <div 
          onClick={() => handleMetricClick('bermasalah')}
          style={{ 
            background: selectedInsightMetric === 'bermasalah' ? 'rgba(217, 119, 6, 0.08)' : 'var(--bg-panel)',
            border: selectedInsightMetric === 'bermasalah' ? '2px solid #d97706' : '1px solid var(--border)', 
            borderRadius: '12px', 
            padding: '18px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px', 
            boxShadow: selectedInsightMetric === 'bermasalah' ? '0 4px 12px rgba(217,119,6,0.1)' : '0 2px 8px rgba(0,0,0,0.02)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            transform: selectedInsightMetric === 'bermasalah' ? 'translateY(-2px)' : 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
            if (selectedInsightMetric !== 'bermasalah') e.currentTarget.style.borderColor = '#d97706';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = selectedInsightMetric === 'bermasalah' ? '0 4px 12px rgba(217,119,6,0.1)' : '0 2px 8px rgba(0,0,0,0.02)';
            if (selectedInsightMetric !== 'bermasalah') e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#d97706' }}>Total Dana Bermasalah</span>
          <strong style={{ fontSize: '24px', color: '#d97706' }}>{formatPrice(stats.bermasalah)}</strong>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Dari <strong>{stats.countBermasalah}</strong> invoice bermasalah</span>
        </div>

        {/* Kartu Rata-rata Nilai Invoice */}
        <div 
          style={{ 
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)', 
            borderRadius: '12px', 
            padding: '18px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
            e.currentTarget.style.borderColor = '#8b5cf6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#8b5cf6' }}>Rata-Rata Nilai Invoice</span>
          <strong style={{ fontSize: '24px', color: '#8b5cf6' }}>{formatPrice(stats.count > 0 ? stats.grandTotal / stats.count : 0)}</strong>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Nilai rata-rata per lembar tagihan</span>
        </div>

        {/* Kartu Rasio Pelunasan */}
        <div 
          style={{ 
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)', 
            borderRadius: '12px', 
            padding: '18px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
            e.currentTarget.style.borderColor = '#6366f1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#6366f1' }}>Rasio Pelunasan</span>
          <strong style={{ fontSize: '24px', color: '#6366f1' }}>{(stats.grandTotal > 0 ? ((stats.lunas + stats.dp) / stats.grandTotal) * 100 : 0).toFixed(1)}%</strong>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Persentase pelunasan dari omzet</span>
        </div>

        {/* Kartu Mitra/Pelanggan Unik */}
        <div 
          style={{ 
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)', 
            borderRadius: '12px', 
            padding: '18px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
            e.currentTarget.style.borderColor = '#06b6d4';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#06b6d4' }}>Mitra & Pelanggan Unik</span>
          <strong style={{ fontSize: '24px', color: '#06b6d4' }}>{stats.uniqueCustomersCount} Pelanggan</strong>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Jumlah kontak bisnis aktif</span>
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
                
                {/* Lunas segment (Green) - rotasi = 0 */}
                {stats.lunas > 0 && (
                  <circle 
                    cx="60" 
                    cy="60" 
                    r={radius} 
                    fill="transparent" 
                    stroke="#16a34a" 
                    strokeWidth={selectedInsightMetric === 'lunas' ? '16' : '12'} 
                    strokeDasharray={`${strokeLengthLunas} ${circumference}`}
                    strokeDashoffset="0"
                    style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
                    onClick={() => handleMetricClick('lunas')}
                  />
                )}
                
                {/* Belum Lunas segment (Red) - rotasi = percentLunas * 3.6 */}
                {stats.belumLunas > 0 && (
                  <circle 
                    cx="60" 
                    cy="60" 
                    r={radius} 
                    fill="transparent" 
                    stroke="#dc2626" 
                    strokeWidth={selectedInsightMetric === 'belum_lunas' ? '16' : '12'} 
                    strokeDasharray={`${strokeLengthBelumLunas} ${circumference}`}
                    strokeDashoffset="0"
                    style={{ 
                      transform: `rotate(${rotateBelumLunas}deg)`, 
                      transformOrigin: '60px 60px', 
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleMetricClick('belum_lunas')}
                  />
                )}

                {/* DP segment (Blue) - rotasi = (percentLunas + percentBelumLunas) * 3.6 */}
                {stats.dp > 0 && (
                  <circle 
                    cx="60" 
                    cy="60" 
                    r={radius} 
                    fill="transparent" 
                    stroke="#2563eb" 
                    strokeWidth={selectedInsightMetric === 'dp' ? '16' : '12'} 
                    strokeDasharray={`${strokeLengthDp} ${circumference}`}
                    strokeDashoffset="0"
                    style={{ 
                      transform: `rotate(${rotateDp}deg)`, 
                      transformOrigin: '60px 60px', 
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleMetricClick('dp')}
                  />
                )}

                {/* Bermasalah segment (Orange/Yellow) - rotasi = (percentLunas + percentBelumLunas + percentDp) * 3.6 */}
                {stats.bermasalah > 0 && (
                  <circle 
                    cx="60" 
                    cy="60" 
                    r={radius} 
                    fill="transparent" 
                    stroke="#d97706" 
                    strokeWidth={selectedInsightMetric === 'bermasalah' ? '16' : '12'} 
                    strokeDasharray={`${strokeLengthBermasalah} ${circumference}`}
                    strokeDashoffset="0"
                    style={{ 
                      transform: `rotate(${rotateBermasalah}deg)`, 
                      transformOrigin: '60px 60px', 
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleMetricClick('bermasalah')}
                  />
                )}
              </svg>
              
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Lunas</span>
                <strong style={{ fontSize: '18px', color: '#16a34a' }}>{percentLunas.toFixed(0)}%</strong>
              </div>
            </div>

            {/* Keterangan */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div 
                onClick={() => handleMetricClick('lunas')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: selectedInsightMetric && selectedInsightMetric !== 'lunas' ? 0.6 : 1 }}
              >
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#16a34a', display: 'inline-block' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Lunas ({percentLunas.toFixed(1)}%)</span>
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{formatPrice(stats.lunas)}</strong>
                </div>
              </div>
              <div 
                onClick={() => handleMetricClick('belum_lunas')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: selectedInsightMetric && selectedInsightMetric !== 'belum_lunas' ? 0.6 : 1 }}
              >
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#dc2626', display: 'inline-block' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Belum Lunas ({percentBelumLunas.toFixed(1)}%)</span>
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{formatPrice(stats.belumLunas)}</strong>
                </div>
              </div>
              <div 
                onClick={() => handleMetricClick('dp')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: selectedInsightMetric && selectedInsightMetric !== 'dp' ? 0.6 : 1 }}
              >
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#2563eb', display: 'inline-block' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>DP ({percentDp.toFixed(1)}%)</span>
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{formatPrice(stats.dp)}</strong>
                </div>
              </div>
              <div 
                onClick={() => handleMetricClick('bermasalah')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: selectedInsightMetric && selectedInsightMetric !== 'bermasalah' ? 0.6 : 1 }}
              >
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#d97706', display: 'inline-block' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Bermasalah ({percentBermasalah.toFixed(1)}%)</span>
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{formatPrice(stats.bermasalah)}</strong>
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
                <strong style={{ color: 'var(--text-primary)' }}>{(percentBelumLunas + percentBermasalah).toFixed(1)}%</strong>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${percentBelumLunas + percentBermasalah}%`, height: '100%', background: '#dc2626', borderRadius: '4px' }} />
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
