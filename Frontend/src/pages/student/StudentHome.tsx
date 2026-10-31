import MockBanner from '../../components/dashboard/MockBanner'
import { mockStudent, mockApplications, mockNotifications } from '../../mock/studentData'

export default function StudentHome() {
  return (
    <>
      <MockBanner />
      <h2>Welcome, {mockStudent.name} 👋</h2>
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card"><h3>{mockApplications.length}</h3><p>Applications</p></div>
        <div className="card"><h3>{mockStudent.cgpa}</h3><p>CGPA</p></div>
        <div className="card"><h3>{mockStudent.skills.length}</h3><p>Skills</p></div>
      </div>
      <div className="card">
        <h3>Notifications</h3>
        <ul>{mockNotifications.map(n => <li key={n}>{n}</li>)}</ul>
      </div>
    </>
  )
}