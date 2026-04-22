import { useEffect, useState, useCallback } from 'react'
import ReactFlow, {
  ReactFlowProvider, Background, Controls, MiniMap,
  useNodesState, useEdgesState, useReactFlow,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import dagre from 'dagre'
import { fetchVisualization } from '../api/visualizer'

import VirtualServerNode from './nodes/VirtualServerNode'
import IruleNode from './nodes/IruleNode'
import DecisionNode from './nodes/DecisionNode'
import PoolNode from './nodes/PoolNode'
import PoolMemberNode from './nodes/PoolMemberNode'

const nodeTypes = {
  virtualServer: VirtualServerNode,
  irule: IruleNode,
  decision: DecisionNode,
  pool: PoolNode,
  poolMember: PoolMemberNode,
}

const NODE_W = { virtualServer: 270, irule: 260, decision: 490, pool: 370, poolMember: 190 }
const NODE_H = { virtualServer: 140, irule: 130, decision: 340, pool: 280, poolMember: 130 }

function layoutNodes(nodes, edges) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 90, ranksep: 110, edgesep: 50, marginx: 60, marginy: 40 })
  nodes.forEach(n => g.setNode(n.id, {
    width: NODE_W[n.type] || 220,
    height: NODE_H[n.type] || 120,
  }))
  edges.forEach(e => g.setEdge(e.source, e.target))
  dagre.layout(g)
  return nodes.map(n => {
    const p = g.node(n.id)
    return { ...n, position: { x: p.x - (NODE_W[n.type] || 220) / 2, y: p.y - (NODE_H[n.type] || 120) / 2 } }
  })
}

function enrichEdges(edges, nodes) {
  const nodeTypeMap = Object.fromEntries(nodes.map(n => [n.id, n.type]))
  return edges.map(e => {
    const srcType = nodeTypeMap[e.source]
    const tgtType = nodeTypeMap[e.target]
    // Use 'step' (orthogonal) for decision→pool/member to avoid crossings
    const isDecisionEdge = srcType === 'decision'
    const isPoolMemberEdge = srcType === 'pool' && tgtType === 'poolMember'
    const edgeType = (isDecisionEdge || isPoolMemberEdge) ? 'step' : 'smoothstep'
    const color = e.style?.stroke || '#475569'
    return {
      ...e,
      type: edgeType,
      markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color },
      labelStyle: { fill: '#f1f5f9', fontSize: 11, fontWeight: 600, fontFamily: 'Segoe UI, sans-serif' },
      labelBgStyle: { fill: '#0f172a', fillOpacity: 0.95 },
      labelBgPadding: [6, 4],
      labelBgBorderRadius: 4,
      style: { strokeWidth: e.animated ? 2.5 : 2, ...(e.style || {}) },
    }
  })
}

function InnerFlow({ rawNodes, rawEdges }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const { fitView } = useReactFlow()

  useEffect(() => {
    if (!rawNodes.length) return
    const laid = layoutNodes(rawNodes, rawEdges)
    setNodes(laid)
    setEdges(enrichEdges(rawEdges, rawNodes))
    setTimeout(() => fitView({ padding: 0.12, duration: 400 }), 60)
  }, [rawNodes, rawEdges, setNodes, setEdges, fitView])

  return (
    <ReactFlow
      nodes={nodes} edges={edges}
      onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView minZoom={0.1} maxZoom={2}
      defaultEdgeOptions={{ type: 'smoothstep' }}
    >
      <Background color="#1e293b" gap={24} size={1} />
      <Controls style={{ background: '#1e293b', border: '1px solid #334155' }} />
      <MiniMap
        style={{ background: '#0a0f1e', border: '1px solid #1e293b' }}
        nodeColor={n => ({
          virtualServer: '#1d4ed8', irule: '#6d28d9', decision: '#c2410c',
          pool: '#15803d', poolMember: '#1e293b',
        })[n.type] || '#334155'}
      />
    </ReactFlow>
  )
}

export default function FlowchartDrawer({ vs, session, onClose }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchVisualization({
        host: session.host,
        vsName: vs.fullPath,
        username: session.username,
        password: session.password,
        partition: vs.partition,
      })
      setData(res)
    } catch (err) {
      setError(err.message || 'Erro ao carregar pipeline')
    } finally {
      setLoading(false)
    }
  }, [vs, session])

  useEffect(() => { load() }, [load])

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <div className="drawer-title">{vs.name}</div>
            <div className="drawer-subtitle">{vs.destination} · {vs.partition}</div>
          </div>
          {data?.meta && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="badge badge-blue">{data.meta.totalNodes} nós</span>
              <span className="badge badge-gray">{data.meta.totalEdges} arestas</span>
            </div>
          )}
          <button className="btn btn-ghost"
                  style={{ padding: '5px 14px', fontSize: 12, marginLeft: 8 }}
                  onClick={onClose}>
            ✕ Fechar
          </button>
        </div>

        {data?.meta && (
          <div className="drawer-meta">
            {vs.poolName && <span className="drawer-meta-item">Pool padrão<span>{vs.poolName}</span></span>}
            {vs.ipProtocol && <span className="drawer-meta-item">Protocolo<span>{vs.ipProtocol.toUpperCase()}</span></span>}
            <span className="drawer-meta-item" style={{ marginLeft: 'auto' }}>
              {new Date(data.meta.fetchedAt).toLocaleString('pt-BR')}
            </span>
          </div>
        )}

        <div className="drawer-canvas">
          {loading && (
            <div className="spinner-overlay">
              <div className="spinner" />
              <span className="spinner-label">Carregando pipeline…</span>
            </div>
          )}
          {error && (
            <div style={{ padding: 20 }}>
              <div className="error-banner">
                <strong>Erro ao carregar pipeline</strong>
                {error}
              </div>
              <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={load}>
                Tentar novamente
              </button>
            </div>
          )}
          {data && !loading && (
            <ReactFlowProvider>
              <InnerFlow rawNodes={data.nodes} rawEdges={data.edges} />
            </ReactFlowProvider>
          )}
        </div>
      </div>
    </div>
  )
}
