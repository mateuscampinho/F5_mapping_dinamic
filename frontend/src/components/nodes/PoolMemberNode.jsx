import { Handle, Position } from 'reactflow'

const DOT = {
  available: { bg: '#22c55e', glow: '0 0 6px #22c55e' },
  offline:   { bg: '#ef4444', glow: 'none' },
  unknown:   { bg: '#64748b', glow: 'none' },
}

const SESSION_BADGE = {
  'user-enabled':   { label: 'enabled',   cls: 'badge-green' },
  'enabled':        { label: 'enabled',   cls: 'badge-green' },
  'user-disabled':  { label: 'disabled',  cls: 'badge-yellow' },
  'forced offline': { label: 'forced off', cls: 'badge-red' },
  'forced-offline': { label: 'forced off', cls: 'badge-red' },
}

function sessionBadge(val) {
  const key = Object.keys(SESSION_BADGE).find(k => (val || '').toLowerCase().includes(k))
  return key ? SESSION_BADGE[key] : { label: val || 'unknown', cls: 'badge-gray' }
}

export default function PoolMemberNode({ data }) {
  const mHealth = data.healthStatus || 'unknown'
  const nHealth = data.nodeHealth || 'unknown'
  const mDot = DOT[mHealth] || DOT.unknown
  const nDot = DOT[nHealth] || DOT.unknown
  const sb = sessionBadge(data.sessionStatus)

  const borderColor = mHealth === 'available' ? '#15803d'
                    : mHealth === 'offline' ? '#b91c1c'
                    : '#475569'

  return (
    <div className="flow-node" style={{ minWidth: 170, borderColor }}>
      <Handle type="target" position={Position.Top} />
      <div className="flow-node-header" style={{
        background: mHealth === 'available' ? '#14532d'
                  : mHealth === 'offline' ? '#7f1d1d'
                  : '#1e293b',
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: mDot.bg,
                       boxShadow: mDot.glow, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{data.label}</span>
      </div>
      <div className="flow-node-body">
        {/* Member-level health */}
        <div className="flow-node-row">
          <span className="flow-node-label">Member</span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: mDot.bg,
                           display: 'inline-block', boxShadow: mDot.glow }} />
            <span className={`badge ${mHealth === 'available' ? 'badge-green' : mHealth === 'offline' ? 'badge-red' : 'badge-gray'}`}>
              {mHealth}
            </span>
          </div>
        </div>
        {/* Node-level health */}
        <div className="flow-node-row">
          <span className="flow-node-label">Node</span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: nDot.bg,
                           display: 'inline-block' }} />
            <span className={`badge ${nHealth === 'available' ? 'badge-green' : nHealth === 'offline' ? 'badge-red' : 'badge-gray'}`}>
              {nHealth}
            </span>
          </div>
        </div>
        {/* Session */}
        <div className="flow-node-row">
          <span className="flow-node-label">Sessão</span>
          <span className={`badge ${sb.cls}`}>{sb.label}</span>
        </div>
      </div>
    </div>
  )
}
