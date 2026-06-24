import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AppLayout from '../../components/shared/AppLayout'
import Button from '../../components/shared/Button'
import Badge from '../../components/shared/Badge'
import Modal from '../../components/shared/Modal'
import IncidentForm from '../../components/incidents/IncidentForm'
import { approveEntryApi, rejectEntryApi } from '../../api/ticketApi'
import useScannerStore from '../../store/scannerStore'
import { ticketStatusLabel } from '../../utils/helpers'
import './VerificationPage.css'

export default function VerificationPage() {
  const navigate = useNavigate()
  const { scannedTicket, verificationResult, setVerificationResult, resetScanner } = useScannerStore()
  const [loading, setLoading] = useState('')
  const [incidentOpen, setIncidentOpen] = useState(false)

  /* ── No ticket loaded ── */
  if (!scannedTicket) {
    return (
      <AppLayout title="Ticket Verification">
        <div className="verify-empty">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="1.2" aria-hidden="true">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <p>No ticket has been scanned yet.<br/>Use the QR Scanner to scan a visitor's ticket first.</p>
          <Button onClick={() => navigate('/security/scanner')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Open Scanner
          </Button>
        </div>
      </AppLayout>
    )
  }

  const { label: statusLabel, color: statusColor } = ticketStatusLabel(scannedTicket.status)

  const handleApprove = async () => {
    setLoading('approve')
    try {
      await approveEntryApi(scannedTicket.id)
      setVerificationResult('approved')
      toast.success(`✅ Entry APPROVED for ${scannedTicket.visitorName}`)
    } catch (err) {
      toast.error(err.message)
    } finally { setLoading('') }
  }

  const handleReject = async () => {
    setLoading('reject')
    try {
      await rejectEntryApi(scannedTicket.id)
      setVerificationResult('rejected')
      toast.error(`🚫 Entry REJECTED for ${scannedTicket.visitorName}`)
    } catch (err) {
      toast.error(err.message)
    } finally { setLoading('') }
  }

  return (
    <AppLayout title="Ticket Verification">
      <div className="verify-page">

        {/* ── Decision banner (shown after decision) ── */}
        {verificationResult && (
          <div className={`verify-decision-banner verify-decision-banner--${verificationResult}`} role="alert">
            <div className="verify-decision-banner__icon">
              {verificationResult === 'approved'
                ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--neon-green)" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--neon-red)" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              }
            </div>
            <div>
              <p className="verify-decision-banner__title">
                Entry {verificationResult === 'approved' ? 'Approved ✓' : 'Rejected ✗'}
              </p>
              <p className="verify-decision-banner__sub">
                Decision recorded for {scannedTicket.visitorName}
              </p>
            </div>
          </div>
        )}

        <div className="verify-layout">
          {/* ── Photo Panel ── */}
          <div className="verify-photo-panel">
            <p className="verify-panel-label">Registered Photo</p>
            <div className="verify-photo">
              {scannedTicket.photoUrl
                ? <img src={scannedTicket.photoUrl} alt={`Registered photo of ${scannedTicket.visitorName}`} />
                : (
                  <div className="verify-no-photo">
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="1.2" aria-hidden="true">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <p>No photo on file</p>
                    <Badge variant="warning">Missing Photo</Badge>
                  </div>
                )
              }
            </div>
            <p className="verify-photo-note">
              ⚠ Compare this photo with the visitor standing in front of you before approving entry.
            </p>
          </div>

          {/* ── Info + Actions Panel ── */}
          <div className="verify-info-panel">
            {/* Ticket info card */}
            <div className="verify-info-card">
              <div className="verify-info-header">
                <h2 className="verify-visitor-name">{scannedTicket.visitorName}</h2>
                <Badge variant={statusColor}>{statusLabel}</Badge>
              </div>
              <dl className="verify-dl">
                <div><dt>Ticket ID</dt><dd><code>{scannedTicket.id}</code></dd></div>
                <div><dt>Email</dt><dd>{scannedTicket.visitorEmail || '—'}</dd></div>
                <div><dt>Event</dt><dd>{scannedTicket.event}</dd></div>
                <div><dt>Zone</dt><dd>{scannedTicket.zone}</dd></div>
                <div><dt>Seat</dt><dd>{scannedTicket.seat}</dd></div>
                <div><dt>Ticket Status</dt><dd><Badge variant={statusColor}>{statusLabel}</Badge></dd></div>
              </dl>
            </div>

            {/* Decision card */}
            <div className="verify-actions-card">
              {!verificationResult ? (
                <>
                  <p className="verify-actions-label">Entry Decision</p>
                  <div className="verify-actions-row">
                    <Button
                      variant="success"
                      size="lg"
                      fullWidth
                      loading={loading === 'approve'}
                      disabled={!!loading}
                      onClick={handleApprove}
                      aria-label={`Approve entry for ${scannedTicket.visitorName}`}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <path d="M20 6 9 17l-5-5"/>
                      </svg>
                      Approve Entry
                    </Button>
                    <Button
                      variant="danger"
                      size="lg"
                      fullWidth
                      loading={loading === 'reject'}
                      disabled={!!loading}
                      onClick={handleReject}
                      aria-label={`Reject entry for ${scannedTicket.visitorName}`}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                      Reject Entry
                    </Button>
                  </div>
                </>
              ) : (
                <div className="verify-post-actions">
                  <Button variant="ghost" onClick={() => setIncidentOpen(true)}>
                    Report Incident
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => { resetScanner(); navigate('/security/scanner') }}
                  >
                    Next Visitor →
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Incident modal */}
      <Modal isOpen={incidentOpen} onClose={() => setIncidentOpen(false)} title="Report Incident">
        <IncidentForm
          ticketId={scannedTicket?.id}
          onSuccess={() => {
            setIncidentOpen(false)
            toast.success('Incident filed successfully.')
          }}
        />
      </Modal>
    </AppLayout>
  )
}
