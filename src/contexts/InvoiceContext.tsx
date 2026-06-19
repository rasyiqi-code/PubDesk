import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { InvoiceItem, Contact, InvoiceProfile } from '../types';

const defaultProfiles: InvoiceProfile[] = [
  {
    // Profil 1: Generik dengan ongkos kirim per item (contoh: jasa produksi/cetak/logistik)
    id: 'profil_dengan_ongkir',
    name: 'Profil Dengan Ongkos Kirim (Bawaan)',
    companyName: 'NAMA PERUSAHAAN',
    companyTagline: 'TAGLINE PERUSAHAAN',
    invoiceTitleText: 'INVOICE',
    accentColor: '#1e70cd',
    accentColorDark: '#1e3a8a',
    headerBgColor: '#222933',
    headerPrimaryColor: '#d93838',
    headerSecondaryColor: '#d93838',
    defaultHal: 'Biaya Layanan',
    defaultLampiran: '-',
    salamPembuka: 'Bersama surat ini kami sampaikan rincian biaya layanan dengan ketentuan sebagai berikut:',
    actionLabel: 'layanan',
    tableType: 'item_dengan_ongkir',
    notes: [
      'Pajak ditanggung oleh pemesan.',
      'Ketentuan sesuai dengan paket yang dipilih.'
    ],
    showSpesifikasi: false,
    defaultSpesifikasi: '',
    signatureOffice: 'Manajemen',
    signatureLocation: 'Kota',
    signatureRole: 'Direktur',
    signatureName: 'NAMA PENANDATANGAN',
    showBankInfo: true,
    bankName: 'Nama Bank',
    bankAccountNo: 'Nomor Rekening',
    bankAccountOwner: 'Nama Pemilik Rekening',
    headerType: 'logo_text',
    tableColumns: [
      { key: 'book_title', label: 'Nama Item', type: 'text', align: 'left' },
      { key: 'quantity', label: 'Qty', type: 'number', align: 'center', width: '80px' },
      { key: 'price', label: 'Harga Satuan', type: 'currency', align: 'right', width: '110px' },
      { key: 'item_shipping_cost', label: 'Ongkos Kirim', type: 'currency', align: 'right', width: '100px' },
      { key: 'total', label: 'Total', type: 'formula', align: 'right', width: '110px', formula: '({price} * {quantity}) + {item_shipping_cost}' }
    ]
  },
  {
    // Profil 2: Generik untuk layanan tunggal tanpa qty (contoh: jasa konsultasi/administrasi)
    id: 'profil_layanan_tunggal',
    name: 'Profil Layanan Tunggal (Bawaan)',
    companyName: 'NAMA PERUSAHAAN',
    companyTagline: 'TAGLINE PERUSAHAAN',
    invoiceTitleText: 'INVOICE',
    accentColor: '#059669',
    accentColorDark: '#065f46',
    headerBgColor: '#222933',
    headerPrimaryColor: '#059669',
    headerSecondaryColor: '#059669',
    defaultHal: 'Biaya Jasa',
    defaultLampiran: '-',
    salamPembuka: 'Dengan hormat, kami sampaikan rincian biaya jasa dengan detail sebagai berikut:',
    actionLabel: 'jasa',
    tableType: 'layanan_tunggal',
    notes: [
      'Pajak dan biaya administrasi tambahan ditanggung oleh pemesan.',
      'Layanan akan diproses setelah pembayaran lunas.'
    ],
    showSpesifikasi: false,
    defaultSpesifikasi: '',
    signatureOffice: 'Administrasi',
    signatureLocation: 'Kota',
    signatureRole: 'Manajer Layanan',
    signatureName: 'NAMA PENANDATANGAN',
    showBankInfo: true,
    bankName: 'Nama Bank',
    bankAccountNo: 'Nomor Rekening',
    bankAccountOwner: 'Nama Pemilik Rekening',
    headerType: 'logo_text',
    tableColumns: [
      { key: 'book_title', label: 'Nama Layanan', type: 'text', align: 'left' },
      { key: 'price', label: 'Total Biaya', type: 'currency', align: 'right', width: '130px' }
    ]
  },
  {
    // Profil 3: Generik untuk pengadaan/paket (contoh: kemitraan/distribusi)
    id: 'profil_pengadaan_paket',
    name: 'Profil Pengadaan Paket (Bawaan)',
    companyName: 'NAMA PERUSAHAAN',
    companyTagline: 'TAGLINE PERUSAHAAN',
    invoiceTitleText: 'INVOICE',
    accentColor: '#d97706',
    accentColorDark: '#92400e',
    headerBgColor: '#222933',
    headerPrimaryColor: '#d97706',
    headerSecondaryColor: '#d97706',
    defaultHal: 'Pengadaan Barang/Jasa',
    defaultLampiran: '-',
    salamPembuka: 'Berikut kami sampaikan rincian anggaran pengadaan barang/jasa sesuai kesepakatan:',
    actionLabel: 'pengadaan',
    tableType: 'pengadaan_paket',
    notes: [],
    showSpesifikasi: true,
    defaultSpesifikasi: 'Sesuai dengan ketentuan yang disepakati.',
    signatureOffice: 'Divisi Pengadaan',
    signatureLocation: 'Kota',
    signatureRole: 'Manajer',
    signatureName: 'NAMA PENANDATANGAN',
    showBankInfo: false,
    bankName: '',
    bankAccountNo: '',
    bankAccountOwner: '',
    headerType: 'logo_text',
    tableColumns: [
      { key: 'book_title', label: 'Nama Item', type: 'text', align: 'left' },
      { key: 'package_name', label: 'Nama Paket', type: 'text', align: 'center', width: '120px' },
      { key: 'quantity', label: 'Qty', type: 'number', align: 'center', width: '80px' },
      { key: 'price', label: 'Harga Paket', type: 'currency', align: 'right', width: '110px' },
      { key: 'total', label: 'Total', type: 'formula', align: 'right', width: '110px', formula: '{price} * {quantity}' }
    ]
  }
];

interface InvoiceContextType {
  customer: Partial<Contact>;
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
  setCustomer: (customer: Partial<Contact> | ((prev: Partial<Contact>) => Partial<Contact>)) => void;
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
  const [activeProfileId, setActiveProfileIdState] = useState<string>(defaultProfiles[0]?.id ?? '');

  const [invoiceType, setInvoiceType] = useState<string>(defaultProfiles[0]?.id ?? '');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceHal, setInvoiceHal] = useState('');
  const [invoiceLampiran, setInvoiceLampiran] = useState('-');
  const [invoiceDate, setInvoiceDate] = useState(getIndonesianDate());
  const [paymentStatus, setPaymentStatus] = useState('LUNAS');
  const [spesifikasiFasilitas, setSpesifikasiFasilitas] = useState('Sesuai poster paket yang diambil');
  const [bankAccountInfo, setBankAccountInfo] = useState('');

  // Helper to evaluate dynamic formulas
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

  const setCustomer = (customerOrUpdater: Partial<Contact> | ((prev: Partial<Contact>) => Partial<Contact>)) => {
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
