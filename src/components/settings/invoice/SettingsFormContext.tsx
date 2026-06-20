import { createContext, useContext } from 'react';
import { InvoiceTableColumn } from '../../../types/invoice.types';

export interface SettingsFormContextType {
  profileName: string;
  setProfileName: (v: string) => void;
  companyName: string;
  setCompanyName: (v: string) => void;
  companyTagline: string;
  setCompanyTagline: (v: string) => void;
  invoiceTitleText: string;
  setInvoiceTitleText: (v: string) => void;
  accentColor: string;
  setAccentColor: (v: string) => void;
  accentColorDark: string;
  setAccentColorDark: (v: string) => void;
  headerBgColor: string;
  setHeaderBgColor: (v: string) => void;
  headerPrimaryColor: string;
  setHeaderPrimaryColor: (v: string) => void;
  headerSecondaryColor: string;
  setHeaderSecondaryColor: (v: string) => void;
  defaultHal: string;
  setDefaultHal: (v: string) => void;
  defaultLampiran: string;
  setDefaultLampiran: (v: string) => void;
  salamPembuka: string;
  setSalamPembuka: (v: string) => void;
  actionLabel: string;
  setActionLabel: (v: string) => void;
  tableType: string;
  setTableType: (v: string) => void;
  notes: string[];
  setNotes: (v: string[]) => void;
  showSpesifikasi: boolean;
  setShowSpesifikasi: (v: boolean) => void;
  defaultSpesifikasi: string;
  setDefaultSpesifikasi: (v: string) => void;
  signatureOffice: string;
  setSignatureOffice: (v: string) => void;
  signatureLocation: string;
  setSignatureLocation: (v: string) => void;
  signatureRole: string;
  setSignatureRole: (v: string) => void;
  signatureName: string;
  setSignatureName: (v: string) => void;
  showBankInfo: boolean;
  setShowBankInfo: (v: boolean) => void;
  bankName: string;
  setBankName: (v: string) => void;
  bankAccountNo: string;
  setBankAccountNo: (v: string) => void;
  bankAccountOwner: string;
  setBankAccountOwner: (v: string) => void;
  companyLogo: string;
  setCompanyLogo: (v: string) => void;
  signatureImg: string;
  setSignatureImg: (v: string) => void;
  headerType: 'logo_only' | 'logo_text' | 'text_only';
  setHeaderType: (v: 'logo_only' | 'logo_text' | 'text_only') => void;
  tableColumns: InvoiceTableColumn[];
  setTableColumns: (v: InvoiceTableColumn[] | ((prev: InvoiceTableColumn[]) => InvoiceTableColumn[])) => void;
  shippingType: 'none' | 'global' | 'item';
  setShippingType: (v: 'none' | 'global' | 'item') => void;
  watermarkColor: string;
  setWatermarkColor: (v: string) => void;
  watermarkOpacity: number;
  setWatermarkOpacity: (v: number) => void;
  invoiceNoFormat: string;
  setInvoiceNoFormat: (v: string) => void;
}

export const SettingsFormContext = createContext<SettingsFormContextType | undefined>(undefined);

export const useSettingsForm = () => {
  const context = useContext(SettingsFormContext);
  if (!context) {
    throw new Error('useSettingsForm must be used within SettingsFormContext.Provider');
  }
  return context;
};
