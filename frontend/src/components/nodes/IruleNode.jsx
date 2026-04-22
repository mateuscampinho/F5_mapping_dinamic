import { useState } from 'react'
import { Handle, Position } from 'reactflow'

export default function IruleNode({ data }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className="flow-node">
        <Handle type="target" position={Position.Top} />
        <div className="flow-node-header" style={{ background: '#6d28d9' }}>
          <span>iRule</span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {data.label}
          </span>
        </div>
        <div className="flow-node-body">
          {data.eventHints && data.eventHints.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 4 }}>
              {data.eventHints.map(ev => (
                <span key={ev} className="badge badge-purple">{ev}</span>
              ))}
            </div>
          )}
          {data.ruleContent && (
            <div
              className="tcl-preview"
              title="Clique para expandir"
              onClick={() => setShowModal(true)}
            >
              {data.ruleContent.slice(0, 120)}{data.ruleContent.length > 120 ? '\n…' : ''}
            </div>
          )}
          <span style={{ fontSize: 10, color: '#7c3aed', cursor: 'pointer', marginTop: 2 }}
                onClick={() => setShowModal(true)}>
            Ver TCL completo
          </span>
        </div>
        <Handle type="source" position={Position.Bottom} />
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>iRule: {data.label}</h3>
            <pre className="modal-tcl">{data.ruleContent}</pre>
            <button className="modal-close" onClick={() => setShowModal(false)}>Fechar</button>
          </div>
        </div>
      )}
    </>
  )
}
