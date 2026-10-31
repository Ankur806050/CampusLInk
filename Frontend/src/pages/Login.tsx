import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, saveToken } from '../lib/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setBusy(true)
    try {
      const result = await api<any>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      saveToken(result.data.token)
      const role = result.data.user.role
      navigate(role === 'STUDENT' ? '/student' : role === 'RECRUITER' ? '/recruiter' : '/')
    } catch (err) {
      const e = err as Error & { data?: any }
      setError(e.message + (e.data?.code === 'EMAIL_NOT_VERIFIED' ? ' Please register again or contact support to verify your email.' : ''))
    } finally { setBusy(false) }
  }

  return <div className="container" style={{ maxWidth: 420, paddingTop: 50 }}><div className="card">
    <h2>Login</h2><form className="form" onSubmit={handleSubmit}>
      <label>Email<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
      <label>Password<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
      {error && <div className="error">{error}</div>}
      <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Login'}</button>
    </form><p>Don't have an account? <Link to="/register">Register</Link></p>
  </div></div>
}
