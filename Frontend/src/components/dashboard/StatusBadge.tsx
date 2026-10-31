import type { ApplicationStatus } from '../../types'

const colors: Record<ApplicationStatus, string> = {
  applied: '#2563eb',
  shortlisted: '#7c3aed',
  oa_scheduled: '#d97706',
  interview_scheduled: '#d97706',
  selected: '#16a34a',
  rejected: '#dc2626',
}

export default function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span style={{
      background: colors[status] + '22', color: colors[status],
      padding: '3px 10px', borderRadius: 999, fontSize: 13, fontWeight: 600,
    }}>
      {status.replace('_', ' ')}
    </span>
  )
}