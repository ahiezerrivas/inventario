import { useEffect, useState } from 'react'

function normalizeAssetTypeLabel(value) {
  const trimmed = String(value || '').trim()
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

export function useInventorySection({ activeView, endpoint, codesEndpoint, typesEndpoint, onError }) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [sheet, setSheet] = useState('Sede')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [codeFilter, setCodeFilter] = useState('')
  const [userCardFilter, setUserCardFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [equipmentTypes, setEquipmentTypes] = useState([])
  const [codes, setCodes] = useState([])

  async function loadItems(currentPage = page, currentSearch = search) {
    setLoading(true)
    onError('')
    try {
      const params = new URLSearchParams({ source_sheet: sheet, page: currentPage })
      if (currentSearch) params.set('search', currentSearch)
      if (typeFilter.trim()) params.set('asset_type', typeFilter.trim())
      if (codeFilter.trim()) params.set('asset_code', codeFilter.trim())
      if (userCardFilter.trim()) params.set('user_card', userCardFilter.trim())
      const response = await fetch(`${endpoint}?${params}`)
      if (!response.ok) throw new Error('No se pudo cargar el inventario.')
      const data = await response.json()
      setItems(data.results)
      setTotal(data.total)
      setPages(data.pages)
    } catch (err) {
      onError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
    loadItems(1, search)
  }, [sheet, typeFilter, codeFilter, userCardFilter, search])

  useEffect(() => {
    async function loadCodes() {
      try {
        const response = await fetch(codesEndpoint)
        if (!response.ok) throw new Error('No se pudieron cargar los codigos.')
        const data = await response.json()
        setCodes(data.results || [])
      } catch {
        setCodes([])
      }
    }
    if (activeView === 'equipment') loadCodes()
  }, [activeView, codesEndpoint])

  useEffect(() => {
    async function loadEquipmentTypes() {
      try {
        const params = new URLSearchParams()
        if (sheet) params.set('source_sheet', sheet)
        const response = await fetch(`${typesEndpoint}?${params.toString()}`)
        if (!response.ok) throw new Error('No se pudieron cargar los tipos de equipo.')

        const data = await response.json()
        const normalized = (data.results || [])
          .map((type) => normalizeAssetTypeLabel(type))
          .filter(Boolean)

        setEquipmentTypes(normalized)
      } catch {
        setEquipmentTypes([])
      }
    }

    if (activeView === 'equipment') loadEquipmentTypes()
  }, [activeView, sheet, typesEndpoint])

  function goToPage(nextPage) {
    setPage(nextPage)
    loadItems(nextPage, search)
  }

  function clearEquipmentFilters() {
    setTypeFilter('')
    setCodeFilter('')
    setUserCardFilter('')
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  return {
    items,
    total,
    pages,
    page,
    sheet,
    search,
    searchInput,
    typeFilter,
    codeFilter,
    userCardFilter,
    loading,
    equipmentTypes,
    codes,
    setSheet,
    setSearchInput,
    setTypeFilter,
    setCodeFilter,
    setUserCardFilter,
    loadItems,
    goToPage,
    clearEquipmentFilters,
  }
}