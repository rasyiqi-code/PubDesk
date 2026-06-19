import React, { useRef, useEffect, useState } from 'react';
import { useInvoiceContext } from '../../contexts/InvoiceContext';

const InvoicePreview: React.FC = () => {
  const { customer, items, shippingCost, adminFee, calculateItemTotal } = useInvoiceContext();
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const itemsTotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const subtotal = itemsTotal;
  const total = subtotal + shippingCost + adminFee;

  // Fungsi helper untuk membagi teks nama pelanggan menjadi dua warna (Hitam & Biru)
  const renderCustomerName = () => {
    const fullName = customer.name || 'NAME HERE';
    const words = fullName.trim().split(/\s+/);
    if (words.length <= 1) {
      return <span style={{ color: '#1e70cd' }}>{fullName}</span>;
    }
    const mid = Math.ceil(words.length / 2);
    const firstPart = words.slice(0, mid).join(' ');
    const secondPart = words.slice(mid).join(' ');
    return (
      <>
        <span style={{ color: '#1f2937' }}>{firstPart} </span>
        <span style={{ color: '#1e70cd' }}>{secondPart}</span>
      </>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#2d2720', overflow: 'auto', padding: '20px', alignItems: 'center', justifyContent: 'center' }}>
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
          
          {/* Header Geometris - Semua elemen full-size absolute di koordinat space yang sama (595×95px) */}
          <div style={{ position: 'relative', height: '95px', width: '100%', overflow: 'hidden', background: '#ffffff', flexShrink: 0 }}>
            {/* Garis vertikal biru di tepi paling kiri */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', background: '#1e70cd', zIndex: 3 }} />
            
            {/* Garis horizontal biru di tepi kiri atas (berakhir di titik awal stripe) */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '245px', height: '6px', background: '#1e70cd', zIndex: 3 }} />

            {/* Kartu Biru Utama - Floating (15px gap atas/bawah), diagonal menyempit ke kiri bawah */}
            <div style={{ 
              background: '#1e70cd', 
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              clipPath: 'polygon(21px 15px, 230px 15px, 192px 80px, 21px 80px)',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '30px',
              zIndex: 2
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '15px' }}>
                {/* Hexagonal Logo Icon */}
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" style={{ marginRight: '10px' }}>
                  <path d="M12 2L21 7v10l-9 5-9-5V7l9-5z" fill="white" />
                  <path d="M9 8h6l-3 4 3 4H9l3-4-3-4z" fill="#1e70cd" />
                </svg>
                <div style={{ color: '#ffffff', fontFamily: '"Montserrat", "Segoe UI", sans-serif' }}>
                  <div style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '1px', lineHeight: '1.1' }}>COMPANY</div>
                  <div style={{ fontSize: '8px', fontWeight: '500', letterSpacing: '2px', opacity: 0.9, marginTop: '2px' }}>TAGLINE HERE</div>
                </div>
              </div>
            </div>

            {/* Stripe Tengah Biru - Full height, diagonal menyempit ke kiri bawah */}
            <div style={{ 
              background: '#1e70cd', 
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              clipPath: 'polygon(245px 0px, 268px 0px, 213px 95px, 190px 95px)',
              zIndex: 2
            }} />

            {/* Kartu Abu-abu Gelap INVOICE - Floating, diagonal menyempit ke kiri bawah */}
            <div style={{ 
              background: '#23252a', 
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              clipPath: 'polygon(278px 15px, 580px 15px, 580px 80px, 240px 80px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingRight: '30px',
              zIndex: 1
            }}>
              <div style={{ color: '#ffffff', fontFamily: '"Montserrat", "Segoe UI", sans-serif', fontSize: '36px', fontWeight: '900', letterSpacing: '5px', lineHeight: '1', marginTop: '15px' }}>INVOICE</div>
            </div>
          </div>

          {/* Info Section */}
          <div style={{ padding: '30px 35px 20px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', fontFamily: '"Montserrat", "Segoe UI", sans-serif', flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1f2937', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invoice To:</div>
              <div style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px', lineHeight: '1.1', wordBreak: 'break-word' }}>
                {renderCustomerName()}
              </div>
              <div style={{ fontSize: '11px', color: '#1f2937', marginBottom: '4px', fontWeight: '600' }}>
                Designation : <span style={{ fontWeight: '500', color: '#4b5563' }}>Managing Director</span>
              </div>
              <div style={{ fontSize: '11px', color: '#1f2937', marginBottom: '4px', fontWeight: '600' }}>
                Phone : <span style={{ fontWeight: '500', color: '#4b5563' }}>{customer.wa_number || '123-456-7890'}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#1f2937', fontWeight: '600' }}>
                Email : <span style={{ fontWeight: '500', color: '#4b5563' }}>infohere</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <span style={{ color: '#1f2937' }}>Payment </span>
                <span style={{ color: '#1e70cd' }}>Method</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '180px', fontSize: '11px' }}>
                  <span style={{ fontWeight: '600', color: '#1f2937' }}>Account No:</span>
                  <span style={{ fontWeight: '500', color: '#1f2937' }}>1234-567-89</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '180px', fontSize: '11px' }}>
                  <span style={{ fontWeight: '600', color: '#1f2937' }}>Account Name:</span>
                  <span style={{ fontWeight: '500', color: '#1f2937' }}>namehere</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '180px', fontSize: '11px' }}>
                  <span style={{ fontWeight: '600', color: '#1f2937' }}>Card holder:</span>
                  <span style={{ fontWeight: '500', color: '#1f2937' }}>holderz</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabel Pesanan */}
          <div style={{ padding: '0 35px', flex: 1, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"Montserrat", "Segoe UI", sans-serif' }}>
              <thead>
                <tr style={{ color: '#ffffff' }}>
                  <th style={{ background: '#1350a0', width: '45px', textAlign: 'center', padding: '10px 10px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', border: 'none' }}>No</th>
                  <th style={{ background: '#1e70cd', textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', border: 'none' }}>Description</th>
                  <th style={{ background: '#1e70cd', textAlign: 'center', padding: '10px 10px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', width: '85px', border: 'none' }}>PRICE.</th>
                  <th style={{ background: '#1e70cd', textAlign: 'center', padding: '10px 10px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', width: '60px', border: 'none' }}>QTY.</th>
                  <th style={{ background: '#1e70cd', textAlign: 'right', padding: '10px 12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', width: '100px', border: 'none' }}>TOTAL.</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <>
                    {[
                      { desc: 'Product Description Here', price: 300, qty: 1, total: '300.00' },
                      { desc: 'Product Description Here', price: 600, qty: 3, total: '1800.00' },
                      { desc: 'Product Description Here', price: 812, qty: 2, total: '1624.00' },
                      { desc: 'Product Description Here', price: 744, qty: 1, total: '744.00' },
                      { desc: 'Product Description Here', price: 150, qty: 2, total: '300.00' },
                      { desc: 'Product Description Here', price: 200, qty: 2, total: '400.00' }
                    ].map((item, idx) => {
                      const rowBg = idx % 2 === 0 ? '#f2f5fa' : '#ffffff';
                      return (
                        <tr key={idx} style={{ background: rowBg }}>
                          <td style={{ padding: '9px 10px', textAlign: 'center', fontSize: '11px', color: '#1f2937', fontWeight: '500', borderBottom: '1px solid #e5e7eb' }}>{idx + 1}.</td>
                          <td style={{ padding: '9px 12px', textAlign: 'left', fontSize: '11px', color: '#1f2937', fontWeight: '500', borderBottom: '1px solid #e5e7eb' }}>{item.desc}</td>
                          <td style={{ padding: '9px 10px', textAlign: 'center', fontSize: '11px', color: '#1f2937', fontWeight: '500', borderBottom: '1px solid #e5e7eb' }}>{item.price}</td>
                          <td style={{ padding: '9px 10px', textAlign: 'center', fontSize: '11px', color: '#1f2937', fontWeight: '500', borderBottom: '1px solid #e5e7eb' }}>{item.qty}</td>
                          <td style={{ padding: '9px 12px', textAlign: 'right', fontSize: '11px', color: '#1f2937', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>{item.total}</td>
                        </tr>
                      );
                    })}
                  </>
                ) : (
                  items.map((item, index) => {
                    const rowBg = index % 2 === 0 ? '#f2f5fa' : '#ffffff';
                    return (
                      <tr key={index} style={{ background: rowBg }}>
                        <td style={{ padding: '9px 10px', textAlign: 'center', fontSize: '11px', color: '#1f2937', fontWeight: '500', borderBottom: '1px solid #e5e7eb' }}>{index + 1}.</td>
                        <td style={{ padding: '9px 12px', textAlign: 'left', fontSize: '11px', color: '#1f2937', fontWeight: '500', borderBottom: '1px solid #e5e7eb' }}>{item.book_title}</td>
                        <td style={{ padding: '9px 10px', textAlign: 'center', fontSize: '11px', color: '#1f2937', fontWeight: '500', borderBottom: '1px solid #e5e7eb' }}>{formatPrice(item.price)}</td>
                        <td style={{ padding: '9px 10px', textAlign: 'center', fontSize: '11px', color: '#1f2937', fontWeight: '500', borderBottom: '1px solid #e5e7eb' }}>{item.quantity}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', fontSize: '11px', color: '#1f2937', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>{formatPrice(calculateItemTotal(item))}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Middle Section (Contact & Totals) */}
          <div style={{ padding: '20px 35px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontFamily: '"Montserrat", "Segoe UI", sans-serif', flexShrink: 0 }}>
            {/* Kontak Kami (Kiri) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#1f2937', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                If You Face Any Problem Contact us
              </div>
              
              {/* Telepon */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#1e70cd', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px', flexShrink: 0 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '9px', fontWeight: '600', color: '#1f2937', lineHeight: '1.2' }}>+000 0000 00000</span>
                  <span style={{ fontSize: '8px', color: '#6b7280', lineHeight: '1.2' }}>+000 0000 00000</span>
                </div>
              </div>

              {/* Email / Web */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#1e70cd', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px', flexShrink: 0 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '9px', fontWeight: '600', color: '#1f2937', lineHeight: '1.2' }}>your company name</span>
                  <span style={{ fontSize: '8px', color: '#6b7280', lineHeight: '1.2' }}>company info here</span>
                </div>
              </div>

              {/* Lokasi */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#1e70cd', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px', flexShrink: 0 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '9px', fontWeight: '600', color: '#1f2937', lineHeight: '1.2' }}>Company Name,</span>
                  <span style={{ fontSize: '8px', color: '#6b7280', lineHeight: '1.2' }}>Office Street, City,</span>
                </div>
              </div>
            </div>

            {/* Total Ringkasan (Kanan) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '180px', fontSize: '11px', color: '#4b5563', borderBottom: '1px dashed #e2e8f0', paddingBottom: '3px' }}>
                <span style={{ fontWeight: '500' }}>VAT:</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>0%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '180px', fontSize: '11px', color: '#4b5563', borderBottom: '1px dashed #e2e8f0', paddingBottom: '3px' }}>
                <span style={{ fontWeight: '500' }}>Subtotal:</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{items.length === 0 ? '00,0' : formatCurrency(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '180px', fontSize: '11px', color: '#4b5563', paddingBottom: '3px' }}>
                <span style={{ fontWeight: '500' }}>Discount:</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{items.length === 0 ? '000' : 'Rp 0'}</span>
              </div>
              <div style={{ 
                background: '#1e70cd', 
                color: '#ffffff', 
                padding: '7px 12px', 
                fontSize: '13px', 
                fontWeight: '700',
                display: 'flex',
                justifyContent: 'space-between',
                width: '180px',
                borderRadius: '2px',
                marginTop: '5px'
              }}>
                <span>Total:</span>
                <span>{items.length === 0 ? '00000000' : formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Footer (Thank You & Tanda Tangan) */}
          <div style={{ 
            padding: '10px 35px 20px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-end', 
            fontFamily: '"Montserrat", "Segoe UI", sans-serif',
            marginTop: 'auto',
            flexShrink: 0
          }}>
            {/* Thank You */}
            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '280px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>Thank You For Business</div>
              <div style={{ fontSize: '8px', color: '#6b7280', lineHeight: '1.4' }}>
                Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna
              </div>
            </div>

            {/* Signature */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '180px' }}>
              <div style={{ 
                fontFamily: '"Playball", "Caveat", "Brush Script MT", cursive', 
                fontSize: '24px', 
                color: '#1f2937', 
                height: '35px', 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '2px'
              }}>
                Signature
              </div>
              <div style={{ width: '100%', height: '1px', background: '#1f2937', margin: '2px 0 5px 0' }} />
              <div style={{ fontSize: '10px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Surename Signature
              </div>
            </div>
          </div>

          {/* Bar Geometris Bawah */}
          <div style={{ height: '18px', background: '#23252a', width: '100%', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
            {/* Stripe 1 */}
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              background: '#1e70cd', 
              clipPath: 'polygon(265px 0, 285px 0, 274px 18px, 254px 18px)' 
            }} />
            {/* Stripe 2 */}
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              background: '#1e70cd', 
              clipPath: 'polygon(295px 0, 308px 0, 297px 18px, 284px 18px)' 
            }} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
