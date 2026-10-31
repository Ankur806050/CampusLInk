import { useEffect,useState } from 'react'
import { api } from '../../lib/api'
export default function StudentHome() {
 const [profile,setProfile]=useState<any>(null);const [applications,setApplications]=useState<any[]>([]);const [notifications,setNotifications]=useState<any[]>([])
 useEffect(()=>{api<any>('/student/profile').then(r=>setProfile(r.data)).catch(()=>{});api<any>('/student/applications').then(r=>setApplications(r.data||[])).catch(()=>{});api<any>('/notifications?limit=5').then(r=>setNotifications(r.notifications||[])).catch(()=>{})},[])
 return <><h2>Welcome{profile?.name?`, ${profile.name}`:''} 👋</h2><div className="grid-3" style={{marginBottom:24}}><div className="card"><h3>{applications.length}</h3><p>Applications</p></div><div className="card"><h3>{profile?.cgpa??'—'}</h3><p>CGPA</p></div><div className="card"><h3>{profile?.branch||'—'}</h3><p>Branch</p></div></div><div className="card"><h3>Notifications</h3>{notifications.length?<ul>{notifications.map(n=><li key={n.id}>{n.title}: {n.message}</li>)}</ul>:<p>No notifications yet.</p>}</div></>
}
