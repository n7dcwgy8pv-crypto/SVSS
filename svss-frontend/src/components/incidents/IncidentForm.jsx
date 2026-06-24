import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Select from '../shared/Select'
import Textarea from '../shared/Textarea'
import Input from '../shared/Input'
import Button from '../shared/Button'
import { createIncidentApi } from '../../api/incidentApi'
import useAuthStore from '../../store/authStore'

export default function IncidentForm({ ticketId = '', onSuccess }) {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { type: '', ticketId, description: '' },
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const incident = await createIncidentApi({ ...data, reportedBy: user?.name })
      toast.success(`Incident ${incident.id} filed successfully.`, { icon: '📋' })
      reset()
      onSuccess?.(incident)
    } catch (err) {
      toast.error(err.message || 'Failed to submit incident.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Incident report form"
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <Select id="incident-type" label="Incident Type" required
        error={errors.type?.message}
        {...register('type', { required: 'Please select an incident type.' })}>
        <option value="">— Select type —</option>
        <option value="duplicate">🔁  Duplicate Ticket</option>
        <option value="suspicious">👀  Suspicious Activity</option>
        <option value="invalid">❌  Invalid Ticket</option>
        <option value="other">📝  Other</option>
      </Select>

      <Input id="incident-ticket" label="Related Ticket ID (optional)"
        placeholder="e.g. TKT-001"
        error={errors.ticketId?.message}
        {...register('ticketId')} />

      <Textarea id="incident-description" label="Description" required rows={4}
        placeholder="Describe what happened in detail — who, what, when, where…"
        error={errors.description?.message}
        {...register('description', {
          required: 'Please describe the incident.',
          minLength: { value: 10, message: 'Description must be at least 10 characters.' },
        })} />

      <Button type="submit" loading={loading} fullWidth size="lg">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
        Submit Incident Report
      </Button>
    </form>
  )
}
