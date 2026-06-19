import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, Book, Contact, Invoice, File, Service } from '../types';
import { invoke } from '@tauri-apps/api/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'primary' | 'danger' | 'warning';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface AppContextType {
  appState: AppState;
  setActiveModule: (module: AppState['activeModule']) => void;
  books: Book[];
  contacts: Contact[];
  invoices: Invoice[];
  files: File[];
  services: Service[];
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  selectedFileId: number | null;
  setSelectedFileId: (id: number | null) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  fileCategory: 'all' | 'invoice' | 'service' | 'other' | 'gdrive';
  setFileCategory: (category: 'all' | 'invoice' | 'service' | 'other' | 'gdrive') => void;
  loadBooks: () => Promise<void>;
  loadContacts: () => Promise<void>;
  loadInvoices: () => Promise<void>;
  loadFiles: () => Promise<void>;
  loadServices: () => Promise<void>;
  addBook: (book: Book) => Promise<number>;
  deleteBook: (id: number) => Promise<void>;
  updateBook: (book: Book) => Promise<void>;
  addContact: (contact: Contact) => Promise<number>;
  addInvoice: (invoice: Invoice) => Promise<number>;
  addFile: (file: File) => Promise<number>;
  deleteFile: (id: number) => Promise<void>;
  updateFile: (file: File) => Promise<void>;
  addService: (service: Service) => Promise<number>;
  updateService: (service: Service) => Promise<void>;
  deleteService: (id: number) => Promise<void>;
  rightPanelVisible: boolean;
  setRightPanelVisible: (visible: boolean) => void;
  selectedBookId: number | null;
  setSelectedBookId: (id: number | null) => void;
  selectedServiceId: number | null;
  setSelectedServiceId: (id: number | null) => void;
  activeSettingsTab: 'invoice' | 'services' | 'general';
  setActiveSettingsTab: (tab: 'invoice' | 'services' | 'general') => void;
  confirmOptions: ConfirmOptions | null;
  showConfirm: (options: ConfirmOptions) => void;
  hideConfirm: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appState, setAppState] = useState<AppState>({
    activeModule: 'invoice'
  });

  const [books, setBooks] = useState<Book[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [fileCategory, setFileCategory] = useState<'all' | 'invoice' | 'service' | 'other' | 'gdrive'>('all');
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'invoice' | 'services' | 'general'>('invoice');
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);

  const showConfirm = (options: ConfirmOptions) => {
    setConfirmOptions(options);
  };

  const hideConfirm = () => {
    setConfirmOptions(null);
  };

  useEffect(() => {
    const init = async () => {
      try {
        await invoke('init_database');
        await loadBooks();
        await loadContacts();
        await loadInvoices();
        await loadFiles();
        await loadServices();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const setActiveModule = (module: AppState['activeModule']) => {
    setAppState(prev => ({ ...prev, activeModule: module }));
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const loadBooks = async () => {
    try {
      const data = await invoke<Book[]>('get_books');
      setBooks(data);
    } catch (error) {
      console.error('Failed to load books:', error);
    }
  };

  const loadContacts = async () => {
    try {
      const data = await invoke<Contact[]>('get_contacts');
      setContacts(data);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  const loadInvoices = async () => {
    try {
      const data = await invoke<Invoice[]>('get_invoices');
      setInvoices(data);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    }
  };

  const loadFiles = async () => {
    try {
      const data = await invoke<File[]>('get_files');
      setFiles(data);
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const addBook = async (book: Book) => {
    const id = await invoke<number>('add_book', { book });
    await loadBooks();
    return id;
  };

  const deleteBook = async (id: number) => {
    await invoke('delete_book', { id });
    await loadBooks();
  };

  const updateBook = async (book: Book) => {
    await invoke('update_book', { book });
    await loadBooks();
  };

  const addContact = async (contact: Contact) => {
    const id = await invoke<number>('add_contact', { contact });
    await loadContacts();
    return id;
  };

  const addInvoice = async (invoice: Invoice) => {
    const id = await invoke<number>('add_invoice', { invoice });
    await loadInvoices();
    return id;
  };

  const addFile = async (file: File) => {
    const id = await invoke<number>('add_file', { file });
    await loadFiles();
    return id;
  };

  const deleteFile = async (id: number) => {
    await invoke('delete_file', { id });
    await loadFiles();
    if (selectedFileId === id) {
      setSelectedFileId(null);
    }
  };

  const updateFile = async (file: File) => {
    await invoke('update_file', { file });
    await loadFiles();
  };

  const loadServices = async () => {
    try {
      const data = await invoke<Service[]>('get_services');
      setServices(data);
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  };

  const addService = async (service: Service) => {
    const id = await invoke<number>('add_service', { service });
    await loadServices();
    return id;
  };

  const updateService = async (service: Service) => {
    await invoke('update_service', { service });
    await loadServices();
  };

  const deleteService = async (id: number) => {
    await invoke('delete_service', { id });
    await loadServices();
    if (selectedServiceId === id) {
      setSelectedServiceId(null);
    }
  };

  return (
    <AppContext.Provider value={{
      appState,
      setActiveModule,
      books,
      contacts,
      invoices,
      files,
      services,
      toast,
      selectedFileId,
      setSelectedFileId,
      showToast,
      fileCategory,
      setFileCategory,
      loadBooks,
      loadContacts,
      loadInvoices,
      loadFiles,
      loadServices,
      addBook,
      deleteBook,
      updateBook,
      addContact,
      addInvoice,
      addFile,
      deleteFile,
      updateFile,
      addService,
      updateService,
      deleteService,
      rightPanelVisible,
      setRightPanelVisible,
      selectedBookId,
      setSelectedBookId,
      selectedServiceId,
      setSelectedServiceId,
      activeSettingsTab,
      setActiveSettingsTab,
      confirmOptions,
      showConfirm,
      hideConfirm,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
