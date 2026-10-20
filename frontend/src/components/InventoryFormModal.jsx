import { useEffect, useState } from 'react'
import AccessoryTable from './AccessoryTable'
import ApplicationTable from './ApplicationTable'
import InventoryFieldsGrid from './InventoryFieldsGrid'
import { EXTRA_FIELDS } from '../inventoryHelpers'

function InventoryFormModal({
  open,
  title,
  formData,
  onChange,
  equipmentOptions,
  serialError,
  lookupLoading,
  lookupMessage,
  onCarnetBlur,
  onCarnetEnter,
  onSerialBlur,
  allowEquipmentTypeSelect = false,
  accessoryTypeOptions,
  accessories,
  onAddAccessory,
  onChangeAccessory,
  onRemoveAccessory,
  applications,
  additionalApplications,
  onAddApplication,
  onChangeApplication,
  onRemoveApplication,
  onSubmit,
  onClose,
  submitLabel,
  submitDisabled,
}) {
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    if (open) {
      setActiveTab('details')
    }
  }, [open, title])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-create" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>

        <div className="modal-tabs" role="tablist" aria-label="Secciones del formulario">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'details'}
            className={`modal-tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Datos del activo
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'accessories'}
            className={`modal-tab ${activeTab === 'accessories' ? 'active' : ''}`}
            onClick={() => setActiveTab('accessories')}
          >
            Accesorios
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'applications'}
            className={`modal-tab ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => setActiveTab('applications')}
          >
            Aplicaciones
          </button>
        </div>

        <form onSubmit={onSubmit}>
          {activeTab === 'details' && (
            <>
              <div className="detail-section">
                <div className="detail-grid">
                  <label>
                    Status
                    <input
                      type="text"
                      name="status"
                      value={formData.status || ''}
                      onChange={onChange}
                      placeholder="Ej: instalado, embalado, spare"
                    />
                  </label>
                </div>
              </div>

              <InventoryFieldsGrid
                fields={EXTRA_FIELDS}
                formData={formData}
                onChange={onChange}
                equipmentOptions={equipmentOptions}
                serialError={serialError}
                lookupLoading={lookupLoading}
                lookupMessage={lookupMessage}
                onCarnetBlur={onCarnetBlur}
                onCarnetEnter={onCarnetEnter}
                onSerialBlur={onSerialBlur}
                allowEquipmentTypeSelect={allowEquipmentTypeSelect}
              />
            </>
          )}

          {activeTab === 'accessories' && (
            <div className="detail-section">
              <div className="accessory-header">
                <h3>Accesorios adicionales</h3>
                <button type="button" className="secondary-button" onClick={onAddAccessory}>+ Agregar accesorio</button>
              </div>
              {!accessories.length && (
                <p className="tab-empty-hint">No hay accesorios agregados. Usa el botón para crear el primero.</p>
              )}
              {!!accessories.length && (
                <AccessoryTable
                  accessories={accessories}
                  accessoryTypeOptions={accessoryTypeOptions}
                  onChangeAccessory={onChangeAccessory}
                  onRemoveAccessory={onRemoveAccessory}
                />
              )}
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="detail-section">
              <div className="accessory-header">
                <h3>Aplicaciones</h3>
                <button type="button" className="secondary-button" onClick={() => onAddApplication('applications')}>
                  + Agregar aplicacion
                </button>
              </div>
              {!applications.length && (
                <p className="tab-empty-hint">No hay aplicaciones agregadas.</p>
              )}
              {!!applications.length && (
                <ApplicationTable
                  applications={applications}
                  onChangeApplication={(index, field, value) => onChangeApplication('applications', index, field, value)}
                  onRemoveApplication={(index) => onRemoveApplication('applications', index)}
                />
              )}

              <div className="accessory-header tab-subsection-header">
                <h3>Aplicaciones adicionales</h3>
                <button type="button" className="secondary-button" onClick={() => onAddApplication('additional_applications')}>
                  + Agregar adicional
                </button>
              </div>
              {!additionalApplications.length && (
                <p className="tab-empty-hint">No hay aplicaciones adicionales.</p>
              )}
              {!!additionalApplications.length && (
                <ApplicationTable
                  applications={additionalApplications}
                  onChangeApplication={(index, field, value) => onChangeApplication('additional_applications', index, field, value)}
                  onRemoveApplication={(index) => onRemoveApplication('additional_applications', index)}
                />
              )}
            </div>
          )}

          <div className="modal-actions">
            <div className="modal-tab-nav">
            </div>
            <button type="submit" disabled={submitDisabled}>{submitLabel}</button>
            <button type="button" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default InventoryFormModal