import { useState } from 'react'

export default function Register() {
  const [role, setRole] = useState<'student' | 'recruiter'>('student')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const f = new FormData(e.currentTarget as HTMLFormElement)
    if (!String(f.get('email')).includes('@')) return setError('Enter a valid email')
    if (String(f.get('password')).length < 6) return setError('Password must be at least 6 characters')
    setError('')
    alert('Prototype only: registration will be handled by the backend.')
  }

  return (
    <div className="container" style={{ maxWidth: 480, paddingTop: 50 }}>
      <div className="card">
        <h2>Create account</h2>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button type="button" className={`btn ${role === 'student' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setRole('student')}>Student</button>
          <button type="button" className={`btn ${role === 'recruiter' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setRole('recruiter')}>Recruiter</button>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <label>Full name<input name="name" required /></label>
          <label>Email<input name="email" /></label>
          <label>Password<input name="password" type="password" /></label>
          {role === 'student' ? (
            <>
              <label>Branch<input name="branch" required /></label>
              <label>CGPA<input name="cgpa" type="number" step="0.01" min="0" max="10" required /></label>
              <label>Graduation year<input name="year" type="number" required /></label>
            </>
          ) : (
            <>
              <label>Company name<input name="company" required /></label>
              <label>Company website<input name="website" /></label>
              <label>HR contact number<input name="phone" /></label>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Company accounts need TPO approval before you can post jobs.</p>
            </>
          )}
          {error && <div className="error">{error}</div>}
          <button className="btn btn-primary" type="submit">Register as {role}</button>
        </form>
      </div>
    </div>
  )
}