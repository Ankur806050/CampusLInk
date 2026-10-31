import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
export default function StudentApplications() {
 const [items,setItems]=useState<any[]>([]);const [error,setError]=useState('');const [loading,setLoading]=useState(true)
 useEffect(()=>{api<any>('/student/applications').then(r=>setItems(r.data||[])).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[])
 return <><h2>My Applications</h2>{loading&&<p>Loading applications…</p>}{error&&<div className="error">{error}</div>}<div className="card"><table><thead><tr><th>Job</th><th>Company</th><th>Applied on</th><th>Status</th></tr></thead><tbody>{items.map(a=><tr key={a.id}><td>{a.job?.title||'Job'}</td><td>{a.job?.companyName||'—'}</td><td>{a.appliedAt?new Date(a.appliedAt).toLocaleDateString():'—'}</td><td>{a.status}</td></tr>)}</tbody></table>{!loading&&!error&&items.length===0&&<p>You haven't applied to any jobs yet.</p>}</div></>
}
