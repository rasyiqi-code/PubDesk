import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Penulis, Penerbit, NaskahOrder, Layouter } from '../types/crm.types';

interface CrmContextType {
  penulis: Penulis[];
  penerbit: Penerbit[];
  naskahOrders: NaskahOrder[];
  layouters: Layouter[];
  loadPenulis: () => Promise<void>;
  loadPenerbit: () => Promise<void>;
  loadNaskahOrders: () => Promise<void>;
  loadLayouters: () => Promise<void>;
  addPenulis: (p: Omit<Penulis, 'created_at'>) => Promise<number>;
  updatePenulis: (p: Penulis) => Promise<void>;
  deletePenulis: (id: number) => Promise<void>;
  addPenerbit: (p: Omit<Penerbit, 'created_at'>) => Promise<number>;
  updatePenerbit: (p: Penerbit) => Promise<void>;
  deletePenerbit: (id: number) => Promise<void>;
  addNaskahOrder: (n: Omit<NaskahOrder, 'status' | 'created_at'>) => Promise<number>;
  updateNaskahOrder: (n: NaskahOrder) => Promise<void>;
  deleteNaskahOrder: (id: number) => Promise<void>;
  addLayouter: (l: Omit<Layouter, 'created_at'>) => Promise<number>;
  updateLayouter: (l: Layouter) => Promise<void>;
  deleteLayouter: (id: number) => Promise<void>;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

export const CrmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [penulis, setPenulis] = useState<Penulis[]>([]);
  const [penerbit, setPenerbit] = useState<Penerbit[]>([]);
  const [naskahOrders, setNaskahOrders] = useState<NaskahOrder[]>([]);
  const [layouters, setLayouters] = useState<Layouter[]>([]);

  const loadPenulis = async () => {
    try {
      const data = await invoke<Penulis[]>('get_penulis');
      setPenulis(data);
    } catch (err) {
      console.error('Gagal memuat data penulis:', err);
    }
  };

  const loadPenerbit = async () => {
    try {
      const data = await invoke<Penerbit[]>('get_penerbit');
      setPenerbit(data);
    } catch (err) {
      console.error('Gagal memuat data penerbit:', err);
    }
  };

  const loadNaskahOrders = async () => {
    try {
      const data = await invoke<NaskahOrder[]>('get_naskah_orders');
      setNaskahOrders(data);
    } catch (err) {
      console.error('Gagal memuat data naskah order:', err);
    }
  };

  const loadLayouters = async () => {
    try {
      const data = await invoke<Layouter[]>('get_layouters');
      setLayouters(data);
    } catch (err) {
      console.error('Gagal memuat data layouter:', err);
    }
  };

  const addPenulis = async (p: Omit<Penulis, 'created_at'>) => {
    try {
      const payload = {
        ...p,
        created_at: new Date().toISOString()
      };
      const id = await invoke<number>('add_penulis', { penulis: payload });
      await loadPenulis();
      return id;
    } catch (err) {
      console.error('Gagal menambah penulis:', err);
      return 0;
    }
  };

  const updatePenulis = async (p: Penulis) => {
    try {
      await invoke('update_penulis', { penulis: p });
      await loadPenulis();
    } catch (err) {
      console.error('Gagal mengupdate penulis:', err);
    }
  };

  const deletePenulis = async (id: number) => {
    try {
      await invoke('delete_penulis', { id });
      await loadPenulis();
    } catch (err) {
      console.error('Gagal menghapus penulis:', err);
    }
  };

  const addPenerbit = async (p: Omit<Penerbit, 'created_at'>) => {
    try {
      const payload = {
        ...p,
        created_at: new Date().toISOString()
      };
      const id = await invoke<number>('add_penerbit', { penerbit: payload });
      await loadPenerbit();
      return id;
    } catch (err) {
      console.error('Gagal menambah penerbit:', err);
      return 0;
    }
  };

  const updatePenerbit = async (p: Penerbit) => {
    try {
      await invoke('update_penerbit', { penerbit: p });
      await loadPenerbit();
    } catch (err) {
      console.error('Gagal mengupdate penerbit:', err);
    }
  };

  const deletePenerbit = async (id: number) => {
    try {
      await invoke('delete_penerbit', { id });
      await loadPenerbit();
    } catch (err) {
      console.error('Gagal menghapus penerbit:', err);
    }
  };

  const addNaskahOrder = async (n: Omit<NaskahOrder, 'status' | 'created_at'>) => {
    try {
      const payload = {
        ...n,
        status: 'Belum Dimulai',
        created_at: new Date().toISOString()
      };
      const id = await invoke<number>('add_naskah_order', { order: payload });
      await loadNaskahOrders();
      return id;
    } catch (err) {
      console.error('Gagal menambah naskah order:', err);
      return 0;
    }
  };

  const updateNaskahOrder = async (n: NaskahOrder) => {
    try {
      await invoke('update_naskah_order', { order: n });
      await loadNaskahOrders();
    } catch (err) {
      console.error('Gagal mengupdate naskah order:', err);
    }
  };

  const deleteNaskahOrder = async (id: number) => {
    try {
      await invoke('delete_naskah_order', { id });
      await loadNaskahOrders();
    } catch (err) {
      console.error('Gagal menghapus naskah order:', err);
    }
  };

  const addLayouter = async (l: Omit<Layouter, 'created_at'>) => {
    try {
      const payload = {
        ...l,
        created_at: new Date().toISOString()
      };
      const id = await invoke<number>('add_layouter', { layouter: payload });
      await loadLayouters();
      return id;
    } catch (err) {
      console.error('Gagal menambah layouter:', err);
      return 0;
    }
  };

  const updateLayouter = async (l: Layouter) => {
    try {
      await invoke('update_layouter', { layouter: l });
      await loadLayouters();
    } catch (err) {
      console.error('Gagal mengupdate layouter:', err);
    }
  };

  const deleteLayouter = async (id: number) => {
    try {
      await invoke('delete_layouter', { id });
      await loadLayouters();
    } catch (err) {
      console.error('Gagal menghapus layouter:', err);
    }
  };

  useEffect(() => {
    loadPenulis();
    loadPenerbit();
    loadNaskahOrders();
    loadLayouters();
  }, []);

  return (
    <CrmContext.Provider
      value={{
        penulis,
        penerbit,
        naskahOrders,
        layouters,
        loadPenulis,
        loadPenerbit,
        loadNaskahOrders,
        loadLayouters,
        addPenulis,
        updatePenulis,
        deletePenulis,
        addPenerbit,
        updatePenerbit,
        deletePenerbit,
        addNaskahOrder,
        updateNaskahOrder,
        deleteNaskahOrder,
        addLayouter,
        updateLayouter,
        deleteLayouter
      }}
    >
      {children}
    </CrmContext.Provider>
  );
};

export const useCrmContext = () => {
  const context = useContext(CrmContext);
  if (context === undefined) {
    throw new Error('useCrmContext must be used within a CrmProvider');
  }
  return context;
};
