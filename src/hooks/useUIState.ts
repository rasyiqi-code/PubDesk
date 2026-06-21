import { useState, useEffect } from 'react';
import { AppState } from '../types/app.types';
import { Contact } from '../types/contact.types';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'primary' | 'danger' | 'warning';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface ImportExportActions {
  onImport?: () => void | Promise<void>;
  onExport?: () => void | Promise<void>;
  onDownloadTemplate?: () => void | Promise<void>;
  label?: string;
}

export function useUIState() {
  const [appState, setAppState] = useState<AppState>({
    activeModule: 'home'
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);
  const [rightPanelVisible, setRightPanelVisible] = useState(false);
  const [fileLayoutMode, setFileLayoutMode] = useState<'list' | 'grid'>('list');
  const [activeSettingsTab, setActiveSettingsTab] = useState<'invoice' | 'local-folders' | 'google-drive' | 'google-apps-script' | 'data-reset'>('invoice');
  const [selectedInsightMetric, setSelectedInsightMetric] = useState<'total' | 'lunas' | 'belum_lunas' | 'bermasalah' | 'dp' | null>(null);

  // Selection states
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedPenulisId, setSelectedPenulisId] = useState<number | null>(null);
  const [selectedPenerbitId, setSelectedPenerbitId] = useState<number | null>(null);
  const [selectedNaskahId, setSelectedNaskahId] = useState<number | null>(null);
  const [selectedTimId, setSelectedTimId] = useState<number | null>(null);
  const [selectedLegalitasId, setSelectedLegalitasId] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Contact | null>(null);
  
  const [importExportActions, setImportExportActions] = useState<Record<string, ImportExportActions>>({});

  const registerImportExportActions = (module: string, actions: ImportExportActions | null) => {
    setImportExportActions(prev => {
      if (!actions) {
        const next = { ...prev };
        delete next[module];
        return next;
      }
      return { ...prev, [module]: actions };
    });
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const showConfirm = (options: ConfirmOptions) => {
    setConfirmOptions(options);
  };

  const hideConfirm = () => {
    setConfirmOptions(null);
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const [moduleHistory, setModuleHistory] = useState<AppState['activeModule'][]>(['home']);
  const [moduleHistoryIndex, setModuleHistoryIndex] = useState<number>(0);

  const setActiveModuleInternal = (module: AppState['activeModule'], isHistoryNav = false) => {
    setAppState(prev => ({ ...prev, activeModule: module }));
    setSelectedFileId(null);
    setSelectedBookId(null);
    setSelectedServiceId(null);
    setSelectedCustomerId(null);
    setSelectedPenulisId(null);
    setSelectedPenerbitId(null);
    setSelectedNaskahId(null);
    setSelectedTimId(null);
    setSelectedLegalitasId(null);
    if (module !== 'edit-tugas') {
      setSelectedTaskId(null);
    }
    setRightPanelVisible(false);

    if (!isHistoryNav) {
      setModuleHistory(prev => {
        const nextHistory = prev.slice(0, moduleHistoryIndex + 1);
        if (nextHistory[nextHistory.length - 1] !== module) {
          const updated = [...nextHistory, module];
          setModuleHistoryIndex(updated.length - 1);
          return updated;
        }
        return nextHistory;
      });
    }
  };

  const setActiveModule = (module: AppState['activeModule']) => {
    setActiveModuleInternal(module, false);
  };

  const navigateModuleBack = () => {
    if (moduleHistoryIndex > 0) {
      const newIndex = moduleHistoryIndex - 1;
      setModuleHistoryIndex(newIndex);
      setActiveModuleInternal(moduleHistory[newIndex], true);
    }
  };

  const navigateModuleForward = () => {
    if (moduleHistoryIndex < moduleHistory.length - 1) {
      const newIndex = moduleHistoryIndex + 1;
      setModuleHistoryIndex(newIndex);
      setActiveModuleInternal(moduleHistory[newIndex], true);
    }
  };

  const canNavigateModuleBack = moduleHistoryIndex > 0;
  const canNavigateModuleForward = moduleHistoryIndex < moduleHistory.length - 1;

  return {
    appState,
    setActiveModule,
    toast,
    showToast,
    confirmOptions,
    showConfirm,
    hideConfirm,
    rightPanelVisible,
    setRightPanelVisible,
    fileLayoutMode,
    setFileLayoutMode,
    activeSettingsTab,
    setActiveSettingsTab,
    selectedInsightMetric,
    setSelectedInsightMetric,
    selectedFileId,
    setSelectedFileId,
    selectedBookId,
    setSelectedBookId,
    selectedServiceId,
    setSelectedServiceId,
    selectedCustomerId,
    setSelectedCustomerId,
    selectedPenulisId,
    setSelectedPenulisId,
    selectedPenerbitId,
    setSelectedPenerbitId,
    selectedNaskahId,
    setSelectedNaskahId,
    selectedTimId,
    setSelectedTimId,
    selectedLegalitasId,
    setSelectedLegalitasId,
    selectedTaskId,
    setSelectedTaskId,
    editingCustomer,
    setEditingCustomer,
    importExportActions,
    registerImportExportActions,
    navigateModuleBack,
    navigateModuleForward,
    canNavigateModuleBack,
    canNavigateModuleForward
  };
}
