function ApplicationTable({ applications, onChangeApplication, onRemoveApplication, readOnly = false }) {
  return (
    <div className="accessory-table-wrap">
      <table className={`accessory-table${readOnly ? ' accessory-table-readonly' : ''}`}>
        <thead>
          <tr>
            <th>Aplicacion</th>
            <th>Version</th>
            <th>Licencia</th>
            <th>Observaciones</th>
            {!readOnly && <th>Accion</th>}
          </tr>
        </thead>
        <tbody>
          {applications.map((application, index) => (
            <tr key={`application-${index}`}>
              <td>
                {readOnly ? (
                  application.name || '—'
                ) : (
                  <input
                    value={application.name || ''}
                    onChange={(e) => onChangeApplication(index, 'name', e.target.value)}
                    placeholder="Nombre"
                  />
                )}
              </td>
              <td>
                {readOnly ? (
                  application.version || '—'
                ) : (
                  <input
                    value={application.version || ''}
                    onChange={(e) => onChangeApplication(index, 'version', e.target.value)}
                    placeholder="Version"
                  />
                )}
              </td>
              <td>
                {readOnly ? (
                  application.license || '—'
                ) : (
                  <input
                    value={application.license || ''}
                    onChange={(e) => onChangeApplication(index, 'license', e.target.value)}
                    placeholder="Tipo o licencia"
                  />
                )}
              </td>
              <td>
                {readOnly ? (
                  application.notes || '—'
                ) : (
                  <input
                    value={application.notes || ''}
                    onChange={(e) => onChangeApplication(index, 'notes', e.target.value)}
                    placeholder="Observaciones"
                  />
                )}
              </td>
              {!readOnly && (
                <td>
                  <button type="button" className="secondary-button danger-button" onClick={() => onRemoveApplication(index)}>
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

export default ApplicationTable