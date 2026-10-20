import { useEffect, useState } from 'react'

function UsersModal({ open, usersEndpoint, inventoryFilters = {}, onClose }) {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function loadUsers(currentPage = 1, searchTerm = '') {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(currentPage) })
      if (searchTerm) params.set('users_search', searchTerm)
      // Pass active inventory filters so backend restricts to matched carnets
      if (inventoryFilters.source_sheet) params.set('source_sheet', inventoryFilters.source_sheet)
      if (inventoryFilters.asset_type) params.set('asset_type', inventoryFilters.asset_type)
      if (inventoryFilters.asset_code) params.set('asset_code', inventoryFilters.asset_code)
      if (inventoryFilters.user_card) params.set('user_card', inventoryFilters.user_card)
      if (inventoryFilters.search) params.set('search', inventoryFilters.search)
      const response = await fetch(`${usersEndpoint}?${params}`)
      if (!response.ok) throw new Error('Error cargando usuarios')
      const data = await response.json()
      setUsers(data.results)
      setTotal(data.total)
      setPages(data.pages || 1)
      setPage(currentPage)
    } catch {
      // silencioso
    } finally {
      setLoading(false)
    }
  }

  // Cargar al abrir o cuando cambian los filtros de inventario
  useEffect(() => {
    if (open) {
      setSearchInput('')
      setSearch('')
      loadUsers(1, '')
    }
  }, [open, JSON.stringify(inventoryFilters)])

  // Debounce búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      const term = searchInput.trim()
      setSearch(term)
      loadUsers(1, term)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal users-modal" onClick={(e) => e.stopPropagation()}>
        <div className="users-modal-header">
          <h2>
            Usuarios
            <span className="total-badge">{total.toLocaleString()} registros</span>
          </h2>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="users-modal-search">
          <input
            type="text"
            placeholder="Buscar por nombre, carnet, cargo..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            autoFocus
          />
          {searchInput && (
            <button type="button" className="btn-clear-search" onClick={() => setSearchInput('')} aria-label="Limpiar búsqueda">✕</button>
          )}
        </div>

        {loading && <p className="users-modal-loading">Cargando...</p>}

        {!loading && users.length === 0 && (
          <p className="users-modal-empty">Sin usuarios.</p>
        )}

        <ul className="users-modal-list">
          {users.map((user) => (
            <li key={user.id} className="users-modal-item">
              <strong>{user.name || 'Sin nombre'}</strong>
              <span>Carnet: {user.carnet || 'N/A'}</span>
              <span>Cargo: {user.cargo_ubicacion || user.cargo || 'N/A'}</span>
              <span>Oficina: {user.office || user.oficina || 'N/A'}</span>
              {user.distribucion && <span>Distribución: {user.distribucion}</span>}
            </li>
          ))}
        </ul>

        {pages > 1 && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => loadUsers(page - 1, search)}>‹ Anterior</button>
            <span>Página {page} de {pages}</span>
            <button disabled={page === pages} onClick={() => loadUsers(page + 1, search)}>Siguiente ›</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default UsersModal
