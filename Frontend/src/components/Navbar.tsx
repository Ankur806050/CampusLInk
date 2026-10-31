import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <header style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <Link to="/" style={{ fontWeight: 800, fontSize: 22, color: 'var(--primary)' }}>
          CampusLink
        </Link>
        <nav style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <a href="/#how">How it works</a>
          <a href="/#roles">Roles</a>
          <a href="/#contact">Contact</a>
          <Link to="/login" className="btn btn-outline">Login</Link>
          <Link to="/register" className="btn btn-primary">Register</Link>
        </nav>
      </div>
    </header>
  )
}