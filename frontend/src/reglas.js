export const SERIAL_PREFIX_RULES = [
  {
    prefix: 'MXL3061',
    asset_type: 'PC',
    model: 'Compaq Pro 6300 SFF',
    extra: {
      'tipo de equipo': 'PC',
      marca: 'HP',
      modelo: 'Compaq Pro 6300 SFF',
    },
  },
  {
    prefix: '5CD6190',
    asset_type: 'PC',
    model: 'ProBook 440 G3',
    extra: {
      'tipo de equipo': 'PC',
      marca: 'HP',
      modelo: 'ProBook 440 G3',
    },
  },
  {
    prefix: '4CE3',
    asset_type: 'PC',
    model: 'Pro SFF 400 G9',
    extra: {
      'tipo de equipo': 'PC',
      marca: 'HP',
      modelo: 'Pro SFF 400 G9',
    },
  },
  {
    prefix: '5CD9',
    asset_type: 'PC',
    model: 'ProBook 440 G6',
    extra: {
      'tipo de equipo': 'PC',
      marca: 'HP',
      modelo: 'ProBook 440 G6',
    },
  },
  {
    prefix: '5CD8',
    asset_type: 'PC',
    model: 'ProBook 450 G5',
    extra: {
      'tipo de equipo': 'PC',
      marca: 'HP',
      modelo: 'ProBook 450 G5',
    },
  },
]

export function getSerialRules(serialValue) {
  const serial = String(serialValue || '').trim().toUpperCase()
  if (!serial) return null

  const rule = SERIAL_PREFIX_RULES.find((item) => serial.startsWith(item.prefix))
  if (!rule) return null

  return {
    asset_type: rule.asset_type,
    model: rule.model,
    extra: { ...(rule.extra || {}) },
  }
}
