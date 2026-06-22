import React, { useMemo, useState } from 'react';
import { useInvoiceContext } from '../../../contexts/InvoiceContext';
import { useAppContext } from '../../../contexts/AppContext';
import { useDataMasterContext } from '../../../contexts/DataMasterContext';
import { SmartRelationField, SmartRelationOption } from '@pubhub/shared-ui';
import { findBestDuplicate, formatDuplicateReason } from '@pubhub/shared-utils';

export const CustomerSection: React.FC = () => {
  const { customer, setCustomer } = useInvoiceContext();
  const { contacts, addContact } = useAppContext();
  const { penulis, addPenulis } = useDataMasterContext();
  const [waInput, setWaInput] = useState('');

  const [createFormData, setCreateFormData] = useState({
    name: '',
    wa_number: '',
    email: '',
    address: '',
  });
  const [duplicateWarning, setDuplicateWarning] = useState<{
    matchedOption: SmartRelationOption;
    similarity: number;
    reason: string;
  } | null>(null);

  // Combine customers and penulis for the dropdown.
  const customers = contacts.filter((c) => c.type === 'customer');
  const allContactOptions: SmartRelationOption[] = useMemo(() => {
    const list = [
      ...customers.map((c) => ({
        value: String(c.id),
        label: `${c.name} (Pelanggan)`,
        source: 'Pelanggan',
        wa_number: c.wa_number,
        email: c.email,
        address: c.address,
        isPenulis: false,
      })),
      ...penulis.map((p) => ({
        value: `penulis-${p.id}`,
        label: `${p.name} (Penulis)`,
        source: 'Penulis',
        wa_number: p.wa_number,
        email: p.email,
        address: p.address,
        isPenulis: true,
      })),
    ];
    return list;
  }, [customers, penulis]);

  const selectedValue = useMemo(() => {
    if (!customer.name) return '';
    const found = allContactOptions.find(
      (o) => o.label.toLowerCase().startsWith(customer.name!.toLowerCase())
    );
    return found ? found.value : '';
  }, [allContactOptions, customer.name]);

  const handleSelect = (value: string, option?: SmartRelationOption) => {
    if (!option) {
      const exactMatch = allContactOptions.find(
        (o) => o.label.replace(/ \(Pelanggan\)| \(Penulis\)/, '').toLowerCase() === value.trim().toLowerCase()
      );
      if (exactMatch) {
        setCustomer((prev) => ({
          ...prev,
          name: value,
          wa_number: exactMatch.wa_number || '',
          email: exactMatch.email || '',
          address: exactMatch.address || '',
          isPenulis: exactMatch.isPenulis || false,
        }));
      } else {
        setCustomer((prev) => ({ ...prev, name: value }));
      }
      return;
    }
    setCustomer((prev) => ({
      ...prev,
      name: option.label.replace(/ \(Pelanggan\)| \(Penulis\)/, ''),
      wa_number: option.wa_number || '',
      email: option.email || '',
      address: option.address || '',
      isPenulis: option.isPenulis || false,
    }));
  };

  const checkDuplicate = (data: { name: string; wa_number?: string; email?: string }) => {
    const allEntities: Array<{ id: string; name: string; wa_number?: string; email?: string }> = [
      ...customers.map((c) => ({ id: String(c.id), name: c.name, wa_number: c.wa_number, email: c.email })),
      ...penulis.map((p) => ({ id: `penulis-${p.id}`, name: p.name, wa_number: p.wa_number, email: p.email })),
    ];
    const result = findBestDuplicate(
      { id: undefined, name: data.name, wa_number: data.wa_number, email: data.email },
      allEntities,
      [
        { key: 'name', weight: 0.5, threshold: 0.85 },
        { key: 'wa_number', weight: 0.35, isPhone: true, threshold: 0.95 },
        { key: 'email', weight: 0.15, threshold: 0.95 },
      ],
      0.7
    );
    if (result) {
      setDuplicateWarning({
        matchedOption: allContactOptions.find((o) => o.value === result.item.id) || {
          value: result.item.id,
          label: result.item.name,
        },
        similarity: result.score,
        reason: formatDuplicateReason(result),
      });
      return true;
    }
    setDuplicateWarning(null);
    return false;
  };

  const handleCreateSave = async (onSuccess: () => void) => {
    const { name, wa_number, email, address } = createFormData;
    if (!name.trim()) return;

    const isPenulis = customer.isPenulis;

    if (duplicateWarning) {
      // The modal is showing the duplicate warning; user pressed "Tetap Buat Baru".
      await actuallyCreate({ name, wa_number, email, address, isPenulis });
      setDuplicateWarning(null);
      onSuccess();
      return;
    }

    const hasDuplicate = checkDuplicate({ name, wa_number, email });
    if (hasDuplicate) {
      return;
    }

    await actuallyCreate({ name, wa_number, email, address, isPenulis });
    onSuccess();
  };

  const actuallyCreate = async (data: {
    name: string;
    wa_number: string;
    email: string;
    address: string;
    isPenulis: boolean;
  }) => {
    try {
      if (data.isPenulis) {
        await addPenulis({
          name: data.name.trim(),
          wa_number: data.wa_number.trim(),
          email: data.email.trim(),
          address: data.address.trim(),
          email_valid: 0,
          wa_valid: 0,
        });
        setCustomer((prev) => ({
          ...prev,
          name: data.name.trim(),
          wa_number: data.wa_number.trim(),
          email: data.email.trim(),
          address: data.address.trim(),
          isPenulis: true,
        }));
      } else {
        await addContact({
          name: data.name.trim(),
          wa_number: data.wa_number.trim(),
          email: data.email.trim(),
          address: data.address.trim(),
          type: 'customer',
          created_at: new Date().toISOString(),
        });
        setCustomer((prev) => ({
          ...prev,
          name: data.name.trim(),
          wa_number: data.wa_number.trim(),
          email: data.email.trim(),
          address: data.address.trim(),
          isPenulis: false,
        }));
      }
    } catch (err) {
      console.error('Gagal membuat kontak baru:', err);
    }
  };

  const handleParseWA = () => {
    const lines = waInput.split('\n');
    let name = '';
    let wa_number = '';
    let email = '';
    let address = '';

    lines.forEach((line) => {
      if (line.toLowerCase().startsWith('nama:')) {
        name = line.substring(5).trim();
      } else if (line.toLowerCase().startsWith('no:') || line.toLowerCase().startsWith('wa:')) {
        wa_number = line.substring(line.indexOf(':') + 1).trim();
      } else if (line.toLowerCase().startsWith('email:')) {
        email = line.substring(6).trim();
      } else if (line.toLowerCase().startsWith('alamat:')) {
        address = line.substring(7).trim();
      }
    });

    setCustomer((prev) => ({
      ...prev,
      name: name || prev.name || '',
      wa_number: wa_number || prev.wa_number || '',
      email: email || prev.email || '',
      address: address || prev.address || '',
    }));
  };

  return (
    <>
      <textarea
        style={{
          width: '100%',
          minHeight: '80px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '14px',
          color: 'var(--text-primary)',
          resize: 'vertical',
          marginBottom: '8px',
        }}
        placeholder="Tempel teks chat WhatsApp di sini..."
        value={waInput}
        onChange={(e) => setWaInput(e.target.value)}
        rows={3}
      />
      <button
        className="btn-secondary"
        onClick={handleParseWA}
        style={{ marginBottom: '16px', width: '100%', padding: '8px 10px', fontSize: '12px' }}
      >
        ✨ Parse Otomatis Chat WhatsApp
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 16px 0' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
        <span
          style={{
            fontSize: '10px',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Detail Kontak Pelanggan
        </span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
      </div>

      <SmartRelationField
        label="Nama Pelanggan / Penulis"
        options={allContactOptions}
        value={selectedValue}
        onChange={handleSelect}
        placeholder="Ketik nama pelanggan atau penulis..."
        emptyMessage="Belum ada data. Klik '+ Baru' untuk membuat."
        entityLabel="Kontak"
        entityLabelPlural="Kontak"
        fullWidth
        renderCreateForm={({ onSave, onCancel }) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="Nama lengkap"
              defaultValue={createFormData.name}
              onChange={(e) => setCreateFormData((prev) => ({ ...prev, name: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
              }}
            />
            <input
              type="text"
              placeholder="Nomor WhatsApp"
              defaultValue={createFormData.wa_number}
              onChange={(e) => setCreateFormData((prev) => ({ ...prev, wa_number: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
              }}
            />
            <input
              type="email"
              placeholder="Email"
              defaultValue={createFormData.email}
              onChange={(e) => setCreateFormData((prev) => ({ ...prev, email: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
              }}
            />
            <input
              type="text"
              placeholder="Alamat"
              defaultValue={createFormData.address}
              onChange={(e) => setCreateFormData((prev) => ({ ...prev, address: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" type="button" onClick={onCancel}>
                Batal
              </button>
              <button
                className="btn-primary"
                type="button"
                onClick={() => handleCreateSave(() => onSave())}
              >
                Simpan
              </button>
            </div>
          </div>
        )}
        duplicateWarning={duplicateWarning}
        onSelectExisting={(val) => {
          const option = allContactOptions.find((o) => o.value === val);
          handleSelect(val, option);
          setDuplicateWarning(null);
        }}
        onConfirmCreateAnyway={() => {
          actuallyCreate({
            name: createFormData.name,
            wa_number: createFormData.wa_number,
            email: createFormData.email,
            address: createFormData.address,
            isPenulis: customer.isPenulis || false,
          }).then(() => setDuplicateWarning(null));
        }}
      />

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
          No. WhatsApp
        </label>
        <input
          type="text"
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '14px',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
          value={customer.wa_number || ''}
          onChange={(e) => setCustomer((prev) => ({ ...prev, wa_number: e.target.value }))}
          placeholder="08123456789"
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
          Alamat Email (Opsional)
        </label>
        <input
          type="email"
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '14px',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
          value={customer.email || ''}
          onChange={(e) => setCustomer((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="pelanggan@email.com"
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
          Alamat
        </label>
        <input
          type="text"
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '14px',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
          value={customer.address || ''}
          onChange={(e) => setCustomer((prev) => ({ ...prev, address: e.target.value }))}
          placeholder="Alamat Pengiriman"
        />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '16px',
          padding: '12px',
          background: 'var(--bg-panel)',
          borderRadius: '8px',
          border: '1px solid var(--border)',
        }}
      >
        <input
          type="checkbox"
          id="isPenulis"
          checked={customer.isPenulis || false}
          onChange={(e) => setCustomer((prev) => ({ ...prev, isPenulis: e.target.checked }))}
          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
        />
        <label htmlFor="isPenulis" style={{ fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer', userSelect: 'none' }}>
          Centang Jika Penulis
        </label>
      </div>
    </>
  );
};
