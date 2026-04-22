import { Handle, Position } from 'reactflow'

const DOT = {
  available: { bg: '#22c55e', glow: '0 0 5px #22c55e' },
  offline:   { bg: '#ef4444', glow: 'none' },
  unknown:   { bg: '#64748b', glow: 'none' },
}

export default function PoolNode({ data }) {
  const members = data.poolMembers || []

  return (
    <div style={{
      background: '#0f1f14',
      border: '2px solid #15803d',
      borderRadius: 8,
      minWidth: 260,
      maxWidth: 360,
      boxShadow: '0 4px 16px rgba(21,128,61,0.2)',
      fontFamily: 'inherit',
    }}>
      <Handle type="target" position={Position.Top} />

      <div style={{
        background: '#14532d',
        padding: '7px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: '6px 6px 0 0',
      }}>
        <span style={{ fontSize: 10, opacity: 0.8, color: '#bbf7d0' }}>POOL</span>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginLeft: 'auto' }}>{data.label}</span>
      </div>

      <div style={{ padding: '8px 14px 4px' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
          {data.lbMode && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#64748b' }}>LB</span>
              <span className="badge badge-green" style={{ fontSize: 10 }}>{data.lbMode}</span>
            </div>
          )}
          {data.monitor && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#64748b' }}>Monitor</span>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>{data.monitor.split('/').pop()}</span>
            </div>
          )}
          {data.memberCount !== undefined && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginLeft: 'auto' }}>
              <span style={{ fontSize: 10, color: '#64748b' }}>Members</span>
              <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700 }}>{data.memberCount}</span>
            </div>
          )}
        </div>

        {members.length > 0 && (
          <div style={{
            maxHeight: 200,
            overflowY: 'auto',
            borderRadius: 4,
            border: '1px solid #1a3525',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#0d2218' }}>
                  <th style={thStyle}>Endereço</th>
                  <th style={thStyle}>Member</th>
                  <th style={thStyle}>Node</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => {
                  const mDot = DOT[m.health] || DOT.unknown
                  const nDot = DOT[m.nodeHealth] || DOT.unknown
                  return (
                    <tr key={i} style={{
                      borderTop: '1px solid #1a3525',
                      background: i % 2 === 0 ? '#0f1f14' : '#0d1c12',
                    }}>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#e2e8f0' }}>{m.label}</td>
                      <td style={tdStyle}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: mDot.bg,
                                         boxShadow: mDot.glow, display: 'inline-block', flexShrink: 0 }} />
                          <span style={{ color: m.health === 'available' ? '#4ade80' : m.health === 'offline' ? '#f87171' : '#94a3b8', fontSize: 10 }}>
                            {m.health}
                          </span>
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: nDot.bg,
                                         display: 'inline-block', flexShrink: 0 }} />
                          <span style={{ color: m.nodeHealth === 'available' ? '#4ade80' : m.nodeHealth === 'offline' ? '#f87171' : '#94a3b8', fontSize: 10 }}>
                            {m.nodeHealth}
                          </span>
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

const thStyle = {
  padding: '3px 8px',
  textAlign: 'left',
  color: '#64748b',
  fontWeight: 600,
  fontSize: 10,
  textTransform: 'uppercase',
}

const tdStyle = {
  padding: '3px 8px',
  verticalAlign: 'middle',
}
