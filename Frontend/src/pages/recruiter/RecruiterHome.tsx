import { useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/api'

type RecruiterJob = {
  id: string
  title: string
  status: string
}

type CompanyRequest = {
  id: string
  name: string
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
  decision?: { note?: string }
}

export default function RecruiterHome() {
  const [jobs, setJobs] = useState<RecruiterJob[]>([])
  const [companies, setCompanies] = useState<CompanyRequest[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [website, setWebsite] = useState('')
  const [industry, setIndustry] = useState('')
  const [hrName, setHrName] = useState('')
  const [hrEmail, setHrEmail] = useState('')
  const [hrPhone, setHrPhone] = useState('')

  const refresh = useCallback(async () => {
    setError('')
    try {
      const [jobsResult, companiesResult] = await Promise.all([
        api<{ data: RecruiterJob[] }>('/recruiter/jobs'),
        api<{ data: CompanyRequest[] }>('/companies/requests'),
      ])
      setJobs(jobsResult.data || [])
      setCompanies(companiesResult.data || [])
    } catch (err) {
      setError((err as Error).message)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  async function requestCompanyApproval(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)

    const optionalFields = { website, industry, hrName, hrEmail, hrPhone }
    const body: Record<string, string> = { name: companyName.trim() }
    for (const [key, value] of Object.entries(optionalFields)) {
      if (value.trim()) body[key] = value.trim()
    }

    try {
      const result = await api<{ message: string }>('/companies/requests', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      setMessage(result.message || 'Company approval request submitted.')
      setCompanyName('')
      setWebsite('')
      setIndustry('')
      setHrName('')
      setHrEmail('')
      setHrPhone('')
      await refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const latestCompany = companies[0]
  const hasPendingOrApprovedCompany = latestCompany?.status === 'PENDING_APPROVAL' || latestCompany?.status === 'APPROVED'

  return (
    <>
      <h2>Recruiter Overview</h2>
      {error && <div className="error" role="alert">{error}</div>}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card"><h3>{jobs.length}</h3><p>Jobs submitted</p></div>
        <div className="card"><h3>{jobs.filter((job) => job.status === 'PUBLISHED').length}</h3><p>Published jobs</p></div>
        <div className="card"><h3>{companies.length}</h3><p>Company approval requests</p></div>
      </div>

      <div className="card" style={{ maxWidth: 700 }}>
        <h3>Company approval</h3>
        {hasPendingOrApprovedCompany ? (
          <>
            <p><b>{latestCompany.name}</b></p>
            <p>Status: <b>{latestCompany.status.replace('_', ' ')}</b></p>
            {latestCompany.status === 'PENDING_APPROVAL' && <p>The TPO is reviewing your company details. Job posting becomes available after approval.</p>}
            {latestCompany.status === 'APPROVED' && <p>Your company is approved. You can submit jobs for TPO approval.</p>}
          </>
        ) : (
          <>
            <p>Submit your company details for TPO approval. A verified recruiter can submit this request while awaiting approval.</p>
            <form className="form" onSubmit={requestCompanyApproval}>
              <label>Company name<input value={companyName} onChange={(e) => setCompanyName(e.target.value)} minLength={2} maxLength={150} required /></label>
              <label>Website<input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} maxLength={300} /></label>
              <label>Industry<input value={industry} onChange={(e) => setIndustry(e.target.value)} maxLength={100} /></label>
              <label>HR contact name<input value={hrName} onChange={(e) => setHrName(e.target.value)} maxLength={100} /></label>
              <label>HR email<input type="email" value={hrEmail} onChange={(e) => setHrEmail(e.target.value)} maxLength={254} /></label>
              <label>HR phone<input value={hrPhone} onChange={(e) => setHrPhone(e.target.value)} maxLength={25} /></label>
              {message && <p role="status">{message}</p>}
              <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Request company approval'}</button>
            </form>
          </>
        )}
        {latestCompany?.status === 'REJECTED' && latestCompany.decision?.note && (
          <p><b>TPO note:</b> {latestCompany.decision.note}</p>
        )}
        {message && hasPendingOrApprovedCompany && <p role="status">{message}</p>}
      </div>
    </>
  )
}
