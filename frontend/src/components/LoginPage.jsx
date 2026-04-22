import { useState } from 'react'

const LS_KEY = 'f5vis_login'

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}

export default function LoginPage({ onConnect, loading, error }) {
  const saved = loadSaved()
  const [form, setForm] = useState({
    host: saved.host || '',
    username: saved.username || 'admin',
    password: '',
    partition: saved.partition || 'Common',
  })
  const [errs, setErrs] = useState({})

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
            {loading ? 'Conectando…' : 'Conectar e Carregar VSs'}
          </button>
        </form>
      </div>
    </div>
  )
}
