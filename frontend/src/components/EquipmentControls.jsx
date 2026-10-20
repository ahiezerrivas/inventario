function EquipmentControls({
  sheet,
  onSheetChange,
  typeFilter,
  onTypeFilterChange,
  equipmentTypes,
  fallbackEquipmentOptions,
  codeFilter,
  onCodeFilterChange,
  codes,
  userCardFilter,
  onUserCardFilterChange,
  searchInput,
  onSearchInputChange,
  onClearSearch,
  onClearFilters,
  onExport,
  exporting,
}) {
  const normalizeAssetTypeLabel = (type) => {
    const trimmed = String(type || '').trim()
    if (!trimmed) return ''

    const canonicalByLower = {
      pc: 'PC',
      kiosko: 'KIOSKO',
      laptop: 'Laptop',
      server: 'Server',
      tablet: 'Tablet',
    }

    return canonicalByLower[trimmed.toLowerCase()] || trimmed
  }

  const normalizedFallback = Array.isArray(fallbackEquipmentOptions)
    ? fallbackEquipmentOptions.map((type) => normalizeAssetTypeLabel(type)).filter(Boolean)
    : []

  const normalizedDynamic = Array.isArray(equipmentTypes)
    ? equipmentTypes.map((type) => normalizeAssetTypeLabel(type)).filter(Boolean)
    : []

  const dedupedOptionsByLower = new Map()
  ;[...normalizedFallback, ...normalizedDynamic].forEach((type) => {
    const key = type.toLowerCase()
    if (!dedupedOptionsByLower.has(key)) dedupedOptionsByLower.set(key, type)
  })

  const mergedTypeOptions = [...dedupedOptionsByLower.values()]
  const selectedTypeValue = normalizeAssetTypeLabel(typeFilter)

  return (
    <section className="panel controls">
      <select id="sheet" value={sheet} onChange={onSheetChange}>
        <option value="">Todos</option>
        <option value="Sede">Sede</option>
        <option value="Oficina">Oficina</option>
      </select>

      <select className="quick-filter" value={selectedTypeValue} onChange={onTypeFilterChange}>
        <option value="">Todos los tipos</option>
        {mergedTypeOptions.map((type) => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>

      <input
        className="quick-filter"
        list="code-options"
        placeholder="Filtrar por codigo"
        value={codeFilter}
        onChange={onCodeFilterChange}
      />
      <datalist id="code-options">
        {codes.map((code) => (
          <option key={code} value={code} />
        ))}
      </datalist>

      <input
        className="quick-filter"
        placeholder="Filtrar por carnet o usuario"
        value={userCardFilter}
        onChange={onUserCardFilterChange}
      />

      <div className="search-form">
        <input
          placeholder="Buscar por serial, usuario, modelo, tipo, oficina o carnet..."
          value={searchInput}
          onChange={onSearchInputChange}
        />
        {searchInput && (
          <button type="button" onClick={onClearSearch}>✕</button>
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

export default EquipmentControls