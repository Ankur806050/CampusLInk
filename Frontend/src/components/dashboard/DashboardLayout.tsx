import { NavLink, Outlet } from 'react-router-dom'

interface Props {
  title: string
  links: { to: string; label: string }[]
}

export default function DashboardLayout({ title, links }: Props) {
  return (
    <div className="dash">
      <aside className="dash-side">
        <h3 style={{ color: 'var(--primary)' }}>{title}</h3>
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end
            className={({ isActive }) => 'dash-link' + (isActive ? ' active' : '')}
          >
            {l.label}
          </NavLink>
        ))}
      </aside>
      <section className="dash-main">
        <Outlet />
      </section>
    </div>
  )
}