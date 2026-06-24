import { format, formatDistanceToNow } from 'date-fns'

export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  try { return format(new Date(dateStr), 'MMM d, yyyy') } catch { return dateStr }
}

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—'
  try { return format(new Date(dateStr), 'MMM d, yyyy HH:mm') } catch { return dateStr }
}

export const timeAgo = (dateStr) => {
  if (!dateStr) return '—'
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }) } catch { return dateStr }
}

export const ticketStatusLabel = (status) => ({
  valid:   { label: 'Valid',   color: 'success' },
  used:    { label: 'Used',    color: 'warning' },
  invalid: { label: 'Invalid', color: 'danger'  },
}[status] || { label: status, color: 'neutral' })

export const incidentTypeLabel = (type) => ({
  duplicate:  'Duplicate Ticket',
  suspicious: 'Suspicious Activity',
  invalid:    'Invalid Ticket',
  other:      'Other',
}[type] || type)

export const incidentStatusColor = (status) => ({
  open:          'danger',
  investigating: 'warning',
  resolved:      'success',
}[status] || 'neutral')

export const roleLabel = (role) => ({
  admin:    'Administrator',
  security: 'Security Staff',
}[role] || role)

export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

export const validateImageFile = (file) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5 MB
  if (!allowed.includes(file.type)) return 'Only JPG, PNG, or WebP images are allowed.'
  if (file.size > maxSize) return 'Image must be smaller than 5 MB.'
  return null
}
