import MockBanner from '../../components/dashboard/MockBanner'
import { mockStudent } from '../../mock/studentData'

export default function StudentProfile() {
  return (
    <>
      <MockBanner />
      <h2>My Profile</h2>
      <div className="card" style={{ maxWidth: 520 }}>
        <form className="form" onSubmit={e => { e.preventDefault(); alert('Mock save only') }}>
          <label>Name<input defaultValue={mockStudent.name} /></label>
          <label>Branch<input defaultValue={mockStudent.branch} /></label>
          <label>CGPA<input type="number" step="0.01" defaultValue={mockStudent.cgpa} /></label>
          <label>Graduation year<input type="number" defaultValue={mockStudent.year} /></label>
          <label>Skills (comma separated)<input defaultValue={mockStudent.skills.join(', ')} /></label>
          <label>Resume (PDF)<input type="file" accept="application/pdf" /></label>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Resume parsing is not connected yet.</p>
          <button className="btn btn-primary" type="submit">Save</button>
        </form>
      </div>
    </>
  )
}