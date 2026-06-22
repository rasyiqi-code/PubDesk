import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState } from '../types/app.types';
import { Book } from '../types/book.types';
import { Contact } from '../types/contact.types';
import { Invoice } from '../types/invoice.types';
import { File } from '../types/file.types';
import { Service } from '../types/service.types';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// Import hooks
import { useUIState, ConfirmOptions, ImportExportActions } from '../hooks/useUIState';
import { useBookState } from '../hooks/useBookState';
import { useContactState } from '../hooks/useContactState';
import { useInvoiceState } from '../hooks/useInvoiceState';
import { useServiceState } from '../hooks/useServiceState';
import { useFileState } from '../hooks/useFileState';
import { useGDriveState, GDriveAccount } from '../hooks/useGDriveState';
import { useSyncState } from '../hooks/useSyncState';

export type { ConfirmOptions, ImportExportActions, GDriveAccount };

export interface WatchFolder {
  id?: number;
  path: string;
  created_at: string;
}

export interface DiscoveredPeer {
  peer_id: string;
  addresses: string[];
}

export interface P2PConnectionInfo {
  is_connected: boolean;
  peer_id: string;
  active_peers: string[];
  local_addresses: string[];
  discovered_peers: DiscoveredPeer[];
  role: string;
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
  updateContact: (contact: Contact) => Promise<void>;
  deleteContact: (id: number) => Promise<void>;
  addInvoice: (invoice: Invoice) => Promise<number>;
  updateInvoice: (invoice: Invoice) => Promise<void>;
  deleteInvoice: (id: number) => Promise<void>;
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
  activeSettingsTab: 'invoice' | 'local-folders' | 'p2p-connection' | 'google-drive' | 'google-apps-script' | 'data-reset';
  setActiveSettingsTab: (tab: 'invoice' | 'local-folders' | 'google-drive' | 'google-apps-script' | 'data-reset') => void;
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
  navigateModuleBack: () => void;
  navigateModuleForward: () => void;
  canNavigateModuleBack: boolean;
  canNavigateModuleForward: boolean;
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
  selectedInsightMetric: 'total' | 'lunas' | 'belum_lunas' | 'bermasalah' | 'dp' | null;
  setSelectedInsightMetric: (metric: 'total' | 'lunas' | 'belum_lunas' | 'bermasalah' | 'dp' | null) => void;
  editingCustomer: Contact | null;
  setEditingCustomer: (customer: Contact | null) => void;
  selectedCustomerId: number | null;
  setSelectedCustomerId: (id: number | null) => void;
  selectedPenulisId: number | null;
  setSelectedPenulisId: (id: number | null) => void;
  selectedPenerbitId: number | null;
  setSelectedPenerbitId: (id: number | null) => void;
  selectedNaskahId: number | null;
  setSelectedNaskahId: (id: number | null) => void;
  selectedTimId: number | null;
  setSelectedTimId: (id: number | null) => void;
  selectedLegalitasId: number | null;
  setSelectedLegalitasId: (id: number | null) => void;
  selectedTaskId: number | null;
  setSelectedTaskId: (id: number | null) => void;
  importExportActions: Record<string, ImportExportActions>;
  registerImportExportActions: (module: string, actions: ImportExportActions | null) => void;
  updateSyncStatus: (tableName: string, id: number, syncStatus: string, cloudFileUrl?: string) => Promise<void>;
  syncAllDataToCloud: (dataMaster: {
    penulis: any[];
    penerbit: any[];
    naskah: any[];
    tim: any[];
    legalitas: any[];
    services: any[];
    tasks: any[];
  }) => Promise<{ success: boolean; message: string }>;
  syncModuleDataToCloud: (moduleName: string, dataMaster: {
    penulis: any[];
    penerbit: any[];
    naskah: any[];
    tim: any[];
    legalitas: any[];
    services: any[];
    tasks: any[];
  }) => Promise<{ success: boolean; message: string }>;
  directAddNewModule: string | null;
  setDirectAddNewModule: (module: string | null) => void;
  isDbInitialized: boolean;
  p2pConnectionInfo: P2PConnectionInfo | null;
  discoveredPeers: DiscoveredPeer[];
  setDiscoveredPeers: (peers: DiscoveredPeer[]) => void;
}


