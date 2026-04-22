import { Handle, Position } from 'reactflow'

export default function PolicyRuleNode({ data }) {
  return (
    <div className="flow-node" style={{ background: '#1c1917', borderColor: '#d97706', minWidth: 180 }}>
      <Handle type="target" position={Position.Top} />
      <div className="flow-node-header" style={{ background: '#92400e', fontSize: 11 }}>
        <span>Rule</span>
        <span>{data.label}</span>
      </div>
      <div className="flow-node-body">
        {data.conditions && data.conditions.length > 0 && (
          <>
            <span className="flow-node-label" style={{ marginBottom: 2 }}>Conditions</span>
            {data.conditions.map((c, i) => (
              <span key={i} className="flow-node-value"
                    style={{ background: '#0c1a0c', padding: '2px 5px', borderRadius: 4, fontSize: 10 }}>
                {c}
              </span>
            ))}
          </>
        )}
        {data.actions && data.actions.length > 0 && (
          <>
            <span className="flow-node-label" style={{ marginTop: 4, marginBottom: 2 }}>Actions</span>
            {data.actions.map((a, i) => (
              <span key={i} className="flow-node-value"
                    style={{ background: '#1a0c00', padding: '2px 5px', borderRadius: 4, fontSize: 10 }}>
                {a}
              </span>
            ))}
          </>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
