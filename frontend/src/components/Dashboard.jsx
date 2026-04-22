import { useState, useMemo } from 'react'
import VsCard from './VsCard'

export default function Dashboard({ session, vsList, onSelectVs, onLogout, onRefresh, refreshing }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return vsList
    return vsList.filter(vs =>
      vs.name.toLowerCase().includes(q) ||
      vs.destination.toLowerCase().includes(q) ||
      (vs.poolName || '').toLowerCase().includes(q) ||
      (vs.description || '').toLowerCase().includes(q)
    )
  }, [vsList, search])

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="topbar-brand">
          <span className="topbar-badge">F5</span>
          <span className="topbar-title">BIG-IP Visualizer</span>
        </div>
        <span className="topbar-host">{session.host}</span>

        <div className="topbar-stats">
          <span className="topbar-stat">Total<span>{vsList.length}</span></span>
          {vsList.some(v => !v.enabled) && (
            <span className="topbar-stat">Desabilitados<span>{vsList.filter(v => !v.enabled).length}</span></span>
          )}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            className="btn btn-ghost"
            style={{ padding: '5px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={onRefresh}
            disabled={refreshing}
            title="Recarregar lista de VSs"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                 style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}>
              <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            {refreshing ? 'Atualizando…' : 'Atualizar'}
          </button>
          <button className="btn btn-ghost" style={{ padding: '5px 14px', fontSize: 12 }} onClick={onLogout}>
            Sair
          </button>
        </div>
      </div>

      <div className="dashboard">
        <div className="search-bar">
          <div className="search-input-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="search-input"
              placeholder="Buscar por nome, IP, pool…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <span className="search-count">
            {filtered.length} de {vsList.length} VSs
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-text">Nenhum VS encontrado</div>
            <div className="empty-state-sub">Tente outro termo de busca</div>
          </div>
        ) : (
          <div className="vs-grid">
            {filtered.map(vs => (
              <VsCard key={vs.fullPath} vs={vs} onClick={onSelectVs} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
