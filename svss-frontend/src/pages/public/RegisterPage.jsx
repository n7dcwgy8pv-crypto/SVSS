import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Input from '../../components/shared/Input'
import Select from '../../components/shared/Select'
import Button from '../../components/shared/Button'
import Alert from '../../components/shared/Alert'
import { registerApi } from '../../api/authApi'
import useAuthStore from '../../store/authStore'
import ParticleCanvas from '../../components/auth/ParticleCanvas'
import './AuthPages.css'

function getStrength(pw) {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}
const strengthColors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981']
const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']

export default function RegisterPage() {
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  // eslint-disable-next-line react-hooks/incompatible-library
  const password = watch('password', '')
  const strength = getStrength(password)

  const onSubmit = async (data) => {
    setApiError('')
    setLoading(true)
    try {
      const { user, token } = await registerApi(data)
      login(user, token)
      toast.success('Account created! Welcome aboard. 🎉')
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/security/dashboard', { replace: true })
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Hero */}
      <div className="auth-hero">
        <ParticleCanvas />
        <div className="auth-hero__content">
          <div className="auth-hero__logo">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
          </div>
          <h1 className="auth-hero__system">Join SVSS<br/>Today</h1>
          <p className="auth-hero__tagline">
            Create your account to start managing venue security with AI-powered precision.
          </p>
          <div className="auth-hero__features">
            <div className="auth-hero__feature">
              <div className="auth-hero__feature-icon" style={{ background: 'rgba(16,185,129,.2)' }}>🚀</div>
              Up and running in under 60 seconds
            </div>
            <div className="auth-hero__feature">
              <div className="auth-hero__feature-icon" style={{ background: 'rgba(79,142,255,.2)' }}>🔒</div>
              Enterprise-grade security by default
            </div>
            <div className="auth-hero__feature">
              <div className="auth-hero__feature-icon" style={{ background: 'rgba(168,85,247,.2)' }}>📊</div>
              Real-time dashboard & analytics
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="auth-form-panel">
        <div className="auth-card" style={{ maxWidth: 480 }}>
          <p className="auth-card__eyebrow">New Account</p>
          <h2 className="auth-card__title">Create your account</h2>
          <p className="auth-card__sub">Fill in your details to get started with SVSS.</p>

          {apiError && <Alert type="error" onDismiss={() => setApiError('')}>{apiError}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="auth-form">
            <div className="auth-grid">
              <Input id="firstName" label="First Name" placeholder="John" required
                error={errors.firstName?.message}
                {...register('firstName', { required: 'First name is required.' })} />
              <Input id="lastName" label="Last Name" placeholder="Doe" required
                error={errors.lastName?.message}
                {...register('lastName', { required: 'Last name is required.' })} />
            </div>

            <Input id="reg-email" label="Email Address" type="email" placeholder="you@example.com"
              autoComplete="email" required error={errors.email?.message}
              {...register('email', {
                required: 'Email is required.',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email.' },
              })} />

            <Select id="role" label="Role" required error={errors.role?.message}
              {...register('role', { required: 'Please select a role.' })}>
              <option value="">— Select your role —</option>
              <option value="security">🛡️  Security Staff</option>
              <option value="admin">⚙️  Administrator</option>
            </Select>

            <div>
              <Input id="reg-password" label="Password" type="password" placeholder="Min. 8 characters"
                autoComplete="new-password" required error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required.',
                  minLength: { value: 8, message: 'At least 8 characters required.' },
                  pattern: { value: /[0-9]/, message: 'Must include at least one number.' },
                })} />
              {password && (
                <div style={{ marginTop: 8 }}>
                  <div className="pw-strength">
                    <div className="pw-strength__fill"
                      style={{ width: `${(strength / 4) * 100}%`, background: strengthColors[strength] }} />
                  </div>
                  <p style={{ fontSize: 11, color: strengthColors[strength], marginTop: 4, fontWeight: 600 }}>
                    {strengthLabels[strength]} password
                  </p>
                </div>
              )}
            </div>

            <Input id="confirmPassword" label="Confirm Password" type="password"
              placeholder="Repeat your password" autoComplete="new-password" required
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your password.',
                validate: v => v === password || 'Passwords do not match.',
              })} />

            <Button type="submit" loading={loading} fullWidth size="lg">
              Create Account
            </Button>
          </form>

          <p className="auth-footer" style={{ marginTop: 20 }}>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
