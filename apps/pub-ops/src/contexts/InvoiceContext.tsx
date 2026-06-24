import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { InvoiceItem, InvoiceProfile } from '../types/invoice.types';
import { Contact } from '../types/contact.types';
import { invoiceTemplates } from '../data/invoiceTemplates';
import { evaluateItemFormula, getIndonesianDate } from '../utils/invoice';

export interface InvoiceCustomerData extends Partial<Contact> {
  isPenulis?: boolean;
}

const defaultProfiles: InvoiceProfile[] = invoiceTemplates.map(t => {
  const isKBMTmpl = t.profile.companyName?.toUpperCase().includes('KBM') || 
                    t.profile.companyName?.toUpperCase().includes('SASTRABOOK') ||
                    t.templateId.toUpperCase().includes('KBM') ||
                    t.templateId.toUpperCase().includes('SASTRABOOK');
  return {
    ...t.profile,
    id: t.templateId,
    name: t.profile.name || t.label,
    invoiceNoFormat: t.profile.invoiceNoFormat || 'KBM/{year}/{month}/{day}/{seq}',
    companyWebsite: t.profile.companyWebsite || (isKBMTmpl ? 'penerbitkbm.com | penerbitbukumurah.com' : ''),
    companyEmail: t.profile.companyEmail || (isKBMTmpl ? 'naskah@penerbitkbm.com' : ''),
    companyYoutube: t.profile.companyYoutube || (isKBMTmpl ? 'Penerbit KBM Sastrabook' : ''),
    companyInstagram: t.profile.companyInstagram || (isKBMTmpl ? '@penerbit.sastrabook / @penerbit.kbmindonesia' : ''),
    companyPhone: t.profile.companyPhone || (isKBMTmpl ? '0813 5751 7526' : ''),
    showCompanyContact: t.profile.showCompanyContact !== undefined ? t.profile.showCompanyContact : isKBMTmpl,
    footerBgColor: t.profile.footerBgColor || t.profile.headerBgColor || '#222933',
    footerPrimaryColor: t.profile.footerPrimaryColor || t.profile.headerPrimaryColor || t.profile.accentColor || '#c01c1c',
    footerSecondaryColor: t.profile.footerSecondaryColor || t.profile.headerSecondaryColor || t.profile.accentColor || '#c01c1c'
  };
}) as InvoiceProfile[];

