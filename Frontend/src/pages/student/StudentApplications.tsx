import MockBanner from '../../components/dashboard/MockBanner'
import StatusBadge from '../../components/dashboard/StatusBadge'
import { mockApplications, mockJobs } from '../../mock/studentData'

export default function StudentApplications() {
  return (
    <>
      <MockBanner />
      <h2>My Applications</h2>
      <div className="card">
        <table>
          <thead><tr><th>Job</th><th>Company</th><th>Applied on</th><th>Status</th></tr></thead>
          <tbody>
            {mockApplications.map(a => {
              const job = mockJobs.find(j => j.id === a.jobId)
              return (
                <tr key={a.id}>
                  <td>{job?.title}</td><td>{job?.company}</td><td>{a.appliedOn}</td>
                  <td><StatusBadge status={a.status} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}