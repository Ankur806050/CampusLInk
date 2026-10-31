import { useState } from 'react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) return setError('Enter a valid email')
    if (password.length < 6) return setError('Password must be at least 6 characters')
    setError('')
    alert('Prototype only: real login will be handled by the backend.')
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 50 }}>
      <div className="card">
        <h2>Login</h2>
        <form className="form" onSubmit={handleSubmit}>
          <label>Email<input value={email} onChange={e => setEmail(e.target.value)} /></label>
          <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>
          {error && <div className="error">{error}</div>}
          <button className="btn btn-primary" type="submit">Login</button>
        </form>
      </div>
    </div>
  )
}