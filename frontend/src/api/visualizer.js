export class APIError extends Error {
  constructor(status, detail) {
    const msg = typeof detail === 'object'
      ? (detail.detail || JSON.stringify(detail))
      : detail
    super(msg)
    this.status = status
    this.raw = detail
  }
}

async function post(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let err
    try { err = await res.json() } catch { err = { detail: res.statusText } }
    throw new APIError(res.status, err.detail ?? err)
  }
  return res.json()
}

export const connectAndList       = (body) => post('/api/connect', body)
export const fetchVisualization   = (body) => post('/api/visualize', body)
export const exportSnapshot       = (body) => post('/api/export', body)
export const visualizeFromSnapshot = (body) => post('/api/visualize-snapshot', body)

export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
