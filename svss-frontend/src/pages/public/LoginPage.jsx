import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Input from '../../components/shared/Input'
import Button from '../../components/shared/Button'
import Alert from '../../components/shared/Alert'
import { loginApi } from '../../api/authApi'
import useAuthStore from '../../store/authStore'
import ParticleCanvas from '../../components/auth/ParticleCanvas'
import './AuthPages.css'

function ShieldIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
    </svg>
  )
}

const features = [
  { icon: '🔐', color: 'rgba(79,142,255,.2)',  text: 'Role-based access for Admin & Security' },
  { icon: '📷', color: 'rgba(0,212,255,.2)',   text: 'Live QR scanning with instant validation' },
  { icon: '🖼️', color: 'rgba(168,85,247,.2)',  text: 'Photo identity matching at entry gates' },
  { icon: '⚡', color: 'rgba(245,158,11,.2)',  text: 'Real-time incident detection & reporting' },
]

export default function LoginPage() {
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setApiError('')
    setLoading(true)
    try {
      const { user, token } = await loginApi(data)
      login(user, token)
      toast.success(`Welcome back, ${user.name}!`, { icon: '🛡️' })
      const from = location.state?.from?.pathname
      navigate(from || (user.role === 'admin' ? '/admin/dashboard' : '/security/dashboard'), { replace: true })
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* ── Left hero panel ── */}
      <div className="auth-hero">
        <ParticleCanvas />
        <div className="auth-hero__content">
          <div className="auth-hero__logo">
            <ShieldIcon size={36} />
          </div>
          <h1 className="auth-hero__system">Smart Venue<br/>Security System</h1>
          <p className="auth-hero__tagline">
            AI-powered access control for concerts, stadiums,<br/>
            festivals and large-scale events.
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
          <p className="auth-card__eyebrow">Secure Access Portal</p>
          <h2 className="auth-card__title">Sign in to SVSS</h2>
          <p className="auth-card__sub">Enter your credentials to access the security dashboard.</p>

          {apiError && (
            <Alert type="error" onDismiss={() => setApiError('')} style={{ marginBottom: 16 }}>
              {apiError}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="auth-form">
            <Input
              id="email"
              label="Email Address"
              type="email"
              placeholder="you@svss.io"
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
                id="password"
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

            <Button type="submit" loading={loading} fullWidth size="lg">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
              Sign In Securely
            </Button>
          </form>

          <p className="auth-footer" style={{ marginTop: 20 }}>
            Don&apos;t have an account?{' '}
            <Link to="/register" className="auth-link">Create one →</Link>
          </p>

          <div className="auth-demo">
            <p className="auth-demo__title">🔑 Demo Credentials</p>
            <div className="auth-demo__rows">
              <div><strong>Admin:</strong> admin@svss.io / any password</div>
              <div><strong>Security:</strong> bob@svss.io / any password</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
