import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import Button from '../shared/Button'
import Alert from '../shared/Alert'
import './QRScanner.css'

const SCANNER_ID = 'qr-reader-mount'

export default function QRScanner({ onScanSuccess, onScanError }) {
  const html5QrcodeRef = useRef(null)
  const [state, setState] = useState('idle') // idle | starting | active | error
  const [errorMsg, setErrorMsg] = useState('')

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stopScanner = async () => {
    if (html5QrcodeRef.current) {
      try {
        const isRunning = html5QrcodeRef.current.isScanning
        if (isRunning) {
          await html5QrcodeRef.current.stop()
        }
        html5QrcodeRef.current.clear()
      } catch {
        // Ignore stop/clear errors — element may already be unmounted
      }
      html5QrcodeRef.current = null
    }
    setState('idle')
  }

  const startScanner = async () => {
    setState('starting')
    setErrorMsg('')

    try {
      // Enumerate cameras first
      const devices = await Html5Qrcode.getCameras()
      if (!devices || devices.length === 0) {
        throw new Error('No camera found on this device.')
      }

      // Prefer rear camera on mobile
      const camera = devices.find((d) =>
        d.label.toLowerCase().includes('back') ||
        d.label.toLowerCase().includes('rear') ||
        d.label.toLowerCase().includes('environment')
      ) || devices[0]

      // Create a fresh instance each time — avoids the "element already in use" error
      const scanner = new Html5Qrcode(SCANNER_ID, { verbose: false })
      html5QrcodeRef.current = scanner

      await scanner.start(
        camera.id,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        (decodedText) => {
          // Successful scan — pass up and let parent decide whether to stop
          onScanSuccess?.(decodedText)
        },
        () => {
          // Per-frame decode failure — expected while no QR is in frame, ignore
        }
      )
      setState('active')
    } catch (err) {
      let msg = 'Failed to start the camera.'
      if (err?.message) {
        if (
          err.message.toLowerCase().includes('permission') ||
          err.message.toLowerCase().includes('denied')
        ) {
          msg = 'Camera permission denied. Please allow camera access in your browser settings and reload the page.'
        } else if (err.message.toLowerCase().includes('no camera')) {
          msg = 'No camera found on this device.'
        } else {
          msg = err.message
        }
      }
      setErrorMsg(msg)
      setState('error')
      onScanError?.(msg)
      // Clean up the broken instance
      if (html5QrcodeRef.current) {
        try { html5QrcodeRef.current.clear() } catch { /* ignore */ }
        html5QrcodeRef.current = null
      }
    }
  }

  const handleStop = async () => {
    await stopScanner()
  }

  return (
    <div className="qr-scanner">
      {/* Camera view — html5-qrcode mounts its video stream here */}
      <div className="qr-scanner__view-wrap">
        {/* This div must be EMPTY when html5-qrcode initialises — placeholders are OUTSIDE it */}
        <div id={SCANNER_ID} className="qr-scanner__mount" />

        {/* Overlays rendered OVER the mount div, not inside it */}
        {state === 'idle' && (
          <div className="qr-scanner__overlay" aria-hidden="true">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none"
              stroke="var(--text-4)" strokeWidth="1.2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <p>Camera inactive</p>
            <p className="qr-scanner__overlay-hint">Press <strong>Start Scanner</strong> to begin</p>
          </div>
        )}

        {state === 'starting' && (
          <div className="qr-scanner__overlay" aria-live="polite">
            <div className="qr-scanner__spin" aria-hidden="true" />
            <p>Initializing camera…</p>
          </div>
        )}

        {/* Scanning corners + sweep line shown over the active video feed */}
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
        <Alert type="error">{errorMsg}</Alert>
      )}

      <div className="qr-scanner__controls">
        {state !== 'active' ? (
          <Button
            onClick={startScanner}
            loading={state === 'starting'}
            size="lg"
            fullWidth
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            {state === 'error' ? 'Retry Scanner' : 'Start Scanner'}
          </Button>
        ) : (
          <Button variant="danger" onClick={handleStop} size="lg" fullWidth>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
            </svg>
            Stop Scanner
          </Button>
        )}
      </div>
    </div>
  )
}
