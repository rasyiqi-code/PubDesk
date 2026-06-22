import React, { useState, useMemo } from 'react';
import { SearchableSelect } from '../atoms/SearchableSelect';
import { Button } from '../atoms/Button';
import { Modal } from './Modal';

export interface SmartRelationOption {
  value: string;
  label: string;
  /** Any extra fields the caller wants to surface (e.g. wa_number, email). */
  [key: string]: any;
}

export interface DuplicateWarning {
  /** The existing option that looks similar. */
  matchedOption: SmartRelationOption;
  /** 0..1 similarity score for display purposes. */
  similarity: number;
  /** Human-readable reason shown to the user. */
  reason: string;
}

export interface SmartRelationFieldProps {
  label?: string;
  /** Existing master-data options. */
  options: SmartRelationOption[];
  /** Currently selected option value (empty string = none). */
  value: string;
  onChange: (value: string, option?: SmartRelationOption) => void;
  placeholder?: string;
  emptyMessage?: string;
  /** Name of the entity, e.g. "Penulis", "Naskah", "Tim". */
  entityLabel: string;
  entityLabelPlural?: string;
  required?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  /** Whether to show the "+ Baru" quick-create button. */
  allowCreate?: boolean;
  /** Whether the user is allowed to proceed with a free-text snapshot. */
  allowManualSnapshot?: boolean;
  /** Called when the user clicks "+ Baru". If renderCreateForm is omitted, the parent is expected to open its own create flow. */
  onRequestCreate?: () => void;
  /** Render prop for the inline quick-create form inside the modal. */
  renderCreateForm?: (props: {
    onSave: (data: Record<string, any>) => void;
    onCancel: () => void;
  }) => React.ReactNode;
  /** Current duplicate warning, if any. */
  duplicateWarning?: DuplicateWarning | null;
  /** Called when the user decides to create a new record despite the duplicate warning. */
  onConfirmCreateAnyway?: () => void;
  /** Called when the user selects the existing matched option from the duplicate warning. */
  onSelectExisting?: (value: string) => void;
  /** Called when the user chooses to use a manual snapshot (free text) instead of creating master data. */
  onUseSnapshot?: (snapshot: string) => void;
}

/**
 * A relation field that does not lock the user to existing master data.
 *
 * Features:
 * - Searchable dropdown over existing master records.
 * - Inline "+ New" quick-create so the operator does not need to switch apps.
 * - Duplicate-warning UI with "use existing" / "create anyway" choices.
 * - Optional manual snapshot fallback for truly ad-hoc cases.
 */
export const SmartRelationField: React.FC<SmartRelationFieldProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Ketik untuk mencari...',
  emptyMessage = 'Tidak ada data',
  entityLabel,
  entityLabelPlural,
  required,
  fullWidth,
  disabled,
  allowCreate = true,
  allowManualSnapshot = false,
  onRequestCreate,
  renderCreateForm,
  duplicateWarning,
  onConfirmCreateAnyway,
  onSelectExisting,
  onUseSnapshot,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const plural = entityLabelPlural || `${entityLabel}`;

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  const handleCreateClick = () => {
    if (onRequestCreate) {
      onRequestCreate();
    } else if (renderCreateForm) {
      setShowCreateModal(true);
    }
  };

  const handleSaveCreate = () => {
    setShowCreateModal(false);
  };

  const handleConfirmCreateAnyway = () => {
    onConfirmCreateAnyway?.();
    setShowCreateModal(false);
  };

  const handleSelectExistingFromWarning = () => {
    if (duplicateWarning?.matchedOption && onSelectExisting) {
      onSelectExisting(duplicateWarning.matchedOption.value);
    }
    setShowCreateModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: fullWidth ? '100%' : undefined }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', width: '100%' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <SearchableSelect
            label={label}
            options={options}
            value={value}
            onChange={(val) => {
              const option = options.find((o) => o.value === val);
              onChange(val, option);
            }}
            placeholder={placeholder}
            emptyMessage={emptyMessage}
            required={required}
            fullWidth
          />
        </div>

        {allowCreate && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleCreateClick}
            disabled={disabled}
            style={{ height: '42px' }}
          >
            + {entityLabel} Baru
          </Button>
        )}
      </div>

      {selectedOption && (
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {selectedOption.wa_number && <span>WA: {selectedOption.wa_number}</span>}
          {selectedOption.email && <span>Email: {selectedOption.email}</span>}
          {selectedOption.city && <span>Kota: {selectedOption.city}</span>}
        </div>
      )}

      {duplicateWarning && (
        <div
          style={{
            padding: '12px 14px',
            background: 'rgba(234, 179, 8, 0.08)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '8px',
            fontSize: '13px',
            color: 'var(--text-primary)',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '6px' }}>
            ⚠️ {entityLabel} serupa ditemukan
          </div>
          <div style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>
            {duplicateWarning.reason}
            <br />
            <strong>{duplicateWarning.matchedOption.label}</strong>
            {duplicateWarning.similarity > 0 && (
              <span> (kesamaan {Math.round(duplicateWarning.similarity * 100)}%)</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {onSelectExisting && (
              <Button type="button" variant="primary" size="sm" onClick={handleSelectExistingFromWarning}>
                Pilih yang Sudah Ada
              </Button>
            )}
            {onConfirmCreateAnyway && (
              <Button type="button" variant="secondary" size="sm" onClick={handleConfirmCreateAnyway}>
                Tetap Buat {entityLabel} Baru
              </Button>
            )}
          </div>
        </div>
      )}

      {renderCreateForm && (
        <Modal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title={duplicateWarning ? `Konfirmasi Duplikat ${entityLabel}` : `Buat ${entityLabel} Baru`}
          width="480px"
        >
          {duplicateWarning ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                {duplicateWarning.reason}. Apakah Anda yakin ingin membuat {entityLabel.toLowerCase()} baru?
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button type="button" variant="secondary" size="md" onClick={handleSelectExistingFromWarning}>
                  Pilih yang Sudah Ada
                </Button>
                <Button type="button" variant="primary" size="md" onClick={handleConfirmCreateAnyway}>
                  Tetap Buat Baru
                </Button>
              </div>
            </div>
          ) : (
            renderCreateForm({
              onSave: handleSaveCreate,
              onCancel: () => setShowCreateModal(false),
            })
          )}
        </Modal>
      )}

      {allowManualSnapshot && !value && onUseSnapshot && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Atau isi manual tanpa menyimpan ke master {plural.toLowerCase()}:
          </label>
          <input
            type="text"
            placeholder={`Nama ${entityLabel.toLowerCase()} (snapshot)...`}
            onBlur={(e) => onUseSnapshot(e.target.value)}
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
        </div>
      )}
    </div>
  );
};
