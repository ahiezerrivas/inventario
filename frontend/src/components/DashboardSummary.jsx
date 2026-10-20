import React from 'react';

function SummaryPanel({
  title,
  entries = [],
  loading,
  onEntryClick,
  activeLabel = '',
  onClearActive,
}) {
  return (
    <article className="panel summary-panel">
      <h2>{title}</h2>
      <div className="summary-list">
        {entries.map((entry) => {
          if (onEntryClick) {
            const isActive = String(activeLabel || '').trim().toLowerCase() === String(entry.label || '').trim().toLowerCase();
            return (
              <div className={`summary-row summary-row-interactive ${isActive ? 'is-active' : ''}`} key={entry.label}>
                <button
                  type="button"
                  className="summary-row-main"
                  onClick={() => onEntryClick(entry.label)}
                  title={`Filtrar por ${entry.label}`}
                >
                  <span>{entry.label}</span>
                  <strong>{entry.total}</strong>
                </button>
                {isActive && onClearActive && (
                  <button
                    type="button"
                    className="summary-row-clear"
                    onClick={onClearActive}
                    title={`Quitar filtro ${entry.label}`}
                    aria-label={`Quitar filtro ${entry.label}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          }
          return (
            <div className="summary-row" key={entry.label}>
              <span>{entry.label}</span>
              <strong>{entry.total}</strong>
            </div>
          );
        })}
        {!loading && !entries.length && <p>Sin datos.</p>}
      </div>
    </article>
  );
}

function DashboardSummary({
  summary,
  summaryLoading,
  // Filtros de los paneles inferiores
  onTypeClick,
  onOfficeClick,
  onSourceClick,
  onDistributionClick,
  activeTypeLabel,
  activeOfficeLabel,
  activeSourceLabel,
  activeDistributionLabel,
  onClearType,
  onClearOffice,
  onClearSource,
  onClearDistribution,
  
  // 👈 NUEVOS PROPS DINÁMICOS PARA ESTADOS
  onStatusClick,         // Función única: (statusLabel) => filtrar(statusLabel)
  activeStatusLabel,     // El estado que está seleccionado actualmente
  onClearStatus,         // Función para limpiar el filtro de estado
  
  panelMode = 'all',
}) {
  const allPanels = [
    {
      key: 'by-type',
      title: 'Equipos por tipo',
      entries: summary?.by_type || [],
      onEntryClick: onTypeClick,
      activeLabel: activeTypeLabel,
      onClearActive: onClearType,
    },
    {
      key: 'by-source',
      title: 'Equipos por ubicación',
      entries: summary?.by_source || [],
      onEntryClick: onSourceClick,
      activeLabel: activeSourceLabel,
      onClearActive: onClearSource,
    },
    {
      key: 'user-distribution',
      title: 'Usuarios por distribución',
      entries: summary?.user_distribution || [],
      onEntryClick: onDistributionClick,
      activeLabel: activeDistributionLabel,
      onClearActive: onClearDistribution,
    },
  ];

  const visiblePanels = panelMode === 'equipment'
    ? allPanels.filter((panel) => panel.key !== 'user-distribution')
    : panelMode === 'users'
      ? allPanels.filter((panel) => panel.key === 'user-distribution')
      : allPanels;

  // Extraemos la lista de estados que nos manda el backend dinámicamente
  const statusEntries = summary?.by_status || [];

  return (
    <>
      {/* Sección superior de Tarjetas de Resumen */}
      <section className="summary-grid">
        {/* Tarjeta del total general siempre fija */}
        <article className="panel summary-card">
          <span className="summary-label">Total Equipos</span>
          <strong>{summaryLoading ? '...' : (summary?.inventory_total || 0).toLocaleString()}</strong>
        </article>

        {/* 🚀 RENDERIZADO DINÁMICO DE ESTADOS */}
        {statusEntries.map((statusEntry) => {
          const isSelected = String(activeStatusLabel || '').trim().toLowerCase() === String(statusEntry.label || '').trim().toLowerCase();

          if (onStatusClick) {
            return (
              <div 
                key={statusEntry.label} 
                className={`panel summary-card summary-card-clickable ${isSelected ? 'is-active' : ''}`}
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
              >
                <button
                  type="button"
                  className="summary-card-button"
                  onClick={() => onStatusClick(statusEntry.label)}
                  title={`Ver equipos en estado ${statusEntry.label}`}
                  style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', width: '100%', cursor: 'pointer', color: 'inherit' }}
                >
                  <span className="summary-label">{statusEntry.label}</span>
                  <strong style={{ display: 'block' }}>
                    {summaryLoading ? '...' : (statusEntry.total || 0).toLocaleString()}
                  </strong>
                </button>

                {/* Si está seleccionado, mostramos la 'X' para limpiar el filtro */}
                {isSelected && onClearStatus && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // Evita disparar el click de la tarjeta
                      onClearStatus();
                    }}
                    className="summary-card-clear"
                    title={`Quitar filtro ${statusEntry.label}`}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          }

          // Si no es interactiva la tarjeta, se muestra estática
          return (
            <article className="panel summary-card" key={statusEntry.label}>
              <span className="summary-label">{statusEntry.label}</span>
              <strong>{summaryLoading ? '...' : (statusEntry.total || 0).toLocaleString()}</strong>
            </article>
          );
        })}
      </section>

      {/* Paneles inferiores (Permanecen igual) */}
      <section className={`summary-panels ${visiblePanels.length === 1 ? 'summary-panels-single' : ''}`}>
        {visiblePanels.map((panel) => (
          <SummaryPanel
            key={panel.key}
            title={panel.title}
            entries={panel.entries}
            loading={summaryLoading}
            onEntryClick={panel.onEntryClick}
            activeLabel={panel.activeLabel}
            onClearActive={panel.onClearActive}
          />
        ))}
      </section>
    </>
  );
}

export default DashboardSummary;