import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useInvoiceContext } from '../../contexts/InvoiceContext';
import { InvoiceProfile, InvoiceItem } from '../../types/invoice.types';

// Import sub-komponen modular
import { InvoiceHeader } from './sections/InvoiceHeader';
import { InvoiceInfo } from './sections/InvoiceInfo';
import { InvoiceTable } from './sections/InvoiceTable';
import { InvoiceFooter } from './sections/InvoiceFooter';
import { Watermark } from './sections/Watermark';

interface InvoicePreviewProps {
  id?: string;
  previewProfile?: InvoiceProfile;
  overrideInvoice?: {
    customerName: string;
    waNumber?: string;
    email?: string;
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

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ id, previewProfile, overrideInvoice }) => {
  const contextData = useInvoiceContext();
  
  const customer = overrideInvoice 
    ? { name: overrideInvoice.customerName, wa_number: overrideInvoice.waNumber, email: overrideInvoice.email, address: overrideInvoice.address } 
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

  const panelRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [zoom, setZoom] = useState(1.0);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleZoomReset = () => setZoom(1.0);

  const [downloading, setDownloading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const handleDownloadPDF = useCallback(async () => {
    setDownloading(true);
    setPdfError(null);
    try {
      const { generateInvoicePDFBytes } = await import('../../utils/pdfGenerator');
      const bytes = await generateInvoicePDFBytes('invoice-preview-export');
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoiceNo ? invoiceNo.replace(/\//g, '_') : 'DRAF'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Gagal generate PDF:', msg);
      setPdfError(msg);
    } finally {
      setDownloading(false);
    }
  }, [invoiceNo]);

  // Auto-clear error after 5s
  useEffect(() => {
    if (!pdfError) return;
    const t = setTimeout(() => setPdfError(null), 5000);
    return () => clearTimeout(t);
  }, [pdfError]);

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
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%', 
        background: 'var(--bg-panel)', 
        overflow: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >


      {/* Floating Zoom Controls + Download */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        display: 'flex',
        gap: '4px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        padding: '4px',
        borderRadius: '8px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
        zIndex: 100
      }}>
        <button 
          onClick={handleZoomOut}
          type="button"
          style={{ width: '24px', height: '24px', borderRadius: '4px', border: 'none', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Zoom Out"
        >
          ➖
        </button>
        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', minWidth: '40px', justifyContent: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button 
          onClick={handleZoomIn}
          type="button"
          style={{ width: '24px', height: '24px', borderRadius: '4px', border: 'none', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Zoom In"
        >
          ➕
        </button>
        <button 
          onClick={handleZoomReset}
          type="button"
          style={{ width: '24px', height: '24px', borderRadius: '4px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Reset"
        >
          🔄
        </button>
        <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 2px' }} />
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          type="button"
          style={{
            width: '32px', height: '24px', borderRadius: '4px', border: 'none',
            background: downloading ? 'var(--bg-panel)' : 'var(--accent)',
            color: downloading ? 'var(--text-secondary)' : '#fff',
            cursor: downloading ? 'not-allowed' : 'pointer',
            fontWeight: '600', fontSize: '13px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
          title={downloading ? 'Memproses...' : 'Download PDF'}
        >
          {downloading ? '⏳' : '⬇'}
        </button>
      </div>

      {pdfError && (
        <div style={{
          position: 'absolute', top: '52px', left: '50%', transform: 'translateX(-50%)',
          background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c',
          fontSize: '11px', fontWeight: '600', padding: '6px 14px', zIndex: 100,
          borderRadius: '6px', whiteSpace: 'nowrap', maxWidth: '90%', overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          ⚙️ Gagal download PDF: {pdfError}
        </div>
      )}

      <div 
        id={id || "invoice-preview-content"}
        style={{
          transform: `scale(${scale * zoom})`,
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
        
        {/* Kop Surat SVG */}
        <InvoiceHeader 
          profile={profile}
          headerBgColor={headerBgColor}
          headerPrimaryColor={headerPrimaryColor}
          headerSecondaryColor={headerSecondaryColor}
          invoiceNo={invoiceNo}
        />
        
        {/* Info detail (kepada, perihal, lampiran, dll.) */}
        <InvoiceInfo
          customer={customer}
          profile={profile}
          invoiceHal={invoiceHal}
          invoiceLampiran={invoiceLampiran}
          invoiceDate={invoiceDate}
        />

        {/* Tabel rincian pesanan */}
        <InvoiceTable
          items={items}
          profile={profile}
          shippingCost={shippingCost}
          adminFee={adminFee}
          spesifikasiFasilitas={spesifikasiFasilitas}
          calculateItemTotal={calculateItemTotal}
          accentColor={accentColor}
          accentColorDark={accentColorDark}
        />

        {/* Tanda tangan & Rekening Transfer */}
        <InvoiceFooter
          profile={profile}
          invoiceDate={invoiceDate}
          accentColor={accentColor}
          footerBgColor={footerBgColor}
          footerPrimaryColor={footerPrimaryColor}
          footerSecondaryColor={footerSecondaryColor}
        />

        {/* Stempel watermark pembayaran */}
        <Watermark paymentStatus={paymentStatus} activeProfile={profile} />
      </div>
    </div>
  );
};

export default InvoicePreview;