const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const ui = useUIState();
  const [fileCategory, setFileCategory] = useState<'all' | 'invoice' | 'service' | 'other' | 'gdrive' | 'pdf' | 'spreadsheet' | 'text' | 'image' | 'presentation'>('all');
  const [directAddNewModule, setDirectAddNewModule] = useState<string | null>(null);
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [discoveredPeers, setDiscoveredPeers] = useState<DiscoveredPeer[]>([]);
  const [p2pConnectionInfo] = useState<P2PConnectionInfo | null>(null);


  const booksState = useBookState({ showToast: ui.showToast });
  const contactsState = useContactState({ showToast: ui.showToast });
  const invoicesState = useInvoiceState({ showToast: ui.showToast });
  const servicesState = useServiceState({ 
    showToast: ui.showToast, 
    selectedServiceId: ui.selectedServiceId, 
    setSelectedServiceId: ui.setSelectedServiceId 
  });
  const filesState = useFileState({ 
    showToast: ui.showToast, 
    selectedFileId: ui.selectedFileId, 
    setSelectedFileId: ui.setSelectedFileId 
  });
  const gdriveState = useGDriveState({ 
    showToast: ui.showToast, 
    fileCategory 
  });
  const syncState = useSyncState({
    contacts: contactsState.contacts,
    loadContacts: contactsState.loadContacts,
    books: booksState.books,
    loadBooks: booksState.loadBooks,
    services: servicesState.services,
    loadServices: servicesState.loadServices,
    files: filesState.files,
    loadFiles: filesState.loadFiles,
    invoices: invoicesState.invoices,
    loadInvoices: invoicesState.loadInvoices
  });

  useEffect(() => {
    const init = async () => {
      try {
        await invoke('init_database');
        setIsDbInitialized(true);
        await booksState.loadBooks();
        await contactsState.loadContacts();
        await invoicesState.loadInvoices();
        await filesState.loadFiles();
        await servicesState.loadServices();
        await filesState.loadWatchFolders();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };
    init();

    const unlistenPromises: Promise<() => void>[] = [];

    const setupListeners = async () => {
      try {
        const u1 = listen<string>('gdrive-oauth-code', async (event) => {
          const code = event.payload;
          if (code) {
            await gdriveState.exchangeCodeForToken(code);
          }
        });
        unlistenPromises.push(u1);

        const u2 = listen<void>('local-files-changed', async () => {
          await filesState.loadFiles();
        });
        unlistenPromises.push(u2);

        const u3 = listen<DiscoveredPeer>('p2p-peer-discovered', (event) => {
          setDiscoveredPeers(prev => {
            const existing = prev.find(p => p.peer_id === event.payload.peer_id);
            if (existing) {
              return prev.map(p =>
                p.peer_id === event.payload.peer_id ? { ...p, addresses: [...new Set([...p.addresses, ...event.payload.addresses])] } : p
              );
            }
            return [...prev, event.payload];
          });
        });
        unlistenPromises.push(u3);

        const u4 = listen<DiscoveredPeer>('p2p-peer-expired', (event) => {
          setDiscoveredPeers(prev => prev.filter(p => p.peer_id !== event.payload.peer_id));
        });
        unlistenPromises.push(u4);

      } catch (err) {
        console.error('Gagal memasang event listener:', err);
      }
    };
    setupListeners();

    return () => {
      Promise.all(unlistenPromises).then(unlisteners => {
        unlisteners.forEach(fn => fn());
      });
    };
  }, []);

  return (
    <AppContext.Provider value={{
      appState: ui.appState,
      setActiveModule: ui.setActiveModule,
      books: booksState.books,
      contacts: contactsState.contacts,
      invoices: invoicesState.invoices,
      files: filesState.files,
      services: servicesState.services,
      toast: ui.toast,
      selectedFileId: ui.selectedFileId,
      setSelectedFileId: ui.setSelectedFileId,
      showToast: ui.showToast,
      fileCategory,
      setFileCategory,
      loadBooks: booksState.loadBooks,
      loadContacts: contactsState.loadContacts,
      loadInvoices: invoicesState.loadInvoices,
      loadFiles: filesState.loadFiles,
      loadServices: servicesState.loadServices,
      addBook: booksState.addBook,
      deleteBook: booksState.deleteBook,
      updateBook: booksState.updateBook,
      addContact: contactsState.addContact,
      updateContact: contactsState.updateContact,
      deleteContact: contactsState.deleteContact,
      editingCustomer: ui.editingCustomer,
      setEditingCustomer: ui.setEditingCustomer,
      selectedCustomerId: ui.selectedCustomerId,
      setSelectedCustomerId: ui.setSelectedCustomerId,
      selectedPenulisId: ui.selectedPenulisId,
      setSelectedPenulisId: ui.setSelectedPenulisId,
      selectedPenerbitId: ui.selectedPenerbitId,
      setSelectedPenerbitId: ui.setSelectedPenerbitId,
      selectedNaskahId: ui.selectedNaskahId,
      setSelectedNaskahId: ui.setSelectedNaskahId,
      selectedTimId: ui.selectedTimId,
      setSelectedTimId: ui.setSelectedTimId,
      selectedLegalitasId: ui.selectedLegalitasId,
      setSelectedLegalitasId: ui.setSelectedLegalitasId,
      selectedTaskId: ui.selectedTaskId,
      setSelectedTaskId: ui.setSelectedTaskId,
      addInvoice: invoicesState.addInvoice,
      updateInvoice: invoicesState.updateInvoice,
      deleteInvoice: invoicesState.deleteInvoice,
      addFile: filesState.addFile,
      deleteFile: filesState.deleteFile,
      updateFile: filesState.updateFile,
      addService: servicesState.addService,
      updateService: servicesState.updateService,
      deleteService: servicesState.deleteService,
      rightPanelVisible: ui.rightPanelVisible,
      setRightPanelVisible: ui.setRightPanelVisible,
      selectedBookId: ui.selectedBookId,
      setSelectedBookId: ui.setSelectedBookId,
      selectedServiceId: ui.selectedServiceId,
      setSelectedServiceId: ui.setSelectedServiceId,
      confirmOptions: ui.confirmOptions,
      showConfirm: ui.showConfirm,
      hideConfirm: ui.hideConfirm,
      currentFolderId: gdriveState.currentFolderId,
      setCurrentFolderId: gdriveState.setCurrentFolderId,
      folderHistory: gdriveState.folderHistory,
      folderHistoryIndex: gdriveState.folderHistoryIndex,
      fileLayoutMode: ui.fileLayoutMode,
      setFileLayoutMode: ui.setFileLayoutMode,
      navigateFolder: gdriveState.navigateFolder,
      navigateBack: gdriveState.navigateBack,
      navigateForward: gdriveState.navigateForward,
      canNavigateBack: gdriveState.canNavigateBack,
      canNavigateForward: gdriveState.canNavigateForward,
      navigateModuleBack: ui.navigateModuleBack,
      navigateModuleForward: ui.navigateModuleForward,
      canNavigateModuleBack: ui.canNavigateModuleBack,
      canNavigateModuleForward: ui.canNavigateModuleForward,
      activeSettingsTab: ui.activeSettingsTab,
      setActiveSettingsTab: ui.setActiveSettingsTab,
      connectedUser: gdriveState.connectedUser,
      setConnectedUser: gdriveState.setConnectedUser,
      testConnection: gdriveState.testConnection,
      refreshAccessToken: gdriveState.refreshAccessToken,
      gdriveAccounts: gdriveState.gdriveAccounts,
      setGdriveAccounts: gdriveState.setGdriveAccounts,
      refreshAccountToken: gdriveState.refreshAccountToken,
      watchFolders: filesState.watchFolders,
      loadWatchFolders: filesState.loadWatchFolders,
      addWatchFolder: filesState.addWatchFolder,
      removeWatchFolder: filesState.removeWatchFolder,
      addFileTag: filesState.addFileTag,
      removeFileTag: filesState.removeFileTag,
      getFileTags: filesState.getFileTags,
      getAllTags: filesState.getAllTags,
      getAllFileTags: filesState.getAllFileTags,
      selectedInsightMetric: ui.selectedInsightMetric,
      setSelectedInsightMetric: ui.setSelectedInsightMetric,
      importExportActions: ui.importExportActions,
      registerImportExportActions: ui.registerImportExportActions,
      updateSyncStatus: syncState.updateSyncStatus,
      syncAllDataToCloud: syncState.syncAllDataToCloud,
      syncModuleDataToCloud: syncState.syncModuleDataToCloud,
      directAddNewModule,
      setDirectAddNewModule,
      isDbInitialized,
      p2pConnectionInfo,
      discoveredPeers,
      setDiscoveredPeers,
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
