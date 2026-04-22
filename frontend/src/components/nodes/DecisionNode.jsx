import { Handle, Position } from 'reactflow'

export default function DecisionNode({ data }) {
  const rules = data.policyRules || []

  return (
    <div style={{
      background: '#1c1917',
      border: '2px solid #f97316',
      borderRadius: 8,
      minWidth: 360,
      maxWidth: 480,
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
        {data.matchType && (
          <span className="badge badge-orange" style={{ fontSize: 10 }}>{data.matchType}</span>
        )}
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginLeft: 'auto' }}>{data.label}</span>
      </div>

      <div style={{ padding: '8px 0 4px' }}>
        {rules.length === 0 && (
          <div style={{ fontSize: 10, color: '#64748b', fontStyle: 'italic', padding: '0 14px 4px' }}>
            Sem regras definidas
          </div>
        )}

        {rules.length > 0 && (
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {rules.map((r, i) => (
              <div key={i} style={{
                borderTop: i > 0 ? '1px solid #292524' : undefined,
                background: r.isDefault ? '#1a1309' : (i % 2 === 0 ? '#1c1917' : '#201c1a'),
                padding: '6px 14px',
              }}>
                {/* Rule header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 10,
                    color: '#64748b',
                    fontFamily: 'monospace',
                    minWidth: 20,
                  }}>
                    {r.isDefault ? '↩' : `#${r.ordinal + 1}`}
                  </span>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                    {r.name || '—'}
                  </span>
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: 11,
                    color: r.isDefault ? '#94a3b8' : '#fb923c',
                    fontWeight: r.isDefault ? 400 : 700,
                    fontStyle: r.isDefault ? 'italic' : 'normal',
                    maxWidth: 140,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {r.target}
                  </span>
                </div>

                {/* Conditions */}
                {r.conditions && r.conditions.length > 0 && (
                  <div style={{ marginBottom: 3 }}>
                    {r.conditions.map((c, ci) => (
                      <div key={ci} style={{
                        fontSize: 10,
                        color: '#cbd5e1',
                        background: '#0f172a',
                        borderRadius: 3,
                        padding: '2px 6px',
                        marginBottom: 2,
                        borderLeft: '2px solid #3b82f6',
                      }}>
                        {c}
                      </div>
                    ))}
                  </div>
                )}

                {r.isDefault && (
                  <div style={{
                    fontSize: 10,
                    color: '#64748b',
                    fontStyle: 'italic',
                    background: '#0f172a',
                    borderRadius: 3,
                    padding: '2px 6px',
                    marginBottom: 2,
                    borderLeft: '2px solid #475569',
                  }}>
                    demais (catch-all)
                  </div>
                )}

                {/* Actions besides pool target */}
                {r.actions && r.actions.filter(a => !a.startsWith('→ pool') && !a.startsWith('→ node')).map((a, ai) => (
                  <div key={ai} style={{
                    fontSize: 10,
                    color: '#fcd34d',
                    background: '#1a1200',
                    borderRadius: 3,
                    padding: '2px 6px',
                    marginBottom: 2,
                    borderLeft: '2px solid #d97706',
                  }}>
                    {a}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
