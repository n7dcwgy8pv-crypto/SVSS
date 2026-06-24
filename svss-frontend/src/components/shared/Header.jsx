import './Header.css'

export default function Header({ title, onMenuToggle }) {
  return (
    <header className="topbar" role="banner">
      <button className="topbar__menu-btn" onClick={onMenuToggle} aria-label="Toggle navigation">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <h1 className="topbar__title">{title}</h1>
      <div className="topbar__spacer" />
      <div className="topbar__live" aria-label="System status: Live">
        <span className="topbar__live-dot" aria-hidden="true" />
        Live
      </div>
    </header>
  )
}
