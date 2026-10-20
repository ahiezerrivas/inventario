function InventoryFieldsGrid({
  fields,
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
}) {
  const safeEquipmentOptions = Array.isArray(equipmentOptions) ? equipmentOptions : []

  return (
    <div className="detail-section">
      <div className="detail-grid">
        {fields.map(([key, label]) => (
          <label key={key}>{label}
            {key === 'ubicacion' ? (
              <select name="source_sheet" value={formData.source_sheet || ''} onChange={onChange}>
                <option value="Sede">Sede</option>
                <option value="Oficina">Oficina</option>
              </select>
            ) : key === 'tipo de equipo' && allowEquipmentTypeSelect ? (
              <select
                name={`extra.${key}`}
                value={formData.extra?.[key] || formData.asset_type || ''}
                onChange={onChange}
              >
                <option value="">Seleccionar tipo de equipo</option>
                {safeEquipmentOptions.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            ) : (
              <input
                name={`extra.${key}`}
                value={formData.extra?.[key] || ''}
                onChange={onChange}
                onBlur={
                  key === 'carnet'
                    ? onCarnetBlur
                    : key === 'serial equipo' || key === 'serial'
                      ? onSerialBlur
                      : undefined
                }
                onKeyDown={
                  key === 'carnet' && onCarnetEnter
                    ? (e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          onCarnetEnter(e.currentTarget.value)
                        }
                      }
                    : undefined
                }
                placeholder={label}
              />
            )}
            {key === 'serial equipo' && serialError && <span className="error">{serialError}</span>}
          </label>
        ))}
      </div>
      {lookupLoading && <p>Consultando carnet...</p>}
      {!lookupLoading && lookupMessage && <p>{lookupMessage}</p>}
    </div>
  )
}

export default InventoryFieldsGrid