import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { AppState, Book, Contact, Invoice, File, Service } from '../types';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface GDriveAccount {
  email: string;
  name: string;
  token: string;
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}

export interface WatchFolder {
  id?: number;
  path: string;
  created_at: string;
}

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
  fileCategory: 'all' | 'invoice' | 'service' | 'other' | 'gdrive' | 'pdf' | 'spreadsheet' | 'text' | 'image' | 'presentation';
  setFileCategory: (category: 'all' | 'invoice' | 'service' | 'other' | 'gdrive' | 'pdf' | 'spreadsheet' | 'text' | 'image' | 'presentation') => void;
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
  activeSettingsTab: 'invoice' | 'services' | 'local-folders' | 'google-drive';
  setActiveSettingsTab: (tab: 'invoice' | 'services' | 'local-folders' | 'google-drive') => void;
  confirmOptions: ConfirmOptions | null;
  showConfirm: (options: ConfirmOptions) => void;
  hideConfirm: () => void;
  currentFolderId: string;
  setCurrentFolderId: (id: string) => void;
  folderHistory: string[];
  folderHistoryIndex: number;
  fileLayoutMode: 'list' | 'grid';
  setFileLayoutMode: (mode: 'list' | 'grid') => void;
  navigateFolder: (folderId: string) => void;
  navigateBack: () => void;
  navigateForward: () => void;
  canNavigateBack: boolean;
  canNavigateForward: boolean;
  connectedUser: { name: string, email: string } | null;
  setConnectedUser: (user: { name: string, email: string } | null) => void;
  testConnection: (token: string) => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  gdriveAccounts: GDriveAccount[];
  setGdriveAccounts: (accounts: GDriveAccount[]) => void;
  refreshAccountToken: (email: string) => Promise<string | null>;
  watchFolders: WatchFolder[];
  loadWatchFolders: () => Promise<void>;
  addWatchFolder: (path: string) => Promise<string>;
  removeWatchFolder: (id: number) => Promise<void>;
  addFileTag: (fileId: number, tag: string) => Promise<void>;
  removeFileTag: (fileId: number, tag: string) => Promise<void>;
  getFileTags: (fileId: number) => Promise<string[]>;
  getAllTags: () => Promise<string[]>;
  getAllFileTags: () => Promise<Record<number, string[]>>;
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
  const [fileCategory, setFileCategory] = useState<'all' | 'invoice' | 'service' | 'other' | 'gdrive' | 'pdf' | 'spreadsheet' | 'text' | 'image' | 'presentation'>('all');
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'invoice' | 'services' | 'local-folders' | 'google-drive'>('invoice');

  const rootFolderId = localStorage.getItem('gdrive_parent_folder_id') || 'root';
  const [currentFolderId, setCurrentFolderId] = useState<string>(rootFolderId);
  const [folderHistory, setFolderHistory] = useState<string[]>([rootFolderId]);
  const [folderHistoryIndex, setFolderHistoryIndex] = useState<number>(0);
  const [fileLayoutMode, setFileLayoutMode] = useState<'list' | 'grid'>('list');
  const [connectedUser, setConnectedUser] = useState<{ name: string, email: string } | null>(null);
  const [watchFolders, setWatchFolders] = useState<WatchFolder[]>([]);
  const [gdriveAccounts, setGdriveAccountsState] = useState<GDriveAccount[]>(() => {
    try {
      const saved = localStorage.getItem('gdrive_accounts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const gdriveAccountsRef = useRef<GDriveAccount[]>(gdriveAccounts);
  useEffect(() => {
    gdriveAccountsRef.current = gdriveAccounts;
  }, [gdriveAccounts]);

  const setGdriveAccounts = (accounts: GDriveAccount[]) => {
    setGdriveAccountsState(accounts);
    localStorage.setItem('gdrive_accounts', JSON.stringify(accounts));
  };

  const exchangeCodeForToken = async (code: string) => {
    const clientId = localStorage.getItem('gdrive_client_id') || '935478440552-k48b61cglp06gskchsc7qg6l2i1pkhn1.apps.googleusercontent.com';
    const clientSecret = localStorage.getItem('gdrive_client_secret') || '';
    const port = 50007;

    showToast('Menukar kode otorisasi...', 'info');
    try {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: `http://localhost:${port}`,
          grant_type: 'authorization_code'
        })
      });

      if (res.ok) {
        const data = await res.json();
        const accessToken = data.access_token;
        const refreshToken = data.refresh_token || '';

        const profileRes = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const email = profileData.user.emailAddress;
          const name = profileData.user.displayName;

          const currentAccounts = gdriveAccountsRef.current;
          const existingAccIdx = currentAccounts.findIndex(acc => acc.email === email);
          let updatedAccounts = [...currentAccounts];

          if (existingAccIdx > -1) {
            const existingAcc = currentAccounts[existingAccIdx];
            updatedAccounts[existingAccIdx] = {
              ...existingAcc,
              name,
              token: accessToken,
              refreshToken: refreshToken || existingAcc.refreshToken,
              clientId,
              clientSecret
            };
          } else {
            updatedAccounts.push({
              email,
              name,
              token: accessToken,
              refreshToken: refreshToken,
              clientId,
              clientSecret
            });
          }

          setGdriveAccounts(updatedAccounts);

          // Set akun default
          localStorage.setItem('gdrive_token', accessToken);
          if (refreshToken) {
            localStorage.setItem('gdrive_refresh_token', refreshToken);
          }
          localStorage.setItem('gdrive_client_id', clientId);
          localStorage.setItem('gdrive_client_secret', clientSecret);

          setConnectedUser({ name, email });
          showToast(`Akun ${email} berhasil dihubungkan!`, 'success');
        } else {
          showToast('Gagal mendapatkan profil pengguna Google', 'error');
        }
      } else {
        const errData = await res.json();
        console.error('Exchange token error:', errData);
        showToast(`Gagal menukar kode otorisasi: ${errData.error_description || errData.error}`, 'error');
      }
    } catch (err: any) {
      console.error('Exchange token error:', err);
      showToast(`Error penukaran token: ${err.message || err}`, 'error');
    }
  };

  const testConnection = async (currentToken: string) => {
    if (!currentToken) {
      setConnectedUser(null);
      return;
    }
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setConnectedUser({
          name: data.user.displayName,
          email: data.user.emailAddress
        });
      } else {
        setConnectedUser(null);
      }
    } catch (err) {
      console.error('Gagal menghubungkan Google API:', err);
      setConnectedUser(null);
    }
  };

  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  const refreshAccountToken = async (email: string): Promise<string | null> => {
    const currentAccounts = gdriveAccountsRef.current;
    const account = currentAccounts.find(acc => acc.email === email);
    if (!account) return null;

    try {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: account.clientId,
          client_secret: account.clientSecret,
          refresh_token: account.refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (res.ok) {
        const data = await res.json();
        const newAccessToken = data.access_token;
        
        const updatedAccounts = currentAccounts.map(acc => {
          if (acc.email === email) {
            return { ...acc, token: newAccessToken };
          }
          return acc;
        });
        setGdriveAccounts(updatedAccounts);

        const defaultToken = localStorage.getItem('gdrive_token');
        const defaultEmail = connectedUser?.email;
        if (defaultEmail === email || !defaultToken) {
          localStorage.setItem('gdrive_token', newAccessToken);
          setConnectedUser({ name: account.name, email: account.email });
        }
        
        return newAccessToken;
      }
    } catch (e) {
      console.error(`Gagal refresh token untuk ${email}:`, e);
    }
    return null;
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const defaultEmail = connectedUser?.email;
    const currentAccounts = gdriveAccountsRef.current;
    if (defaultEmail && currentAccounts.some(acc => acc.email === defaultEmail)) {
      refreshPromiseRef.current = refreshAccountToken(defaultEmail);
      const res = await refreshPromiseRef.current;
      refreshPromiseRef.current = null;
      return res;
    }

    const refreshToken = localStorage.getItem('gdrive_refresh_token');
    const clientId = localStorage.getItem('gdrive_client_id');
    const clientSecret = localStorage.getItem('gdrive_client_secret');

    if (!refreshToken || !clientId || !clientSecret) {
      return null;
    }

    const runRefresh = async (): Promise<string | null> => {
      try {
        const res = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
          })
        });

        if (res.ok) {
          const data = await res.json();
          const newAccessToken = data.access_token;
          localStorage.setItem('gdrive_token', newAccessToken);
          
          await testConnection(newAccessToken);
          return newAccessToken;
        } else {
          console.error('Respon Google OAuth refresh gagal:', res.status);
          return null;
        }
      } catch (err) {
        console.error('Gagal melakukan refresh token:', err);
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    };

    refreshPromiseRef.current = runRefresh();
    return refreshPromiseRef.current;
  };

  useEffect(() => {
    const initConnection = async () => {
      const token = localStorage.getItem('gdrive_token');
      if (token) {
        try {
          const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setConnectedUser({
              name: data.user.displayName,
              email: data.user.emailAddress
            });
          } else if (res.status === 401) {
            await refreshAccessToken();
          }
        } catch {
          await refreshAccessToken();
        }
      }
    };
    initConnection();
  }, []);

  useEffect(() => {
    const rootId = localStorage.getItem('gdrive_parent_folder_id') || 'root';
    setCurrentFolderId(rootId);
    setFolderHistory([rootId]);
    setFolderHistoryIndex(0);
  }, [fileCategory]);

  const navigateFolder = (folderId: string) => {
    const newHistory = folderHistory.slice(0, folderHistoryIndex + 1);
    newHistory.push(folderId);
    setFolderHistory(newHistory);
    setFolderHistoryIndex(newHistory.length - 1);
    setCurrentFolderId(folderId);
  };

  const navigateBack = () => {
    if (folderHistoryIndex > 0) {
      const newIndex = folderHistoryIndex - 1;
      setFolderHistoryIndex(newIndex);
      setCurrentFolderId(folderHistory[newIndex]);
    }
  };

  const navigateForward = () => {
    if (folderHistoryIndex < folderHistory.length - 1) {
      const newIndex = folderHistoryIndex + 1;
      setFolderHistoryIndex(newIndex);
      setCurrentFolderId(folderHistory[newIndex]);
    }
  };

  const canNavigateBack = folderHistoryIndex > 0;
  const canNavigateForward = folderHistoryIndex < folderHistory.length - 1;

  const showConfirm = (options: ConfirmOptions) => {
    setConfirmOptions(options);
  };

  const hideConfirm = () => {
    setConfirmOptions(null);
  };

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let unlistenLocal: (() => void) | undefined;
    const init = async () => {
      try {
        await invoke('init_database');
        await loadBooks();
        await loadContacts();
        await loadInvoices();
        await loadFiles();
        await loadServices();
        await loadWatchFolders();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };
    init();

    const setupListener = async () => {
      try {
        unlisten = await listen<string>('gdrive-oauth-code', async (event) => {
          const code = event.payload;
          if (code) {
            await exchangeCodeForToken(code);
          }
        });
        unlistenLocal = await listen<void>('local-files-changed', async () => {
          await loadFiles();
        });
      } catch (err) {
        console.error('Gagal memasang event listener oauth:', err);
      }
    };
    setupListener();

    return () => {
      if (unlisten) unlisten();
      if (unlistenLocal) unlistenLocal();
    };
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

  const loadWatchFolders = async () => {
    try {
      const data = await invoke<WatchFolder[]>('get_watch_folders');
      setWatchFolders(data);
    } catch (error) {
      console.error('Failed to load watch folders:', error);
    }
  };

  const addWatchFolder = async (path: string) => {
    const result = await invoke<string>('add_watch_folder', { path });
    await loadWatchFolders();
    await loadFiles();
    return result;
  };

  const removeWatchFolder = async (id: number) => {
    await invoke('remove_watch_folder', { id });
    await loadWatchFolders();
    await loadFiles();
  };

  const addFileTag = async (fileId: number, tag: string) => {
    await invoke('add_file_tag', { fileId, tag });
  };

  const removeFileTag = async (fileId: number, tag: string) => {
    await invoke('remove_file_tag', { fileId, tag });
  };

  const getFileTags = async (fileId: number): Promise<string[]> => {
    return await invoke<string[]>('get_file_tags', { fileId });
  };

  const getAllTags = async (): Promise<string[]> => {
    return await invoke<string[]>('get_all_tags');
  };

  const getAllFileTags = async (): Promise<Record<number, string[]>> => {
    return await invoke<Record<number, string[]>>('get_all_file_tags');
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
      confirmOptions,
      showConfirm,
      hideConfirm,
      currentFolderId,
      setCurrentFolderId,
      folderHistory,
      folderHistoryIndex,
      fileLayoutMode,
      setFileLayoutMode,
      navigateFolder,
      navigateBack,
      navigateForward,
      canNavigateBack,
      canNavigateForward,
      activeSettingsTab,
      setActiveSettingsTab,
      connectedUser,
      setConnectedUser,
      testConnection,
      refreshAccessToken,
      gdriveAccounts,
      setGdriveAccounts,
      refreshAccountToken,
      watchFolders,
      loadWatchFolders,
      addWatchFolder,
      removeWatchFolder,
      addFileTag,
      removeFileTag,
      getFileTags,
      getAllTags,
      getAllFileTags,
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
