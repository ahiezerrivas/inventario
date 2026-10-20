function AccessoryTable({
  accessories,
  accessoryTypeOptions = [],
  onChangeAccessory,
  onRemoveAccessory,
  readOnly = false,
}) {
  return (
    <div className="accessory-table-wrap">
      <table className={`accessory-table${readOnly ? ' accessory-table-readonly' : ''}`}>
        <thead>
          <tr>
            <th>Tipo de accesorio</th>
            <th>Serial</th>
            <th>Descripcion</th>
            <th>Observaciones</th>
            {!readOnly && <th>Accion</th>}
          </tr>
        </thead>
        <tbody>
          {accessories.map((accessory, index) => (
            <tr key={`accessory-${index}`}>
              <td>
                {readOnly ? (
                  accessory.accessory_type || '—'
                ) : (
                  <select
                    value={accessory.accessory_type || ''}
                    onChange={(e) => onChangeAccessory(index, 'accessory_type', e.target.value)}
                  >
                    <option value="">Seleccionar</option>
                    {accessoryTypeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                )}
              </td>
              <td>
                {readOnly ? (
                  accessory.serial || '—'
                ) : (
                  <input
                    value={accessory.serial || ''}
                    onChange={(e) => onChangeAccessory(index, 'serial', e.target.value)}
                    placeholder="Serial"
                  />
                )}
              </td>
              <td>
                {readOnly ? (
                  accessory.description || '—'
                ) : (
                  <input
                    value={accessory.description || ''}
                    onChange={(e) => onChangeAccessory(index, 'description', e.target.value)}
                    placeholder="Marca / modelo / detalle"
                  />
                )}
              </td>
              <td>
                {readOnly ? (
                  accessory.notes || '—'
                ) : (
                  <input
                    value={accessory.notes || ''}
                    onChange={(e) => onChangeAccessory(index, 'notes', e.target.value)}
                    placeholder="Observaciones"
                  />
                )}
              </td>
              {!readOnly && (
                <td>
                  <button type="button" className="secondary-button danger-button" onClick={() => onRemoveAccessory(index)}>
                    Quitar
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AccessoryTable