import { useState } from 'react'
import MockBanner from '../../components/dashboard/MockBanner'

interface Proposal { id: number; kind: string; date: string; time: string; notes: string }

export default function RecruiterSchedule() {
  const [proposals, setProposals] = useState<Proposal[]>([])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const f = new FormData(form)
    setProposals(prev => [...prev, {
      id: Date.now(),
      kind: String(f.get('kind')),
      date: String(f.get('date')),
      time: String(f.get('time')),
      notes: String(f.get('notes')),
    }])
    form.reset()
  }

  return (
    <>
      <MockBanner />
      <h2>Propose OA / Interview Schedule</h2>
      <div className="card" style={{ maxWidth: 520 }}>
        <form className="form" onSubmit={handleSubmit}>
          <label>Type
            <select name="kind"><option>Online Assessment</option><option>Interview</option></select>
          </label>
          <label>Date<input name="date" type="date" required /></label>
          <label>Time<input name="time" type="time" required /></label>
          <label>Notes<input name="notes" placeholder="Platform link, instructions" /></label>
          <button className="btn btn-primary" type="submit">Send proposal to TPO</button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>My proposals</h3>
        {proposals.length === 0 ? <p>No proposals yet.</p> : (
          <table>
            <thead><tr><th>Type</th><th>Date</th><th>Time</th><th>TPO status</th></tr></thead>
            <tbody>
              {proposals.map(p => (
                <tr key={p.id}><td>{p.kind}</td><td>{p.date}</td><td>{p.time}</td><td>Pending TPO approval (mock)</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
