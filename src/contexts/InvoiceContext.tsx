import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { InvoiceItem, Contact, InvoiceProfile } from '../types';

const defaultProfiles: InvoiceProfile[] = [
  {
    id: 'kbm_cetak',
    name: 'Profil Cetak Buku (Bawaan)',
    companyName: 'PENERBIT DUMMY',
    companyTagline: 'CV MEDIA UTAMA DUMMY',
    invoiceTitleText: 'INVOICE',
    accentColor: '#1e70cd',
    accentColorDark: '#1e3a8a',
    headerColor: '#d93838',
    defaultHal: 'Biaya Cetak Buku',
    defaultLampiran: '-',
    salamPembuka: 'Bersama surat ini kami memberikan gambaran rincian biaya cetak buku dengan ketentuan sebagai berikut:',
    actionLabel: 'cetak buku',
    tableType: 'kbm_cetak',
    notes: [
      'Pajak ditanggung oleh pemesan atau penulis.',
      'Ketentuan dan fasilitas sesuai dengan paket yang dipilih.'
    ],
    showSpesifikasi: false,
    defaultSpesifikasi: '',
    signatureOffice: 'Manajemen Penerbit Dummy',
    signatureLocation: 'Kota Dummy',
    signatureRole: 'Direktur Utama',
    signatureName: 'NAMA PENANDATANGAN DUMMY, M.T.',
    showBankInfo: true,
    bankName: 'Bank Mandiri',
    bankAccountNo: '1234567890123',
    bankAccountOwner: 'Nama Pemilik Rekening'
  },
  {
    id: 'kbm_creator',
    name: 'Profil Jasa Kreator (Bawaan)',
    companyName: 'KREATOR DUMMY SERVICES',
    companyTagline: 'SOLUSI KONTEN DIGITAL DUMMY',
    invoiceTitleText: 'INVOICE',
    accentColor: '#059669',
    accentColorDark: '#065f46',
    headerColor: '#059669',
    defaultHal: 'Pengajuan Sertifikat Hak Cipta Karya',
    defaultLampiran: '-',
    salamPembuka: 'Dengan hormat, kami sampaikan rincian biaya pengajuan sertifikat hak cipta karya tulis/desain dengan detail sebagai berikut:',
    actionLabel: 'pengajuan sertifikat',
    tableType: 'kbm_creator',
    notes: [
      'Pajak dan biaya administrasi tambahan ditanggung oleh pemesan.',
      'Sertifikat akan diproses setelah pembayaran lunas.'
    ],
    showSpesifikasi: false,
    defaultSpesifikasi: '',
    signatureOffice: 'Administrasi Layanan Kreator',
    signatureLocation: 'Kota Dummy',
    signatureRole: 'Manajer Layanan',
    signatureName: 'NAMA STAF ADMINISTRASI, S.Kom.',
    showBankInfo: true,
    bankName: 'Bank Central Asia (BCA)',
    bankAccountNo: '9876543210',
    bankAccountOwner: 'Nama Pemilik Rekening'
  },
  {
    id: 'spt_mitra',
    name: 'Profil Kerjasama Kemitraan (Bawaan)',
    companyName: 'DUMMY PRESS INDONESIA',
    companyTagline: 'SOLUSI PUBLIKASI DAN ARSIP',
    invoiceTitleText: 'INVOICE',
    accentColor: '#d97706',
    accentColorDark: '#92400e',
    headerColor: '#d97706',
    defaultHal: 'KERJASAMA PENYEDIAAN ALAT PEMBELAJARAN',
    defaultLampiran: '-',
    salamPembuka: 'Berikut kami sampaikan rincian anggaran pengadaan barang/jasa kemitraan penerbitan sesuai kesepakatan:',
    actionLabel: 'pengadaan barang',
    tableType: 'spt_mitra',
    notes: [],
    showSpesifikasi: true,
    defaultSpesifikasi: 'Sesuai dengan ketentuan proposal kemitraan yang disepakati.',
    signatureOffice: 'Divisi Kemitraan Dummy Press',
    signatureLocation: 'Kota Dummy',
    signatureRole: 'Manajer Hubungan Mitra',
    signatureName: 'NAMA HUBUNGAN MITRA, M.B.A.',
    showBankInfo: false,
    bankName: '',
    bankAccountNo: '',
    bankAccountOwner: ''
  }
];

