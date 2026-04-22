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

export const connectAndList = (body) => post('/api/connect', body)
export const fetchVisualization = (body) => post('/api/visualize', body)
