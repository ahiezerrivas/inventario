function UserEditModal({ open, formData, loading, onChange, onSubmit, onClose }) {
  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Editar usuario</h2>
        <form onSubmit={onSubmit}>
          <label>Carnet
            <input name="carnet" value={formData.carnet || ''} onChange={(e) => onChange('carnet', e.target.value)} />
          </label>
          <label>Nombre
            <input name="name" value={formData.name || ''} onChange={(e) => onChange('name', e.target.value)} />
          </label>
          <label>Cargo ubicacion
            <input name="cargo_ubicacion" value={formData.cargo_ubicacion || ''} onChange={(e) => onChange('cargo_ubicacion', e.target.value)} />
          </label>
          <label>Cargo
            <input name="cargo" value={formData.cargo || ''} onChange={(e) => onChange('cargo', e.target.value)} />
          </label>
          <label>Office
            <input name="office" value={formData.office || ''} onChange={(e) => onChange('office', e.target.value)} />
          </label>
          <label>Oficina
            <input name="oficina" value={formData.oficina || ''} onChange={(e) => onChange('oficina', e.target.value)} />
          </label>
          <label>Distribucion
            <input name="distribucion" value={formData.distribucion || ''} onChange={(e) => onChange('distribucion', e.target.value)} />
          </label>
          <div className="modal-actions">
            <button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
            <button type="button" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserEditModal