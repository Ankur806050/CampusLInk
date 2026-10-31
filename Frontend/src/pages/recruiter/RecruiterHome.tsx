import MockBanner from '../../components/dashboard/MockBanner'
import { mockCompany, mockCompanyStatus, mockRecruiterJobs, mockApplicants } from '../../mock/recruiterData'

const statusText = {
  pending: { msg: 'Your company registration is pending TPO approval. You cannot post jobs yet.', bg: '#fef3c7', color: '#92400e' },
  approved: { msg: 'Your company is approved. You can post jobs.', bg: '#dcfce7', color: '#166534' },
  rejected: { msg: 'Your company registration was rejected. Please contact the TPO.', bg: '#fee2e2', color: '#991b1b' },
}

export default function RecruiterHome() {
  const s = statusText[mockCompanyStatus]
  return (
    <>
      <MockBanner />
      <h2>{mockCompany.name} - Recruiter Overview</h2>
      <div style={{ background: s.bg, color: s.color, padding: 12, borderRadius: 8, marginBottom: 20 }}>
        <b>Approval status: {mockCompanyStatus}</b>
        <div>{s.msg}</div>
      </div>
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card"><h3>{mockRecruiterJobs.length}</h3><p>Jobs</p></div>
        <div className="card"><h3>{mockApplicants.length}</h3><p>Applicants</p></div>
        <div className="card"><h3>{mockApplicants.filter(a => a.status === 'shortlisted').length}</h3><p>Shortlisted</p></div>
      </div>
      <div className="card">
        <h3>Company contact</h3>
        <p>HR: {mockCompany.hrName} | {mockCompany.hrEmail}</p>
      </div>
    </>
  )
}
