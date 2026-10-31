import { MOCK_LABEL } from '../../mock/studentData'

export default function MockBanner() {
  return (
    <div style={{ background: '#fef3c7', color: '#92400e', padding: '8px 12px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
      ⚠ {MOCK_LABEL}
    </div>
  )
}