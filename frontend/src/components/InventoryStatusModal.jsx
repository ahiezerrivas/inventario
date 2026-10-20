import React, { useState, useEffect } from 'react';
import axios from 'axios'; // O la librería/función fetch que uses en tu proyecto

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname || '127.0.0.1'}:8000/api`

function InventoryStatusModal({ isOpen, onClose, statusToFilter, title, extraFilters = {}, onOpenView }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const extraFiltersKey = JSON.stringify(extraFilters);

  // Resetear a la página 1 cuando cambia el estado o los filtros del dashboard
  useEffect(() => {
    setPage(1);
  }, [statusToFilter, extraFiltersKey]);

  useEffect(() => {
    if (isOpen && statusToFilter) {
      fetchStatusItems();
    }
  }, [isOpen, statusToFilter, extraFiltersKey, page]);

  const fetchStatusItems = async () => {
    setLoading(true);
    setError(null);
    try {
      // 🚀 LLAMADA AL BACKEND: Usamos el nuevo parámetro unificado 'status_filter'
      // Ajusta la URL de tu API según corresponda
      // Incluimos los filtros activos del dashboard (ej. source_sheet, asset_type, office)
      // junto al filtro de estado, descartando los vacíos.
      const activeFilters = Object.fromEntries(
        Object.entries(extraFilters).filter(([, value]) => value !== '' && value != null)
      );

      const response = await axios.get(`${API_URL}/inventory/`, {
        params: {
          ...activeFilters,
          status_filter: statusToFilter.trim().toLowerCase(),
          page: page,
          page_size: pageSize,
        }
      });

      // El backend devuelve datos paginados: { total, page, page_size, pages, results: [...] }
      const data = response.data;
      const list = Array.isArray(data) ? data : (data?.results || []);
      setItems(list);
      setTotal(data?.total || list.length);
      setPageSize(data?.page_size || pageSize);
      setPages(data?.pages || 1);
    } catch (err) {
      console.error("Error al cargar los equipos por estado:", err);
      setError("No se pudieron cargar los equipos para este estado.");
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > pages) return;
    setPage(nextPage);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Cabecera del Modal */}
        <header className="modal-header">
          <h2>{title || `Equipos en estado: ${statusToFilter}`}</h2>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Cerrar modal">
            ✕
          </button>
        </header>

        {/* Cuerpo del Modal */}
        <div className="modal-body">
          {loading && (
            <div className="modal-status-message">
              <span className="spinner"></span> Cargando equipos...
            </div>
          )}

          {error && (
            <div className="modal-status-message error-message">
              ⚠️ {error}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <p className="modal-status-message">No se encontraron equipos en este estado.</p>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="modal-table-wrapper">
              <table className="modal-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Modelo</th>
                    <th>Serial</th>
                    <th>Tipo</th>
                    <th>Oficina / Ubicación</th>
                    <th>Asignado a</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className={onOpenView ? 'modal-row-clickable' : ''}
                      onClick={() => onOpenView && onOpenView(item)}
                      title={onOpenView ? 'Ver detalle del activo' : ''}
                    >
                      <td><strong>{item.id}</strong></td>
                      <td>{item.model || <span className="text-muted">-</span>}</td>
                      <td><code>{item.serial || 'S/N'}</code></td>
                      <td>{item.asset_type || <span className="text-muted">-</span>}</td>
                      <td>{item.office || item.extra?.ubicacion || <span className="text-muted">-</span>}</td>
                      <td>{item.assignee || <span className="text-muted">No asignado</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pie del Modal */}
        <footer className="modal-footer">
          <span className="modal-count-summary">
            Total: <strong>{total}</strong> equipos
          </span>

          {pages > 1 && (
            <div className="modal-pagination">
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => goToPage(page - 1)}
                disabled={page === 1 || loading}
              >
                Anterior
              </button>
              <span className="modal-page-info">
                Página {page} de {pages}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => goToPage(page + 1)}
                disabled={page === pages || loading}
              >
                Siguiente
              </button>
            </div>
          )}

          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </footer>

      </div>
    </div>
  );
}

export default InventoryStatusModal;