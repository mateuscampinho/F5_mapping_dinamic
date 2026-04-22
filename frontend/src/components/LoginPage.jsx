import { useState, useRef } from 'react'

const LS_KEY = 'f5vis_login'

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}

export default function LoginPage({ onConnect, onLoadSnapshot, loading, error }) {
  const saved = loadSaved()
  const [form, setForm] = useState({
    host: saved.host || '',
    username: saved.username || 'admin',
    password: '',
    partition: saved.partition || 'Common',
  })
  const [errs, setErrs] = useState({})
  const [fileError, setFileError] = useState(null)
  const fileRef = useRef()

  const up = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const v = {}
    if (!form.host.trim()) v.host = 'Obrigatório'
    if (!form.password) v.password = 'Obrigatório'
    if (Object.keys(v).length) { setErrs(v); return }
    setErrs({})
    localStorage.setItem(LS_KEY, JSON.stringify({ host: form.host, username: form.username, partition: form.partition }))
    onConnect(form)
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileError(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const snapshot = JSON.parse(ev.target.result)
        if (!snapshot.vsList || !snapshot.vsData) throw new Error('Arquivo inválido')
        onLoadSnapshot(snapshot)
      } catch {
        setFileError('Arquivo inválido. Use um snapshot exportado pela aplicação.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-badge">F5</div>
          <div className="login-logo-text">
            <h1>BIG-IP Visualizer</h1>
            <p>Mapa completo de Virtual Servers</p>
          </div>
        </div>

        <form onSubmit={submit}>
          <div className="form-field">
            <label>BIG-IP Host / IP</label>
            <input value={form.host} onChange={up('host')} placeholder="192.168.1.245" autoFocus />
            {errs.host && <span className="field-error">{errs.host}</span>}
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Usuário</label>
              <input value={form.username} onChange={up('username')} />
            </div>
            <div className="form-field">
              <label>Partição</label>
              <input value={form.partition} onChange={up('partition')} />
            </div>
          </div>

          <div className="form-field">
            <label>Senha</label>
            <input type="password" value={form.password} onChange={up('password')} />
            {errs.password && <span className="field-error">{errs.password}</span>}
          </div>

          {error && (
            <div className="error-banner" style={{ marginBottom: 12 }}>
              <strong>{error.message || 'Erro ao conectar'}</strong>
            </div>
          )}

          <button className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Carregando configurações do F5… (pode demorar)' : 'Conectar ao F5'}
          </button>
        </form>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          margin: '18px 0 14px', color: '#475569',
        }}>
          <div style={{ flex: 1, height: 1, background: '#1e293b' }} />
          <span style={{ fontSize: 12 }}>ou</span>
          <div style={{ flex: 1, height: 1, background: '#1e293b' }} />
        </div>

        <button
          className="btn btn-ghost btn-full"
          style={{ padding: '10px', fontSize: 13 }}
          onClick={() => fileRef.current.click()}
        >
          Carregar snapshot local (.json)
        </button>
        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFile} />

        {fileError && (
          <div className="error-banner" style={{ marginTop: 8 }}>
            {fileError}
          </div>
        )}
      </div>
    </div>
  )
}
