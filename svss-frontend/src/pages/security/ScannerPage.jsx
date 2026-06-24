import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AppLayout from '../../components/shared/AppLayout'
import QRScanner from '../../components/scanner/QRScanner'
import Button from '../../components/shared/Button'
import Alert from '../../components/shared/Alert'
import Spinner from '../../components/shared/Spinner'
import { verifyTicketQRApi } from '../../api/ticketApi'
import useScannerStore from '../../store/scannerStore'
import './ScannerPage.css'

export default function ScannerPage() {
  const navigate = useNavigate()
  const { setScanStatus, setScannedTicket } = useScannerStore()
  const [verifying, setVerifying] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [scanDone, setScanDone] = useState(false)

  const handleScan = async (qrData) => {
    if (verifying || scanDone) return
    setVerifying(true)
    setScanStatus('scanning')
    try {
      const result = await verifyTicketQRApi(qrData)
      setScanResult(result)
      setScanDone(true)
      if (result.valid) {
        setScannedTicket(result.ticket)
        setScanStatus('success')
        toast.success('Ticket verified! Proceed to check photo.', { icon: '✅' })
      } else {
        setScanStatus('error')
        toast.error(result.reason || 'Invalid ticket.', { icon: '🚫' })
      }
    } catch {
      setScanResult({ valid: false, reason: 'System error. Please try again.' })
      setScanStatus('error')
    } finally {
      setVerifying(false)
    }
  }

  const reset = () => {
    setScanResult(null)
    setScanDone(false)
    setScanStatus('idle')
    setScannedTicket(null)
  }

  return (
    <AppLayout title="QR Scanner">
      <div className="scanner-page">
        <div className="scanner-card">
          {!scanDone && (
            <>
              <p className="scanner-instruction">
                Hold your camera up to the visitor's QR code ticket.<br/>
                The system will verify automatically.
              </p>
              <QRScanner onScanSuccess={handleScan} />
              {verifying && (
                <div className="scanner-verifying">
                  <Spinner size="md" />
                  <p>Verifying ticket with server…</p>
                </div>
              )}
            </>
          )}

          {scanDone && scanResult && (
            <div className="scan-result">
              <div className={`scan-result__icon-wrap scan-result__icon-wrap--${scanResult.valid ? 'success' : 'error'}`} aria-hidden="true">
                {scanResult.valid
                  ? <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--neon-green)" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                  : <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--neon-red)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                }
              </div>

              <p className={`scan-result__title scan-result__title--${scanResult.valid ? 'success' : 'error'}`}>
                {scanResult.valid ? 'Valid Ticket Found' : 'Ticket Invalid'}
              </p>

              {scanResult.valid && scanResult.ticket && (
                <div className="scan-result__visitor-card">
                  <p className="scan-result__name">{scanResult.ticket.visitorName}</p>
                  <p className="scan-result__meta">
                    {scanResult.ticket.event} · {scanResult.ticket.zone} · Seat {scanResult.ticket.seat}
                  </p>
                </div>
              )}

              {!scanResult.valid && (
                <Alert type="error">{scanResult.reason}</Alert>
              )}

              <div className="scan-result__actions">
                {scanResult.valid ? (
                  <Button variant="success" size="lg" fullWidth onClick={() => navigate('/security/verify')}>
                    Proceed to Verification →
                  </Button>
                ) : (
                  <Button variant="danger" fullWidth onClick={() => navigate('/security/incidents')}>
                    Report This Incident
                  </Button>
                )}
                <Button variant="secondary" fullWidth onClick={reset}>
                  Scan Another Ticket
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
