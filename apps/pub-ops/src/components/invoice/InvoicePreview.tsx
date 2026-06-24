import React, { useRef, useEffect, useState } from 'react';
import { useInvoiceContext } from '../../contexts/InvoiceContext';
import { InvoiceProfile, InvoiceItem } from '../../types/invoice.types';

// Import sub-komponen modular
import { InvoiceHeader } from './sections/InvoiceHeader';
import { InvoiceInfo } from './sections/InvoiceInfo';
import { InvoiceTable } from './sections/InvoiceTable';
import { InvoiceFooter } from './sections/InvoiceFooter';
import { Watermark } from './sections/Watermark';

interface InvoicePreviewProps {
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

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ previewProfile, overrideInvoice }) => {
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
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-panel)', overflow: 'hidden' }}>


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
