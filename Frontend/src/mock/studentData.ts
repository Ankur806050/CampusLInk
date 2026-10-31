import type { Job, Application } from '../types'

export const MOCK_LABEL = 'Mock data: not connected to backend yet'

export const mockStudent = {
  name: 'Arjun',
  branch: 'CSE',
  cgpa: 8.2,
  year: 2027,
  skills: ['React', 'JavaScript', 'Python', 'SQL'],
}

export const mockJobs: Job[] = [
  {
    id: 'j1', title: 'Frontend Developer', company: 'TechNova', location: 'Bengaluru',
    type: 'Full-time', ctc: '8 LPA', deadline: '2026-11-20',
    skills: ['React', 'TypeScript', 'CSS'], minCgpa: 7.0, branches: ['CSE', 'IT'],
    description: 'Build responsive web interfaces for our SaaS product.',
  },
  {
    id: 'j2', title: 'Data Analyst Intern', company: 'DataWorks', location: 'Remote',
    type: 'Internship', ctc: '25,000 / month', deadline: '2026-11-15',
    skills: ['Python', 'SQL', 'Excel'], minCgpa: 6.5, branches: ['CSE', 'IT', 'ECE'],
    description: 'Work with the analytics team on dashboards and reports.',
  },
  {
    id: 'j3', title: 'Backend Engineer', company: 'CloudBase', location: 'Hyderabad',
    type: 'Full-time', ctc: '12 LPA', deadline: '2026-12-01',
    skills: ['Node.js', 'SQL', 'Docker'], minCgpa: 8.5, branches: ['CSE'],
    description: 'Design and maintain scalable APIs.',
  },
]

export const mockApplications: Application[] = [
  { id: 'a1', jobId: 'j1', status: 'shortlisted', appliedOn: '2026-10-25' },
  { id: 'a2', jobId: 'j2', status: 'applied', appliedOn: '2026-10-28' },
]

export const mockNotifications = [
  'You were shortlisted for Frontend Developer at TechNova.',
  'OA schedule for TechNova will be shared soon.',
]