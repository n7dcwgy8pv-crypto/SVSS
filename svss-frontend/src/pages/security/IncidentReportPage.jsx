import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/shared/AppLayout'
import IncidentForm from '../../components/incidents/IncidentForm'
import Button from '../../components/shared/Button'
import './IncidentReportPage.css'

export default function IncidentReportPage() {
  const navigate = useNavigate()

  return (
    <AppLayout title="Report Incident">
      <div className="inc-report-page">
        <div className="inc-report-card">
          <div className="inc-report-header">
            <div className="inc-report-icon" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--neon-amber)" strokeWidth="2">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <h2 className="inc-report-title">File Incident Report</h2>
              <p className="inc-report-sub">
                Report suspicious activity, duplicate entries, or invalid ticket attempts.
                All reports are logged and reviewed by administrators.
              </p>
            </div>
          </div>

          <IncidentForm onSuccess={() => navigate('/security/dashboard')} />

          <div className="inc-report-back">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Back
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
