import React, { useRef, useEffect, useState } from 'react';
import { useInvoiceContext } from '../../contexts/InvoiceContext';
import { InvoiceProfile, InvoiceItem } from '../../types/invoice.types';
import { formatPrice } from '../../utils/format';
import { evaluateItemFormula } from '../../utils/invoice';

interface InvoicePreviewProps {
  previewProfile?: InvoiceProfile;
  overrideInvoice?: {
    customerName: string;
    waNumber?: string;
    address?: string;
    items: InvoiceItem[];
    shippingCost: number;
    adminFee: number;
    invoiceType: string;
    invoiceNo: string;
    invoiceHal: string;
    invoiceLampiran: string;
    invoiceDate: string;
    paymentStatus?: string;
    spesifikasiFasilitas?: string;
  };
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ previewProfile, overrideInvoice }) => {
  const contextData = useInvoiceContext();
  
  const customer = overrideInvoice 
    ? { name: overrideInvoice.customerName, wa_number: overrideInvoice.waNumber, address: overrideInvoice.address } 
    : contextData.customer;
  const items = overrideInvoice ? overrideInvoice.items : contextData.items;
  const shippingCost = overrideInvoice ? overrideInvoice.shippingCost : contextData.shippingCost;
  const adminFee = overrideInvoice ? overrideInvoice.adminFee : contextData.adminFee;
  const invoiceType = overrideInvoice ? overrideInvoice.invoiceType : contextData.invoiceType;
  const invoiceNo = overrideInvoice ? overrideInvoice.invoiceNo : contextData.invoiceNo;
  const invoiceHal = overrideInvoice ? overrideInvoice.invoiceHal : contextData.invoiceHal;
  const invoiceLampiran = overrideInvoice ? overrideInvoice.invoiceLampiran : contextData.invoiceLampiran;
  const invoiceDate = overrideInvoice ? overrideInvoice.invoiceDate : contextData.invoiceDate;
  const paymentStatus = overrideInvoice ? overrideInvoice.paymentStatus : contextData.paymentStatus;
  const spesifikasiFasilitas = overrideInvoice ? overrideInvoice.spesifikasiFasilitas : contextData.spesifikasiFasilitas;
  const calculateItemTotal = contextData.calculateItemTotal;
  const profiles = contextData.profiles;

  const profile = previewProfile || (overrideInvoice ? profiles.find(p => p.id === invoiceType) : contextData.activeProfile) || (profiles.length > 0 ? profiles[0] : null);
  const activeProfile = profile;

  const panelRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const a4Width = 595;
  const a4Height = 842;

  useEffect(() => {
    const updateScale = () => {
      if (panelRef.current) {
        const panelWidth = panelRef.current.clientWidth;
        const panelHeight = panelRef.current.clientHeight;
        const pad = 40;
        const scaleX = (panelWidth - pad) / a4Width;
        const scaleY = (panelHeight - pad) / a4Height;
        setScale(Math.min(scaleX, scaleY));
      }
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (panelRef.current) {
      ro.observe(panelRef.current);
    }
    return () => ro.disconnect();
  }, []);

  const itemsTotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const subtotal = itemsTotal;
  // Gunakan deteksi kolom dinamis agar tidak bergantung pada tableType spesifik
  const hasItemShipping = profile?.tableColumns?.some(col => col.key === 'item_shipping_cost');
  const globalShip = hasItemShipping ? 0 : shippingCost;
  const total = subtotal + globalShip + adminFee;

  const getHalDefault = () => {
    return profile?.defaultHal || 'Biaya Cetak Buku';
  };

  const getSalamPembuka = () => {
    return profile?.salamPembuka || 'Bersama surat ini kami memberikan gambaran rincian biaya dengan ketentuan sebagai berikut:';
  };

  const getInvoiceTypeActionLabel = () => {
    return profile?.actionLabel || 'cetak buku';
  };

  const getSignatureOfficeLabel = () => {
    return profile?.signatureOffice || 'KBM Kreator Yogyakarta';
  };

  const getSignatureLocationDateLabel = () => {
    if (profile?.signatureLocation) {
      return `${profile.signatureLocation}, ${invoiceDate}`;
    }
    return invoiceDate;
  };

  const getSignatureRoleLabel = () => {
    return profile?.signatureRole || '';
  };

  const getSignatureNameLabel = () => {
    return profile?.signatureName || 'MOHAMMAD IMAM JUNAIDI, M.H.';
  };

  // Fungsi helper untuk membagi teks nama pelanggan menjadi dua warna (Hitam & Biru)
  const renderCustomerName = () => {
    const fullName = customer.name || 'NAMA PELANGGAN';
    const words = fullName.trim().split(/\s+/);
    if (words.length <= 1) {
      return <span style={{ color: profile?.accentColor || '#1e70cd' }}>{fullName}</span>;
    }
    const mid = Math.ceil(words.length / 2);
    const firstPart = words.slice(0, mid).join(' ');
    const secondPart = words.slice(mid).join(' ');
    return (
      <>
        <span style={{ color: '#1f2937' }}>{firstPart} </span>
        <span style={{ color: profile?.accentColor || '#1e70cd' }}>{secondPart}</span>
      </>
    );
  };

  // Render watermark lunas/belum lunas/pending
  const renderWatermark = () => {
    if (!paymentStatus) return null;

    let text = '';
    let baseColor = '';

    switch (paymentStatus.toUpperCase()) {
      case 'LUNAS':
        text = 'LUNAS';
        baseColor = '#16a34a';
        break;
      case 'BELUM LUNAS':
        text = 'BELUM LUNAS';
        baseColor = '#dc2626';
        break;
      case 'PENDING':
        text = 'PENDING';
        baseColor = '#d97706';
        break;
      default:
        return null;
    }

    const color = activeProfile?.watermarkColor || baseColor;
    const opacityValue = activeProfile?.watermarkOpacity !== undefined ? activeProfile.watermarkOpacity / 100 : 0.08;

    const fontSize = text === 'BELUM LUNAS' ? '30px' : text === 'LUNAS' ? '44px' : '38px';
    const letterSpacing = text === 'BELUM LUNAS' ? '4px' : text === 'LUNAS' ? '6px' : '5px';

    return (
      <div
        style={{
          position: 'absolute',
          top: '55%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-15deg)',
          color: color,
          border: `4px solid ${color}`,
          padding: '2px',
          borderRadius: '8px',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 10,
          opacity: opacityValue,
          fontFamily: '"Montserrat", "Segoe UI", sans-serif',
          display: 'inline-block'
        }}
      >
        <div
          style={{
            border: `1.5px solid ${color}`,
            padding: '8px 20px',
            borderRadius: '5px',
            fontSize: fontSize,
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: letterSpacing,
            paddingLeft: `calc(20px + ${letterSpacing})`, // Menyeimbangkan letter-spacing di kanan karakter terakhir
            whiteSpace: 'nowrap',
            textAlign: 'center',
            lineHeight: '1'
          }}
        >
          {text}
        </div>
      </div>
    );
  };

  const accentColor = profile?.accentColor || '#c01c1c';
  const accentColorDark = profile?.accentColorDark || '#991b1b';
  const headerBgColor = profile?.headerBgColor || '#222933';
  const headerPrimaryColor = profile?.headerPrimaryColor || (profile as any)?.headerColor || profile?.accentColor || '#c01c1c';
  const headerSecondaryColor = profile?.headerSecondaryColor || (profile as any)?.headerColor || profile?.accentColor || '#c01c1c';
  const footerBgColor = profile?.footerBgColor || profile?.headerBgColor || '#222933';
  const footerPrimaryColor = profile?.footerPrimaryColor || profile?.headerPrimaryColor || profile?.accentColor || '#c01c1c';
  const footerSecondaryColor = profile?.footerSecondaryColor || profile?.headerSecondaryColor || profile?.accentColor || '#c01c1c';




  return (
    <div 
      ref={panelRef}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-panel)', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Playball&display=swap');
      `}</style>

      <div 
        id="invoice-preview-content"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          flexShrink: 0,
          width: `${a4Width}px`,
          height: `${a4Height}px`,
          background: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          fontFamily: '"Montserrat", "Segoe UI", sans-serif',
          display: 'flex',
          flexDirection: 'column',
        }}>
        
        {/* Header SVG */}
          <div className="invoice-header" style={{ flexShrink: 0 }}>
            <svg
              viewBox="0 0 657 139"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Invoice header"
              shapeRendering="geometricPrecision"
              style={{ display: 'block', width: '100%' }}
            >
              {/* Background putih */}
              <rect x="0" y="0" width="657" height="139" fill="#ffffff" />

              {/* Garis abu-abu di bagian atas */}
              <rect x="0" y="0" width="657" height="2" fill="#dddddd" />

              {/* Definisi filter drop-shadow untuk efek timbul */}
              <defs>
                <filter id="drop-shadow" x="-10%" y="-10%" width="120%" height="130%">
                  <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.3" />
                </filter>
                <filter id="drop-shadow-middle" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#000000" floodOpacity="0.5" />
                </filter>
              </defs>

              {/* Grup shape background horizontal dengan efek timbul (drop shadow) */}
              <g filter="url(#drop-shadow)">
                {/* Panel hitam di belakang seluruh shape */}
                <rect x="267" y="54" width="390" height="78" fill={headerBgColor} />

                {/* Bidang merah utama (Warna dinamis) - Sejajar dengan panel hitam y=54 ke y=132 */}
                <polygon points="0,54 220,54 264.5,132 0,132" fill={headerPrimaryColor} />
              </g>

              {/* Grup shape miring tengah dengan efek timbul (drop shadow) di atas shape horizontal */}
              <g filter="url(#drop-shadow-middle)">
                {/* Pemisah putih agar warna hitam tidak menyelip - Diperpanjang membungkus */}
                <polygon points="214.3,44 230.3,44 284.5,139 268.5,139" fill="#ffffff" />

                {/* Aksen merah kedua (Warna dinamis) - Diperpanjang membungkus */}
                <polygon points="230.3,44 265.2,44 320.6,139 284.5,139" fill={headerSecondaryColor} />
              </g>

              {/* Render Kop Surat berdasarkan headerType */}
              {(() => {
                const headerType = profile?.headerType || 'logo_text';

                // Jika hanya teks atau (jika hanya logo tetapi logo kustom belum diunggah, fallback ke text_only)
                if (headerType === 'text_only' || (!profile?.companyLogo && headerType === 'logo_only')) {
                  return (
                    <>
                      <text x="120" y="88" textAnchor="middle" fill="#ffffff" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="700" letterSpacing="1.4">
                        {profile?.companyName || 'CV KBM'}
                      </text>
                      <text x="120" y="104" textAnchor="middle" fill="#ffffff" fontFamily="Arial, sans-serif" fontSize="7.5" fontWeight="600" letterSpacing="1.8">
                        {profile?.companyTagline || 'KARYA BAKTI MAKMUR'}
                      </text>
                    </>
                  );
                }

                if (headerType === 'logo_only' && profile?.companyLogo) {
                  return (
                    <image
                      href={profile.companyLogo}
                      x="55"
                      y="60"
                      width="130"
                      height="66"
                      preserveAspectRatio="xMidYMid meet"
                    />
                  );
                }

                // Mode: Logo + Teks (logo_text)
                return (
                  <>
                    {profile?.companyLogo ? (
                      <>
                        <image
                          href={profile.companyLogo}
                          x="25"
                          y="67"
                          width="52"
                          height="52"
                          preserveAspectRatio="xMinYMid meet"
                        />
                        <text x="90" y="87" fill="#ffffff" fontFamily="Arial, sans-serif" fontSize="15" fontWeight="700" letterSpacing="1.4">
                          {profile?.companyName || 'CV KBM'}
                        </text>
                        <text x="90" y="101" fill="#ffffff" fontFamily="Arial, sans-serif" fontSize="7" fontWeight="600" letterSpacing="1.8">
                          {profile?.companyTagline || 'KARYA BAKTI MAKMUR'}
                        </text>
                      </>
                    ) : (
                      <>
                        <g transform="translate(40 71)">
                          <path d="M20 0 L38 10 L38 33 L20 44 L2 33 L2 10 Z" fill="#ffffff" />
                          <path d="M20 11 L29 16 L29 28 L20 33 L11 28 L11 16 Z" fill={headerPrimaryColor} />
                        </g>
                        <text x="88" y="87" fill="#ffffff" fontFamily="Arial, sans-serif" fontSize="15" fontWeight="700" letterSpacing="1.4">
                          {profile?.companyName || 'CV KBM'}
                        </text>
                        <text x="89" y="101" fill="#ffffff" fontFamily="Arial, sans-serif" fontSize="7" fontWeight="600" letterSpacing="1.8">
                          {profile?.companyTagline || 'KARYA BAKTI MAKMUR'}
                        </text>
                      </>
                    )}
                  </>
                );
              })()}

              {/* Judul invoice */}
              <text x="622" y="98" textAnchor="end" fill="#ffffff" fontFamily="Arial, sans-serif" fontSize="44" fontWeight="700" letterSpacing="2">
                {profile?.invoiceTitleText || 'INVOICE'}
              </text>

              {/* Nomor invoice di bawah judul */}
              <text x="622" y="118" textAnchor="end" fill="#dddddd" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="700" letterSpacing="1">
                NO. {invoiceNo || 'RA.01/11/06/2026'}
              </text>
            </svg>
          </div>
 
          {/* Info Section */}
          <div style={{ padding: '20px 35px 12px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', fontFamily: '"Montserrat", "Segoe UI", sans-serif', flexShrink: 0, color: '#1f2937' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kepada Yth.</div>
              <div style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px', lineHeight: '1.1', wordBreak: 'break-word' }}>
                {renderCustomerName()}
              </div>
              <div style={{ fontSize: '10px', color: '#1f2937', marginBottom: '4px', fontWeight: '600' }}>
                Alamat : <span style={{ fontWeight: '500', color: '#4b5563' }}>{customer.address || 'Di Tempat'}</span>
              </div>
              <div style={{ fontSize: '10px', color: '#1f2937', fontWeight: '600' }}>
                No. WA : <span style={{ fontWeight: '500', color: '#4b5563' }}>{customer.wa_number || '-'}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '10px', color: '#4b5563' }}>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontWeight: '700', color: '#1f2937', width: '70px', flexShrink: 0 }}>Perihal</span>
                <span style={{ marginRight: '6px', color: '#4b5563', fontWeight: '700' }}>:</span>
                <span style={{ fontWeight: '600', color: activeProfile?.accentColor || '#1e70cd', wordBreak: 'break-word' }}>"{invoiceHal || getHalDefault()}"</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontWeight: '700', color: '#1f2937', width: '70px', flexShrink: 0 }}>Lampiran</span>
                <span style={{ marginRight: '6px', color: '#4b5563', fontWeight: '700' }}>:</span>
                <span style={{ fontWeight: '500' }}>{invoiceLampiran || '-'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontWeight: '700', color: '#1f2937', width: '70px', flexShrink: 0 }}>Tanggal</span>
                <span style={{ marginRight: '6px', color: '#4b5563', fontWeight: '700' }}>:</span>
                <span style={{ fontWeight: '500' }}>{invoiceDate}</span>
              </div>
            </div>
          </div>

          {/* Salam Hormat */}
          <div style={{ padding: '10px 35px 8px', fontSize: '10px', color: '#4b5563', fontFamily: '"Montserrat", "Segoe UI", sans-serif', lineHeight: '1.4' }}>
            <strong>Salam hormat,</strong><br />
            {getSalamPembuka()}
          </div>

          {/* Tabel Pesanan */}
          <div style={{ padding: '0 35px', flex: 1, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"Montserrat", "Segoe UI", sans-serif' }}>
              <thead>
                <tr style={{ color: '#ffffff' }}>
                  <th style={{ background: accentColorDark, width: '28px', textAlign: 'center', padding: '8px 4px', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', border: 'none' }}>No</th>
                  <th style={{ background: accentColor, textAlign: 'left', padding: '8px 8px', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', border: 'none' }}>Judul / Detail</th>
                  <th style={{ background: accentColor, textAlign: 'right', padding: '8px 8px', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', border: 'none', width: '90px', whiteSpace: 'nowrap' }}>Harga</th>
                  <th style={{ background: accentColor, textAlign: 'center', padding: '8px 8px', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', border: 'none', width: '50px' }}>Jml.</th>
                  <th style={{ background: accentColor, textAlign: 'right', padding: '8px 8px', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', border: 'none', width: '95px', whiteSpace: 'nowrap' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '20px', textAlign: 'center', fontSize: '11px', color: '#6b7280', fontStyle: 'italic', borderBottom: '1px solid #e5e7eb' }}>
                      Belum ada rincian item. Silakan tambahkan di menu generator.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const rowBg = index % 2 === 0 ? '#fdf2f2' : '#ffffff';
                    const columns = profile?.tableColumns || [];

                    // Kumpulkan kolom detail — semua kecuali item_title, price, quantity, dan formula total
                    const keysToSkip = new Set(['item_title', 'price', 'quantity', 'total']);
                    const detailParts: string[] = [];
                    columns.forEach(col => {
                      if (keysToSkip.has(col.key)) return;
                      // Jika formula yang merupakan total, lewati
                      if (col.type === 'formula' && (col.key === 'total' || col.key.toLowerCase().includes('total'))) return;

                      let val: any;
                      if (col.type === 'formula' && col.formula) {
                        val = evaluateItemFormula(col.formula, item);
                      } else {
                        val = item[col.key];
                      }
                      if (val === undefined || val === null || val === '' || val === 0) return;

                      const displayVal = col.type === 'currency'
                        ? `Rp ${formatPrice(Number(val))}`
                        : String(val);
                      detailParts.push(`${col.label}: ${displayVal}`);
                    });

                    // Harga: ambil dari kolom price
                    const priceVal = item.price || 0;
                    const priceDisplay = `Rp ${formatPrice(priceVal)}`;

                    // Jumlah: ambil quantity, jika tidak ada default 1
                    const qtyVal = item.quantity ?? 1;

                    // Total: gunakan calculateItemTotal yang sudah pakai formula profil
                    const totalVal = calculateItemTotal(item);
                    const totalDisplay = `Rp ${formatPrice(totalVal)}`;

                    return (
                      <tr key={index} style={{ background: rowBg }}>
                        {/* No */}
                        <td style={{ padding: '6px 4px', textAlign: 'center', fontSize: '9.5px', color: '#1f2937', fontWeight: '500', borderBottom: '1px solid #e5e7eb', verticalAlign: 'top' }}>
                          {index + 1}.
                        </td>

                        {/* Judul / Detail */}
                        <td style={{ padding: '6px 8px', textAlign: 'left', fontSize: '9.5px', color: '#1f2937', fontWeight: '700', borderBottom: '1px solid #e5e7eb', wordBreak: 'break-word', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: '700' }}>"{item.item_title || '-'}"</div>
                          {detailParts.length > 0 && (
                            <div style={{ fontWeight: '400', color: '#6b7280', fontSize: '8.5px', marginTop: '2px', lineHeight: '1.4' }}>
                              {detailParts.join(' | ')}
                            </div>
                          )}
                        </td>

                        {/* Harga */}
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: '9.5px', color: '#1f2937', fontWeight: '500', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                          {priceDisplay}
                        </td>

                        {/* Jumlah */}
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontSize: '9.5px', color: '#1f2937', fontWeight: '500', borderBottom: '1px solid #e5e7eb', verticalAlign: 'top' }}>
                          {qtyVal}
                        </td>

                        {/* Total */}
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: '9.5px', color: '#1f2937', fontWeight: '700', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                          {totalDisplay}
                        </td>
                      </tr>
                    );
                  })
                )}
                {/* Rincian Biaya Tambahan Global & Grand Total */}
                {items.length > 0 && (
                  <>
                    {/* Subtotal (hanya jika ada ongkir global atau biaya admin) */}
                    {((!hasItemShipping && shippingCost > 0) || adminFee > 0) && (
                      <tr style={{ borderTop: '1.5px solid #d1d5db' }}>
                        <td colSpan={4} style={{ padding: '6px 8px', textAlign: 'right', fontSize: '9px', fontWeight: '600', color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>
                          Subtotal
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: '9px', fontWeight: '600', color: '#1f2937', whiteSpace: 'nowrap', borderBottom: '1px solid #e5e7eb' }}>
                          Rp {formatPrice(subtotal)}
                        </td>
                      </tr>
                    )}

                    {/* Ongkos Kirim Global */}
                    {!hasItemShipping && shippingCost > 0 && (
                      <tr>
                        <td colSpan={4} style={{ padding: '6px 8px', textAlign: 'right', fontSize: '9px', fontWeight: '600', color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>
                          Ongkos Kirim
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: '9px', fontWeight: '600', color: '#1f2937', whiteSpace: 'nowrap', borderBottom: '1px solid #e5e7eb' }}>
                          Rp {formatPrice(shippingCost)}
                        </td>
                      </tr>
                    )}

                    {/* Biaya Admin */}
                    {adminFee > 0 && (
                      <tr>
                        <td colSpan={4} style={{ padding: '6px 8px', textAlign: 'right', fontSize: '9px', fontWeight: '600', color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>
                          Biaya Admin
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: '9px', fontWeight: '600', color: '#1f2937', whiteSpace: 'nowrap', borderBottom: '1px solid #e5e7eb' }}>
                          Rp {formatPrice(adminFee)}
                        </td>
                      </tr>
                    )}

                    {/* Grand Total */}
                    <tr style={{ borderTop: '1.5px solid #9ca3af' }}>
                      <td colSpan={4} style={{ padding: '6px 8px', textAlign: 'right', fontSize: '9.5px', fontWeight: '700', color: '#1f2937' }}>
                        Total
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: '10px', fontWeight: '800', color: accentColorDark, whiteSpace: 'nowrap' }}>
                        Rp {formatPrice(total)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>

            {/* Status Akhir Pembayaran Box */}
            <div style={{ marginTop: '8px', display: 'flex', width: '100%', border: '1px solid #e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ flex: 1, background: '#fdf2f2', padding: '6px 12px', fontSize: '9.5px', fontWeight: '700', color: '#1f2937', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                STATUS AKHIR PEMBAYARAN
              </div>
              <div style={{ width: '150px', background: '#ffffff', padding: '6px 12px', fontSize: '10px', fontWeight: '800', color: '#16a34a', textTransform: 'uppercase', textAlign: 'right', borderLeft: '1px solid #e5e7eb' }}>
                {paymentStatus || 'LUNAS'}
              </div>
            </div>

            {/* Spesifikasi & Fasilitas (SPT) */}
            {activeProfile?.showSpesifikasi && (
              <div style={{ marginTop: '10px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ background: accentColor, color: '#ffffff', padding: '4px 10px', fontSize: '8.5px', fontWeight: '700', textTransform: 'uppercase', textAlign: 'center' }}>
                  SPESIFIKASI & FASILITAS
                </div>
                <div style={{ border: `1px solid ${accentColor}`, borderTop: 'none', padding: '6px 10px', fontSize: '8.5px', color: '#4b5563', background: '#fef3c7', textAlign: 'center', fontWeight: '600' }}>
                  {spesifikasiFasilitas || activeProfile.defaultSpesifikasi}
                </div>
              </div>
            )}

            {/* Catatan / Note (KBM) */}
            {activeProfile?.notes && activeProfile.notes.length > 0 && (
              <div style={{ marginTop: '10px', fontSize: '8.5px', color: '#4b5563', lineHeight: '1.4' }}>
                <span style={{ fontWeight: '700', fontStyle: 'italic' }}>Note:</span><br />
                {activeProfile.notes.map((note, idx) => (
                  <React.Fragment key={idx}>
                    {idx + 1}. {note}<br />
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Penutup */}
            <div style={{ marginTop: '10px', fontSize: '9px', color: '#4b5563', lineHeight: '1.4' }}>
              Demikian rincian biaya {getInvoiceTypeActionLabel()} anda. Dan lembar ini kami buat untuk dipergunakan sebagaimana semestinya. Atas kepercayaan anda, kami ucapkan terimakasih.
            </div>

          </div>


          {/* Middle Section (Contact & Totals) */}
          <div style={{ padding: '10px 35px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontFamily: '"Montserrat", "Segoe UI", sans-serif', flexShrink: 0 }}>
            {/* Tanda Tangan (Kiri) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '220px', fontSize: '9.5px', color: '#1f2937', position: 'relative' }}>
              <div style={{ fontWeight: '600', color: '#4b5563', marginBottom: '2px' }}>{getSignatureOfficeLabel()}</div>
              <div style={{ fontWeight: '600', color: '#4b5563', marginBottom: '6px' }}>{getSignatureLocationDateLabel()}</div>
              <div style={{ fontWeight: '600', fontSize: '8.5px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '8px' }}>{getSignatureRoleLabel()}</div>
              
              {/* Tanda Tangan Visual & Nama Wrapper */}
              <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {profile?.signatureImg ? (
                  // Tanda Tangan Gambar yang Besar dan Menimpa Nama
                  <div style={{ 
                    position: 'absolute', 
                    top: '-20px', 
                    left: '50%',
                    transform: 'translateX(-50%)',
                    height: '55px', 
                    width: '130px', 
                    pointerEvents: 'none', 
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img 
                      src={profile.signatureImg} 
                      alt="Tanda Tangan" 
                      style={{ height: '100%', width: '100%', objectFit: 'contain' }} 
                    />
                  </div>
                ) : (
                  // Fallback Tanda Tangan Teks Cursive
                  <div style={{ 
                    fontFamily: '"Playball", cursive', 
                    fontSize: '22px', 
                    color: accentColor, 
                    height: '32px', 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '3px 0',
                    zIndex: 1
                  }}>
                    {getSignatureNameLabel().split(',')[0]}
                  </div>
                )}
                
                {/* Garis Pembatas (selalu di bawah tapi di-overlay oleh gambar tanda tangan) */}
                <div style={{ width: '100%', height: '1px', background: '#1f2937', margin: profile?.signatureImg ? '25px 0 4px 0' : '2px 0 4px 0', zIndex: 1 }} />
                
                {/* Nama Penandatangan */}
                <div style={{ fontSize: '8.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', zIndex: 1 }}>
                  {getSignatureNameLabel()}
                </div>
              </div>
            </div>

            {/* Sisi Kanan: Kontak Kustom */}
            {activeProfile?.showCompanyContact ? (
              <div style={{ 
                width: '240px', 
                fontSize: '9px', 
                color: '#4b5563',
                textAlign: 'right', 
                lineHeight: '1.5',
                fontFamily: '"Montserrat", "Segoe UI", sans-serif',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                alignItems: 'flex-end'
              }}>
                {activeProfile.companyWebsite && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>{activeProfile.companyWebsite}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: accentColor }}><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                  </div>
                )}
                {activeProfile.companyEmail && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>{activeProfile.companyEmail}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: accentColor }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  </div>
                )}
                {activeProfile.companyYoutube && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>{activeProfile.companyYoutube}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: accentColor }}><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.95 1.96C5.12 19.5 12 19.5 12 19.5s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 11.75a29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
                  </div>
                )}
                {activeProfile.companyInstagram && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>{activeProfile.companyInstagram}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: accentColor }}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                  </div>
                )}
                {activeProfile.companyPhone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>{activeProfile.companyPhone}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: accentColor }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  </div>
                )}
              </div>
            ) : <div style={{ width: '240px' }} />}
          </div>

          {/* Footer SVG */}
          <div className="invoice-footer" style={{ flexShrink: 0 }}>
            <svg
              viewBox="0 0 1045 80"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
              shapeRendering="geometricPrecision"
              aria-label="Footer invoice"
              style={{ display: 'block', width: '100%' }}
            >
              {/* Background */}
              <rect width="1045" height="80" fill="#ffffff" />

              {/* Definisi filter drop-shadow untuk efek timbul */}
              <defs>
                <filter id="drop-shadow-footer" x="-10%" y="-10%" width="120%" height="130%">
                  <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.3" />
                </filter>
                <filter id="drop-shadow-middle-footer" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#000000" floodOpacity="0.5" />
                </filter>
              </defs>

              {/* Grup shape background horizontal dengan efek timbul (drop shadow) */}
              <g filter="url(#drop-shadow-footer)">
                {/* Bidang hitam */}
                <path d="M 0 20 H 312 L 349.5 70 H 0 Z" fill={footerBgColor} />

                {/* Bidang merah kanan (Warna dinamis) */}
                <path d="M 388.25 20 H 1045 V 70 H 425.75 Z" fill={footerPrimaryColor} />
              </g>

              {/* Teks Pengantar Transfer (di dalam shape footer kiri) */}
              {activeProfile?.showBankInfo && (
                <text 
                  x="35" 
                  y="49" 
                  fill="#ffffff" 
                  fontFamily='"Montserrat", "Segoe UI", sans-serif' 
                  fontSize="12.5" 
                  fontWeight="600"
                  letterSpacing="0.2"
                >
                  Silahkan transfer ke Rekening:
                </text>
              )}

              {/* Teks Rekening Bank (di dalam shape footer kanan) */}
              {activeProfile?.showBankInfo && (
                <text 
                  x="1010" 
                  y="49" 
                  textAnchor="end"
                  fill="#ffffff" 
                  fontFamily='"Montserrat", "Segoe UI", sans-serif' 
                  fontSize="12.5" 
                  fontWeight="600"
                  letterSpacing="0.2"
                >
                  {activeProfile.bankName} | {activeProfile.bankAccountNo} | a/n. {activeProfile.bankAccountOwner}
                </text>
              )}

              {/* Grup shape miring tengah dengan efek timbul (drop shadow) di atas shape horizontal */}
              <g filter="url(#drop-shadow-middle-footer)">
                {/* Diagonal merah tengah (Warna dinamis) */}
                <path d="M 320 5 H 359 L 407.75 70 H 368.75 Z" fill={footerSecondaryColor} />

                {/* Pemisah putih */}
                <path d="M 359 5 H 377 L 425.75 70 H 407.75 Z" fill="#ffffff" />
              </g>
            </svg>
          </div>

          {renderWatermark()}
        </div>
    </div>
  );
};

export default InvoicePreview;
