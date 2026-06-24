import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import './AppLayout.css'

export default function AppLayout({ title, children }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <Header title={title} onMenuToggle={() => setMobileOpen((v) => !v)} />
      <main className="app-main" id="main-content">
        {children}
      </main>
    </div>
  )
}
