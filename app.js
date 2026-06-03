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

  // ── Demo credentials (works without backend) ──
  const demoUsers = {
    'admin@svss.io': { password: 'Admin@1234', role: 'admin',        name: 'System Administrator' },
    'gate@svss.io':  { password: 'Gate@1234',  role: 'gate_operator', name: 'Marcus Johnson',
                       gate: 'Gate A', shift: '18:00 – 02:00', position: 'Main Entrance Operator' },
  };

  // ── Check demo accounts first ──
  const demo = demoUsers[email.toLowerCase()];
  if (demo && demo.password === password) {
    localStorage.setItem('svss_user', JSON.stringify({
      name: demo.name, role: demo.role, email,
      gate: demo.gate || null, shift: demo.shift || null, position: demo.position || null,
    }));
    localStorage.setItem('svss_access_token', 'demo_token');
    await new Promise(r => setTimeout(r, 1000));
    showToast(`Welcome back, ${demo.name.split(' ')[0]}! Redirecting...`, 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
    setLoading(false);
    return;
  }

  // ── Check localStorage registered users ──
  try {
    const registered = JSON.parse(localStorage.getItem('svss_registered_users')) || [];
    const found = registered.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found && found.password === password) {
      localStorage.setItem('svss_user', JSON.stringify({
        name:     found.name,
        role:     found.role,
        email:    found.email,
        gate:     found.gate     || null,
        shift:    found.shift    || null,
        position: found.position || null,
      }));
      localStorage.setItem('svss_access_token', 'reg_token_' + found.id);
      await new Promise(r => setTimeout(r, 1000));
      showToast(`Welcome, ${found.firstName}! Redirecting...`, 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
      setLoading(false);
      return;
    }
  } catch(e) { /* ignore */ }

  // ── Try real backend if demo credentials don't match ──
  try {
    const result = await Auth.login(email, password, remember);

    if (result.success) {
      const { role, name } = result.data.user;
      showToast(`Welcome back, ${name.split(' ')[0]}! Redirecting...`, 'success');
      setTimeout(() => Auth.redirectAfterLogin(role), 1200);
    } else {
      showToast(result.message || 'Invalid email or password.', 'error');
      showError('passwordError', 'Incorrect email or password.');
    }
  } catch (err) {
    showToast('Invalid email or password.', 'error');
    showError('passwordError', 'Incorrect email or password.');
  } finally {
    setLoading(false);
  }
});

/* ── Animate status counters ── */
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
