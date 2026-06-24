import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './styles/index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        gutter={10}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#111135',
            color: '#f0f0ff',
            border: '1px solid rgba(255,255,255,.1)',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '500',
            padding: '12px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.05)',
            backdropFilter: 'blur(12px)',
            maxWidth: '380px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#111135' },
            style: {
              background: 'rgba(16,185,129,.12)',
              border: '1px solid rgba(16,185,129,.3)',
              color: '#6ee7b7',
            },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#111135' },
            style: {
              background: 'rgba(239,68,68,.12)',
              border: '1px solid rgba(239,68,68,.3)',
              color: '#fca5a5',
            },
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>
)
