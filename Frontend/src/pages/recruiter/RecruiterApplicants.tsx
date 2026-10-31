import { useState } from 'react'
import MockBanner from '../../components/dashboard/MockBanner'
import StatusBadge from '../../components/dashboard/StatusBadge'
import { mockApplicants } from '../../mock/recruiterData'
import type { Applicant } from '../../types/recruiter'
import type { ApplicationStatus } from '../../types'

export default function RecruiterApplicants() {
  const [list, setList] = useState<Applicant[]>(mockApplicants)
  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationStatus>('all')
  const [minScore, setMinScore] = useState(0)
  const [selected, setSelected] = useState<Applicant | null>(null)

  function updateStatus(id: string, status: ApplicationStatus) {
    setList(prev => prev.map(a => (a.id === id ? { ...a, status } : a)))
    setSelected(prev => (prev && prev.id === id ? { ...prev, status } : prev))
  }

  const shown = list
    .filter(a => (statusFilter === 'all' || a.status === statusFilter) && a.matchScore >= minScore)
    .sort((a, b) => b.matchScore - a.matchScore)

  return (
    <>
      <MockBanner />
      <h2>Applicants</h2>
      <p style={{ fontSize: 13, color: 'var(--muted)' }}>
        Match scores are mock numbers, not real AI results. They only assist your review; the hiring decision is yours.
      </p>
      <div style={{ display: 'flex', gap: 12, margin: '12px 0', alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as 'all' | ApplicationStatus)} style={{ padding: 10, borderRadius: 8 }}>
          <option value="all">All statuses</option>
          <option value="applied">Applied</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="rejected">Rejected</option>
        </select>
        <label>Min score: {minScore}
          <input type="range" min={0} max={100} value={minScore} onChange={e => setMinScore(Number(e.target.value))} style={{ marginLeft: 8 }} />
        </label>
      </div>

      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>Branch</th><th>CGPA</th><th>Mock score</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {shown.map(a => (
              <tr key={a.id}>
                <td>{a.name}</td><td>{a.branch}</td><td>{a.cgpa}</td><td>{a.matchScore}%</td>
                <td><StatusBadge status={a.status} /></td>
                <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button className="btn btn-outline" onClick={() => setSelected(a)}>View</button>
                  <button className="btn btn-primary" onClick={() => updateStatus(a.id, 'shortlisted')}>Shortlist</button>
                  <button className="btn btn-outline" onClick={() => updateStatus(a.id, 'rejected')}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && <p>No applicants match the filters.</p>}
      </div>

      {selected && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>{selected.name} - candidate review</h3>
          <p>{selected.branch} | CGPA {selected.cgpa}</p>
          <p><b>Matching skills:</b> {selected.requiredSkills.filter(s => selected.skills.includes(s)).map(s => <span className="tag" key={s}>{s}</span>)}</p>
          <p><b>Skill gaps:</b> {selected.requiredSkills.filter(s => !selected.skills.includes(s)).map(s => <span className="tag missing" key={s}>{s}</span>)}</p>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Resume viewing will be connected once the backend provides a resume endpoint.</p>
          <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
        </div>
      )}
    </>
  )
}
