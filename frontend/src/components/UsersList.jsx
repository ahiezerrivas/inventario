function UsersList({ users, usersLoading, usersTotal, usersPages, usersPage, usersSearch, onEditUser, onGoToUsersPage }) {
  const activeUsersFilters = [
    usersSearch ? `Busqueda: ${usersSearch}` : '',
  ].filter(Boolean)

  const titleSuffix = activeUsersFilters.length ? ` — ${activeUsersFilters.join(' | ')}` : ''

  return (
    <section className="panel list">
      <h2>
        Usuarios{titleSuffix}
        <span className="total-badge">{usersTotal.toLocaleString()} registros</span>
      </h2>
      {usersLoading && <p>Cargando...</p>}
      {!usersLoading && users.length === 0 && <p>Sin usuarios.</p>}
      <ul>
        {users.map((user) => (
          <li key={user.id} className="item-card">
            <div className="item-info">
              <strong>{user.name || 'Sin nombre'}</strong>
              <span>Carnet: {user.carnet}</span>
              <span>Cargo: {user.cargo_ubicacion || user.cargo || 'N/A'}</span>
              <span>Oficina: {user.office || user.oficina || 'N/A'}</span>
              <span>Distribución: {user.distribucion || 'N/A'}</span>
            </div>
            <div className="item-actions">
              <button className="btn-edit" onClick={() => onEditUser(user)}>Editar</button>
            </div>
          </li>
        ))}
      </ul>
      {usersPages > 1 && (
        <div className="pagination">
          <button disabled={usersPage === 1} onClick={() => onGoToUsersPage(usersPage - 1)}>‹ Anterior</button>
          <span>Página {usersPage} de {usersPages}</span>
          <button disabled={usersPage === usersPages} onClick={() => onGoToUsersPage(usersPage + 1)}>Siguiente ›</button>
        </div>
      )}
    </section>
  )
}

export default UsersList