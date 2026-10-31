import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import MockBanner from '../../components/dashboard/MockBanner'
import { mockJobs, mockStudent } from '../../mock/studentData'

export default function StudentJobDetail() {
  const { id } = useParams()
  const [applied, setApplied] = useState(false)
  const job = mockJobs.find(j => j.id === id)

  if (!job) return <p>Job not found. <Link to="/student/jobs">Back</Link></p>

  const eligible = mockStudent.cgpa >= job.minCgpa && job.branches.includes(mockStudent.branch)
  const matching = job.skills.filter(s => mockStudent.skills.includes(s))
  const missing = job.skills.filter(s => !mockStudent.skills.includes(s))

  return (
    <>
      <MockBanner />
      <Link to="/student/jobs">← Back to jobs</Link>
      <div className="card" style={{ marginTop: 12 }}>
        <h2>{job.title}</h2>
        <p><b>{job.company}</b> · {job.location} · {job.type} · {job.ctc}</p>
        <p>{job.description}</p>
        <p><b>Eligibility:</b> CGPA ≥ {job.minCgpa}, Branches: {job.branches.join(', ')}</p>
        <p><b>Deadline:</b> {job.deadline}</p>
        <p><b>Matching skills:</b> {matching.map(s => <span className="tag" key={s}>{s}</span>)}</p>
        <p><b>Skills to learn:</b> {missing.map(s => <span className="tag missing" key={s}>{s}</span>)}</p>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Skill comparison here is a simple mock check, not an AI result.</p>
        <button className="btn btn-primary" disabled={!eligible || applied} onClick={() => setApplied(true)}>
          {applied ? 'Applied (mock)' : eligible ? 'Apply' : 'Not eligible'}
        </button>
      </div>
    </>
  )
}