interface InvoiceContextType {
  customer: InvoiceCustomerData;
  items: InvoiceItem[];
  shippingCost: number;
  adminFee: number;
  invoiceType: string;
  invoiceNo: string;
  invoiceHal: string;
  invoiceLampiran: string;
  invoiceDate: string;
  paymentStatus: string;
  spesifikasiFasilitas: string;
  bankAccountInfo: string;
  profiles: InvoiceProfile[];
  activeProfileId: string;
  activeProfile: InvoiceProfile | undefined;
  setCustomer: (customer: InvoiceCustomerData | ((prev: InvoiceCustomerData) => InvoiceCustomerData)) => void;
  addItem: (item: InvoiceItem) => void;
  updateItem: (index: number, item: Partial<InvoiceItem>) => void;
  removeItem: (index: number) => void;
  setShippingCost: (cost: number) => void;
  setAdminFee: (fee: number) => void;
  setInvoiceType: (type: string) => void;
  setInvoiceNo: (no: string) => void;
  setInvoiceHal: (hal: string) => void;
  setInvoiceLampiran: (lampiran: string) => void;
  setInvoiceDate: (date: string) => void;
  setPaymentStatus: (status: string) => void;
  setSpesifikasiFasilitas: (val: string) => void;
  setBankAccountInfo: (val: string) => void;
  setProfiles: (profiles: InvoiceProfile[]) => void;
  setActiveProfileId: (id: string) => void;
  calculateTotal: () => number;
  calculateItemTotal: (item: InvoiceItem) => number;
  resetInvoice: () => void;
  addOrUpdateProfile: (profile: InvoiceProfile) => void;
  deleteProfile: (id: string) => void;
  resetProfilesToDefault: () => void;
  editingInvoiceId: number | null;
  setEditingInvoiceId: (id: number | null) => void;
  loadInvoiceToForm: (invoice: any) => void;
  tempPreviewProfile: InvoiceProfile | null;
  setTempPreviewProfile: (profile: InvoiceProfile | null) => void;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export const InvoiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customer, setCustomerState] = useState<InvoiceCustomerData>({
    name: '',
    wa_number: '',
    email: '',
    address: '',
    isPenulis: false
  });
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [shippingCost, setShippingCost] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  
  // Custom Invoice Profiles
  const [profiles, setProfilesState] = useState<InvoiceProfile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string>(defaultProfiles[0]?.id ?? '');

  const [invoiceType, setInvoiceType] = useState<string>(defaultProfiles[0]?.id ?? '');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceHal, setInvoiceHal] = useState('');
  const [invoiceLampiran, setInvoiceLampiran] = useState('-');
  const [invoiceDate, setInvoiceDate] = useState(getIndonesianDate());
  const [paymentStatus, setPaymentStatus] = useState('LUNAS');
  const [spesifikasiFasilitas, setSpesifikasiFasilitas] = useState('Sesuai poster paket yang diambil');
  const [bankAccountInfo, setBankAccountInfo] = useState('');
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);
  const [tempPreviewProfile, setTempPreviewProfile] = useState<InvoiceProfile | null>(null);

  // Load profiles from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('invoice_profiles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Suntik tableColumns default jika profil lama belum memilikinya
          const migrasiParsed = parsed.map((p: any) => {
            if (!p.tableColumns) {
              const matchingDefault = defaultProfiles.find(dp => dp.id === p.id) 
                || defaultProfiles.find(dp => dp.tableType === p.tableType)
                || defaultProfiles[0];
              return {
                ...p,
                tableColumns: matchingDefault.tableColumns
              };
            }
            return p;
          });
          setProfilesState(migrasiParsed);
          const activeId = localStorage.getItem('active_profile_id') || migrasiParsed[0].id;
          setActiveProfileIdState(activeId);
          return;
        }
      } catch (e) {
        console.error('Gagal memuat profil invoice:', e);
      }
    }
    
    // Fallback ke profil bawaan
    setProfilesState(defaultProfiles);
    localStorage.setItem('invoice_profiles', JSON.stringify(defaultProfiles));
    setActiveProfileIdState(defaultProfiles[0]?.id ?? '');
    localStorage.setItem('active_profile_id', defaultProfiles[0]?.id ?? '');
  }, []);

  // Save profiles to localStorage when updated
  const setProfiles = (newProfiles: InvoiceProfile[]) => {
    setProfilesState(newProfiles);
    localStorage.setItem('invoice_profiles', JSON.stringify(newProfiles));
  };

  const setActiveProfileId = (id: string) => {
    setActiveProfileIdState(id);
    localStorage.setItem('active_profile_id', id);
  };

  // Find active profile
  const activeProfile = useMemo(() => {
    return profiles.find(p => p.id === activeProfileId);
  }, [profiles, activeProfileId]);

  // Sync state values with active profile details
  useEffect(() => {
    if (activeProfile) {
      setInvoiceType(activeProfile.tableType);
      setInvoiceHal(activeProfile.defaultHal);
      setInvoiceLampiran(activeProfile.defaultLampiran);
      setSpesifikasiFasilitas(activeProfile.defaultSpesifikasi);
      
      let bankText = '';
      if (activeProfile.showBankInfo) {
        bankText = `${activeProfile.bankName} - No: ${activeProfile.bankAccountNo} a.n. ${activeProfile.bankAccountOwner}`;
      }
      setBankAccountInfo(bankText);
    }
  }, [activeProfile]);

  const setCustomer = (customerOrUpdater: InvoiceCustomerData | ((prev: InvoiceCustomerData) => InvoiceCustomerData)) => {
    setCustomerState(customerOrUpdater);
  };

  const calculateItemTotal = (item: InvoiceItem) => {
    // Jika ada kolom formula total pada profil aktif, gunakan formula tersebut
    if (activeProfile?.tableColumns) {
      const totalCol = activeProfile.tableColumns.find(
        col => col.type === 'formula' && (col.key === 'total' || col.key.toLowerCase().includes('total'))
      );
      if (totalCol && totalCol.formula) {
        const val = evaluateItemFormula(totalCol.formula, item);
        return typeof val === 'number' ? val : parseFloat(val) || 0;
      }
    }
    
    // Fallback ke perhitungan bawaan jika tidak ada kolom formula khusus
    const itemShip = item.item_shipping_cost || 0;
    return (item.price * item.quantity) - item.discount + itemShip;
  };

  const calculateTotalValue = useMemo(() => {
    const itemsTotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    // Jika profil memiliki kolom ongkos kirim per item, abaikan ongkir global
    const hasItemShipping = activeProfile?.tableColumns?.some(col => col.key === 'item_shipping_cost');
    const globalShip = hasItemShipping ? 0 : shippingCost;
    return itemsTotal + globalShip + adminFee;
  }, [items, shippingCost, adminFee, activeProfile]);

  const calculateTotal = () => calculateTotalValue;

  const addItem = (item: InvoiceItem) => {
    setItems(prev => [...prev, item]);
  };

  const updateItem = (index: number, updates: Partial<InvoiceItem>) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    ));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const resetInvoice = () => {
    setCustomer({ name: '', wa_number: '', email: '', address: '', isPenulis: false });
    setItems([]);
    setShippingCost(0);
    setAdminFee(0);
    setInvoiceNo('');
    setInvoiceDate(getIndonesianDate());
    setPaymentStatus('LUNAS');
    setEditingInvoiceId(null);
    
    if (activeProfile) {
      setInvoiceHal(activeProfile.defaultHal);
      setInvoiceLampiran(activeProfile.defaultLampiran);
      setSpesifikasiFasilitas(activeProfile.defaultSpesifikasi);
    }
  };

  const addOrUpdateProfile = (profile: InvoiceProfile) => {
    setProfilesState(prev => {
      const idx = prev.findIndex(p => p.id === profile.id);
      let updated: InvoiceProfile[];
      if (idx > -1) {
        updated = prev.map((p, i) => i === idx ? profile : p);
      } else {
        updated = [...prev, profile];
      }
      localStorage.setItem('invoice_profiles', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteProfile = (id: string) => {
    setProfilesState(prev => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem('invoice_profiles', JSON.stringify(updated));
      
      // Jika profile aktif dihapus, pilih profile pertama yang tersisa
      if (activeProfileId === id && updated.length > 0) {
        setActiveProfileIdState(updated[0].id);
        localStorage.setItem('active_profile_id', updated[0].id);
      }
      return updated;
    });
  };

  const loadInvoiceToForm = (invoice: any) => {
    try {
      let metadata: {
        invoiceNo: string;
        invoiceDate: string;
        invoiceHal: string;
        invoiceLampiran: string;
        paymentStatus: string;
        spesifikasiFasilitas: string;
        customerName: string;
        customerWa: string;
        customerEmail?: string;
        customerAddress: string;
        isPenulis?: boolean;
      } = {
        invoiceNo: '',
        invoiceDate: '',
        invoiceHal: '',
        invoiceLampiran: '',
        paymentStatus: 'LUNAS',
        spesifikasiFasilitas: '',
        customerName: '',
        customerWa: '',
        customerAddress: ''
      };
      
      if (invoice.file_path) {
        try {
          metadata = JSON.parse(invoice.file_path);
        } catch (jsonErr) {
          console.error("Gagal parse metadata JSON:", jsonErr);
        }
      }
      
      setCustomer({
        name: metadata.customerName || '',
        wa_number: metadata.customerWa || '',
        email: metadata.customerEmail || '',
        address: metadata.customerAddress || '',
        isPenulis: metadata.isPenulis || false
      });
      
      let parsedItems = [];
      if (invoice.items_json) {
        try {
          parsedItems = JSON.parse(invoice.items_json);
        } catch (jsonErr) {
          console.error("Gagal parse items JSON:", jsonErr);
        }
      }
      setItems(parsedItems);
      
      setShippingCost(invoice.shipping_cost || 0);
      setAdminFee(invoice.admin_fee || 0);
      setInvoiceNo(metadata.invoiceNo || '');
      setInvoiceHal(metadata.invoiceHal || '');
      setInvoiceLampiran(metadata.invoiceLampiran || '-');
      setInvoiceDate(metadata.invoiceDate || '');
      setPaymentStatus(metadata.paymentStatus || 'LUNAS');
      setSpesifikasiFasilitas(metadata.spesifikasiFasilitas || '');
      
      // Cocokkan profile dengan export_format
      const matchingProfile = profiles.find(p => p.id === invoice.export_format || p.tableType === invoice.export_format);
      if (matchingProfile) {
        setActiveProfileIdState(matchingProfile.id);
      }
      
      if (invoice.id) {
        setEditingInvoiceId(invoice.id);
      }
    } catch (e) {
      console.error("Gagal memuat invoice ke form:", e);
    }
  };

  const resetProfilesToDefault = () => {
    setProfilesState(defaultProfiles);
    localStorage.setItem('invoice_profiles', JSON.stringify(defaultProfiles));
    setActiveProfileIdState(defaultProfiles[0]?.id ?? '');
    localStorage.setItem('active_profile_id', defaultProfiles[0]?.id ?? '');
  };

  return (
    <InvoiceContext.Provider value={{
      customer,
      items,
      shippingCost,
      adminFee,
      invoiceType,
      invoiceNo,
      invoiceHal,
      invoiceLampiran,
      invoiceDate,
      paymentStatus,
      spesifikasiFasilitas,
      bankAccountInfo,
      profiles,
      activeProfileId,
      activeProfile,
      setCustomer,
      addItem,
      updateItem,
      removeItem,
      setShippingCost,
      setAdminFee,
      setInvoiceType,
      setInvoiceNo,
      setInvoiceHal,
      setInvoiceLampiran,
      setInvoiceDate,
      setPaymentStatus,
      setSpesifikasiFasilitas,
      setBankAccountInfo,
      setProfiles,
      setActiveProfileId,
      calculateTotal,
      calculateItemTotal,
      resetInvoice,
      addOrUpdateProfile,
      deleteProfile,
      resetProfilesToDefault,
      editingInvoiceId,
      setEditingInvoiceId,
      loadInvoiceToForm,
      tempPreviewProfile,
      setTempPreviewProfile,
    }}>
      {children}
    </InvoiceContext.Provider>
  );
};

export const useInvoiceContext = () => {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoiceContext must be used within InvoiceProvider');
  }
  return context;
};
