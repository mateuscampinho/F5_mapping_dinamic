import { Handle, Position } from 'reactflow'

export default function DecisionNode({ data }) {
  return (
    <div style={{
      background: '#1c1917',
      border: '2px solid #f97316',
      borderRadius: 8,
      minWidth: 200,
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
      <div style={{ padding: '8px 14px' }}>
        {data.matchType && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Estratégia</span>
            <span className="badge badge-orange">{data.matchType}</span>
          </div>
        )}
        <div style={{ marginTop: 6, fontSize: 10, color: '#64748b', fontStyle: 'italic' }}>
          As arestas indicam o destino de cada condição →
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
