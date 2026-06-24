import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import AppLayout from '../../components/shared/AppLayout'
import Button from '../../components/shared/Button'
import Badge from '../../components/shared/Badge'
import Modal from '../../components/shared/Modal'
import Input from '../../components/shared/Input'
import Select from '../../components/shared/Select'
import { PageSpinner } from '../../components/shared/Spinner'
import PageHeader from '../../components/shared/PageHeader'
import { getUsersApi, createUserApi, toggleUserStatusApi } from '../../api/userApi'
import { roleLabel, formatDate } from '../../utils/helpers'
import './UsersPage.css'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm()

  const load = async () => {
    setLoading(true)
    try { setUsers(await getUsersApi()) } finally { setLoading(false) }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [])

  const onSubmit = async (data) => {
    setCreating(true)
    try {
      const user = await createUserApi(data)
      setUsers(prev => [...prev, user])
      toast.success(`User ${user.name} created.`, { icon: '👤' })
      setShowModal(false)
      reset()
    } catch (err) {
      toast.error(err.message)
    } finally { setCreating(false) }
  }

  const toggleStatus = async (id) => {
    try {
      const updated = await toggleUserStatusApi(id)
      setUsers(prev => prev.map(u => u.id === id ? updated : u))
      toast.success(`User ${updated.status === 'active' ? 'activated' : 'deactivated'}.`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <AppLayout title="User Management">
      <div className="users-page">
        <PageHeader
          eyebrow="Administration"
          title="User Management"
          subtitle="Control access roles and account status for all team members."
          action={
            <Button onClick={() => setShowModal(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add User
            </Button>
          }
        />
        <div className="users-toolbar">
          <p className="users-count">{users.length} user{users.length !== 1 ? 's' : ''} registered</p>
        </div>

        {loading && <PageSpinner label="Loading users…" />}

        {!loading && (
          <div className="users-table-wrap">
            <table className="users-table" aria-label="User management table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Joined</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-name-cell">
                        <div className="user-avatar" aria-hidden="true">{u.name.charAt(0)}</div>
                        {u.name}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-3)', fontSize: 13 }}>{u.email}</td>
                    <td><Badge variant="info">{roleLabel(u.role)}</Badge></td>
                    <td>
                      <Badge variant={u.status === 'active' ? 'success' : 'neutral'}>
                        {u.status === 'active' ? '● Active' : '○ Inactive'}
                      </Badge>
                    </td>
                    <td className="td-muted">{formatDate(u.createdAt)}</td>
                    <td>
                      <Button
                        size="sm"
                        variant={u.status === 'active' ? 'secondary' : 'ghost'}
                        onClick={() => toggleStatus(u.id)}
                        aria-label={`${u.status === 'active' ? 'Deactivate' : 'Activate'} ${u.name}`}
                      >
                        {u.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); reset() }} title="Add New User">
        <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Add user form">
          <div className="user-form">
            <div className="form-grid-2">
              <Input id="uf-first" label="First Name" required
                error={errors.firstName?.message}
                {...register('firstName', { required: 'Required.' })} />
              <Input id="uf-last" label="Last Name" required
                error={errors.lastName?.message}
                {...register('lastName', { required: 'Required.' })} />
            </div>
            <Input id="uf-email" label="Email Address" type="email" required
              error={errors.email?.message}
              {...register('email', {
                required: 'Email required.',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email.' },
              })} />
            <Select id="uf-role" label="Role" required
              error={errors.role?.message}
              {...register('role', { required: 'Role required.' })}>
              <option value="">— Select role —</option>
              <option value="security">Security Staff</option>
              <option value="admin">Administrator</option>
            </Select>
            <div className="user-form-actions">
              <Button type="button" variant="secondary"
                onClick={() => { setShowModal(false); reset() }}>
                Cancel
              </Button>
              <Button type="submit" loading={creating}>Create User</Button>
            </div>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}
