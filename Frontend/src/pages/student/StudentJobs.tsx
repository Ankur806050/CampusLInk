import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
export default function StudentJobs() {
 const [jobs,setJobs]=useState<any[]>([]); const [q,setQ]=useState(''); const [type,setType]=useState('All'); const [error,setError]=useState(''); const [loading,setLoading]=useState(true)
 useEffect(()=>{api<any>('/jobs').then(r=>setJobs(r.data||r.jobs||[])).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[])
 const shown=useMemo(()=>jobs.filter(j=>(type==='All'||j.jobType===type)&&(String(j.title||'')+' '+String(j.companyName||'')+' '+String(j.location||'')).toLowerCase().includes(q.toLowerCase())),[jobs,q,type])
 return <><h2>Browse Jobs</h2><div style={{display:'flex',gap:10,marginBottom:16}}><input placeholder="Search role, company, location" value={q} onChange={e=>setQ(e.target.value)} style={{flex:1,padding:10,border:'1px solid var(--border)',borderRadius:8}}/><select value={type} onChange={e=>setType(e.target.value)} style={{padding:10,borderRadius:8}}><option value="All">All types</option><option value="FULL_TIME">Full-time</option><option value="INTERNSHIP">Internship</option></select></div>
 {loading&&<p>Loading jobs…</p>}{error&&<div className="error">{error}</div>}<div style={{display:'grid',gap:16}}>{shown.map(j=><div className="card" key={j.id||j._id}><h3>{j.title} <small style={{color:'var(--muted)'}}>at {j.companyName}</small></h3><p>{j.location||'Location not specified'} · {j.jobType==='FULL_TIME'?'Full-time':'Internship'} · {j.compensation} · Deadline {j.applicationDeadline?new Date(j.applicationDeadline).toLocaleDateString():'—'}</p><Link className="btn btn-outline" to={`/student/jobs/${j.id||j._id}`}>View details</Link></div>)}{!loading&&!error&&shown.length===0&&<p>No published jobs found.</p>}</div></>
}
