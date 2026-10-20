export const EQUIPMENT_OPTIONS = ['PC', 'KIOSKO', 'Laptop', 'server', 'Tablet']

export const ACCESSORY_TYPE_OPTIONS = ['Mouse', 'Teclado', 'Monitor', 'Dock', 'Headset', 'Camara', 'Telefono IP', 'UPS', 'Cargador', 'Adaptador', 'Otro']

export const EXTRA_FIELDS = [
  ['serial equipo', 'serial equipo'],
  ['hostname ip', 'hostname ip'],
  ['ubicacion', 'ubicacion'],
  ['tipo de equipo', 'tipo de equipo'],
  ['usuario', 'usuario'],
  ['carnet', 'carnet'],
  ['ext', 'ext'],
  ['cod.', 'cod.'],
  ['oficina', 'oficina'],
  ['piso region', 'piso region'],
  ['cargo ubicacion', 'cargo ubicacion'],
  ['sistema operativo', 'sistema operativo'],
  ['marca', 'marca'],
  ['modelo', 'modelo'],
  ['equipo especial', 'equipo especial'],
  ['personal retirado transferido', 'personal retirado transferido'],
  ['fecha de actualizacion', 'fecha de actualizacion'],
  ['observaciones', 'observaciones'],
  ['segmento', 'segmento'],
  ['pcn ene 2026', 'pcn ene 2026'],
  ['mem2', 'mem2'],
  ['dd', 'dd'],
  ['distribucion', 'distribucion'],
  ['estatus agencia', 'estatus agencia'],
  ['dispositivo de conexion', 'dispositivo de conexion'],
  ['serial dispositivo', 'serial dispositivo'],
  ['sim card', 'sim card'],
  ['operadora', 'operadora'],
  ['equipo de proteccion', 'equipo de proteccion'],
  ['serial', 'serial'],
  ['grupo', 'grupo'],
]

export const EMPTY_EXTRA = Object.fromEntries(EXTRA_FIELDS.map(([key]) => [key, '']))

export function createEmptyAccessory() {
  return {
    accessory_type: '',
    serial: '',
    description: '',
    notes: '',
  }
}

export function createEmptyApplication() {
  return {
    name: '',
    version: '',
    license: '',
    notes: '',
  }
}

export function coerceAdditionalAccessories(value) {
  if (!Array.isArray(value)) return []

  return value.map((accessory) => ({
    ...createEmptyAccessory(),
    ...(accessory && typeof accessory === 'object' ? accessory : {}),
  }))
}

export function sanitizeAdditionalAccessories(value) {
  return coerceAdditionalAccessories(value)
    .map((accessory) => ({
      accessory_type: String(accessory.accessory_type || '').trim(),
      serial: String(accessory.serial || '').trim(),
      description: String(accessory.description || '').trim(),
      notes: String(accessory.notes || '').trim(),
    }))
    .filter((accessory) => Object.values(accessory).some(Boolean))
}

export function coerceApplications(value) {
  if (!Array.isArray(value)) return []

  return value.map((application) => ({
    ...createEmptyApplication(),
    ...(application && typeof application === 'object' ? application : {}),
  }))
}

export function sanitizeApplications(value) {
  return coerceApplications(value)
    .map((application) => ({
      name: String(application.name || '').trim(),
      version: String(application.version || '').trim(),
      license: String(application.license || '').trim(),
      notes: String(application.notes || '').trim(),
    }))
    .filter((application) => Object.values(application).some(Boolean))
}

export function buildExtraPayload(extra = {}) {
  const accessories = sanitizeAdditionalAccessories(extra.additional_accessories)
  const applications = sanitizeApplications(extra.applications)
  const additionalApplications = sanitizeApplications(extra.additional_applications)

  const payload = Object.fromEntries(
    Object.entries(extra).filter(
      ([key, value]) => !['additional_accessories', 'applications', 'additional_applications'].includes(key)
        && String(value || '').trim() !== ''
    )
  )

  if (accessories.length) {
    payload.additional_accessories = accessories
  }

  if (applications.length) {
    payload.applications = applications
  }

  if (additionalApplications.length) {
    payload.additional_applications = additionalApplications
  }

  return payload
}

export function getAdditionalAccessories(itemOrExtra) {
  const extra = itemOrExtra?.extra || itemOrExtra || {}
  return sanitizeAdditionalAccessories(extra.additional_accessories)
}

export function getApplications(itemOrExtra) {
  const extra = itemOrExtra?.extra || itemOrExtra || {}
  return sanitizeApplications(extra.applications)
}

export function getAdditionalApplications(itemOrExtra) {
  const extra = itemOrExtra?.extra || itemOrExtra || {}
  return sanitizeApplications(extra.additional_applications)
}

export function createInitialForm(sourceSheet = 'Sede') {
  return {
    source_sheet: sourceSheet,
    asset_code: '',
    asset_type: '',
    model: '',
    serial: '',
    assignee: '',
    office: '',
    status: '',
    extra: {
      ...EMPTY_EXTRA,
      additional_accessories: [],
      applications: [],
      additional_applications: [],
    },
  }
}