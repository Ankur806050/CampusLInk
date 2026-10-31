import MockBanner from '../../components/dashboard/MockBanner'
import { mockRecruiterJobs } from '../../mock/recruiterData'

const label = { draft: 'Draft', pending_tpo: 'Pending TPO approval', published: 'Published' }

export default function RecruiterJobs() {
  return (
    <>
      <MockBanner />
      <h2>My Jobs</h2>
      <div className="card">
        <table>
          <thead><tr><th>Title</th><th>Type</th><th>CTC</th><th>Deadline</th><th>Status</th><th>Applicants</th></tr></thead>
          <tbody>
            {mockRecruiterJobs.map(j => (
              <tr key={j.id}>
                <td>{j.title}</td><td>{j.type}</td><td>{j.ctc}</td><td>{j.deadline}</td>
                <td>{label[j.status]}</td><td>{j.applicants}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
