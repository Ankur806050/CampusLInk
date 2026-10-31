import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
export default function VerifyEmail() {
 const location = useLocation(); const navigate = useNavigate()
 const [email,setEmail] = useState((location.state as any)?.email || '')
 const [otp,setOtp] = useState(''); const [error,setError] = useState(''); const [busy,setBusy] = useState(false)
 async function submit(e: React.FormEvent) { e.preventDefault(); setError(''); setBusy(true); try { await api('/auth/verify-email',{method:'POST',body:JSON.stringify({email,otp})}); navigate('/login',{replace:true}) } catch(err) { setError((err as Error).message) } finally { setBusy(false) } }
 return <div className="container" style={{maxWidth:420,paddingTop:50}}><div className="card"><h2>Verify email</h2><p>Enter the verification code sent to your email address.</p><form className="form" onSubmit={submit}><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label><label>6-digit code<input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value)} required /></label>{error&&<div className="error">{error}</div>}<button className="btn btn-primary" disabled={busy}>{busy?'Verifying…':'Verify email'}</button></form><p><Link to="/login">Back to login</Link></p></div></div>
}
