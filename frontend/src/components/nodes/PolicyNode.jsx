import { Handle, Position } from 'reactflow'

export default function PolicyNode({ data }) {
  return (
    <div className="flow-node">
      <Handle type="target" position={Position.Top} />
      <div className="flow-node-header" style={{ background: '#c2410c' }}>
        <span>Policy</span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {data.label}
        </span>
      </div>
      <div className="flow-node-body">
        {data.matchType && (
          <div className="flow-node-row">
            <span className="flow-node-label">Match</span>
            <span className="badge badge-orange">{data.matchType}</span>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
