import React, { useRef, useEffect, useState } from 'react';
import { useInvoiceContext } from '../../contexts/InvoiceContext';
import { InvoiceProfile, InvoiceItem } from '../../types';

const evaluateItemFormula = (formulaStr: string, item: InvoiceItem): any => {
  try {
    let processed = formulaStr;
    const tokenRegex = /\{([^}]+)\}/g;
    
    let match;
    let containsString = false;
    const keys: string[] = [];
    while ((match = tokenRegex.exec(formulaStr)) !== null) {
      keys.push(match[1]);
    }
    
    keys.forEach(key => {
      let val = item[key];
      if (val === undefined || val === null) {
        val = 0;
      }
      
      if (typeof val === 'string' && isNaN(Number(val))) {
        containsString = true;
      }
      
      processed = processed.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
    });
    
    const mathOperators = /[\+\-\*\/\(\)]/;
    if (containsString || !mathOperators.test(processed)) {
      return processed;
    }
    
    const safeMathExpr = processed.replace(/[^0-9\+\-\*\/\.\(\)\s]/g, '');
    // eslint-disable-next-line no-new-func
    const result = new Function(`return (${safeMathExpr});`)();
    return typeof result === 'number' && !isNaN(result) ? result : 0;
  } catch (e) {
    console.error('Gagal mengevaluasi formula:', formulaStr, e);
    return 0;
  }
};

