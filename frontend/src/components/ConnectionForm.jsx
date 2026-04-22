import { useState } from 'react'

const STORAGE_KEY = 'f5vis_form'

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export default function ConnectionForm({ onSubmit, loading }) {
  const saved = loadSaved()
  const [form, setForm] = useState({
    host: saved.host || '',
    vsName: saved.vsName || '',
    username: saved.username || 'admin',
    password: '',
    partition: saved.partition || 'Common',
  })
  const [errors, setErrors] = useState({})

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.host.trim()) errs.host = 'Obrigatório'
    if (!form.vsName.trim()) errs.vsName = 'Obrigatório'
    if (!form.password) errs.password = 'Obrigatório'
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      host: form.host, vsName: form.vsName,
      username: form.username, partition: form.partition,
    }))
    onSubmit(form)
  }

  return (
    <form className="form-panel" onSubmit={handleSubmit}>
      <FormField label="BIG-IP Host/IP" error={errors.host}>
        <input value={form.host} onChange={update('host')} placeholder="192.168.1.1" />
      </FormField>
      <FormField label="Virtual Server" error={errors.vsName}>
        <input value={form.vsName} onChange={update('vsName')} placeholder="/Common/my_vs" />
      </FormField>
      <FormField label="Partition">
        <input value={form.partition} onChange={update('partition')} style={{ width: 110 }} />
      </FormField>
      <FormField label="Usuário">
        <input value={form.username} onChange={update('username')} />
      </FormField>
      <FormField label="Senha" error={errors.password}>
        <input type="password" value={form.password} onChange={update('password')} />
      </FormField>
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? 'Consultando…' : 'Visualizar'}
      </button>
    </form>
  )
}

function FormField({ label, error, children }) {
  return (
    <div className="form-group">
      <label>{label}{error && <span style={{ color: '#f87171', marginLeft: 6 }}>{error}</span>}</label>
      {children}
    </div>
  )
}
