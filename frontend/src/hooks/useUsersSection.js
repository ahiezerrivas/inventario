import { useEffect, useState } from 'react'

export function useUsersSection({
  activeView,
  usersEndpoint,
  onError,
  onAfterUserSaved,
  downloadReport,
  apiUrl,
}) {
  const [users, setUsers] = useState([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [usersPage, setUsersPage] = useState(1)
  const [usersPages, setUsersPages] = useState(1)
  const [usersSearch, setUsersSearch] = useState('')
  const [usersSearchInput, setUsersSearchInput] = useState('')
  const [usersLoading, setUsersLoading] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [editUserForm, setEditUserForm] = useState({})
  const [editUserLoading, setEditUserLoading] = useState(false)

  async function loadUsers(currentPage = usersPage, searchTerm = usersSearch) {
    setUsersLoading(true)
    onError('')
    setUsersPage(currentPage)
    try {
      const params = new URLSearchParams({ page: String(currentPage) })
      if (searchTerm) params.set('search', searchTerm)
      const response = await fetch(`${usersEndpoint}?${params}`)
      if (!response.ok) throw new Error('No se pudieron cargar los usuarios.')
      const data = await response.json()
      setUsers(data.results)
      setUsersTotal(data.total)
      setUsersPages(data.pages || 1)
    } catch (err) {
      onError(err.message)
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    if (activeView === 'users') {
      loadUsers(1, usersSearch)
    }
  }, [activeView, usersSearch])

  useEffect(() => {
    const timer = setTimeout(() => {
      setUsersSearch(usersSearchInput.trim())
      setUsersPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [usersSearchInput])

  function openEditUser(user) {
    setEditUser(user)
    setEditUserForm({
      carnet: user.carnet || '',
      name: user.name || '',
      cargo_ubicacion: user.cargo_ubicacion || '',
      cargo: user.cargo || '',
      office: user.office || '',
      oficina: user.oficina || '',
      distribucion: user.distribucion || '',
      extra: user.extra || {},
    })
  }

  function closeEditUser() {
    setEditUser(null)
    setEditUserForm({})
  }

  async function onEditUserSubmit(event) {
    event.preventDefault()
    setEditUserLoading(true)
    onError('')
    try {
      const response = await fetch(`${usersEndpoint}${encodeURIComponent(editUser.carnet)}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editUserForm),
      })
      if (!response.ok) throw new Error('No se pudo guardar el usuario.')
      closeEditUser()
      await loadUsers(usersPage, usersSearch)
      await onAfterUserSaved()
    } catch (err) {
      onError(err.message)
    } finally {
      setEditUserLoading(false)
    }
  }

  function goToUsersPage(p) {
    setUsersPage(p)
    loadUsers(p, usersSearch)
  }

  function clearUsersFilters() {
    setUsersSearchInput('')
    setUsersSearch('')
    setUsersPage(1)
  }

  function exportUsersReport() {
    const params = new URLSearchParams()
    if (usersSearch.trim()) params.set('search', usersSearch.trim())
    downloadReport(`${apiUrl}/reports/users/?${params.toString()}`, 'users_report.xlsx', 'users')
  }

  return {
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
    loadUsers,
    openEditUser,
    closeEditUser,
    onEditUserSubmit,
    goToUsersPage,
    clearUsersFilters,
    exportUsersReport,
  }
}