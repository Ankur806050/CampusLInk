import type { ApplicationStatus } from './index'

// TODO: confirm with backend teammate
export type CompanyApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface RecruiterJob {
  id: string
  title: string
  type: 'Full-time' | 'Internship'
  ctc: string
  location: string
  deadline: string
  status: 'draft' | 'pending_tpo' | 'published'
  applicants: number
}

export interface Applicant {
  id: string
  name: string
  branch: string
  cgpa: number
  jobId: string
  skills: string[]
  requiredSkills: string[]
  matchScore: number
  status: ApplicationStatus
}
