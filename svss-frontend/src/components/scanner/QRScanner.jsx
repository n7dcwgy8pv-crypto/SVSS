import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import Button from '../shared/Button'
import Alert from '../shared/Alert'
import './QRScanner.css'

export default function QRScanner({ onScanSuccess, onScanError }) {
  const scannerRef = useRef(null)
  const [state, setState] = useState('idle') // idle | starting | active | error
  const [errorMsg, setErrorMsg] = useState('')

  const startScanner = async () => {
    setState('starting')
    setErrorMsg('')
    try {
      const devices = await Html5Qrcode.getCameras()
      if (!devices || devices.length === 0) throw new Error('No camera found on this device.')
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner
      const cameraId = devices.find(d => d.label.toLowerCase().includes('back'))?.id || devices[0].id
      await scanner.start(
        cameraId,
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => { onScanSuccess?.(decoded) },
        () => { /* ignore per-frame decode failures */ }
      )
      setState('active')
    } catch (err) {
      const msg = err?.message?.includes('Permission')
        ? 'Camera permission denied. Please allow camera access in your browser settings.'
        : err?.message || 'Failed to start camera.'
      setErrorMsg(msg)
      setState('error')
      onScanError?.(msg)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch { /* ignore stop errors */ }
      scannerRef.current = null
    }
    setState('idle')
  }

  useEffect(() => () => { stopScanner() }, [])

  return (
    <div className="qr-scanner">
      <div id="qr-reader" className="qr-scanner__view">
        {state !== 'active' && state !== 'starting' && (
          <div className="qr-scanner__placeholder">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="1.2" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <p>Camera inactive — press <strong>Start Scanner</strong> to begin</p>
          </div>
        )}
        {state === 'starting' && (
          <div className="qr-scanner__placeholder">
            <div className="qr-scanner__spin" aria-hidden="true" />
            <p>Initializing camera…</p>
          </div>
        )}
        {state === 'active' && (
          <div className="qr-scanner__frame" aria-hidden="true">
            <div className="qr-scanner__corner qr-scanner__corner--tl" />
            <div className="qr-scanner__corner qr-scanner__corner--tr" />
            <div className="qr-scanner__corner qr-scanner__corner--bl" />
            <div className="qr-scanner__corner qr-scanner__corner--br" />
            <div className="qr-scanner__line" />
          </div>
        )}
      </div>

      {state === 'error' && (
        <Alert type="error" title="Camera Error">{errorMsg}</Alert>
      )}

      <div className="qr-scanner__controls">
        {state !== 'active' ? (
          <Button onClick={startScanner} loading={state === 'starting'} size="lg" fullWidth>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Start Scanner
          </Button>
        ) : (
          <Button variant="danger" onClick={stopScanner} size="lg" fullWidth>
            Stop Scanner
          </Button>
        )}
      </div>
    </div>
  )
}
