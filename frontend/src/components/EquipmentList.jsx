function EquipmentList({
  items,
  loading,
  total,
  pages,
  page,
  search,
  sheet,
  typeFilter,
  codeFilter,
  userCardFilter,
  onOpenView,
  onOpenEdit,
  onDelete,
  onGoToPage,
  getAdditionalAccessories,
}) {
  const activeFilters = [
    sheet ? `Ubicacion: ${sheet}` : '',
    typeFilter ? `Tipo: ${typeFilter}` : '',
    codeFilter ? `Codigo: ${codeFilter}` : '',
    userCardFilter ? `Carnet/Usuario: ${userCardFilter}` : '',
    search ? `Busqueda: ${search}` : '',
  ].filter(Boolean)

  const titleSuffix = activeFilters.length ? ` — ${activeFilters.join(' | ')}` : ''

  return (
    <section className="grid">
      <section className="panel list">
        <h2>
          Activos{titleSuffix}
          <span className="total-badge">{total.toLocaleString()} registros</span>
        </h2>
        {loading && <p>Cargando...</p>}
        {!loading && items.length === 0 && <p>Sin registros.</p>}
        {!loading && items.length > 0 && (
          <div className="table-wrapper">
            <table className="equipment-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Modelo</th>
                  <th>Serial</th>
                  <th>Hostname</th>
                  <th>Usuario</th>
                  <th>Distribucion</th>
                  <th>Status</th>
                  <th>Accesorios</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="equipment-row" onClick={() => onOpenView(item)}>
                    <td><strong>{item.asset_type || 'Sin tipo'}</strong></td>
                    <td>{item.model || 'Sin modelo'}</td>
                    <td>{item.extra?.['serial equipo'] || item.extra?.serial || item.serial || 'N/A'}</td>
                    <td>{item.extra?.['hostname ip'] || item.extra?.hostname || item.extra?.['hostname/cargo'] || 'N/A'}</td>
                    <td>{item.assignee || item.extra?.usuario || 'N/A'}</td>
                    <td>{item.extra?.distribucion || 'N/A'}</td>
                    <td>{item.status || 'N/A'}</td>
                    <td>{getAdditionalAccessories(item).length}</td>
                    <td>
                      <div className="item-actions">
                        <button className="btn-edit" onClick={(e) => { e.stopPropagation(); onOpenEdit(item) }}>Editar</button>
                        <button className="btn-delete" onClick={(e) => { e.stopPropagation(); onDelete(item) }}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => onGoToPage(page - 1)}>‹ Anterior</button>
            <span>Página {page} de {pages}</span>
            <button disabled={page === pages} onClick={() => onGoToPage(page + 1)}>Siguiente ›</button>
          </div>
        )}
      </section>
    </section>
  )
}

export default EquipmentList