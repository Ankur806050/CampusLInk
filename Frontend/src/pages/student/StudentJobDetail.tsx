import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../lib/api'

type Job = {
  id: string
  title: string
  companyName: string
  location?: string
  workMode?: string
  jobType: 'FULL_TIME' | 'INTERNSHIP'
  compensation: string
  description: string
  eligibleBranches?: string[]
  eligibleGraduationYears?: number[]
  minimumCgpa?: number
  requiredSkills?: string[]
  applicationDeadline?: string
}

type ResumeItem = { id: string; originalName: string }

export default function StudentJobDetail() {
  const { id } = useParams()
  const [job, setJob] = useState<Job | null>(null)
  const [resumes, setResumes] = useState<ResumeItem[]>([])
  const [selectedResume, setSelectedResume] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        if (!id) throw new Error('Missing job ID.')
        const [jobResult, resumeResult] = await Promise.all([
          api<{ data: Job }>(`/jobs/${id}`),
          api<{ data: ResumeItem[] }>('/student/resumes'),
        ])
        if (!active) return
        setJob(jobResult.data)
        setResumes(resumeResult.data || [])
      } catch (err) {
        if (active) setError((err as Error).message)
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [id])

  async function apply() {
    if (!id) return
    setBusy(true)
    setError('')
    setMessage('')
    const body = selectedResume ? { resumeId: selectedResume } : {}
    try {
      const result = await api<{ message: string }>(`/student/applications/${id}`, {
        method: 'POST',
        body: JSON.stringify(body),
      })
      setMessage(result.message || 'Application submitted successfully.')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="container" style={{ paddingTop: 24 }}>Loading job details…</div>
  if (error && !job) return <div className="container" style={{ paddingTop: 24 }}><div className="error" role="alert">{error}</div><Link to="/student/jobs">Back to jobs</Link></div>
  if (!job) return <div className="container" style={{ paddingTop: 24 }}>Job not found. <Link to="/student/jobs">Back to jobs</Link></div>

  return (
    <>
      <Link to="/student/jobs">← Back to jobs</Link>
      <div className="card" style={{ marginTop: 12 }}>
        <h2>{job.title}</h2>
        <p><b>{job.companyName}</b> · {job.location || 'Location not specified'} · {job.jobType === 'FULL_TIME' ? 'Full-time' : 'Internship'} · {job.compensation}</p>
        <p><b>Work mode:</b> {job.workMode || 'Not specified'}</p>
        <p>{job.description}</p>
        <p><b>Eligible branches:</b> {(job.eligibleBranches || []).join(', ') || 'All branches'}</p>
        <p><b>Eligible graduation years:</b> {(job.eligibleGraduationYears || []).join(', ') || 'Not restricted'}</p>
        <p><b>Minimum CGPA:</b> {job.minimumCgpa ?? 'Not specified'}</p>
        <p><b>Required skills:</b> {(job.requiredSkills || []).length ? job.requiredSkills?.map((skill) => <span className="tag" key={skill}>{skill}</span>) : 'Not specified'}</p>
        <p><b>Deadline:</b> {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleString() : '—'}</p>

        <div className="form" style={{ maxWidth: 420, marginTop: 18 }}>
          <label>Resume to attach (optional)
            <select value={selectedResume} onChange={(e) => setSelectedResume(e.target.value)}>
              <option value="">Apply without attaching a saved resume</option>
              {resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.originalName}</option>)}
            </select>
          </label>
          {!resumes.length && <p style={{ fontSize: 13, color: 'var(--muted)' }}>You have not uploaded a resume yet. You can upload one from your profile.</p>}
        </div>
        {error && <div className="error" role="alert">{error}</div>}
        {message && <p role="status" style={{ color: 'var(--success, #16a34a)' }}>{message}</p>}
        <button className="btn btn-primary" disabled={busy || !!message} onClick={() => void apply()}>{busy ? 'Submitting…' : message ? 'Applied' : 'Apply for this job'}</button>
      </div>
    </>
  )
}
