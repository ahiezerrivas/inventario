import { useEffect, useMemo, useState } from 'react'
import AccessoryTable from './AccessoryTable'
import ApplicationTable from './ApplicationTable'

function InventoryDetailModal({ open, item, accessories, applications, additionalApplications, onClose, onEdit }) {
  const [activeTab, setActiveTab] = useState('info')

  const hasAdditionalData = useMemo(
    () => Boolean(item?.extra && Object.keys(item.extra).some((key) => !['additional_accessories', 'applications', 'additional_applications'].includes(key))),
    [item]
  )

  useEffect(() => {
    if (open) {
      setActiveTab('info')
    }
  }, [open, item?.id])

  if (!open || !item) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-detail" onClick={(e) => e.stopPropagation()}>
        <h2>Detalle del activo</h2>

        <div className="modal-tabs" role="tablist" aria-label="Secciones del detalle">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'info'}
            className={`modal-tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Informacion
          </button>
          {!!accessories.length && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'accessories'}
              className={`modal-tab ${activeTab === 'accessories' ? 'active' : ''}`}
              onClick={() => setActiveTab('accessories')}
            >
              Accesorios
            </button>
          )}
          {(applications.length > 0 || additionalApplications.length > 0) && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'applications'}
              className={`modal-tab ${activeTab === 'applications' ? 'active' : ''}`}
              onClick={() => setActiveTab('applications')}
            >
              Aplicaciones
            </button>
          )}
          {hasAdditionalData && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'extra'}
              className={`modal-tab ${activeTab === 'extra' ? 'active' : ''}`}
              onClick={() => setActiveTab('extra')}
            >
              Datos adicionales
            </button>
          )}
        </div>

        {activeTab === 'info' && (
          <div className="detail-section">
            <h3>Informacion principal</h3>
            <div className="detail-grid">
              {[
                ['ID', item.id],
                ['Fuente', item.source_sheet],
                ['Codigo', item.asset_code],
                ['Tipo', item.asset_type],
                ['Modelo', item.model],
                ['Serial', item.extra?.['serial equipo'] || item.extra?.serial || item.serial],
                ['Usuario', item.assignee],
                ['Oficina', item.extra.oficina],
                ['Status', item.status || ''],
              ].map(([label, value]) => (
                <div className="detail-field" key={label}>
                  <span className="detail-label">{label}</span>
                  <span className="detail-value">{value || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'accessories' && accessories.length > 0 && (
          <div className="detail-section">
            <h3>Accesorios adicionales</h3>
            <AccessoryTable accessories={accessories} readOnly />
          </div>
        )}

        {activeTab === 'applications' && (
          <>
            {applications.length > 0 && (
              <div className="detail-section">
                <h3>Aplicaciones</h3>
                <ApplicationTable applications={applications} readOnly />
              </div>
            )}

            {additionalApplications.length > 0 && (
              <div className="detail-section">
                <h3>Aplicaciones adicionales</h3>
                <ApplicationTable applications={additionalApplications} readOnly />
              </div>
            )}
          </>
        )}

        {activeTab === 'extra' && hasAdditionalData && (
          <div className="detail-section">
            <h3>Datos adicionales</h3>
            <div className="detail-grid">
              {Object.entries(item.extra)
                .filter(([key]) => !['additional_accessories', 'applications', 'additional_applications'].includes(key))
                .map(([key, value]) => (
                <div className="detail-field" key={key}>
                  <span className="detail-label">{key}</span>
                  <span className="detail-value">{value || '—'}</span>
                </div>
                ))}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" onClick={onEdit}>Editar</button>
          <button type="button" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}

export default InventoryDetailModal