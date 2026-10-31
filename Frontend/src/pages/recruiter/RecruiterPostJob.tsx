import { useState } from 'react'
import MockBanner from '../../components/dashboard/MockBanner'
import { mockCompanyStatus } from '../../mock/recruiterData'

export default function RecruiterPostJob() {
  const [done, setDone] = useState(false)
  const blocked = mockCompanyStatus !== 'approved'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setDone(true)
  }

  return (
    <>
      <MockBanner />
      <h2>Post a Job</h2>
      {blocked && <p className="error">Your company must be approved by the TPO before posting jobs.</p>}
      <div className="card" style={{ maxWidth: 640 }}>
        <form className="form" onSubmit={handleSubmit}>
          <fieldset disabled={blocked} style={{ border: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label>Job title<input required /></label>
            <label>Type
              <select><option>Full-time</option><option>Internship</option></select>
            </label>
            <label>CTC / Stipend amount<input placeholder="e.g. 8" required /></label>
            <label>Pay unit
              <select><option>LPA (per year)</option><option>Per month</option></select>
            </label>
            <label>Location<input required /></label>
            <label>Description<textarea rows={4} style={{ width: '100%', padding: 10, border: '1px solid var(--border)', borderRadius: 8 }} /></label>
            <label>Required skills (comma separated)<input /></label>
            <label>Preferred skills (comma separated)<input /></label>
            <label>Application deadline<input type="date" required /></label>
            <label>Eligible branches (comma separated)<input placeholder="CSE, IT" /></label>
            <label>Minimum CGPA<input type="number" step="0.1" min="0" max="10" /></label>
            <label>Graduation year<input type="number" /></label>
            <label>Max active backlogs allowed<input type="number" min="0" defaultValue={0} /></label>
            <button className="btn btn-primary" type="submit">Submit for TPO approval</button>
          </fieldset>
        </form>
        {done && <p style={{ color: '#16a34a', marginTop: 12 }}>Submitted (mock only). Nothing was sent to the backend.</p>}
      </div>
    </>
  )
}
