import React from 'react';
import { InvoiceProfile } from '../../../types/invoice.types';
import { formatDateId } from '../../../utils/invoice';

interface InvoiceFooterProps {
  profile: InvoiceProfile | null;
  invoiceDate: string;
  accentColor: string;
  footerBgColor: string;
  footerPrimaryColor: string;
  footerSecondaryColor: string;
}

export const InvoiceFooter: React.FC<InvoiceFooterProps> = ({
  profile,
  invoiceDate,
  accentColor,
  footerBgColor,
  footerPrimaryColor,
  footerSecondaryColor
}) => {
  const getSignatureOfficeLabel = () => {
    return profile?.signatureOffice || 'KBM Kreator Yogyakarta';
  };

  const getSignatureLocationDateLabel = () => {
    if (profile?.signatureLocation) {
      return `${profile.signatureLocation}, ${formatDateId(invoiceDate)}`;
    }
    return invoiceDate;
  };

  const getSignatureRoleLabel = () => {
    return profile?.signatureRole || '';
  };

  const getSignatureNameLabel = () => {
    return profile?.signatureName || '';
  };

  return (
    <>
      <div style={{ padding: '10px 35px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontFamily: '"Montserrat", "Segoe UI", sans-serif', flexShrink: 0 }}>
        {/* Tanda Tangan (Kiri) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '220px', fontSize: '9.5px', color: '#1f2937', position: 'relative' }}>
          <div style={{ fontWeight: '600', color: '#4b5563', marginBottom: '2px' }}>{getSignatureOfficeLabel()}</div>
          <div style={{ fontWeight: '600', color: '#4b5563', marginBottom: '6px' }}>{getSignatureLocationDateLabel()}</div>
          <div style={{ fontWeight: '600', fontSize: '8.5px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '8px' }}>{getSignatureRoleLabel()}</div>
          
          <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {profile?.signatureImg ? (
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
            
            <div style={{ width: '100%', height: '1px', background: '#1f2937', margin: profile?.signatureImg ? '25px 0 4px 0' : '2px 0 4px 0', zIndex: 1 }} />
            
            <div style={{ fontSize: '8.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', zIndex: 1 }}>
              {getSignatureNameLabel()}
            </div>
          </div>
        </div>

        {/* Sisi Kanan: Kontak Kustom */}
        {profile?.showCompanyContact ? (
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
            {profile.companyWebsite && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>{profile.companyWebsite}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: accentColor }}><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
              </div>
            )}
            {profile.companyEmail && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>{profile.companyEmail}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: accentColor }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              </div>
            )}
            {profile.companyYoutube && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>{profile.companyYoutube}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: accentColor }}><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.95 1.96C5.12 19.5 12 19.5 12 19.5s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 11.75a29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
              </div>
            )}
            {profile.companyInstagram && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>{profile.companyInstagram}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: accentColor }}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </div>
            )}
            {profile.companyPhone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>{profile.companyPhone}</span>
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
          <rect width="1045" height="80" fill="#ffffff" />
          <defs>
            <filter id="drop-shadow-footer" x="-10%" y="-10%" width="120%" height="130%">
              <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.3" />
            </filter>
            <filter id="drop-shadow-middle-footer" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#000000" floodOpacity="0.5" />
            </filter>
          </defs>

          <g filter="url(#drop-shadow-footer)">
            <path d="M 0 20 H 312 L 349.5 70 H 0 Z" fill={footerBgColor} />
            <path d="M 388.25 20 H 1045 V 70 H 425.75 Z" fill={footerPrimaryColor} />
          </g>

          {profile?.showBankInfo && (
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

          {profile?.showBankInfo && (
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
              {profile.bankName} | {profile.bankAccountNo} | a/n. {profile.bankAccountOwner}
            </text>
          )}

          <g filter="url(#drop-shadow-middle-footer)">
            <path d="M 320 5 H 359 L 407.75 70 H 368.75 Z" fill={footerSecondaryColor} />
            <path d="M 359 5 H 377 L 425.75 70 H 407.75 Z" fill="#ffffff" />
          </g>
        </svg>
      </div>
    </>
  );
};
