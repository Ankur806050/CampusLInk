import { useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/api'

type StudentProfileData = {
  id: string
  name: string
  email: string
  branch?: string
  cgpa?: number
  graduationYear?: number | null
  phone?: string
  bio?: string
  linkedinUrl?: string
  githubUrl?: string
  portfolioUrl?: string
}

type ResumeItem = {
  id: string
  originalName: string
  mimeType: string
  size: number
  createdAt: string
}

export default function StudentProfile() {
  const [profile, setProfile] = useState<StudentProfileData | null>(null)
  const [resumes, setResumes] = useState<ResumeItem[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [resumeBusy, setResumeBusy] = useState(false)

  const loadResumes = useCallback(async () => {
    const result = await api<{ data: ResumeItem[] }>('/student/resumes')
    setResumes(result.data || [])
  }, [])

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [profileResult, resumeResult] = await Promise.all([
          api<{ data: StudentProfileData }>('/student/profile'),
          api<{ data: ResumeItem[] }>('/student/resumes'),
        ])
        if (!active) return
        setProfile(profileResult.data)
        setResumes(resumeResult.data || [])
      } catch (err) {
        if (active) setError((err as Error).message)
      }
    }
    void load()
    return () => { active = false }
  }, [])

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!profile) return
    setError('')
    setMessage('')
    setBusy(true)
    const form = new FormData(e.currentTarget)
    const body = Object.fromEntries(
      ['name', 'phone', 'bio', 'linkedinUrl', 'githubUrl', 'portfolioUrl'].map((key) => [key, String(form.get(key) || '').trim()]),
    )
    try {
      const result = await api<{ data: StudentProfileData; message: string }>('/student/profile', {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      setProfile(result.data || { ...profile, ...body })
      setMessage(result.message || 'Profile updated successfully.')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function uploadResume(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fileInput = form.elements.namedItem('resume') as HTMLInputElement | null
    const file = fileInput?.files?.[0]
    if (!file) {
      setError('Choose a PDF or DOCX resume first.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Resume must not exceed 5 MB.')
      return
    }
    setError('')
    setMessage('')
    setResumeBusy(true)
    const body = new FormData()
    body.append('resume', file)
    try {
      const result = await api<{ message: string }>('/student/resumes', { method: 'POST', body })
      await loadResumes()
      form.reset()
      setMessage(result.message || 'Resume uploaded successfully.')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setResumeBusy(false)
    }
  }

  async function deleteResume(resumeId: string) {
    setError('')
    setMessage('')
    try {
      const result = await api<{ message: string }>(`/student/resumes/${resumeId}`, { method: 'DELETE' })
      await loadResumes()
      setMessage(result.message || 'Resume deleted successfully.')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (!profile && !error) return <div className="container" style={{ paddingTop: 24 }}>Loading profile…</div>

  return (
    <>
      <h2>My Profile</h2>
      {error && <div className="error" role="alert">{error}</div>}
      {message && <p role="status" style={{ color: 'var(--success, #16a34a)' }}>{message}</p>}
      {profile && (
        <div className="card" style={{ maxWidth: 640 }}>
          <p><b>Email:</b> {profile.email}</p>
          <p><b>Branch:</b> {profile.branch || '—'} · <b>CGPA:</b> {profile.cgpa ?? '—'} · <b>Graduation year:</b> {profile.graduationYear ?? '—'}</p>
          <form className="form" onSubmit={save}>
            <label>Name<input name="name" defaultValue={profile.name} minLength={2} maxLength={80} required /></label>
            <label>Phone<input name="phone" defaultValue={profile.phone || ''} maxLength={25} /></label>
            <label>Bio<textarea name="bio" defaultValue={profile.bio || ''} rows={3} maxLength={1000} /></label>
            <label>LinkedIn URL<input name="linkedinUrl" type="url" defaultValue={profile.linkedinUrl || ''} maxLength={300} /></label>
            <label>GitHub URL<input name="githubUrl" type="url" defaultValue={profile.githubUrl || ''} maxLength={300} /></label>
            <label>Portfolio URL<input name="portfolioUrl" type="url" defaultValue={profile.portfolioUrl || ''} maxLength={300} /></label>
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
          </form>
        </div>
      )}

      <div className="card" style={{ maxWidth: 640, marginTop: 20 }}>
        <h3>My resumes</h3>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Upload a PDF or DOCX file up to 5 MB. Resume content is not parsed on this page.</p>
        <form className="form" onSubmit={uploadResume}>
          <label>Resume file<input name="resume" type="file" accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx" required /></label>
          <button className="btn btn-primary" disabled={resumeBusy}>{resumeBusy ? 'Uploading…' : 'Upload resume'}</button>
        </form>
        {resumes.length ? (
          <ul style={{ paddingLeft: 20, marginTop: 16 }}>
            {resumes.map((resume) => (
              <li key={resume.id} style={{ marginBottom: 10 }}>
                {resume.originalName} · {(resume.size / 1024).toFixed(0)} KB
                {' '}<button type="button" className="btn btn-outline" onClick={() => void deleteResume(resume.id)}>Delete</button>
              </li>
            ))}
          </ul>
        ) : <p>No resumes uploaded yet.</p>}
      </div>
    </>
  )
}
