import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import './QRCodeDisplay.css'

export default function QRCodeDisplay({ value, size = 200 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!value || !canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 2,
      color: { dark: '#111827', light: '#ffffff' },
    }).catch(console.error)
  }, [value, size])

  if (!value) return <div className="qr-empty">No QR data available</div>

  return (
    <div className="qr-wrapper">
      <canvas ref={canvasRef} aria-label={`QR code for ticket ${value}`} role="img" />
    </div>
  )
}
