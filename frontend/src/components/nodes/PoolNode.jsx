import { Handle, Position } from 'reactflow'

export default function PoolNode({ data }) {
  return (
    <div className="flow-node" style={{ minWidth: 220 }}>
      <Handle type="target" position={Position.Top} />
      <div className="flow-node-header" style={{ background: '#15803d' }}>
        <span style={{ fontSize: 10, opacity: 0.8 }}>POOL</span>
        <span style={{ marginLeft: 'auto' }}>{data.label}</span>
      </div>
      <div className="flow-node-body">
        {data.lbMode && (
          <div className="flow-node-row">
            <span className="flow-node-label">LB Mode</span>
            <span className="badge badge-green" style={{ fontSize: 10 }}>{data.lbMode}</span>
          </div>
        )}
        {data.monitor && (
          <div className="flow-node-row">
            <span className="flow-node-label">Monitor</span>
            <span className="flow-node-value">{data.monitor.split('/').pop()}</span>
          </div>
        )}
        {data.memberCount !== undefined && (
          <div className="flow-node-row">
            <span className="flow-node-label">Members</span>
            <span className="flow-node-value">{data.memberCount}</span>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
