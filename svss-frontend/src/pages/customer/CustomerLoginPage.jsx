import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Input from '../../components/shared/Input'
import Button from '../../components/shared/Button'
import Alert from '../../components/shared/Alert'
import { customerLoginApi } from '../../api/authApi'
import useAuthStore from '../../store/authStore'
import ParticleCanvas from '../../components/auth/ParticleCanvas'
import '../public/AuthPages.css'
import './CustomerAuthPages.css'

const features = [
  { icon: '🎟️', color: 'rgba(16,185,129,.2)',  text: 'Browse and purchase event tickets online' },
  { icon: '📱', color: 'rgba(0,212,255,.2)',   text: 'Digital QR tickets — no printing needed' },
  { icon: '🎪', color: 'rgba(168,85,247,.2)',  text: 'Concerts, expos, summits & more' },
  { icon: '⚡', color: 'rgba(245,158,11,.2)',  text: 'Instant ticket delivery to your account' },
]

export default function CustomerLoginPage() {
  const { login } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [apiError, setApiError] = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setApiError('')
    setLoading(true)
    try {
      const { user, token } = await customerLoginApi(data)
      login(user, token)
      toast.success(`Welcome back, ${user.name}! 🎉`)
      const from = location.state?.from?.pathname
      // Only allow redirect to customer routes
      const safePath = from?.startsWith('/customer') ? from : '/customer/dashboard'
      navigate(safePath, { replace: true })
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* ── Left hero panel ── */}
      <div className="auth-hero auth-hero--customer">
        <ParticleCanvas />
        <div className="auth-hero__content">
          <div className="auth-hero__logo">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
            </svg>
          </div>
          <h1 className="auth-hero__system">Your Event<br/>Tickets, Ready</h1>
          <p className="auth-hero__tagline">
            Buy tickets online, get your QR pass instantly,<br/>
            and walk straight through the gate.
          </p>
          <div className="auth-hero__features">
            {features.map((f, i) => (
              <div className="auth-hero__feature" key={i}>
                <div className="auth-hero__feature-icon" style={{ background: f.color }} aria-hidden="true">
                  {f.icon}
                </div>
                {f.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="cauth-portal-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
            </svg>
            Customer Portal
          </div>
          <h2 className="auth-card__title">Welcome back</h2>
          <p className="auth-card__sub">Sign in to access your tickets and discover new events.</p>

          {apiError && (
            <Alert type="error" onDismiss={() => setApiError('')} style={{ marginBottom: 16 }}>
              {apiError}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="auth-form">
            <Input
              id="cust-email"
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required.',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email address.' },
              })}
            />

            <div className="auth-pass-wrap">
              <Input
                id="cust-password"
                label="Password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                error={errors.password?.message}
                {...register('password', { required: 'Password is required.' })}
              />
              <button
                type="button"
                className="auth-pass-toggle"
                onClick={() => setShowPass(v => !v)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>

            <Button type="submit" loading={loading} fullWidth size="lg" className="btn--customer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
              </svg>
              Sign In to Customer Portal
            </Button>
          </form>

          <p className="auth-footer" style={{ marginTop: 20 }}>
            New here?{' '}
            <Link to="/customer/register" className="auth-link auth-link--customer">
              Create a free account →
            </Link>
          </p>

          <div className="auth-divider" style={{ margin: '20px 0 16px' }}>
            <span>or</span>
          </div>
          <div className="auth-portal-switch">
            <p>SVSS staff member?</p>
            <Link to="/login" className="auth-portal-switch__link auth-portal-switch__link--staff">
              🛡️ Go to Staff Portal →
            </Link>
          </div>

          <div className="auth-demo auth-demo--customer">
            <p className="auth-demo__title">🎟️ Demo Customer Account</p>
            <div className="auth-demo__rows">
              <div><strong>Customer:</strong> eva@svss.io / any password</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
