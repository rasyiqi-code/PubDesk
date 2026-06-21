import React, { useState, useMemo, useEffect } from 'react';
import { useWorkflowContext } from '../../contexts/WorkflowContext';
import { useDataMasterContext } from '../../contexts/DataMasterContext';
import { useAppContext } from '../../contexts/AppContext';
import { Badge, getStatusVariant } from '../../ui/atoms/Badge';
import { Button } from '../../ui/atoms/Button';
import { FilterBar, FilterGroup, FilterChip, FilterDivider } from '../../ui/molecules/FilterBar';
import { DataTablePage, DataTable, DataTableHeader, DataTableBody, HoverRow, tableStyles } from '../../ui/molecules/DataTable';
import { formatDateLong } from '../../utils/format';
import { useUniqueValues } from '../../hooks/useUniqueValues';
import * as XLSX from 'xlsx';
import { save } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';

const ProduksiList: React.FC<{ searchQuery?: string }> = ({ searchQuery = '' }) => {
  const { tasks, isLoading, setSelectedTaskId, addTask } = useWorkflowContext();
  const { naskah, tim } = useDataMasterContext();
  const { setRightPanelVisible, setActiveModule, setSelectedTaskId: setGlobalSelectedTaskId, registerImportExportActions, showToast } = useAppContext();

  useEffect(() => {
    const actions = {
      onImport: () => document.getElementById('tasks-excel-import-input')?.click(),
      onExport: handleExportExcel,
      onDownloadTemplate: handleDownloadTemplate
    };
    registerImportExportActions('produksi-list', actions);
    return () => {
      registerImportExportActions('produksi-list', null);
    };
  }, [tasks, naskah, tim]);

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (data.length === 0) {
          showToast('File Excel kosong!', 'error');
          return;
        }

        let importedCount = 0;
        let errorCount = 0;

        for (const row of data) {
          const naskahTitle = row["Judul Naskah"] || row.judul || row.title;
          const step_name = row["Nama Langkah"] || row.tahap || row.step_name;
          if (!naskahTitle || !step_name) {
            errorCount++;
            continue;
          }

          // Lookup naskah_id
          const foundNaskah = naskah.find(n => n.title.toLowerCase() === String(naskahTitle).trim().toLowerCase());
          if (!foundNaskah) {
            errorCount++;
            continue;
          }

          // Lookup team member id
          let assigned_team_id: number | undefined = undefined;
          const picName = row.PIC || row["Nama PIC"] || row.pic_name;
          if (picName) {
            const foundMember = tim.find(m => m.name.toLowerCase() === String(picName).trim().toLowerCase());
            if (foundMember) {
              assigned_team_id = foundMember.id;
            }
          }

          const step_order = parseInt(row["Urutan Langkah"] || row.step_order || '1', 10);
          const status = row.Status || row.status || 'Belum Mulai';
          const priority = row.Prioritas || row.priority || 'Normal';
          const start_date = row["Tanggal Mulai"] || row.start_date;
          const due_date = row["Tenggat Waktu"] || row.due_date;
          const notes = row.Catatan || row.catatan || row.notes;

          try {
            await addTask({
              naskah_id: foundNaskah.id!,
              step_name: String(step_name).trim(),
              step_order: isNaN(step_order) ? 1 : step_order,
              assigned_team_id,
              status: String(status).trim(),
              priority: String(priority).trim(),
              start_date: start_date ? String(start_date).trim() : undefined,
              due_date: due_date ? String(due_date).trim() : undefined,
              completed_date: undefined,
              notes: notes ? String(notes).trim() : undefined,
              proof_path_or_link: undefined,
            });
            importedCount++;
          } catch (err) {
            console.error('Gagal mengimpor tugas:', err);
            errorCount++;
          }
        }

        showToast(`Impor tugas berhasil! ${importedCount} data dimasukkan.${errorCount > 0 ? ` Gagal: ${errorCount}` : ''}`, 'success');
        e.target.value = '';
      } catch (err) {
        console.error(err);
        showToast('Gagal memproses file Excel!', 'error');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExportExcel = async () => {
    try {
      if (tasks.length === 0) {
        showToast('Tidak ada tugas untuk diekspor!', 'info');
        return;
      }

      const exportData = tasks.map((t, idx) => ({
        "No": idx + 1,
        "ID Task": t.id,
        "Judul Naskah": t.naskah_title || '',
        "Penulis": t.penulis_name || '',
        "Nama Langkah": t.step_name,
        "Urutan Langkah": t.step_order || '',
        "PIC": t.pic_name || '',
        "Status": t.status,
        "Prioritas": t.priority || 'Normal',
        "Tanggal Mulai": t.start_date ? t.start_date.substring(0, 10) : '',
        "Tenggat Waktu": t.due_date ? t.due_date.substring(0, 10) : '',
        "Tanggal Selesai": t.completed_date ? t.completed_date.substring(0, 10) : '',
        "Catatan": t.notes || ''
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      const maxLens = Object.keys(exportData[0] || {}).map(key => {
        return Math.max(
          key.length,
          ...exportData.map(row => String((row as any)[key] || '').length)
        );
      });
      ws['!cols'] = maxLens.map(len => ({ wch: Math.min(len + 3, 50) }));

      XLSX.utils.book_append_sheet(wb, ws, "Daftar Tugas");

      const filePath = await save({
        filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }],
        defaultPath: 'Daftar_Tugas_Export.xlsx'
      });

      if (!filePath) return;

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const bytes = new Uint8Array(wbout);
      await invoke('write_binary_file', { path: filePath, bytes: Array.from(bytes) });

      showToast('Data Daftar Tugas berhasil diekspor!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengekspor data tugas!', 'error');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const templateData = [
        {
          "Judul Naskah": "Lentera Senja",
          "Nama Langkah": "Layout Bab 1-5",
          "Urutan Langkah": 1,
          "PIC": "Hana Safitri",
          "Status": "Belum Mulai",
          "Prioritas": "Normal",
          "Tanggal Mulai": "2026-06-20",
          "Tenggat Waktu": "2026-06-25",
          "Catatan": "Gunakan grid template A5"
        }
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(templateData);

      const maxLens = Object.keys(templateData[0] || {}).map(key => {
        return Math.max(
          key.length,
          ...templateData.map(row => String((row as any)[key] || '').length)
        );
      });
      ws['!cols'] = maxLens.map(len => ({ wch: Math.min(len + 3, 50) }));

      XLSX.utils.book_append_sheet(wb, ws, "Template Tugas");

      const filePath = await save({
        filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }],
        defaultPath: 'Template_Daftar_Tugas.xlsx'
      });

      if (!filePath) return;

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const bytes = new Uint8Array(wbout);
      await invoke('write_binary_file', { path: filePath, bytes: Array.from(bytes) });

      showToast('Template Excel Daftar Tugas berhasil diunduh!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengunduh template!', 'error');
    }
  };

  const [filterType, setFilterType] = useState<'pic' | 'status'>('pic');
  const [filterPic, setFilterPic] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const uniquePics = useUniqueValues(tasks, 'pic_name');
  const uniqueStatuses = useUniqueValues(tasks, 'status');

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (searchQuery && !(t.naskah_title || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterPic && t.pic_name !== filterPic) return false;
      if (filterStatus && t.status !== filterStatus) return false;
      return true;
    });
  }, [tasks, searchQuery, filterPic, filterStatus]);

  return (
    <DataTablePage
      filterBar={
        <FilterBar
          actions={
            <Button onClick={() => { setActiveModule('tambah-tugas'); }} variant="primary" size="sm" icon="➕" />
          }
        >
          <input
            type="file"
            id="tasks-excel-import-input"
            accept=".xlsx, .xls"
            style={{ display: 'none' }}
            onChange={handleImportExcel}
          />
          <FilterGroup label="🔍 FILTER:">
            <FilterChip 
              label="PJ" 
              active={filterType === 'pic'} 
              onClick={() => { setFilterType('pic'); setFilterPic(''); setFilterStatus(''); }} 
            />
            <FilterChip 
              label="Status" 
              active={filterType === 'status'} 
              onClick={() => { setFilterType('status'); setFilterPic(''); setFilterStatus(''); }} 
            />
          </FilterGroup>

          {filterType === 'pic' && uniquePics.length > 0 && (
            <>
              <FilterDivider />
              <FilterGroup label="👤 PJ:">
                <FilterChip label="Semua" active={filterPic === ''} onClick={() => setFilterPic('')} />
                {uniquePics.map(pic => (
                  <FilterChip key={pic as string} label={pic as string} active={filterPic === pic} onClick={() => setFilterPic(pic as string)} />
                ))}
              </FilterGroup>
            </>
          )}

          {filterType === 'status' && uniqueStatuses.length > 0 && (
            <>
              <FilterDivider />
              <FilterGroup label="📋 STATUS:">
                <FilterChip label="Semua" active={filterStatus === ''} onClick={() => setFilterStatus('')} />
                {uniqueStatuses.map(status => (
                  <FilterChip key={status as string} label={status as string} active={filterStatus === status} onClick={() => setFilterStatus(status as string)} />
                ))}
              </FilterGroup>
            </>
          )}
        </FilterBar>
      }
    >
      <DataTable>
        <DataTableHeader columns={['ID Task', 'ID Naskah', 'Judul', 'Penulis', 'Tahap', 'PJ', 'Mulai', 'Deadline', 'Selesai', 'Status']} />
        <DataTableBody isLoading={isLoading} isEmpty={filteredTasks.length === 0} colSpan={11} emptyMessage="Tidak ada data tugas">
          {filteredTasks.map(task => (
            <HoverRow
              key={task.id}
              onClick={() => { if (task.id) { setSelectedTaskId(task.id); setRightPanelVisible(true); } }}
            >
              <td style={tableStyles.tdMuted}>#{task.id}</td>
              <td style={tableStyles.tdMuted}>#{task.naskah_id}</td>
              <td style={tableStyles.tdTitle}>{task.naskah_title || '-'}</td>
              <td style={tableStyles.td}>{task.penulis_name || '-'}</td>
              <td style={tableStyles.td}>{task.step_name}</td>
              <td style={tableStyles.td}>{task.pic_name || '-'}</td>
              <td style={tableStyles.tdMuted}>{formatDateLong(task.start_date)}</td>
              <td style={tableStyles.tdMuted}>{formatDateLong(task.due_date)}</td>
              <td style={tableStyles.tdMuted}>{formatDateLong(task.completed_date)}</td>
              <td style={tableStyles.td}>
                <Badge label={task.status} variant={getStatusVariant(task.status)} />
              </td>
              <td style={tableStyles.tdAction}>
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (task.id) {
                      setGlobalSelectedTaskId(task.id);
                      setActiveModule('edit-tugas'); 
                    }
                  }}
                  style={tableStyles.actionButton}
                  title="Edit"
                >
                  ✏️
                </button>
              </td>
            </HoverRow>
          ))}
        </DataTableBody>
      </DataTable>


    </DataTablePage>
  );
};

export default ProduksiList;
