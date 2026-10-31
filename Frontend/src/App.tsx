import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import DashboardLayout from './components/dashboard/DashboardLayout'
import StudentHome from './pages/student/StudentHome'
import StudentJobs from './pages/student/StudentJobs'
import StudentJobDetail from './pages/student/StudentJobDetail'
import StudentApplications from './pages/student/StudentApplications'
import StudentProfile from './pages/student/StudentProfile'
import RecruiterHome from './pages/recruiter/RecruiterHome'
import RecruiterPostJob from './pages/recruiter/RecruiterPostJob'
import RecruiterJobs from './pages/recruiter/RecruiterJobs'
import RecruiterApplicants from './pages/recruiter/RecruiterApplicants'
import RecruiterSchedule from './pages/recruiter/RecruiterSchedule'

const studentLinks = [
  { to: '/student', label: 'Overview' },
  { to: '/student/profile', label: 'Profile' },
  { to: '/student/jobs', label: 'Browse Jobs' },
  { to: '/student/applications', label: 'Applications' },
]

const recruiterLinks = [
  { to: '/recruiter', label: 'Overview' },
  { to: '/recruiter/post-job', label: 'Post Job' },
  { to: '/recruiter/jobs', label: 'My Jobs' },
  { to: '/recruiter/applicants', label: 'Applicants' },
  { to: '/recruiter/schedule', label: 'Schedule' },
]

export default function App() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: '70vh' }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/student" element={<DashboardLayout title="Student" links={studentLinks} />}>
            <Route index element={<StudentHome />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="jobs" element={<StudentJobs />} />
            <Route path="jobs/:id" element={<StudentJobDetail />} />
            <Route path="applications" element={<StudentApplications />} />
          </Route>

          <Route path="/recruiter" element={<DashboardLayout title="Recruiter" links={recruiterLinks} />}>
            <Route index element={<RecruiterHome />} />
            <Route path="post-job" element={<RecruiterPostJob />} />
            <Route path="jobs" element={<RecruiterJobs />} />
            <Route path="applicants" element={<RecruiterApplicants />} />
            <Route path="schedule" element={<RecruiterSchedule />} />
          </Route>
        </Routes>
      </main>
      <Footer />
    </>
  )
}
