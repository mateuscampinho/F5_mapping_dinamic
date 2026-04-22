import { useEffect } from 'react'
import ReactFlow, {
  Background, Controls, MiniMap,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'
import dagre from 'dagre'

import VirtualServerNode from './nodes/VirtualServerNode'
import IruleNode from './nodes/IruleNode'
import PolicyNode from './nodes/PolicyNode'
import PolicyRuleNode from './nodes/PolicyRuleNode'
import PoolNode from './nodes/PoolNode'
import PoolMemberNode from './nodes/PoolMemberNode'
import LoadingSpinner from './LoadingSpinner'

const nodeTypes = {
  virtualServer: VirtualServerNode,
  irule: IruleNode,
  policy: PolicyNode,
  policyRule: PolicyRuleNode,
  pool: PoolNode,
  poolMember: PoolMemberNode,
}

const NODE_WIDTHS = {
  virtualServer: 280, irule: 260, policy: 240,
  policyRule: 220, pool: 240, poolMember: 180,
}
const NODE_HEIGHT = 120

function applyDagreLayout(nodes, edges) {
  if (!nodes.length) return nodes

  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80, marginx: 40, marginy: 40 })

  nodes.forEach(n => {
    g.setNode(n.id, {
      width: NODE_WIDTHS[n.type] || 220,
      height: NODE_HEIGHT,
    })
  })
  edges.forEach(e => g.setEdge(e.source, e.target))

  dagre.layout(g)

  return nodes.map(n => {
    const pos = g.node(n.id)
    return {
      ...n,
      position: {
        x: pos.x - (NODE_WIDTHS[n.type] || 220) / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    }
  })
}

function InnerCanvas({ nodes, edges, onNodesChange, onEdgesChange, loading }) {
  const { fitView } = useReactFlow()

  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 50)
    }
  }, [nodes, fitView])

  const layoutedNodes = nodes.length ? applyDagreLayout(nodes, edges) : nodes

  return (
    <div className="canvas-wrapper" style={{ position: 'relative' }}>
      <LoadingSpinner visible={loading} />
      <ReactFlow
        nodes={layoutedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        <Background color="#1e293b" gap={20} />
        <Controls style={{ background: '#1e293b', border: '1px solid #334155' }} />
        <MiniMap
          style={{ background: '#0f172a', border: '1px solid #334155' }}
          nodeColor={(n) => {
            const colors = {
              virtualServer: '#1d4ed8', irule: '#6d28d9',
              policy: '#c2410c', policyRule: '#92400e',
              pool: '#15803d', poolMember: '#1e293b',
            }
            return colors[n.type] || '#334155'
          }}
        />
      </ReactFlow>
    </div>
  )
}

export default function DiagramCanvas(props) {
  // ReactFlowProvider is applied in App.jsx
  return <InnerCanvas {...props} />
}
