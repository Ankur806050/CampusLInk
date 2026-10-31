import { Link } from 'react-router-dom'

const steps = [
  { t: '1. Register', d: 'Students and companies create accounts. Companies wait for TPO approval.' },
  { t: '2. Post & Apply', d: 'Approved recruiters post jobs. Eligible students discover and apply.' },
  { t: '3. Review & Schedule', d: 'Recruiters review applications and propose OA/interview slots; the TPO reviews approvals.' },
]

const roles = [
  { t: 'Student', d: 'Build your profile, upload your resume, browse eligible openings and track applications.' },
  { t: 'Recruiter', d: 'Submit company details for approval, post openings, review applicants and propose OA/interview slots.' },
  { t: 'TPO', d: 'Review company requests, approve job postings and review interview schedule proposals.' },
]

export default function Landing() {
  return (
    <>
      <section style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', padding: '90px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 46, margin: 0 }}>One platform for campus placements</h1>
          <p style={{ fontSize: 19, maxWidth: 640, margin: '16px auto 28px' }}>
            CampusLink connects students, recruiters and the TPO, replacing scattered spreadsheets and emails.
          </p>
          <Link to="/register" className="btn" style={{ background: '#fff', color: 'var(--primary)', marginRight: 12 }}>Get Started</Link>
          <Link to="/login" className="btn" style={{ border: '1px solid #fff', color: '#fff' }}>Login</Link>
        </div>
      </section>

      <section id="how" className="container" style={{ paddingTop: 60 }}>
        <h2 style={{ textAlign: 'center' }}>How it works</h2>
        <div className="grid-3">
          {steps.map(s => (
            <div className="card" key={s.t}><h3>{s.t}</h3><p>{s.d}</p></div>
          ))}
        </div>
      </section>

      <section id="roles" className="container" style={{ paddingTop: 60 }}>
        <h2 style={{ textAlign: 'center' }}>Built for every role</h2>
        <div className="grid-3">
          {roles.map(r => (
            <div className="card" key={r.t}><h3>{r.t}</h3><p>{r.d}</p></div>
          ))}
        </div>
      </section>
    </>
  )
}