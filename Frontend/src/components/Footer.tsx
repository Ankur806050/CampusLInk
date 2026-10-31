export default function Footer() {
  return (
    <footer id="contact" style={{ background: '#0f172a', color: '#cbd5e1', padding: '32px 0', marginTop: 60 }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <strong style={{ color: '#fff' }}>CampusLink</strong>
          <div>Campus placement platform</div>
        </div>
        <div>
          <div>Help: tpo@college.edu (placeholder)</div>
          <div>© 2026 CampusLink</div>
        </div>
      </div>
    </footer>
  )
}