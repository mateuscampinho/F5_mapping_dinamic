import { useState } from 'react'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import FlowchartDrawer from './components/FlowchartDrawer'
import { connectAndList, exportSnapshot, downloadJson } from './api/visualizer'

export default function App() {
  const [phase, setPhase] = useState('login')
  const [session, setSession] = useState(null)
  const [vsList, setVsList] = useState([])
  const [snapshot, setSnapshot] = useState(null) // offline mode data
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState(null)
  const [selectedVs, setSelectedVs] = useState(null)
  const [exporting, setExporting] = useState(false)

  const isOffline = snapshot !== null

  const handleConnect = async (form) => {
    setLoading(true)
    setLoginError(null)
    try {
      const res = await connectAndList(form)
      setSession({ host: form.host, username: form.username, password: form.password, partition: form.partition })
      setSnapshot(null)
      setVsList(res.vsList)
      setPhase('dashboard')
    } catch (err) {
      setLoginError(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadSnapshot = (snap) => {
    setSnapshot(snap)
    setSession(null)
    setVsList(snap.vsList)
    setPhase('dashboard')
  }

  const handleExport = async () => {
    if (!session) return
    setExporting(true)
    try {
      const data = await exportSnapshot(session)
      const ts = new Date().toISOString().slice(0, 10)
      downloadJson(data, `f5-snapshot-${session.host}-${ts}.json`)
    } catch (err) {
      alert('Erro ao exportar: ' + (err.message || err))
    } finally {
      setExporting(false)
    }
  }

  const handleRefresh = async () => {
    if (!session) return
    setLoading(true)
    try {
      const res = await connectAndList(session)
      setVsList(res.vsList)
    } catch (err) {
      console.error('Refresh failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setPhase('login')
    setSession(null)
    setSnapshot(null)
    setVsList([])
    setSelectedVs(null)
  }

  if (phase === 'login') {
    return (
      <LoginPage
        onConnect={handleConnect}
        onLoadSnapshot={handleLoadSnapshot}
        loading={loading}
        error={loginError}
      />
    )
  }

  return (
    <>
      <Dashboard
        session={session}
        vsList={vsList}
        onSelectVs={setSelectedVs}
        onLogout={handleLogout}
        onRefresh={handleRefresh}
        refreshing={loading}
        onExport={handleExport}
        exporting={exporting}
        isOffline={isOffline}
      />
      {selectedVs && (
        <FlowchartDrawer
          vs={selectedVs}
          session={session}
          snapshotVsData={isOffline ? snapshot.vsData?.[selectedVs.fullPath] : null}
          partition={isOffline ? snapshot.partition : session?.partition}
          onClose={() => setSelectedVs(null)}
        />
      )}
    </>
  )
}
