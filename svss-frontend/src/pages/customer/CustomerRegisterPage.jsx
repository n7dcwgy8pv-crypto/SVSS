import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Input from '../../components/shared/Input'
import Button from '../../components/shared/Button'
import Alert from '../../components/shared/Alert'
import { customerRegisterApi } from '../../api/authApi'
import useAuthStore from '../../store/authStore'
import ParticleCanvas from '../../components/auth/ParticleCanvas'
import '../public/AuthPages.css'
import './CustomerAuthPages.css'

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

export default function CustomerRegisterPage() {
  const { login } = useAuthStore()
  const navigate  = useNavigate()
  const [apiError, setApiError] = useState('')
  const [loading, setLoading]   = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password', '')
  const strength = getStrength(password)

  const onSubmit = async (data) => {
    setApiError('')
    setLoading(true)
    try {
      const { user, token } = await customerRegisterApi(data)
      login(user, token)
      toast.success('Account created! Start exploring events. 🎪')
      navigate('/customer/events', { replace: true })
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Hero */}
      <div className="auth-hero auth-hero--customer">
        <ParticleCanvas />
        <div className="auth-hero__content">
          <div className="auth-hero__logo">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
            </svg>
          </div>
          <h1 className="auth-hero__system">Join the<br/>Experience</h1>
          <p className="auth-hero__tagline">
            Create your free account and get instant access<br/>
            to events happening near you.
          </p>
          <div className="auth-hero__features">
            <div className="auth-hero__feature">
              <div className="auth-hero__feature-icon" style={{ background: 'rgba(16,185,129,.2)' }}>🚀</div>
              Free to sign up — takes under a minute
            </div>
            <div className="auth-hero__feature">
              <div className="auth-hero__feature-icon" style={{ background: 'rgba(0,212,255,.2)' }}>📱</div>
              Instant QR tickets delivered to your account
            </div>
            <div className="auth-hero__feature">
              <div className="auth-hero__feature-icon" style={{ background: 'rgba(168,85,247,.2)' }}>🎪</div>
              Access concerts, expos, summits & more
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="auth-form-panel">
        <div className="auth-card" style={{ maxWidth: 480 }}>
          <div className="cauth-portal-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
            </svg>
            Customer Portal
          </div>
          <h2 className="auth-card__title">Create your account</h2>
          <p className="auth-card__sub">Free account for event attendees. No credit card needed to sign up.</p>

          {apiError && <Alert type="error" onDismiss={() => setApiError('')}>{apiError}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="auth-form">
            <div className="auth-grid">
              <Input id="cust-firstName" label="First Name" placeholder="Jane" required
                error={errors.firstName?.message}
                {...register('firstName', { required: 'First name is required.' })} />
              <Input id="cust-lastName" label="Last Name" placeholder="Doe" required
                error={errors.lastName?.message}
                {...register('lastName', { required: 'Last name is required.' })} />
            </div>

            <Input
              id="cust-reg-email"
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required.',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email.' },
              })}
            />

            <div>
              <Input
                id="cust-reg-password"
                label="Password"
                type="password"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                required
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required.',
                  minLength: { value: 8, message: 'At least 8 characters required.' },
                  pattern: { value: /[0-9]/, message: 'Must include at least one number.' },
                })}
              />
              {password && (
                <div style={{ marginTop: 8 }}>
                  <div className="pw-strength">
                    <div
                      className="pw-strength__fill"
                      style={{ width: `${(strength / 4) * 100}%`, background: strengthColors[strength] }}
                    />
                  </div>
                  <p style={{ fontSize: 11, color: strengthColors[strength], marginTop: 4, fontWeight: 600 }}>
                    {strengthLabels[strength]} password
                  </p>
                </div>
              )}
            </div>

            <Input
              id="cust-confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="Repeat your password"
              autoComplete="new-password"
              required
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your password.',
                validate: v => v === password || 'Passwords do not match.',
              })}
            />

            <p className="cauth-terms">
              By creating an account you agree to our{' '}
              <span className="cauth-terms__link">Terms of Service</span> and{' '}
              <span className="cauth-terms__link">Privacy Policy</span>.
            </p>

            <Button type="submit" loading={loading} fullWidth size="lg" className="btn--customer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
              </svg>
              Create Free Account
            </Button>
          </form>

          <p className="auth-footer" style={{ marginTop: 20 }}>
            Already have an account?{' '}
            <Link to="/customer/login" className="auth-link auth-link--customer">
              Sign in →
            </Link>
          </p>

          <div className="auth-divider" style={{ margin: '20px 0 16px' }}>
            <span>or</span>
          </div>
          <div className="auth-portal-switch">
            <p>SVSS staff member?</p>
            <Link to="/register" className="auth-portal-switch__link auth-portal-switch__link--staff">
              🛡️ Staff registration →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
