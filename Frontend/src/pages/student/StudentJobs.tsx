import { useState } from 'react'
import { Link } from 'react-router-dom'
import MockBanner from '../../components/dashboard/MockBanner'
import { mockJobs, mockStudent } from '../../mock/studentData'

export default function StudentJobs() {
  const [q, setQ] = useState('')
  const [type, setType] = useState('All')

  const jobs = mockJobs.filter(j =>
    (type === 'All' || j.type === type) &&
    (j.title + j.company + j.location).toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <>
      <MockBanner />
      <h2>Browse Jobs</h2>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input placeholder="Search role, company, location" value={q} onChange={e => setQ(e.target.value)}
          style={{ flex: 1, padding: 10, border: '1px solid var(--border)', borderRadius: 8 }} />
        <select value={type} onChange={e => setType(e.target.value)} style={{ padding: 10, borderRadius: 8 }}>
          <option>All</option><option>Full-time</option><option>Internship</option>
        </select>
      </div>
      <div style={{ display: 'grid', gap: 16 }}>
        {jobs.map(j => {
          const eligible = mockStudent.cgpa >= j.minCgpa && j.branches.includes(mockStudent.branch)
          return (
            <div className="card" key={j.id}>
              <h3>{j.title} <small style={{ color: 'var(--muted)' }}>at {j.company}</small></h3>
              <p>{j.location} · {j.type} · {j.ctc} · Deadline {j.deadline}</p>
              <p style={{ color: eligible ? 'var(--success, #16a34a)' : '#dc2626' }}>
                {eligible ? '✓ You are eligible' : '✗ Not eligible (CGPA/branch)'}
              </p>
              <Link className="btn btn-outline" to={`/student/jobs/${j.id}`}>View details</Link>
            </div>
          )
        })}
        {jobs.length === 0 && <p>No jobs found.</p>}
      </div>
    </>
  )
}