import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api, clearToken, getToken } from '../lib/api'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const signedIn = Boolean(getToken())

  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' })
    } catch {
      // Clearing the local token still logs the user out if the API is unavailable.
    } finally {
      clearToken()
      navigate('/login')
    }
  }

  return (
    <header style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <Link to="/" style={{ fontWeight: 800, fontSize: 22, color: 'var(--primary)' }}>CampusLink</Link>
        <nav style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="/#how">How it works</a>
          <a href="/#roles">Roles</a>
          <a href="/#contact">Contact</a>
          {signedIn ? (
            <button className="btn btn-outline" onClick={logout}>Logout</button>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline" state={{ from: location.pathname }}>Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
