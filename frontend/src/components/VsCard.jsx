export default function VsCard({ vs, onClick }) {
  return (
    <div className="vs-card" onClick={() => onClick(vs)}>
      <div className="vs-card-header">
        <div>
          <div className="vs-name">{vs.name}</div>
          <div className="vs-partition">/{vs.partition}</div>
        </div>
        {!vs.enabled && <span className="badge badge-disabled">Desabilitado</span>}
      </div>

      <div className="vs-meta">
        <div className="vs-meta-row">
          <span className="vs-meta-label">Destino</span>
          <span className="vs-meta-value">{vs.destination || '—'}</span>
        </div>
        {vs.ipProtocol && (
          <div className="vs-meta-row">
            <span className="vs-meta-label">Protocolo</span>
            <span className="badge badge-blue">{vs.ipProtocol.toUpperCase()}</span>
          </div>
        )}
        {vs.poolName && (
          <div className="vs-meta-row">
            <span className="vs-meta-label">Pool</span>
            <span className="vs-meta-value">{vs.poolName}</span>
          </div>
        )}
        {vs.poolMemberCount > 0 && (
          <div className="vs-meta-row">
            <span className="vs-meta-label">Members</span>
            <span className="vs-meta-value">{vs.poolMemberCount}</span>
          </div>
        )}
      </div>
    </div>
  )
}
