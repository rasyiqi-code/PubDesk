import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Penulis, Penerbit, Naskah, Tim, Legalitas } from '../types/data-master.types';

interface DataMasterContextType {
  penulis: Penulis[];
  penerbit: Penerbit[];
  naskah: Naskah[];
  tim: Tim[];
  loadPenulis: () => Promise<void>;
  loadPenerbit: () => Promise<void>;
  loadNaskah: () => Promise<void>;
  loadTim: () => Promise<void>;
  addPenulis: (p: Omit<Penulis, 'created_at'>) => Promise<number>;
  updatePenulis: (p: Penulis) => Promise<void>;
  deletePenulis: (id: number) => Promise<void>;
  addPenerbit: (p: Omit<Penerbit, 'created_at'>) => Promise<number>;
  updatePenerbit: (p: Penerbit) => Promise<void>;
  deletePenerbit: (id: number) => Promise<void>;
  addNaskah: (n: Omit<Naskah, 'status' | 'created_at'>) => Promise<number>;
  updateNaskah: (n: Naskah) => Promise<void>;
  deleteNaskah: (id: number) => Promise<void>;
  addTim: (l: Omit<Tim, 'created_at'>) => Promise<number>;
  updateTim: (l: Tim) => Promise<void>;
  deleteTim: (id: number) => Promise<void>;
  legalitas: Legalitas[];
  loadLegalitas: () => Promise<void>;
  addLegalitas: (l: Omit<Legalitas, 'created_at'>) => Promise<number>;
  updateLegalitas: (l: Legalitas) => Promise<void>;
  deleteLegalitas: (id: number) => Promise<void>;
}

const DataMasterContext = createContext<DataMasterContextType | undefined>(undefined);

export const DataMasterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [penulis, setPenulis] = useState<Penulis[]>([]);
  const [penerbit, setPenerbit] = useState<Penerbit[]>([]);
  const [naskah, setNaskah] = useState<Naskah[]>([]);
  const [tim, setTim] = useState<Tim[]>([]);
  const [legalitas, setLegalitas] = useState<Legalitas[]>([]);

  const loadLegalitas = async () => {
    try {
      const data = await invoke<Legalitas[]>('get_legalitas');
      setLegalitas(data);
    } catch (err) {
      console.error('Gagal memuat data legalitas:', err);
    }
  };

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

  const loadNaskah = async () => {
    try {
      const data = await invoke<Naskah[]>('get_naskah');
      setNaskah(data);
    } catch (err) {
      console.error('Gagal memuat data naskah:', err);
    }
  };

  const loadTim = async () => {
    try {
      const data = await invoke<Tim[]>('get_tim');
      setTim(data);
    } catch (err) {
      console.error('Gagal memuat data tim:', err);
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

  const addNaskah = async (n: Omit<Naskah, 'status' | 'created_at'>) => {
    try {
      const payload = {
        ...n,
        status: 'Belum Dimulai',
        created_at: new Date().toISOString()
      };
      const id = await invoke<number>('add_naskah', { order: payload });
      await loadNaskah();
      return id;
    } catch (err) {
      console.error('Gagal menambah naskah:', err);
      return 0;
    }
  };

  const updateNaskah = async (n: Naskah) => {
    try {
      await invoke('update_naskah', { order: n });
      await loadNaskah();
    } catch (err) {
      console.error('Gagal mengupdate naskah:', err);
    }
  };

  const deleteNaskah = async (id: number) => {
    try {
      await invoke('delete_naskah', { id });
      await loadNaskah();
    } catch (err) {
      console.error('Gagal menghapus naskah:', err);
    }
  };

  const addTim = async (l: Omit<Tim, 'created_at'>) => {
    try {
      const payload = {
        ...l,
        created_at: new Date().toISOString()
      };
      const id = await invoke<number>('add_tim', { tim: payload });
      await loadTim();
      return id;
    } catch (err) {
      console.error('Gagal menambah tim:', err);
      return 0;
    }
  };

  const updateTim = async (l: Tim) => {
    try {
      await invoke('update_tim', { tim: l });
      await loadTim();
    } catch (err) {
      console.error('Gagal mengupdate tim:', err);
    }
  };

  const deleteTim = async (id: number) => {
    try {
      await invoke('delete_tim', { id });
      await loadTim();
    } catch (err) {
      console.error('Gagal menghapus tim:', err);
    }
  };

  const addLegalitas = async (l: Omit<Legalitas, 'created_at'>) => {
    try {
      const payload = {
        ...l,
        created_at: new Date().toISOString()
      };
      const id = await invoke<number>('add_legalitas', { legalitas: payload });
      await loadLegalitas();
      return id;
    } catch (err) {
      console.error('Gagal menambah legalitas:', err);
      return 0;
    }
  };

  const updateLegalitas = async (l: Legalitas) => {
    try {
      await invoke('update_legalitas', { legalitas: l });
      await loadLegalitas();
    } catch (err) {
      console.error('Gagal mengupdate legalitas:', err);
    }
  };

  const deleteLegalitas = async (id: number) => {
    try {
      await invoke('delete_legalitas', { id });
      await loadLegalitas();
    } catch (err) {
      console.error('Gagal menghapus legalitas:', err);
    }
  };

  useEffect(() => {
    loadPenulis();
    loadPenerbit();
    loadNaskah();
    loadTim();
    loadLegalitas();
  }, []);

  return (
    <DataMasterContext.Provider
      value={{
        penulis,
        penerbit,
        naskah,
        tim,
        legalitas,
        loadPenulis,
        loadPenerbit,
        loadNaskah,
        loadTim,
        loadLegalitas,
        addPenulis,
        updatePenulis,
        deletePenulis,
        addPenerbit,
        updatePenerbit,
        deletePenerbit,
        addNaskah,
        updateNaskah,
        deleteNaskah,
        addTim,
        updateTim,
        deleteTim,
        addLegalitas,
        updateLegalitas,
        deleteLegalitas,
      }}
    >
      {children}
    </DataMasterContext.Provider>
  );
};

export const useDataMasterContext = () => {
  const context = useContext(DataMasterContext);
  if (context === undefined) {
    throw new Error('useDataMasterContext must be used within a DataMasterProvider');
  }
  return context;
};
