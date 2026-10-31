import type { Applicant, CompanyApprovalStatus, RecruiterJob } from '../types/recruiter'

// Change to 'pending' or 'rejected' to test the UI states
export const mockCompanyStatus: CompanyApprovalStatus = 'approved'

export const mockCompany = {
  name: 'TechNova',
  hrName: 'Riya Sharma',
  hrEmail: 'hr@technova.example',
}

export const mockRecruiterJobs: RecruiterJob[] = [
  { id: 'rj1', title: 'Frontend Developer', type: 'Full-time', ctc: '8 LPA', location: 'Bengaluru', deadline: '2026-11-20', status: 'published', applicants: 3 },
  { id: 'rj2', title: 'UI/UX Intern', type: 'Internship', ctc: '20,000 / month', location: 'Remote', deadline: '2026-12-05', status: 'pending_tpo', applicants: 0 },
]

export const mockApplicants: Applicant[] = [
  { id: 'ap1', name: 'Arjun Patel', branch: 'CSE', cgpa: 8.2, jobId: 'rj1', skills: ['React', 'JavaScript', 'CSS'], requiredSkills: ['React', 'TypeScript', 'CSS'], matchScore: 78, status: 'applied' },
  { id: 'ap2', name: 'Neha Verma', branch: 'IT', cgpa: 8.9, jobId: 'rj1', skills: ['React', 'TypeScript', 'CSS', 'Figma'], requiredSkills: ['React', 'TypeScript', 'CSS'], matchScore: 94, status: 'applied' },
  { id: 'ap3', name: 'Rahul Singh', branch: 'CSE', cgpa: 7.1, jobId: 'rj1', skills: ['HTML', 'Python'], requiredSkills: ['React', 'TypeScript', 'CSS'], matchScore: 41, status: 'applied' },
]
