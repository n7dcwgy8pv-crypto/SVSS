/* ============================================================
   Login Page  –  app.js
   ============================================================ */

// Redirect if already logged in
if (Auth.isLoggedIn()) {
  Auth.redirectAfterLogin(Auth.getUser()?.role);
}

/* ── Password Toggle ── */
document.getElementById('togglePassword')?.addEventListener('click', function () {
  const input = document.getElementById('password');
  const icon  = document.getElementById('eyeIcon');
  const hidden = input.type === 'password';
  input.type   = hidden ? 'text' : 'password';
  icon.className = hidden ? 'fas fa-eye-slash' : 'fas fa-eye';
});

/* ── Helpers ── */
function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function clearErrors() {
  ['emailError', 'passwordError'].forEach(id => showError(id, ''));
}

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'circle-check' : 'circle-xmark'}"></i> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function setLoading(loading) {
  const btn    = document.getElementById('loginBtn');
  const text   = btn.querySelector('.btn-text');
  const loader = btn.querySelector('.btn-loader');
  btn.disabled = loading;
  text.classList.toggle('hidden', loading);
  loader.classList.toggle('hidden', !loading);
}

/* ── Form Submit ── */
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const remember = document.getElementById('rememberMe').checked;
  let valid = true;

  if (!email) {
    showError('emailError', 'Email address is required.'); valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError('emailError', 'Please enter a valid email address.'); valid = false;
  }

  if (!password) {
    showError('passwordError', 'Password is required.'); valid = false;
  }

  if (!valid) return;

  setLoading(true);

  try {
    // ── Primary path: real backend API ──
    const result = await Auth.login(email, password, remember);

    if (result.success) {
      const { role, name } = result.data.user;
      showToast(`Welcome back, ${name.split(' ')[0]}! Redirecting...`, 'success');
      setTimeout(() => Auth.redirectAfterLogin(role), 1200);
    } else {
      const msg = result.message || 'Invalid email or password.';

      // Friendly messages for specific backend status codes
      if (msg.includes('pending')) {
        showToast('Your account is pending admin approval.', 'error');
        showError('emailError', 'Account not yet approved.');
      } else if (msg.includes('suspended')) {
        showToast('Your account has been suspended. Contact an administrator.', 'error');
        showError('emailError', 'Account suspended.');
      } else {
        showToast(msg, 'error');
        showError('passwordError', 'Incorrect email or password.');
      }
    }
  } catch (err) {
    // ── Offline fallback: only when backend is completely unreachable ──
    console.warn('[Login] Backend unreachable, trying offline fallback:', err.message);

    const offlineUsers = {
      'admin@svss.io': { password: 'Admin@1234', role: 'admin', name: 'System Administrator' },
      'gate@svss.io':  { password: 'Gate@1234',  role: 'gate_operator', name: 'Marcus Johnson',
                         gate: 'Gate A', shift: '18:00 – 02:00', position: 'Main Entrance Operator' },
    };

    const match = offlineUsers[email.toLowerCase()];
    if (match && match.password === password) {
      localStorage.setItem('svss_user', JSON.stringify({
        name: match.name, role: match.role, email,
        gate: match.gate || null, shift: match.shift || null, position: match.position || null,
      }));
      localStorage.setItem('svss_access_token', 'offline_token');
      showToast(`Welcome back, ${match.name.split(' ')[0]}! (Offline mode)`, 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
    } else {
      showToast('Cannot reach the server. Check your connection.', 'error');
      showError('passwordError', 'Server unavailable — try again shortly.');
    }
  } finally {
    setLoading(false);
  }
});

/* ── Animate status counters on login page ── */
function animateCounter(el, target, duration = 1200) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { el.textContent = target; clearInterval(timer); return; }
    el.textContent = Math.floor(start);
  }, 16);
}

document.querySelectorAll('.status-value').forEach(el => {
  const val = parseInt(el.textContent);
  if (!isNaN(val)) { el.textContent = '0'; animateCounter(el, val); }
});
