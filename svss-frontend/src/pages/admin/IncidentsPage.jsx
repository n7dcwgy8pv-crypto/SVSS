import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AppLayout from '../../components/shared/AppLayout'
import Badge from '../../components/shared/Badge'
import Modal from '../../components/shared/Modal'
import Input from '../../components/shared/Input'
import Select from '../../components/shared/Select'
import Button from '../../components/shared/Button'
import { PageSpinner } from '../../components/shared/Spinner'
import { getIncidentsApi, updateIncidentStatusApi } from '../../api/incidentApi'
import { getErrorMessage } from '../../utils/apiError'
import { incidentTypeLabel, incidentStatusColor, formatDateTime } from '../../utils/helpers'
import './IncidentsPage.css'

const EMPTY_FILTERS = { type: '', status: '', search: '' }

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [filters, setFilters]     = useState(EMPTY_FILTERS)

  const load = async (f = filters) => {
    setLoading(true)
    try {
      // Strip empty strings so the API doesn't receive empty filter params
      const params = {}
      if (f.type)   params.type   = f.type
      if (f.status) params.status = f.status
      if (f.search) params.search = f.search
      setIncidents(await getIncidentsApi(params))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilter = (e) => { e.preventDefault(); load() }
  const handleClear  = () => { setFilters(EMPTY_FILTERS); load(EMPTY_FILTERS) }

  const handleStatusChange = async (incidentId, newStatus) => {
    setUpdatingStatus(true)
    try {
      const updated = await updateIncidentStatusApi(incidentId, newStatus)
      setIncidents(prev => prev.map(i => i.id === incidentId ? updated : i))
      // Keep the modal in sync
      setSelected(prev => prev?.id === incidentId ? updated : prev)
      toast.success(`Incident marked as ${newStatus}.`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <AppLayout title="Incidents">
      <div className="incidents-page">

        {/* ── Filter bar ── */}
        <form onSubmit={handleFilter} className="incidents-filter" role="search" aria-label="Filter incidents">
          <Select
            id="inc-type"
            value={filters.type}
            onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
            aria-label="Filter by incident type"
          >
            <option value="">All types</option>
            <option value="duplicate">Duplicate</option>
            <option value="suspicious">Suspicious</option>
            <option value="invalid">Invalid</option>
            <option value="other">Other</option>
          </Select>
          <Select
            id="inc-status"
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
          </Select>
          <Input
            id="inc-search"
            placeholder="Search description, reporter…"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            aria-label="Search incidents"
          />
          <Button type="submit" variant="secondary">Filter</Button>
          <Button type="button" variant="ghost" onClick={handleClear}>Clear</Button>
        </form>

        {loading && <PageSpinner label="Loading incidents…" />}

        {!loading && incidents.length === 0 && (
          <div className="incidents-empty">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
              stroke="var(--text-4)" strokeWidth="1.2" aria-hidden="true">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            </svg>
            <p style={{ marginTop: 8 }}>No incidents found.</p>
          </div>
        )}

        {!loading && incidents.length > 0 && (
          <div className="incidents-table-wrap">
            <table className="incidents-table" aria-label="Incidents table">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Type</th>
                  <th scope="col">Ticket</th>
                  <th scope="col">Reported By</th>
                  <th scope="col">Status</th>
                  <th scope="col">Date</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map(inc => (
                  <tr key={inc.id}>
                    <td><code>{inc.id}</code></td>
                    <td style={{ color: 'var(--text-1)', fontWeight: 500 }}>
                      {incidentTypeLabel(inc.type)}
                    </td>
                    <td><code>{inc.ticketId || '—'}</code></td>
                    <td>{inc.reportedBy}</td>
                    <td>
                      <Badge variant={incidentStatusColor(inc.status)}>{inc.status}</Badge>
                    </td>
                    <td className="td-muted">{formatDateTime(inc.createdAt)}</td>
                    <td>
                      <Button size="sm" variant="ghost" onClick={() => setSelected(inc)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Detail / status update modal ── */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Incident — ${selected?.id}`}
      >
        {selected && (
          <div className="incident-detail">
            <dl>
              <div><dt>Type</dt>        <dd>{incidentTypeLabel(selected.type)}</dd></div>
              <div><dt>Ticket ID</dt>   <dd><code>{selected.ticketId || '—'}</code></dd></div>
              <div><dt>Reported By</dt> <dd>{selected.reportedBy}</dd></div>
              <div><dt>Date / Time</dt> <dd>{formatDateTime(selected.createdAt)}</dd></div>
              <div>
                <dt>Status</dt>
                <dd><Badge variant={incidentStatusColor(selected.status)}>{selected.status}</Badge></dd>
              </div>
              <div className="incident-detail__desc">
                <dt>Description</dt>
                <dd>{selected.description}</dd>
              </div>
            </dl>

            {/* Admin can update status inline */}
            {selected.status !== 'resolved' && (
              <div className="incident-detail__actions">
                {selected.status === 'open' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={updatingStatus}
                    onClick={() => handleStatusChange(selected.id, 'investigating')}
                  >
                    Mark Investigating
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="success"
                  loading={updatingStatus}
                  onClick={() => handleStatusChange(selected.id, 'resolved')}
                >
                  Mark Resolved
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AppLayout>
  )
}
