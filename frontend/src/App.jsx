import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { getSerialRules } from './reglas'
import DashboardSummary from './components/DashboardSummary'
import EquipmentList from './components/EquipmentList'
import EquipmentControls from './components/EquipmentControls'
import InventoryDetailModal from './components/InventoryDetailModal'
import InventoryFormModal from './components/InventoryFormModal'
import TopNav from './components/TopNav'
import UserEditModal from './components/UserEditModal'
import UsersControls from './components/UsersControls'
import UsersList from './components/UsersList'
import UsersModal from './components/UsersModal'
import InventoryStatusModal from './components/InventoryStatusModal'
// Un solo estado para controlar qué filtro de estado está viendo el usuario en el modal

import { useInventorySection } from './hooks/useInventorySection'
import { useUsersSection } from './hooks/useUsersSection'
import {
  ACCESSORY_TYPE_OPTIONS,
  buildExtraPayload,
  coerceAdditionalAccessories,
  coerceApplications,
  createEmptyApplication,
  createEmptyAccessory,
  createInitialForm,
  EMPTY_EXTRA,
  EQUIPMENT_OPTIONS,
  getAdditionalAccessories,
  getAdditionalApplications,
  getApplications,
} from './inventoryHelpers'

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname || '127.0.0.1'}:8000/api`

function App() {
  const [form, setForm] = useState(createInitialForm('Sede'))
  const [createOpen, setCreateOpen] = useState(false)
  const [createLookupLoading, setCreateLookupLoading] = useState(false)
  const [createLookupMessage, setCreateLookupMessage] = useState('')
  const [createSerialError, setCreateSerialError] = useState('')
  const [error, setError] = useState('')
  const [editItem, setEditItem] = useState(null)     // item en edición (modal)
  const [editForm, setEditForm] = useState({})
  const [editLoading, setEditLoading] = useState(false)
  const [editLookupLoading, setEditLookupLoading] = useState(false)
  const [editLookupMessage, setEditLookupMessage] = useState('')
  const [editSerialError, setEditSerialError] = useState('')
  const [viewItem, setViewItem] = useState(null)      // item en detalle (modal)
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [activeView, setActiveView] = useState('equipment')  // 'equipment' o 'users'
  const [usersModalOpen, setUsersModalOpen] = useState(false)
  
  const [exportingReport, setExportingReport] = useState('')

  const endpoint = useMemo(() => `${API_URL}/inventory/`, [])
  const codesEndpoint = useMemo(() => `${API_URL}/codes/`, [])
  const typesEndpoint = useMemo(() => `${API_URL}/equipment-types/`, [])
  const dashboardEndpoint = useMemo(() => `${API_URL}/dashboard/summary/`, [])
  const usersEndpoint = useMemo(() => `${API_URL}/users/`, [])
const [selectedStatusModal, setSelectedStatusModal] = useState(null);

  const {
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
  } = useInventorySection({
    activeView,
    endpoint,
    codesEndpoint,
    typesEndpoint,
    onError: setError,
  })

  const {
    users,
    usersTotal,
    usersPage,
    usersPages,
    usersSearch,
    usersSearchInput,
    usersLoading,
    editUser,
    editUserForm,
    editUserLoading,
    setUsersSearchInput,
    setEditUserForm,
    openEditUser,
    closeEditUser,
    onEditUserSubmit,
    goToUsersPage,
    clearUsersFilters,
    exportUsersReport,
  } = useUsersSection({
    activeView,
    usersEndpoint,
    onError: setError,
    onAfterUserSaved: loadSummary,
    downloadReport,
    apiUrl: API_URL,
  })

  useEffect(() => {
    loadSummary()
  }, [dashboardEndpoint, sheet, typeFilter, codeFilter, userCardFilter, search, usersSearch])

  useEffect(() => {
    if (!createOpen) return
    const carnet = String(form.extra?.carnet || '').trim()
    if (!carnet) {
      setCreateLookupMessage('')
      return
    }
    const timer = setTimeout(() => {
      autofillByCarnet(carnet)
    }, 450)
    return () => clearTimeout(timer)
  }, [createOpen, form.extra?.carnet])

  useEffect(() => {
    if (!editItem) return
    const carnet = String(editForm.extra?.carnet || '').trim()
    if (!carnet) {
      setEditLookupMessage('')
      return
    }
    const timer = setTimeout(() => {
      autofillEditByCarnet(carnet)
    }, 450)
    return () => clearTimeout(timer)
  }, [editItem, editForm.extra?.carnet])

  function openCreate() {
    setForm(createInitialForm(sheet))
    setCreateLookupMessage('')
    setCreateOpen(true)
  }

  async function loadSummary() {
    setSummaryLoading(true)
    try {
      const params = new URLSearchParams()
      if (sheet) params.set('source_sheet', sheet)
      if (search) params.set('search', search)
      if (typeFilter.trim()) params.set('asset_type', typeFilter.trim())
      if (codeFilter.trim()) params.set('asset_code', codeFilter.trim())
      if (userCardFilter.trim()) params.set('user_card', userCardFilter.trim())
      if (usersSearch.trim()) params.set('users_search', usersSearch.trim())
      const query = params.toString()
      const response = await fetch(query ? `${dashboardEndpoint}?${query}` : dashboardEndpoint)
      if (!response.ok) throw new Error('No se pudo cargar el resumen.')
      const data = await response.json()
      setSummary(data)
    } catch {
      setSummary(null)
    } finally {
      setSummaryLoading(false)
    }
  }

  function closeCreate() {
    setCreateOpen(false)
    setForm(createInitialForm(sheet))
    setCreateLookupMessage('')
    setCreateSerialError('')
  }

  async function autofillByCarnet(carnetValue) {
    const carnet = String((carnetValue ?? form.extra?.carnet) || '').trim()
    if (!carnet) {
      setCreateLookupMessage('')
      setForm((prev) => ({
        ...prev,
        assignee: '',
        office: '',
        extra: {
          ...prev.extra,
          usuario: '',
          oficina: '',
          'cargo ubicacion': '',
          cargo: '',
          distribucion: '',
        },
      }))
      return
    }

    setCreateLookupLoading(true)
    setCreateLookupMessage('Buscando usuario...')
    try {
      const response = await fetch(`${usersEndpoint}${encodeURIComponent(carnet)}/`)
      if (response.status === 404) {
        setCreateLookupMessage('No se encontro usuario para ese carnet.')
        return
      }
      if (!response.ok) throw new Error('No se pudo consultar el carnet.')

      const user = await response.json()
      setForm((prev) => ({
        ...prev,
        assignee: user.name || prev.assignee,
        office: user.office || user.oficina || prev.office,
        extra: {
          ...prev.extra,
          carnet: user.carnet || prev.extra.carnet,
          usuario: user.name || prev.extra.usuario,
          oficina: user.oficina || user.office || prev.extra.oficina,
          'cargo ubicacion': user.cargo_ubicacion || prev.extra['cargo ubicacion'],
          cargo: user.cargo || prev.extra.cargo,
          distribucion: user.distribucion || prev.extra.distribucion,
        },
      }))
      setCreateLookupMessage('Usuario cargado automaticamente.')
    } catch (err) {
      setCreateLookupMessage(err.message)
    } finally {
      setCreateLookupLoading(false)
    }
  }

  function exportInventoryReport() {
    const params = new URLSearchParams()
    if (sheet) params.set('source_sheet', sheet)
    if (search) params.set('search', search)
    if (typeFilter.trim()) params.set('asset_type', typeFilter.trim())
    if (codeFilter.trim()) params.set('asset_code', codeFilter.trim())
    if (userCardFilter.trim()) params.set('user_card', userCardFilter.trim())
    downloadReport(
      `${API_URL}/reports/inventory/?${params.toString()}`,
      'INVENTARIO GENERAL PROYECTO ACTUALIZACION TECNOLOGICA.xlsx',
      'inventory'
    )
  }

  function openEdit(item) {
    setEditItem(item)
    setEditLookupMessage('')
    setEditForm({
      source_sheet: item.source_sheet,
      asset_code: item.asset_code,
      asset_type: item.asset_type,
      model: item.model,
      serial: item.serial || item.extra?.['serial equipo'] || item.extra?.serial || '',
      assignee: item.assignee,
      office: item.office,
      status: item.status || '',
      extra: {
        ...EMPTY_EXTRA,
        ...(item.extra || {}),
        additional_accessories: coerceAdditionalAccessories(item.extra?.additional_accessories),
        applications: coerceApplications(item.extra?.applications),
        additional_applications: coerceApplications(item.extra?.additional_applications),
      },
    })
  }

  function closeEdit() {
    setEditItem(null)
    setEditForm({})
    setEditLookupMessage('')
    setEditSerialError('')
  }

  function normalizeSerial(value) {
    return String(value || '').trim().toLowerCase()
  }

  async function checkDuplicateSerial(serialValue, excludeId = null) {
    const serial = String(serialValue || '').trim()
    if (!serial) return ''

    try {
      const params = new URLSearchParams({ search: serial, page: '1' })
      const response = await fetch(`${endpoint}?${params}`)
      if (!response.ok) return ''
      const data = await response.json()
      const duplicate = (data.results || []).some((item) => {
        const current = normalizeSerial(item.serial)
        const extraSerial = normalizeSerial(item.extra?.['serial equipo'])
        const extraFallback = normalizeSerial(item.extra?.serial)
        const matches = [current, extraSerial, extraFallback].includes(normalizeSerial(serial))
        const sameItem = excludeId ? item.id === excludeId : false
        return matches && !sameItem
      })
      return duplicate ? 'El serial ya existe. No se permiten seriales duplicados.' : ''
    } catch {
      return ''
    }
  }

  async function validateCreateSerial() {
    const serialToValidate = form.serial || form.extra?.['serial equipo'] || form.extra?.serial || ''
    const msg = await checkDuplicateSerial(serialToValidate)
    setCreateSerialError(msg)
    return !msg
  }

  async function validateEditSerial() {
    const serialToValidate = editForm.serial || editForm.extra?.['serial equipo'] || editForm.extra?.serial || ''
    const msg = await checkDuplicateSerial(serialToValidate, editItem?.id)
    setEditSerialError(msg)
    return !msg
  }

  async function autofillEditByCarnet(carnetValue) {
    const carnet = String((carnetValue ?? editForm.extra?.carnet) || '').trim()
    if (!carnet) {
      setEditLookupMessage('')
      return
    }

    setEditLookupLoading(true)
    setEditLookupMessage('Buscando usuario...')
    try {
      const response = await fetch(`${usersEndpoint}${encodeURIComponent(carnet)}/`)
      if (response.status === 404) {
        setEditLookupMessage('No se encontro usuario para ese carnet.')
        return
      }
      if (!response.ok) throw new Error('No se pudo consultar el carnet.')

      const user = await response.json()
      setEditForm((prev) => ({
        ...prev,
        assignee: user.name || prev.assignee,
        office: user.office || user.oficina || prev.office,
        extra: {
          ...(prev.extra || {}),
          carnet: user.carnet || prev.extra?.carnet || '',
          usuario: user.name || prev.extra?.usuario || '',
          oficina: user.oficina || user.office || prev.extra?.oficina || '',
          'cargo ubicacion': user.cargo_ubicacion || prev.extra?.['cargo ubicacion'] || '',
          cargo: user.cargo || prev.extra?.cargo || '',
          distribucion: user.distribucion || prev.extra?.distribucion || '',
        },
      }))
      setEditLookupMessage('Usuario cargado automaticamente.')
    } catch (err) {
      setEditLookupMessage(err.message)
    } finally {
      setEditLookupLoading(false)
    }
  }

  function openView(item) {
    setViewItem(item)
  }

  function closeView() {
    setViewItem(null)
  }

  async function onEditSubmit(e) {
    e.preventDefault()
    const serialOk = await validateEditSerial()
    if (!serialOk) return
    setEditLoading(true)
    try {
      const extra = buildExtraPayload(editForm.extra || {})
      const payload = {
        ...editForm,
        asset_code: editForm.asset_code || extra['cod.'] || '',
        serial: editForm.serial || extra['serial equipo'] || '',
        assignee: editForm.assignee || extra.usuario || '',
        office: editForm.office || extra.oficina || '',
        asset_type: editForm.asset_type || extra['tipo de equipo'] || '',
        model: editForm.model || extra.modelo || '',
        extra,
      }
      const res = await fetch(`${endpoint}${editItem.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('No se pudo guardar.')
      closeEdit()
      await loadItems(page, search)
      await loadSummary()
    } catch (err) {
      setError(err.message)
    } finally {
      setEditLoading(false)
    }
  }

  async function onDelete(item) {
    if (!window.confirm(`¿Eliminar "${item.model || item.asset_code || item.id}"?`)) return
    try {
      const res = await fetch(`${endpoint}${item.id}/`, { method: 'DELETE' })
      if (!res.ok) throw new Error('No se pudo eliminar.')
      await loadItems(page, search)
      await loadSummary()
    } catch (err) {
      setError(err.message)
    }
  }

  function onChange(event) {
    const { name, value } = event.target
    if (name === 'source_sheet') {
      setForm((prev) => ({
        ...prev,
        source_sheet: value,
        extra: {
          ...prev.extra,
          ubicacion: value,
        },
      }))
      return
    }
    if (name.startsWith('extra.')) {
      const extraKey = name.replace('extra.', '')
      const serialRules = (extraKey === 'serial equipo' || extraKey === 'serial') ? getSerialRules(value) : null
      setForm((prev) => ({
        ...prev,
        ...(extraKey === 'tipo de equipo' ? { asset_type: value } : {}),
        ...(extraKey === 'modelo' ? { model: value } : {}),
        ...(extraKey === 'serial equipo' ? { serial: value } : {}),
        ...(extraKey === 'usuario' ? { assignee: value } : {}),
        ...(extraKey === 'oficina' ? { office: value } : {}),
        ...(extraKey === 'cod.' ? { asset_code: value } : {}),
        ...(serialRules ? { asset_type: serialRules.asset_type, model: serialRules.model } : {}),
        extra: {
          ...prev.extra,
          [extraKey]: value,
          ...(serialRules?.extra || {}),
        },
      }))
      return
    }
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function onEditChange(event) {
    const { name, value } = event.target
    if (name === 'source_sheet') {
      setEditForm((prev) => ({
        ...prev,
        source_sheet: value,
        extra: {
          ...(prev.extra || {}),
          ubicacion: value,
        },
      }))
      return
    }
    if (name.startsWith('extra.')) {
      const extraKey = name.replace('extra.', '')
      const isSpareUser = extraKey === 'usuario' && value.toLowerCase().includes('spare')
      const isEmptyCarnet = extraKey === 'carnet' && !value.trim()
      const serialRules = (extraKey === 'serial equipo' || extraKey === 'serial') ? getSerialRules(value) : null
      setEditForm((prev) => ({
        ...prev,
        ...(serialRules ? { asset_type: serialRules.asset_type, model: serialRules.model } : {}),
        assignee: isEmptyCarnet ? '' : extraKey === 'usuario' ? value : prev.assignee,
        office: isEmptyCarnet ? '' : isSpareUser ? 'Soporte' : prev.office,
        extra: {
          ...(prev.extra || {}),
          [extraKey]: value,
          ...(serialRules?.extra || {}),
          ...(isEmptyCarnet
            ? {
                usuario: '',
                oficina: '',
                'cargo ubicacion': '',
                cargo: '',
                distribucion: '',
              }
            : {}),
          ...(isSpareUser
            ? {
                carnet: '',
                ext: '',
                'cod.': '',
                'piso region': '11',
                oficina: 'Soporte',
                cargo: 'Equipo para spare',
                'cargo ubicacion': 'Equipo para spare',
              }
            : {}),
        },
      }))
      return
    }
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  function updateCreateAccessory(index, field, value) {
    setForm((prev) => {
      const accessories = coerceAdditionalAccessories(prev.extra?.additional_accessories)
      accessories[index] = {
        ...createEmptyAccessory(),
        ...(accessories[index] || {}),
        [field]: value,
      }

      return {
        ...prev,
        extra: {
          ...prev.extra,
          additional_accessories: accessories,
        },
      }
    })
  }

  function addCreateAccessory() {
    setForm((prev) => ({
      ...prev,
      extra: {
        ...prev.extra,
        additional_accessories: [...coerceAdditionalAccessories(prev.extra?.additional_accessories), createEmptyAccessory()],
      },
    }))
  }

  function removeCreateAccessory(index) {
    setForm((prev) => ({
      ...prev,
      extra: {
        ...prev.extra,
        additional_accessories: coerceAdditionalAccessories(prev.extra?.additional_accessories).filter((_, currentIndex) => currentIndex !== index),
      },
    }))
  }

  function updateEditAccessory(index, field, value) {
    setEditForm((prev) => {
      const accessories = coerceAdditionalAccessories(prev.extra?.additional_accessories)
      accessories[index] = {
        ...createEmptyAccessory(),
        ...(accessories[index] || {}),
        [field]: value,
      }

      return {
        ...prev,
        extra: {
          ...(prev.extra || {}),
          additional_accessories: accessories,
        },
      }
    })
  }

  function addEditAccessory() {
    setEditForm((prev) => ({
      ...prev,
      extra: {
        ...(prev.extra || {}),
        additional_accessories: [...coerceAdditionalAccessories(prev.extra?.additional_accessories), createEmptyAccessory()],
      },
    }))
  }

  function removeEditAccessory(index) {
    setEditForm((prev) => ({
      ...prev,
      extra: {
        ...(prev.extra || {}),
        additional_accessories: coerceAdditionalAccessories(prev.extra?.additional_accessories).filter((_, currentIndex) => currentIndex !== index),
      },
    }))
  }

  function updateCreateApplication(listKey, index, field, value) {
    setForm((prev) => {
      const applications = coerceApplications(prev.extra?.[listKey])
      applications[index] = {
        ...createEmptyApplication(),
        ...(applications[index] || {}),
        [field]: value,
      }

      return {
        ...prev,
        extra: {
          ...prev.extra,
          [listKey]: applications,
        },
      }
    })
  }

  function addCreateApplication(listKey) {
    setForm((prev) => ({
      ...prev,
      extra: {
        ...prev.extra,
        [listKey]: [...coerceApplications(prev.extra?.[listKey]), createEmptyApplication()],
      },
    }))
  }

  function removeCreateApplication(listKey, index) {
    setForm((prev) => ({
      ...prev,
      extra: {
        ...prev.extra,
        [listKey]: coerceApplications(prev.extra?.[listKey]).filter((_, currentIndex) => currentIndex !== index),
      },
    }))
  }

  function updateEditApplication(listKey, index, field, value) {
    setEditForm((prev) => {
      const applications = coerceApplications(prev.extra?.[listKey])
      applications[index] = {
        ...createEmptyApplication(),
        ...(applications[index] || {}),
        [field]: value,
      }

      return {
        ...prev,
        extra: {
          ...(prev.extra || {}),
          [listKey]: applications,
        },
      }
    })
  }

  function addEditApplication(listKey) {
    setEditForm((prev) => ({
      ...prev,
      extra: {
        ...(prev.extra || {}),
        [listKey]: [...coerceApplications(prev.extra?.[listKey]), createEmptyApplication()],
      },
    }))
  }

  function removeEditApplication(listKey, index) {
    setEditForm((prev) => ({
      ...prev,
      extra: {
        ...(prev.extra || {}),
        [listKey]: coerceApplications(prev.extra?.[listKey]).filter((_, currentIndex) => currentIndex !== index),
      },
    }))
  }

  async function onSubmit(event) {
    event.preventDefault()
    const serialOk = await validateCreateSerial()
    if (!serialOk) return
    setError('')
    try {
      const extra = buildExtraPayload(form.extra || {})
      const payload = {
        ...form,
        asset_code: form.asset_code || extra['cod.'] || '',
        serial: form.serial || extra['serial equipo'] || '',
        assignee: form.assignee || extra.usuario || '',
        office: form.office || extra.oficina || '',
        asset_type: form.asset_type || extra['tipo de equipo'] || '',
        model: form.model || extra.modelo || '',
        extra,
      }
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('No se pudo guardar el activo.')

      closeCreate()
      await loadItems()
      await loadSummary()
    } catch (err) {
      setError(err.message)
    }
  }

  async function downloadReport(url, fallbackName, reportType) {
    setError('')
    setExportingReport(reportType)
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error('No se pudo exportar el reporte.')

      const blob = await response.blob()
      const contentDisposition = response.headers.get('content-disposition') || ''
      const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
      const fileName = fileNameMatch?.[1] || fallbackName

      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(objectUrl)
    } catch (err) {
      setError(err.message)
    } finally {
      setExportingReport('')
    }
  }

  function handleTypeSummaryClick(label) {
    setActiveView('equipment')
    setTypeFilter(String(label || '').trim())
  }

  function handleOfficeSummaryClick(label) {
    setActiveView('equipment')
    setSearchInput(String(label || '').trim())
  }

  function handleSourceSummaryClick(label) {
    const nextSource = String(label || '').trim()
    if (!nextSource) return

    setActiveView('equipment')
    setSheet(nextSource)
    if (nextSource === 'Sede' || nextSource === 'Oficina') {
      setForm((prev) => ({ ...prev, source_sheet: nextSource }))
    }
  }

  function handleDistributionSummaryClick(label) {
    const searchTerm = String(label || '').trim()
    if (!searchTerm) return

    setActiveView('users')
    setUsersSearchInput(searchTerm)
  }


  const handleStatusCardClick = (label) => {
  // Al hacer clic, simplemente guardamos el nombre del estado (ej: "Embalado", "Spare", "Filial")
  setSelectedStatusModal(label);
  console.log(selectedStatusModal)
};
  return (
    <main className="page">
      <TopNav activeView={activeView} onSetActiveView={setActiveView} onOpenCreate={openCreate} />

      {activeView === 'equipment' && (
        <>
          <EquipmentControls
            sheet={sheet}
            onSheetChange={(e) => {
              const nextSheet = e.target.value
              setSheet(nextSheet)
              if (nextSheet === 'Sede' || nextSheet === 'Oficina') {
                setForm((prev) => ({ ...prev, source_sheet: nextSheet }))
              }
            }}
            typeFilter={typeFilter}
            onTypeFilterChange={(e) => setTypeFilter(e.target.value)}
            equipmentTypes={equipmentTypes}
            fallbackEquipmentOptions={EQUIPMENT_OPTIONS}
            codeFilter={codeFilter}
            onCodeFilterChange={(e) => setCodeFilter(e.target.value)}
            codes={codes}
            userCardFilter={userCardFilter}
            onUserCardFilterChange={(e) => setUserCardFilter(e.target.value)}
            searchInput={searchInput}
            onSearchInputChange={(e) => setSearchInput(e.target.value)}
            onClearSearch={() => setSearchInput('')}
            onClearFilters={clearEquipmentFilters}
            onExport={exportInventoryReport}
            exporting={exportingReport === 'inventory'}
          />

      <DashboardSummary
        summary={summary}
        summaryLoading={summaryLoading}
        onTypeClick={handleTypeSummaryClick}
        onOfficeClick={handleOfficeSummaryClick}
        onSourceClick={handleSourceSummaryClick}
        onDistributionClick={handleDistributionSummaryClick}
        activeTypeLabel={typeFilter}
        activeOfficeLabel={searchInput}
        activeSourceLabel={sheet}
        onClearType={() => setTypeFilter('')}
        onClearOffice={() => setSearchInput('')}
        onClearSource={() => setSheet('')}
        
        // 🚀 PROPS COMPLETAMENTE DINÁMICAS ASIGNADAS AL COMPONENTE HIJO
        onStatusClick={handleStatusCardClick} 
        activeStatusLabel={selectedStatusModal} 
        onClearStatus={() => setSelectedStatusModal(null)} 
        
        panelMode="equipment"
      />

      <EquipmentList
        items={items}
        loading={loading}
        total={total}
        pages={pages}
        page={page}
        search={search}
        sheet={sheet}
        typeFilter={typeFilter}
        codeFilter={codeFilter}
        userCardFilter={userCardFilter}
        onOpenView={openView}
        onOpenEdit={openEdit}
        onDelete={onDelete}
        onGoToPage={goToPage}
        getAdditionalAccessories={getAdditionalAccessories}
      />
        </>
      )}

      {activeView === 'users' && (
        <>
          <UsersControls
            usersSearchInput={usersSearchInput}
            onUsersSearchInputChange={(e) => setUsersSearchInput(e.target.value)}
            onClearUsersSearch={() => setUsersSearchInput('')}
            onClearFilters={clearUsersFilters}
            onExport={exportUsersReport}
            exporting={exportingReport === 'users'}
          />

          <UsersList
            users={users}
            usersLoading={usersLoading}
            usersTotal={usersTotal}
            usersPages={usersPages}
            usersPage={usersPage}
            usersSearch={usersSearch}
            onEditUser={openEditUser}
            onGoToUsersPage={goToUsersPage}
          />
        </>
      )}

      {error && <p className="error">{error}</p>}

      <InventoryFormModal
        open={createOpen}
        title="Nuevo activo"
        formData={form}
        onChange={onChange}
        equipmentOptions={EQUIPMENT_OPTIONS}
        serialError={createSerialError}
        lookupLoading={createLookupLoading}
        lookupMessage={createLookupMessage}
        onCarnetBlur={(e) => autofillByCarnet(e.target.value)}
        onCarnetEnter={autofillByCarnet}
        onSerialBlur={validateCreateSerial}
        allowEquipmentTypeSelect
        accessoryTypeOptions={ACCESSORY_TYPE_OPTIONS}
        accessories={coerceAdditionalAccessories(form.extra?.additional_accessories)}
        onAddAccessory={addCreateAccessory}
        onChangeAccessory={updateCreateAccessory}
        onRemoveAccessory={removeCreateAccessory}
        applications={coerceApplications(form.extra?.applications)}
        additionalApplications={coerceApplications(form.extra?.additional_applications)}
        onAddApplication={(listKey) => addCreateApplication(listKey)}
        onChangeApplication={(listKey, index, field, value) => updateCreateApplication(listKey, index, field, value)}
        onRemoveApplication={(listKey, index) => removeCreateApplication(listKey, index)}
        onSubmit={onSubmit}
        onClose={closeCreate}
        submitLabel="Guardar"
        submitDisabled={Boolean(createSerialError)}
      />

      {/* 📦 UN ÚNICO MODAL GENÉRICO E INTELIGENTE (fuera de las vistas para que abra en cualquiera) */}
      {selectedStatusModal && (
        <InventoryStatusModal
          isOpen={Boolean(selectedStatusModal)}
          onClose={() => setSelectedStatusModal(null)}
          statusToFilter={selectedStatusModal}
          title={`Equipos en Estado: ${selectedStatusModal}`}
          extraFilters={{
            source_sheet: sheet,
            asset_type: typeFilter,
            asset_code: codeFilter,
            user_card: userCardFilter,
            search: search,
          }}
          onOpenView={openView}
        />
      )}

      <InventoryDetailModal
        open={Boolean(viewItem)}
        item={viewItem}
        accessories={getAdditionalAccessories(viewItem)}
        applications={getApplications(viewItem)}
        additionalApplications={getAdditionalApplications(viewItem)}
        onClose={closeView}
        onEdit={() => { closeView(); openEdit(viewItem) }}
      />

      <InventoryFormModal
        open={Boolean(editItem)}
        title="Editar activo"
        formData={editForm}
        onChange={onEditChange}
        equipmentOptions={EQUIPMENT_OPTIONS}
        serialError={editSerialError}
        lookupLoading={editLookupLoading}
        lookupMessage={editLookupMessage}
        onCarnetBlur={(e) => autofillEditByCarnet(e.target.value)}
        onSerialBlur={validateEditSerial}
        accessoryTypeOptions={ACCESSORY_TYPE_OPTIONS}
        accessories={coerceAdditionalAccessories(editForm.extra?.additional_accessories)}
        onAddAccessory={addEditAccessory}
        onChangeAccessory={updateEditAccessory}
        onRemoveAccessory={removeEditAccessory}
        applications={coerceApplications(editForm.extra?.applications)}
        additionalApplications={coerceApplications(editForm.extra?.additional_applications)}
        onAddApplication={(listKey) => addEditApplication(listKey)}
        onChangeApplication={(listKey, index, field, value) => updateEditApplication(listKey, index, field, value)}
        onRemoveApplication={(listKey, index) => removeEditApplication(listKey, index)}
        onSubmit={onEditSubmit}
        onClose={closeEdit}
        submitLabel={editLoading ? 'Guardando...' : 'Guardar'}
        submitDisabled={editLoading || Boolean(editSerialError)}
      />

      <UserEditModal
        open={Boolean(editUser)}
        formData={editUserForm}
        loading={editUserLoading}
        onChange={(field, value) => setEditUserForm((prev) => ({ ...prev, [field]: value }))}
        onSubmit={onEditUserSubmit}
        onClose={closeEditUser}
      />

     

      <UsersModal
        open={usersModalOpen}
        usersEndpoint={usersEndpoint}
        inventoryFilters={{
          source_sheet: sheet,
          asset_type: typeFilter,
          asset_code: codeFilter,
          user_card: userCardFilter,
          search: search,
        }}
        onClose={() => setUsersModalOpen(false)}
      />

    </main>
  )
}

export default App
