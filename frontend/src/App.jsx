import { useState } from 'react'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import FlowchartDrawer from './components/FlowchartDrawer'
import { connectAndList } from './api/visualizer'

export default function App() {
  const [phase, setPhase] = useState('login') // 'login' | 'dashboard'
  const [session, setSession] = useState(null) // { host, username, password, partition }
  const [vsList, setVsList] = useState([])
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState(null)
  const [selectedVs, setSelectedVs] = useState(null)

  const handleConnect = async (form) => {
    setLoading(true)
    setLoginError(null)
    try {
      const res = await connectAndList(form)
      setSession({ host: form.host, username: form.username, password: form.password, partition: form.partition })
      setVsList(res.vsList)
      setPhase('dashboard')
    } catch (err) {
      setLoginError(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (!session) return
    setLoading(true)
    try {
      const res = await connectAndList(session)
      setVsList(res.vsList)
    } catch (err) {
      // keep old list, silently log
      console.error('Refresh failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setPhase('login')
    setSession(null)
    setVsList([])
    setSelectedVs(null)
  }

  if (phase === 'login') {
    return <LoginPage onConnect={handleConnect} loading={loading} error={loginError} />
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
      />
      {selectedVs && (
        <FlowchartDrawer
          vs={selectedVs}
          session={session}
          onClose={() => setSelectedVs(null)}
        />
      )}
    </>
  )
}
