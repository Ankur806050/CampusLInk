import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

export default function Register() {
  const [role, setRole] = useState<'STUDENT' | 'RECRUITER'>('STUDENT')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(''); setMessage(''); setBusy(true)
    const f = new FormData(e.currentTarget)
    const body: any = { name: String(f.get('name')).trim(), email: String(f.get('email')).trim(), password: String(f.get('password')), role }
    if (role === 'STUDENT') Object.assign(body, { rollNumber: String(f.get('rollNumber')).trim(), studentYear: f.get('studentYear'), branch: String(f.get('branch')).trim(), cgpa: Number(f.get('cgpa')), graduationYear: Number(f.get('graduationYear')) })
    else Object.assign(body, { companyName: String(f.get('companyName')).trim(), designation: String(f.get('designation')).trim() })
    try {
      const result = await api<any>('/auth/signup', { method: 'POST', body: JSON.stringify(body) })
      setMessage(result.message || 'Registration started.')
      navigate('/verify-email', { state: { email: body.email }, replace: false })
    } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }

  return <div className="container" style={{ maxWidth: 480, paddingTop: 50 }}><div className="card">
    <h2>Create account</h2>
    <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
      <button type="button" className={`btn ${role === 'STUDENT' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setRole('STUDENT')}>Student</button>
      <button type="button" className={`btn ${role === 'RECRUITER' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setRole('RECRUITER')}>Recruiter</button>
    </div>
    <form className="form" onSubmit={handleSubmit}>
      <label>Full name<input name="name" autoComplete="name" minLength={2} required /></label>
      <label>Email<input name="email" type="email" autoComplete="email" required /></label>
      <label>Password<input name="password" type="password" autoComplete="new-password" minLength={12} required /><small>At least 12 characters with uppercase, lowercase, number and special character.</small></label>
      {role === 'STUDENT' ? <>
        <label>Roll number<input name="rollNumber" required /></label>
        <label>Current year<select name="studentYear" required><option value="THIRD_YEAR">Third year</option><option value="FOURTH_YEAR">Fourth year</option></select></label>
        <label>Branch<input name="branch" required /></label>
        <label>CGPA<input name="cgpa" type="number" step="0.01" min="0" max="10" required /></label>
        <label>Graduation year<input name="graduationYear" type="number" min={new Date().getFullYear()} max={2100} required /></label>
      </> : <>
        <label>Company name<input name="companyName" required /></label>
        <label>Designation<input name="designation" required /></label>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Recruiter accounts require TPO approval before job posting.</p>
      </>}
      {error && <div className="error">{error}</div>}{message && <p>{message}</p>}
      <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Registering…' : `Register as ${role === 'STUDENT' ? 'student' : 'recruiter'}`}</button>
    </form><p>Already registered? <Link to="/login">Login</Link></p>
  </div></div>
}