interface InvoiceContextType {
  customer: Partial<Contact>;
  items: InvoiceItem[];
  shippingCost: number;
  adminFee: number;
  invoiceType: 'kbm_cetak' | 'kbm_creator' | 'spt_mitra';
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
  setCustomer: (customer: Partial<Contact> | ((prev: Partial<Contact>) => Partial<Contact>)) => void;
  addItem: (item: InvoiceItem) => void;
  updateItem: (index: number, item: Partial<InvoiceItem>) => void;
  removeItem: (index: number) => void;
  setShippingCost: (cost: number) => void;
  setAdminFee: (fee: number) => void;
  setInvoiceType: (type: 'kbm_cetak' | 'kbm_creator' | 'spt_mitra') => void;
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
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

const getIndonesianDate = () => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const d = new Date();
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export const InvoiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customer, setCustomerState] = useState<Partial<Contact>>({
    name: '',
    wa_number: '',
    address: ''
  });
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [shippingCost, setShippingCost] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  
  // Custom Invoice Profiles
  const [profiles, setProfilesState] = useState<InvoiceProfile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string>('kbm_cetak');

  const [invoiceType, setInvoiceType] = useState<'kbm_cetak' | 'kbm_creator' | 'spt_mitra'>('kbm_cetak');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceHal, setInvoiceHal] = useState('');
  const [invoiceLampiran, setInvoiceLampiran] = useState('-');
  const [invoiceDate, setInvoiceDate] = useState(getIndonesianDate());
  const [paymentStatus, setPaymentStatus] = useState('LUNAS');
  const [spesifikasiFasilitas, setSpesifikasiFasilitas] = useState('Sesuai poster paket yang diambil');
  const [bankAccountInfo, setBankAccountInfo] = useState('');

  // Load profiles from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('invoice_profiles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProfilesState(parsed);
          const activeId = localStorage.getItem('active_profile_id') || parsed[0].id;
          setActiveProfileIdState(activeId);
          return;
        }
      } catch (e) {
        console.error('Gagal memuat profil invoice:', e);
      }
    }
    
    // Fallback to default profiles
    setProfilesState(defaultProfiles);
    localStorage.setItem('invoice_profiles', JSON.stringify(defaultProfiles));
    setActiveProfileIdState('kbm_cetak');
    localStorage.setItem('active_profile_id', 'kbm_cetak');
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

  const setCustomer = (customerOrUpdater: Partial<Contact> | ((prev: Partial<Contact>) => Partial<Contact>)) => {
    setCustomerState(customerOrUpdater);
  };

  const calculateItemTotal = (item: InvoiceItem) => {
    const itemShip = item.item_shipping_cost || 0;
    return (item.price * item.quantity) - item.discount + itemShip;
  };

  const calculateTotalValue = useMemo(() => {
    const itemsTotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    // If table type is KBM Cetak, shipping is calculated per item, else we use global shipping
    const globalShip = (activeProfile?.tableType === 'kbm_cetak') ? 0 : shippingCost;
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
    setCustomer({ name: '', wa_number: '', address: '' });
    setItems([]);
    setShippingCost(0);
    setAdminFee(0);
    setInvoiceDate(getIndonesianDate());
    setPaymentStatus('LUNAS');
    
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

  const resetProfilesToDefault = () => {
    setProfilesState(defaultProfiles);
    localStorage.setItem('invoice_profiles', JSON.stringify(defaultProfiles));
    setActiveProfileIdState('kbm_cetak');
    localStorage.setItem('active_profile_id', 'kbm_cetak');
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