interface InvoicePreviewProps {
  previewProfile?: InvoiceProfile;
  overrideInvoice?: {
    customerName: string;
    waNumber?: string;
    address?: string;
    items: InvoiceItem[];
    shippingCost: number;
    adminFee: number;
    invoiceType: 'kbm_cetak' | 'kbm_creator' | 'spt_mitra';
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

  const profile = previewProfile || (overrideInvoice ? profiles.find(p => p.id === invoiceType) : contextData.activeProfile) || profiles[0];
  const activeProfile = profile;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const a4Width = 595;
  const a4Height = 842;

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        
        const scaleX = containerWidth / a4Width;
        const scaleY = containerHeight / a4Height;
        const newScale = Math.min(scaleX, scaleY);
        
        setScale(newScale);
      }
    };

    updateScale();
    
    const resizeObserver = new ResizeObserver(updateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, []);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const itemsTotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const subtotal = itemsTotal;
  const globalShip = (profile?.tableType === 'kbm_cetak') ? 0 : shippingCost;
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

  const accentColor = profile?.accentColor || '#c01c1c';
  const accentColorDark = profile?.accentColorDark || '#991b1b';
  const headerBgColor = profile?.headerBgColor || '#222933';
  const headerPrimaryColor = profile?.headerPrimaryColor || (profile as any)?.headerColor || profile?.accentColor || '#c01c1c';
  const headerSecondaryColor = profile?.headerSecondaryColor || (profile as any)?.headerColor || profile?.accentColor || '#c01c1c';




  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', overflow: 'auto', padding: '20px', alignItems: 'center', justifyContent: 'center' }}>
      {/* Mengimpor font Montserrat dan Playball dari Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Playball&display=swap');
      `}</style>

      <div 
        ref={containerRef}
        style={{ 
          background: 'transparent', 
          overflow: 'hidden', 
          width: '100%', 
          maxWidth: `${a4Width * 0.8}px`,
          aspectRatio: `${a4Width} / ${a4Height}`,
          margin: '0 auto',
          position: 'relative',
          flexShrink: 0
        }}>
        <div 
          ref={contentRef}
          id="invoice-preview-content"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: 'center center',
            display: 'flex',
            flexDirection: 'column',
            width: `${a4Width}px`,
            height: `${a4Height}px`,
            background: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            fontFamily: '"Montserrat", "Segoe UI", sans-serif'
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
                  <th style={{ background: accentColorDark, width: '35px', textAlign: 'center', padding: '8px 4px', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', border: 'none' }}>No</th>
                  {(profile?.tableColumns || []).map((col) => (
                    <th 
                      key={col.key} 
                      style={{ 
                        background: accentColor, 
                        textAlign: col.align || 'left', 
                        padding: '8px 8px', 
                        fontSize: '9px', 
                        fontWeight: '700', 
                        textTransform: 'uppercase', 
                        width: col.width || 'auto', 
                        border: 'none' 
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={(profile?.tableColumns?.length || 4) + 1} style={{ padding: '20px', textAlign: 'center', fontSize: '11px', color: '#6b7280', fontStyle: 'italic', borderBottom: '1px solid #e5e7eb' }}>
                      Belum ada rincian item. Silakan tambahkan di menu generator.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const rowBg = index % 2 === 0 ? '#fdf2f2' : '#ffffff';
                    const columns = profile?.tableColumns || [];

                    return (
                      <tr key={index} style={{ background: rowBg }}>
                        {/* No */}
                        <td style={{ padding: '6px 4px', textAlign: 'center', fontSize: '9.5px', color: '#1f2937', fontWeight: '500', borderBottom: '1px solid #e5e7eb' }}>
                          {index + 1}.
                        </td>
                        
                        {/* Kolom Dinamis */}
                        {columns.map((col) => {
                          let displayVal = '';
                          let val = item[col.key];
                          
                          if (col.type === 'formula' && col.formula) {
                            val = evaluateItemFormula(col.formula, item);
                          }
                          
                          if (col.type === 'currency' && typeof val === 'number') {
                            displayVal = `Rp ${formatPrice(val)}`;
                          } else if (col.type === 'number' && typeof val === 'number') {
                            displayVal = String(val);
                          } else {
                            displayVal = val !== undefined && val !== null ? String(val) : '';
                          }
                          
                          if (col.key === 'book_title') {
                            displayVal = `"${displayVal.replace(/"/g, '')}"`;
                          }
                          
                          return (
                            <td 
                              key={col.key} 
                              style={{ 
                                padding: '6px 8px', 
                                textAlign: col.align || 'left', 
                                fontSize: '9.5px', 
                                color: '#1f2937', 
                                fontWeight: col.key === 'book_title' || col.key === 'total' || col.key.includes('total') ? '700' : '500',
                                borderBottom: '1px solid #e5e7eb',
                                whiteSpace: col.type === 'currency' ? 'nowrap' : 'normal',
                                wordBreak: 'break-word'
                              }}
                            >
                              {displayVal}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
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

            {/* Total / Bank Info Box (Kanan) */}
            {activeProfile?.showBankInfo ? (
              <div style={{ 
                width: '220px', 
                border: '1px solid #e5e7eb', 
                borderRadius: '4px', 
                padding: '8px 10px', 
                fontSize: '8.5px', 
                color: '#1f2937', 
                background: '#f9fafb',
                lineHeight: '1.4'
              }}>
                <strong style={{ color: accentColorDark }}>INFORMASI PEMBAYARAN:</strong>
                <div style={{ marginTop: '4px' }}>
                  Transfer melalui rekening bank:<br />
                  <strong>{activeProfile.bankName}</strong><br />
                  No. Rekening: <strong>{activeProfile.bankAccountNo}</strong><br />
                  A.n. <strong>{activeProfile.bankAccountOwner}</strong>
                </div>
              </div>
            ) : (
              // For SPT, display a minimal total box
              <div style={{ 
                background: accentColor, 
                color: '#ffffff', 
                padding: '6px 12px', 
                fontSize: '11px', 
                fontWeight: '700',
                display: 'flex',
                justifyContent: 'space-between',
                width: '180px',
                borderRadius: '4px'
              }}>
                <span>Total:</span>
                <span>Rp {formatPrice(total)}</span>
              </div>
            )}
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
                <path d="M 0 20 H 462 L 499.5 70 H 0 Z" fill={headerBgColor} />

                {/* Bidang merah kanan (Warna dinamis) */}
                <path d="M 538.25 20 H 1045 V 70 H 575.75 Z" fill={headerPrimaryColor} />
              </g>

              {/* Grup shape miring tengah dengan efek timbul (drop shadow) di atas shape horizontal */}
              <g filter="url(#drop-shadow-middle-footer)">
                {/* Diagonal merah tengah (Warna dinamis) */}
                <path d="M 470 5 H 509 L 557.75 70 H 518.75 Z" fill={headerSecondaryColor} />

                {/* Pemisah putih */}
                <path d="M 509 5 H 527 L 575.75 70 H 557.75 Z" fill="#ffffff" />
              </g>
            </svg>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
