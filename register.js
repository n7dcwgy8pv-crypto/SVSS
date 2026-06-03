/* ============================================================
   Registration Page  –  register.js
   Fully offline — saves users to localStorage
   ============================================================ */

// Redirect if already logged in
try {
  if (localStorage.getItem('svss_access_token')) {
    window.location.href = 'dashboard.html';
  }
} catch(e) {}

/* ── Password Toggles ── */
function setupToggle(btnId, inputId, iconId) {
  document.getElementById(btnId)?.addEventListener('click', () => {
    const input = document.getElementById(inputId);
    const icon  = document.getElementById(iconId);
    const hidden = input.type === 'password';
    input.type     = hidden ? 'text' : 'password';
    icon.className = hidden ? 'fas fa-eye-slash' : 'fas fa-eye';
  });
}
setupToggle('toggleRegPassword',     'regPassword',     'regEyeIcon');
setupToggle('toggleConfirmPassword', 'confirmPassword', 'confirmEyeIcon');

/* ── Password Strength ── */
const strengthLevels = [
  { label: 'Too weak',    color: '#ef4444', width: '20%'  },
  { label: 'Weak',        color: '#f59e0b', width: '40%'  },
  { label: 'Fair',        color: '#eab308', width: '60%'  },
  { label: 'Strong',      color: '#10b981', width: '80%'  },
  { label: 'Very strong', color: '#3b82f6', width: '100%' },
];

function calcStrength(pw) {
  let score = 0;
  if (pw.length >= 8)          score++;
  if (pw.length >= 12)         score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

document.getElementById('regPassword')?.addEventListener('input', function () {
  const fill  = document.getElementById('strengthFill');
  const label = document.getElementById('strengthLabel');
  if (!this.value) {
    fill.style.width  = '0%';
    label.textContent = 'Enter password';
    label.style.color = '';
    return;
  }
  const level = strengthLevels[calcStrength(this.value)];
  fill.style.width      = level.width;
  fill.style.background = level.color;
  label.textContent     = level.label;
  label.style.color     = level.color;
});

/* ── Gate field toggle (show only for gate_operator) ── */
document.getElementById('role')?.addEventListener('change', function () {
  const gateGroup = document.getElementById('gateGroup');
  if (gateGroup) {
    gateGroup.style.display = this.value === 'gate_operator' ? 'flex' : 'none';
  }
});

/* ── Helpers ── */
function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function clearErrors() {
  ['firstNameError','lastNameError','regEmailError','roleError',
   'regPasswordError','confirmPasswordError','termsError'].forEach(id => showError(id, ''));
}

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'circle-check' : 'circle-xmark'}"></i> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function setLoading(loading) {
  const btn    = document.getElementById('registerBtn');
  const text   = btn.querySelector('.btn-text');
  const loader = btn.querySelector('.btn-loader');
  btn.disabled = loading;
  text.classList.toggle('hidden', loading);
  loader.classList.toggle('hidden', !loading);
}

/* ── Local user store helpers ── */
function getRegisteredUsers() {
  try { return JSON.parse(localStorage.getItem('svss_registered_users')) || []; }
  catch { return []; }
}

function saveRegisteredUsers(users) {
  localStorage.setItem('svss_registered_users', JSON.stringify(users));
}

function emailExists(email) {
  // Check built-in demo accounts
  const builtIn = ['admin@svss.io', 'gate@svss.io'];
  if (builtIn.includes(email.toLowerCase())) return true;
  // Check registered users
  return getRegisteredUsers().some(u => u.email.toLowerCase() === email.toLowerCase());
}

/* ── Role config ── */
const roleConfig = {
  super_admin:      { label: 'Super Admin',       dashRole: 'admin',         permissions: ['dashboard','monitoring','tickets','alerts','analytics','incidents','gates','users','settings'] },
  security_manager: { label: 'Security Manager',  dashRole: 'admin',         permissions: ['dashboard','monitoring','tickets','alerts','analytics','incidents','gates'] },
  gate_operator:    { label: 'Gate Operator',      dashRole: 'gate_operator', permissions: ['tickets','gate_access'] },
  analyst:          { label: 'Security Analyst',   dashRole: 'admin',         permissions: ['dashboard','analytics','incidents'] },
};

/* ── Form Submit ── */
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const firstName       = document.getElementById('firstName').value.trim();
  const lastName        = document.getElementById('lastName').value.trim();
  const email           = document.getElementById('regEmail').value.trim();
  const role            = document.getElementById('role').value;
  const gateAssigned    = document.getElementById('gateAssigned')?.value || 'Gate A';
  const password        = document.getElementById('regPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const agreeTerms      = document.getElementById('agreeTerms').checked;
  let valid = true;

  if (!firstName) { showError('firstNameError', 'First name is required.'); valid = false; }
  if (!lastName)  { showError('lastNameError',  'Last name is required.');  valid = false; }

  if (!email) {
    showError('regEmailError', 'Email address is required.'); valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError('regEmailError', 'Please enter a valid email address.'); valid = false;
  } else if (emailExists(email)) {
    showError('regEmailError', 'This email is already registered.'); valid = false;
  }

  if (!role) { showError('roleError', 'Please select a role.'); valid = false; }

  if (!password) {
    showError('regPasswordError', 'Password is required.'); valid = false;
  } else if (password.length < 8) {
    showError('regPasswordError', 'Password must be at least 8 characters.'); valid = false;
  } else if (calcStrength(password) < 2) {
    showError('regPasswordError', 'Too weak — add uppercase letters, numbers, or symbols.'); valid = false;
  }

  if (!confirmPassword) {
    showError('confirmPasswordError', 'Please confirm your password.'); valid = false;
  } else if (password !== confirmPassword) {
    showError('confirmPasswordError', 'Passwords do not match.'); valid = false;
  }

  if (!agreeTerms) { showError('termsError', 'You must agree to the terms to continue.'); valid = false; }

  if (!valid) return;

  setLoading(true);

  try {
    const result = await Auth.register({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role,
      gateAssigned,
    });

    setLoading(false);

    if (!result.success) {
      if (result.message && result.message.toLowerCase().includes('email')) {
        showError('regEmailError', result.message);
      } else {
        showToast(result.message || 'Registration failed. Please try again.', 'error');
      }
      return;
    }

    showToast(`Account created! Welcome, ${firstName}. Redirecting to login...`, 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 2200);
  } catch (err) {
    setLoading(false);
    showToast('Unable to connect to the server. Please try again later.', 'error');
    console.error('Registration error:', err);
  }
});
