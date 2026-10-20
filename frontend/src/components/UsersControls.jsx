function UsersControls({
  usersSearchInput,
  onUsersSearchInputChange,
  onClearUsersSearch,
  onClearFilters,
  onExport,
  exporting,
}) {
  return (
    <section className="panel controls">
      <div className="search-form">
        <input
          placeholder="Buscar carnet, nombre, oficina..."
          value={usersSearchInput}
          onChange={onUsersSearchInputChange}
        />
        {usersSearchInput && (
          <button type="button" onClick={onClearUsersSearch}>✕</button>
        )}
      </div>

      <button type="button" onClick={onClearFilters}>Limpiar filtros</button>
      <button type="button" onClick={onExport}>
        {exporting ? (
          <>
            <span className="spinner" aria-hidden="true"></span>
            Exportando...
          </>
        ) : (
          'Exportar Excel'
        )}
      </button>
    </section>
  )
}

export default UsersControls