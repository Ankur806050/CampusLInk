import { useEffect,useState } from 'react'
import { api } from '../../lib/api'
export default function RecruiterJobs() {
 const [jobs,setJobs]=useState<any[]>([]);const [error,setError]=useState('');const [loading,setLoading]=useState(true)
 useEffect(()=>{api<any>('/recruiter/jobs').then(r=>setJobs(r.data||[])).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[])
 return <><h2>My Jobs</h2>{loading&&<p>Loading jobs…</p>}{error&&<div className="error">{error}</div>}<div className="card"><table><thead><tr><th>Title</th><th>Type</th><th>Compensation</th><th>Deadline</th><th>Status</th></tr></thead><tbody>{jobs.map(j=><tr key={j.id}><td>{j.title}</td><td>{j.jobType}</td><td>{j.compensation}</td><td>{j.applicationDeadline?new Date(j.applicationDeadline).toLocaleDateString():'—'}</td><td>{j.status}</td></tr>)}</tbody></table>{!loading&&!error&&!jobs.length&&<p>No jobs posted yet.</p>}</div></>
}
