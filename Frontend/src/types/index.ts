export type Role = 'student' | 'recruiter' | 'tpo'

// TODO: confirm these status values with the backend teammate
export type ApplicationStatus =
  | 'applied'
  | 'shortlisted'
  | 'oa_scheduled'
  | 'interview_scheduled'
  | 'selected'
  | 'rejected'

export interface Job {
  id: string
  title: string
  company: string
  location: string
  type: 'Full-time' | 'Internship'
  ctc: string
  deadline: string
  skills: string[]
  minCgpa: number
  branches: string[]
  description: string
}

export interface Application {
  id: string
  jobId: string
  status: ApplicationStatus
  appliedOn: string
}