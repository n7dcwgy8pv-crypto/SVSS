import './PageHeader.css'

/**
 * Consistent page-level heading strip.
 * Usage: <PageHeader title="Ticket Management" subtitle="Manage all event tickets" action={<Button>New</Button>} />
 */
export default function PageHeader({ title, subtitle, action, eyebrow }) {
  return (
    <div className="page-header">
      <div className="page-header__text">
        {eyebrow && <p className="page-header__eyebrow">{eyebrow}</p>}
        <h2 className="page-header__title">{title}</h2>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {action && <div className="page-header__action">{action}</div>}
    </div>
  )
}
