import { useState, useCallback } from 'react'
import { useNodesState, useEdgesState } from 'reactflow'
import { fetchVisualization } from '../api/visualizer'

export function useVisualizerData() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [meta, setMeta] = useState(null)

  const fetchData = useCallback(async (formValues) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchVisualization(formValues)
      setNodes(data.nodes)
      setEdges(data.edges)
      setMeta(data.meta)
    } catch (err) {
      setError(err)
      setNodes([])
      setEdges([])
      setMeta(null)
    } finally {
      setLoading(false)
    }
  }, [setNodes, setEdges])

  return { nodes, edges, onNodesChange, onEdgesChange, loading, error, meta, fetchData }
}
