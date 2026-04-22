import { Handle, Position } from 'reactflow'

export default function DecisionNode({ data }) {
  const rules = data.policyRules || []

  return (
    <div style={{
      background: '#1c1917',
      border: '2px solid #f97316',
      borderRadius: 8,
      minWidth: 320,
      maxWidth: 420,
      boxShadow: '0 4px 16px rgba(249,115,22,0.25)',
      fontFamily: 'inherit',
    }}>
      <Handle type="target" position={Position.Top} />

      <div style={{
        background: '#9a3412',
        padding: '7px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: '6px 6px 0 0',
      }}>
        <span style={{ fontSize: 10, opacity: 0.8, color: '#fed7aa' }}>LTM POLICY</span>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginLeft: 'auto' }}>{data.label}</span>
      </div>

      <div style={{ padding: '8px 14px 4px' }}>
        {data.matchType && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Estratégia</span>
            <span className="badge badge-orange">{data.matchType}</span>
          </div>
        )}

        {rules.length > 0 && (
          <div style={{
            maxHeight: 220,
            overflowY: 'auto',
            borderRadius: 4,
            border: '1px solid #292524',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#292524' }}>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Condição</th>
                  <th style={thStyle}>Destino</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r, i) => (
                  <tr key={i} style={{
                    background: r.isDefault ? '#1a1309' : (i % 2 === 0 ? '#1c1917' : '#221c1a'),
                    borderTop: '1px solid #292524',
                  }}>
                    <td style={{ ...tdStyle, color: '#64748b', width: 24 }}>
                      {r.isDefault ? '↩' : r.ordinal + 1}
                    </td>
                    <td style={{ ...tdStyle, color: '#cbd5e1', maxWidth: 160, wordBreak: 'break-word' }}>
                      {r.conditions || '—'}
                    </td>
                    <td style={{ ...tdStyle, maxWidth: 110, wordBreak: 'break-word' }}>
                      <span style={{
                        color: r.isDefault ? '#94a3b8' : '#fb923c',
                        fontWeight: r.isDefault ? 400 : 600,
                        fontStyle: r.isDefault ? 'italic' : 'normal',
                      }}>
                        {r.target}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rules.length === 0 && (
          <div style={{ fontSize: 10, color: '#64748b', fontStyle: 'italic', paddingBottom: 4 }}>
            Sem regras definidas
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

const thStyle = {
  padding: '4px 8px',
  textAlign: 'left',
  color: '#94a3b8',
  fontWeight: 600,
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const tdStyle = {
  padding: '4px 8px',
  verticalAlign: 'top',
  color: '#e2e8f0',
}
