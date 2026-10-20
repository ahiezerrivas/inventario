function TopNav({ activeView, onSetActiveView, onOpenCreate }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>Inventario Sistema</h1>
      </div>
      <div className="navbar-menu">
        <button
          className={`nav-button ${activeView === 'equipment' ? 'active' : ''}`}
          onClick={() => onSetActiveView('equipment')}
        >
          📦 Equipos
        </button>
        <button
          className={`nav-button ${activeView === 'users' ? 'active' : ''}`}
          onClick={() => onSetActiveView('users')}
        >
          👥 Usuarios
        </button>
        <button
          className="nav-button nav-button-create"
          onClick={onOpenCreate}
        >
          + Nuevo activo
        </button>
      </div>
    </nav>
  )
}

export default TopNav