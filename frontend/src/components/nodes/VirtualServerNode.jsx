import { Handle, Position } from 'reactflow'

export default function VirtualServerNode({ data }) {
  return (
    <div className="flow-node" style={{ minWidth: 260 }}>
      <div className="flow-node-header" style={{ background: '#1d4ed8' }}>
        <span style={{ fontSize: 10, opacity: 0.8 }}>VIRTUAL SERVER</span>
        <span style={{ marginLeft: 'auto' }}>{data.label}</span>
        {data.partition && <span className="badge badge-blue" style={{ fontSize: 9 }}>{data.partition}</span>}
      </div>
      <div className="flow-node-body">
        {data.source && (
          <div className="flow-node-row">
            <span className="flow-node-label">Origem</span>
            <span className="flow-node-value" style={{ fontFamily: 'monospace', color: '#93c5fd' }}>{data.source}</span>
          </div>
        )}
        {data.destination && (
          <div className="flow-node-row">
            <span className="flow-node-label">Destino</span>
            <span className="flow-node-value" style={{ fontFamily: 'monospace', color: '#7dd3fc' }}>{data.destination}</span>
          </div>
        )}
        <div className="flow-node-row">
          {data.ipProtocol && <span className="badge badge-blue">{data.ipProtocol.toUpperCase()}</span>}
          {data.snatType && <span className="badge badge-gray">SNAT: {data.snatType}</span>}
        </div>
        {data.profiles && data.profiles.length > 0 && (
          <div className="flow-node-row" style={{ alignItems: 'flex-start' }}>
            <span className="flow-node-label">Profiles</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'flex-end' }}>
              {data.profiles.map(p => <span key={p} className="badge badge-gray" style={{ fontSize: 9 }}>{p}</span>)}
            </div>
          </div>
        )}
        {data.description && (
          <div className="flow-node-row">
            <span className="flow-node-value" style={{ fontStyle: 'italic', opacity: 0.6, fontSize: 10 }}>{data.description}</span>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
