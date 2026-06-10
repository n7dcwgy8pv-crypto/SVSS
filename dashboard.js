/* ============================================================
   SMART VENUE SECURITY — Dashboard Logic
   ============================================================ */

/* ── Auth guard: redirect to login if no token ── */
(function () {
  const token = localStorage.getItem('svss_access_token');
  if (!token) { window.location.href = 'index.html'; }
})();

/* ── Load user info & apply role-based visibility ── */
(function () {
  try {
    const user     = JSON.parse(localStorage.getItem('svss_user'));
    const isAdmin  = !user || user.role === 'admin';
    const isGateOp = user?.role === 'gate_operator';

    const roleLabels = {
      admin:            'Super Admin',
      security_manager: 'Security Manager',
      gate_operator:    'Gate Operator',
      analyst:          'Analyst',
    };
    const roleLabel = roleLabels[user?.role] || 'Staff';
    const initial   = (user?.name || 'U').charAt(0).toUpperCase();

    // ── Topbar profile chip ──
    const nameEl = document.querySelector('.profile-name');
    const roleEl = document.querySelector('.profile-role');
    const avatar = document.querySelector('.profile-avatar');
    if (nameEl) nameEl.textContent = user?.name || 'User';
    if (roleEl) roleEl.textContent = roleLabel;
    if (avatar) avatar.textContent = initial;

    // ── Profile dropdown ──
    const pdName  = document.getElementById('pdName');
    const pdEmail = document.getElementById('pdEmail');
    const pdRole  = document.getElementById('pdRole');
    const pdAv    = document.querySelector('.pd-avatar');
    if (pdName)  pdName.textContent  = user?.name  || 'User';
    if (pdEmail) pdEmail.textContent = user?.email || '';
    if (pdRole)  pdRole.textContent  = roleLabel;
    if (pdAv)    pdAv.textContent    = initial;

    // ── Welcome banner ──
    const wName = document.querySelector('.welcome-text h2');
    if (wName && user?.name) {
      wName.innerHTML = `Good <span id="timeGreeting">Morning</span>, ${user.name.split(' ')[0]} 👋`;
    }

    // ── Role-based visibility ──
    if (isGateOp) {
      // Hide all admin-only elements
      document.querySelectorAll('[data-admin-only]').forEach(el => el.style.display = 'none');
      // Show gate operator panels
      document.querySelectorAll('[data-user-only]').forEach(el => el.style.display = 'grid');

      // Fill gate operator profile card
      const av      = document.getElementById('userAvatarLarge');
      const fn      = document.getElementById('userFullName');
      const rt      = document.getElementById('userRoleTag');
      const em      = document.getElementById('userEmailDisplay');
      const gateEl  = document.getElementById('userGateAssigned');
      const shiftEl = document.getElementById('userShift');
      const posEl   = document.getElementById('userPosition');

      if (av)      av.textContent      = initial;
      if (fn)      fn.textContent      = user.name     || 'Gate Operator';
      if (rt)      rt.textContent      = roleLabel;
      if (em)      em.textContent      = user.email    || '';
      if (gateEl)  gateEl.textContent  = user.gate     || 'Gate A';
      if (shiftEl) shiftEl.textContent = user.shift    || '18:00 – 02:00';
      if (posEl)   posEl.textContent   = user.position || 'Main Entrance Operator';

      // Update ticket table header with assigned gate
      const gateHeader = document.getElementById('gateOpTicketHeader');
      if (gateHeader && user.gate) gateHeader.textContent = `My Tickets — ${user.gate}`;

      document.title = `Gate Operator — ${user.gate || 'Gate A'} | SVSS`;
    }
  } catch (e) { /* ignore */ }
})();

/* ── Logout (sidebar button) ── */
document.querySelector('.logout-btn')?.addEventListener('click', (e) => {
  e.preventDefault();
  doLogout();
});

/* ── Logout (profile dropdown button) ── */
document.getElementById('profileLogoutBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  doLogout();
});

function doLogout() {
  // Call backend logout to invalidate refresh token, then clear session
  Auth.logout();
}

/* ── Profile Dropdown Toggle ── */
const profileChip     = document.getElementById('profileChip');
const profileDropdown = document.getElementById('profileDropdown');

profileChip?.addEventListener('click', (e) => {
  e.stopPropagation();
  profileDropdown.classList.toggle('hidden');
  // close notif if open
  document.getElementById('notifDropdown')?.classList.add('hidden');
});

document.addEventListener('click', () => {
  profileDropdown?.classList.add('hidden');
});
profileDropdown?.addEventListener('click', e => e.stopPropagation());

/* ── Sidebar Toggle ── */
const sidebar       = document.getElementById('sidebar');
const mainWrapper   = document.getElementById('mainWrapper');
const sidebarToggle = document.getElementById('sidebarToggle');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');

// Desktop collapse
sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  mainWrapper.classList.toggle('expanded');
});

// Mobile overlay
const overlay = document.createElement('div');
overlay.className = 'sidebar-overlay';
document.body.appendChild(overlay);

mobileMenuBtn.addEventListener('click', () => {
  sidebar.classList.add('mobile-open');
  overlay.classList.add('visible');
});
overlay.addEventListener('click', () => {
  sidebar.classList.remove('mobile-open');
  overlay.classList.remove('visible');
});

/* ── Active Nav ── */
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
  });
});

/* ── Live Clock ── */
function updateClock() {
  const now = new Date();
  document.getElementById('liveClock').textContent =
    now.toLocaleTimeString('en-US', { hour12: false });
}
updateClock();
setInterval(updateClock, 1000);

/* ── Greeting & Date ── */
(function () {
  const h = new Date().getHours();
  const greet = h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
  document.getElementById('timeGreeting').textContent = greet;
  document.getElementById('todayDate').textContent =
    new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
})();

/* ── Notification Dropdown ── */
const notifBtn      = document.getElementById('notifBtn');
const notifDropdown = document.getElementById('notifDropdown');

notifBtn.addEventListener('click', e => {
  e.stopPropagation();
  notifDropdown.classList.toggle('hidden');
});
document.addEventListener('click', () => notifDropdown.classList.add('hidden'));
notifDropdown.addEventListener('click', e => e.stopPropagation());

document.querySelector('.mark-all-read').addEventListener('click', () => {
  document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
  document.querySelector('.notif-count').textContent = '0';
});

/* ── KPI Counter Animation ── */
function animateCounter(el, target, duration = 1400) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { el.textContent = target.toLocaleString(); clearInterval(timer); return; }
    el.textContent = Math.floor(start).toLocaleString();
  }, 16);
}

// Animate static KPI cards (tickets validated etc. – from data-target attributes)
// Real live data from the API will override these via loadDashboardSummary()
document.querySelectorAll('.kpi-value[data-target]').forEach(el => {
  const target = parseInt(el.dataset.target);
  animateCounter(el, target);
});

/* ── Load Live Dashboard Summary from API ── */
async function loadDashboardSummary() {
  try {
    const res  = await Auth.apiFetch('/dashboard/summary');
    if (!res) return; // session expired, auth.js already redirected

    const json = await res.json();
    if (!json.success) return;

    const d = json.data;

    // Map API fields → KPI card data-targets and animate them
    const mappings = [
      // [querySelector for kpi-card color, API value]
      { color: 'blue',   value: d.todayEntries         },  // Tickets Validated
      { color: 'purple', value: d.flaggedPersons        },  // People Detected (flagged)
      { color: 'red',    value: d.unauthorizedAlerts    },  // Unauthorized Entries
      { color: 'green',  value: d.activeGates           },  // Active Gates
      { color: 'orange', value: d.unauthorizedAlerts    },  // Active Alerts
      { color: 'cyan',   value: d.onlineCameras         },  // Cameras Online
    ];

    mappings.forEach(({ color, value }) => {
      if (value === undefined) return;
      const card = document.querySelector(`.kpi-card[data-color="${color}"] .kpi-value`);
      if (card) {
        card.dataset.target = value;
        animateCounter(card, value);
      }
    });

    // Update notification AI status pill
    if (d.aiStatus) {
      const pill = document.querySelector('.ai-status-pill span:last-child');
      if (pill) pill.textContent = d.aiStatus === 'online' ? 'AI Online' : 'AI Offline';
    }

  } catch (err) {
    console.warn('[Dashboard] Summary API unavailable, using static values:', err.message);
    // Static data-target values already rendered above — no action needed
  }
}

/* ── Sparklines (mini canvas charts) ── */
const sparkData = {
  spark1: [900,950,1020,1100,1180,1220,1284],
  spark2: [910,960,1030,1110,1190,1240,1301],
  spark3: [22,20,19,21,18,19,17],
  spark4: [10,11,12,12,12,12,12],
  spark5: [6,5,4,5,4,3,3],
  spark6: [22,23,24,24,23,24,24],
};

const sparkColors = {
  spark1:'#3b82f6', spark2:'#8b5cf6', spark3:'#ef4444',
  spark4:'#10b981', spark5:'#f59e0b', spark6:'#06b6d4',
};

Object.entries(sparkData).forEach(([id, data]) => {
  const container = document.getElementById(id);
  if (!container) return;
  const canvas = document.createElement('canvas');
  canvas.width  = container.offsetWidth || 120;
  canvas.height = 32;
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const color = sparkColors[id];
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const w = canvas.width, h = canvas.height;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 4) - 2,
  }));
  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, color + '55');
  grad.addColorStop(1, color + '00');
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();
  // Line
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  ctx.stroke();
});

/* ── Entry Flow Chart (Chart.js) ── */
const entryCtx = document.getElementById('entryChart').getContext('2d');

const labels = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];
const ticketData  = [45, 120, 210, 280, 310, 290, 340, 380, 420, 390, 310, 195];
const detectedData= [47, 124, 215, 285, 318, 295, 348, 385, 428, 396, 315, 198];
const unauthorData= [2,   4,   5,   5,   8,   5,   8,   5,   8,   6,   5,   3];

const chartDatasets = {
  today: { tickets: ticketData, detected: detectedData, unauth: unauthorData },
  week:  {
    tickets:  [1100,1250,1180,1320,1400,1280,1284],
    detected: [1115,1265,1195,1338,1418,1295,1301],
    unauth:   [12,15,11,18,20,14,17],
  },
  month: {
    tickets:  [28000,31000,29500,33000,35000,32000,34000],
    detected: [28400,31400,29900,33500,35500,32500,34500],
    unauth:   [320,380,290,410,450,360,400],
  },
};

const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul'];
const weekLabels  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function makeGradient(ctx, color) {
  const g = ctx.createLinearGradient(0, 0, 0, 300);
  g.addColorStop(0, color + '55');
  g.addColorStop(1, color + '00');
  return g;
}

const entryChart = new Chart(entryCtx, {
  type: 'line',
  data: {
    labels,
    datasets: [
      {
        label: 'Ticket Scans',
        data: ticketData,
        borderColor: '#3b82f6',
        backgroundColor: makeGradient(entryCtx, '#3b82f6'),
        borderWidth: 2, pointRadius: 3, pointHoverRadius: 5,
        fill: true, tension: 0.4,
      },
      {
        label: 'AI Detected',
        data: detectedData,
        borderColor: '#8b5cf6',
        backgroundColor: makeGradient(entryCtx, '#8b5cf6'),
        borderWidth: 2, pointRadius: 3, pointHoverRadius: 5,
        fill: true, tension: 0.4,
      },
      {
        label: 'Unauthorized',
        data: unauthorData,
        borderColor: '#ef4444',
        backgroundColor: makeGradient(entryCtx, '#ef4444'),
        borderWidth: 2, pointRadius: 3, pointHoverRadius: 5,
        fill: true, tension: 0.4,
        yAxisID: 'y2',
      },
    ],
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.95)',
        borderColor: 'rgba(59,130,246,0.3)', borderWidth: 1,
        titleColor: '#f1f5f9', bodyColor: '#94a3b8',
        padding: 10, cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(59,130,246,0.06)' },
        ticks: { color: '#64748b', font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(59,130,246,0.06)' },
        ticks: { color: '#64748b', font: { size: 10 } },
      },
      y2: {
        position: 'right',
        grid: { display: false },
        ticks: { color: '#ef4444', font: { size: 10 } },
      },
    },
  },
});

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const range = btn.dataset.range;
    const d = chartDatasets[range];
    const lbl = range === 'week' ? weekLabels : range === 'month' ? monthLabels : labels;
    entryChart.data.labels = lbl;
    entryChart.data.datasets[0].data = d.tickets;
    entryChart.data.datasets[1].data = d.detected;
    entryChart.data.datasets[2].data = d.unauth;
    entryChart.update();
  });
});

/* ── Live Alert Feed ── */
const feedEl = document.getElementById('alertFeed');

// Severity → CSS type mapping
const severityTypeMap = {
  critical: 'danger',
  high:     'danger',
  medium:   'warning',
  low:      'info',
};

// Alert type → icon mapping
const alertIconMap = {
  unauthorized_entry: 'fa-user-slash',
  tailgating:         'fa-users',
  forced_entry:       'fa-door-open',
  duplicate_scan:     'fa-qrcode',
  crowd_threshold:    'fa-triangle-exclamation',
  default:            'fa-triangle-exclamation',
};

function relativeTime(isoString) {
  if (!isoString) return '';
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(isoString).toLocaleDateString();
}

// Static fallback feed (shown when API is offline)
const staticFeedItems = [
  { type:'danger',  icon:'fa-user-slash',          title:'Unauthorized Entry',        desc:'Gate C — 2 people / 1 ticket',    time:'just now' },
  { type:'warning', icon:'fa-qrcode',               title:'Duplicate QR Scan',         desc:'Ticket #TK-4821 at Gate A',       time:'2m ago' },
  { type:'warning', icon:'fa-users',                title:'Crowd Threshold Warning',   desc:'Section B at 92% capacity',       time:'8m ago' },
  { type:'info',    icon:'fa-video',                title:'Camera 07 Reconnected',     desc:'Gate B — feed restored',          time:'15m ago' },
  { type:'danger',  icon:'fa-triangle-exclamation', title:'Tailgating Detected',       desc:'Gate D — AI flagged 3 persons',   time:'22m ago' },
  { type:'success', icon:'fa-circle-check',         title:'Incident #INC-091 Resolved',desc:'Security team confirmed clear',   time:'35m ago' },
  { type:'info',    icon:'fa-robot',                title:'AI Model Updated',          desc:'Detection engine v2.4.1 loaded',  time:'1h ago' },
];

let feedItems = [...staticFeedItems];

function renderFeed(items) {
  feedEl.innerHTML = '';
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = `feed-item ${item.type}`;
    div.innerHTML = `
      <i class="fas ${item.icon} feed-icon"></i>
      <div class="feed-body">
        <strong>${item.title}</strong>
        <span>${item.desc}</span>
      </div>
      <span class="feed-time">${item.time}</span>`;
    feedEl.appendChild(div);
  });
}

async function loadAlertFeed() {
  try {
    const res  = await Auth.apiFetch('/alerts?status=open');
    if (!res) return;
    const json = await res.json();
    if (!json.success || !json.data.length) { renderFeed(feedItems); return; }

    feedItems = json.data.map(a => ({
      type:  severityTypeMap[a.severity] || 'info',
      icon:  alertIconMap[a.type] || alertIconMap.default,
      title: a.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      desc:  a.description || `Gate ${a.gate}`,
      time:  relativeTime(a.timestamp),
    }));

    renderFeed(feedItems);
  } catch (err) {
    console.warn('[Dashboard] Alerts API unavailable, using static feed:', err.message);
    renderFeed(feedItems);
  }
}

renderFeed(feedItems);
loadAlertFeed();

// Simulate live feed additions every 8s (still useful in offline mode too)
const liveAlerts = [
  { type:'danger',  icon:'fa-user-slash',  title:'Unauthorized Entry',      desc:'Gate A — mismatch detected',   time:'just now' },
  { type:'warning', icon:'fa-qrcode',      title:'Invalid QR Code',         desc:'Gate E — ticket expired',      time:'just now' },
  { type:'info',    icon:'fa-video',       title:'Camera 12 Motion Alert',  desc:'Restricted zone movement',     time:'just now' },
];
let liveIdx = 0;
setInterval(() => {
  const alert = { ...liveAlerts[liveIdx % liveAlerts.length], time: 'just now' };
  feedItems.unshift(alert);
  if (feedItems.length > 10) feedItems.pop();
  renderFeed(feedItems);
  liveIdx++;
}, 8000);

/* ── Gate Status Grid ── */
const gateGrid = document.getElementById('gateGrid');

// Static fallback gate data
const staticGates = [
  { name:'Gate A', status:'online',  count:142 },
  { name:'Gate B', status:'online',  count:98  },
  { name:'Gate C', status:'alert',   count:67  },
  { name:'Gate D', status:'online',  count:115 },
  { name:'Gate E', status:'online',  count:88  },
  { name:'Gate F', status:'standby', count:0   },
  { name:'VIP-1',  status:'online',  count:54  },
  { name:'VIP-2',  status:'online',  count:41  },
  { name:'Exit-1', status:'online',  count:320 },
  { name:'Exit-2', status:'online',  count:280 },
  { name:'Staff',  status:'online',  count:22  },
  { name:'Load',   status:'offline', count:0   },
  { name:'Gate G', status:'online',  count:77  },
  { name:'Gate H', status:'standby', count:0   },
];

const iconMap = {
  open:    'fa-door-open',
  closed:  'fa-door-closed',
  locked:  'fa-lock',
  standby: 'fa-pause-circle',
  offline: 'fa-door-closed',
  online:  'fa-door-open',
  alert:   'fa-triangle-exclamation',
};

function renderGates(gateList) {
  gateGrid.innerHTML = '';
  gateList.forEach(g => {
    const div = document.createElement('div');
    div.className = `gate-item ${g.status}`;
    const label = g.status === 'open' || g.status === 'online'
      ? `${g.count ?? '—'} in`
      : g.status;
    div.innerHTML = `
      <i class="fas ${iconMap[g.status] || 'fa-door-closed'}"></i>
      <span class="gate-name">${g.name}</span>
      <span class="gate-status-text">${label}</span>`;
    gateGrid.appendChild(div);
  });
}

async function loadGates() {
  try {
    const res  = await Auth.apiFetch('/gates');
    if (!res) return;
    const json = await res.json();
    if (!json.success || !json.data.length) { renderGates(staticGates); return; }

    // Map backend gate format → UI format
    const gateList = json.data.map(g => ({
      name:   g.name.split('–')[0].trim(),  // "Gate A – Main Entrance" → "Gate A"
      status: g.status,                      // open | closed | locked
      count:  g.cameras,                     // repurpose cameras field as entry count placeholder
    }));

    renderGates(gateList);

    // Update gate count badge
    const onlineCount = gateList.filter(g => g.status === 'open').length;
    const countEl = document.getElementById('gateOnlineCount');
    if (countEl) countEl.textContent = `${onlineCount} / ${gateList.length} Online`;

  } catch (err) {
    console.warn('[Dashboard] Gates API unavailable, using static data:', err.message);
    renderGates(staticGates);
  }
}

renderGates(staticGates);
loadGates();

/* ── Incidents Table ── */
const staticIncidents = [
  { id:'INC-094', gate:'Gate C', type:'Unauthorized Entry', time:'19:42', status:'danger',  statusLabel:'Active'   },
  { id:'INC-093', gate:'Gate A', type:'Duplicate QR',       time:'19:28', status:'warning', statusLabel:'Reviewing'},
  { id:'INC-092', gate:'Gate B', type:'Tailgating',         time:'18:55', status:'warning', statusLabel:'Reviewing'},
  { id:'INC-091', gate:'Gate D', type:'Invalid Ticket',     time:'18:12', status:'success', statusLabel:'Resolved' },
  { id:'INC-090', gate:'VIP-1',  type:'Unauthorized Entry', time:'17:44', status:'success', statusLabel:'Resolved' },
  { id:'INC-089', gate:'Gate E', type:'Crowd Threshold',    time:'17:10', status:'info',    statusLabel:'Logged'   },
];

const tbody = document.getElementById('incidentsTbody');

function renderIncidents(list) {
  tbody.innerHTML = '';
  list.forEach(inc => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${inc.id}</td>
      <td>${inc.gate}</td>
      <td><span class="badge ${inc.status}">${inc.type}</span></td>
      <td>${inc.time}</td>
      <td><span class="badge ${inc.status}">${inc.statusLabel}</span></td>`;
    tbody.appendChild(tr);
  });
}

async function loadIncidents() {
  try {
    const res  = await Auth.apiFetch('/alerts');
    if (!res) return;
    const json = await res.json();
    if (!json.success || !json.data.length) { renderIncidents(staticIncidents); return; }

    const statusBadgeMap = {
      open:     { css: 'danger',  label: 'Active'   },
      resolved: { css: 'success', label: 'Resolved' },
      default:  { css: 'info',    label: 'Logged'   },
    };

    const list = json.data.slice(0, 6).map((a, i) => {
      const badge  = statusBadgeMap[a.status] || statusBadgeMap.default;
      const timeStr = a.timestamp
        ? new Date(a.timestamp).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12: false })
        : '—';
      return {
        id:          `INC-${String(100 - i).padStart(3, '0')}`,
        gate:        `Gate ${a.gate || '?'}`,
        type:        a.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        time:        timeStr,
        status:      badge.css,
        statusLabel: badge.label,
      };
    });

    renderIncidents(list);
  } catch (err) {
    console.warn('[Dashboard] Incidents API unavailable, using static data:', err.message);
    renderIncidents(staticIncidents);
  }
}

renderIncidents(staticIncidents);
loadIncidents();

/* ── Donut Chart ── */
const donutCtx = document.getElementById('donutChart').getContext('2d');

const donutData = [
  { label: 'Valid Entries',    value: 1267, color: '#3b82f6' },
  { label: 'Unauthorized',     value: 17,   color: '#ef4444' },
  { label: 'Duplicate Scans',  value: 8,    color: '#f59e0b' },
  { label: 'Expired Tickets',  value: 5,    color: '#8b5cf6' },
];

new Chart(donutCtx, {
  type: 'doughnut',
  data: {
    labels: donutData.map(d => d.label),
    datasets: [{
      data: donutData.map(d => d.value),
      backgroundColor: donutData.map(d => d.color + 'cc'),
      borderColor: donutData.map(d => d.color),
      borderWidth: 1.5,
      hoverOffset: 6,
    }],
  },
  options: {
    responsive: true, maintainAspectRatio: true,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.95)',
        borderColor: 'rgba(59,130,246,0.3)', borderWidth: 1,
        titleColor: '#f1f5f9', bodyColor: '#94a3b8',
        padding: 10, cornerRadius: 8,
      },
    },
  },
});

// Legend
const legendEl = document.getElementById('donutLegend');
donutData.forEach(d => {
  const div = document.createElement('div');
  div.className = 'donut-legend-item';
  div.innerHTML = `
    <span class="donut-legend-dot" style="background:${d.color}"></span>
    <span>${d.label}</span>
    <span class="donut-legend-val">${d.value.toLocaleString()}</span>`;
  legendEl.appendChild(div);
});

/* ── Hourly Heatmap ── */
const heatmapGrid = document.getElementById('heatmapGrid');
const hourlyValues = [
  5,8,4,3,2,3,12,45,120,210,280,310,
  290,340,380,420,390,310,195,140,90,60,30,12,
];
const maxVal = Math.max(...hourlyValues);

hourlyValues.forEach((val, i) => {
  const cell = document.createElement('div');
  cell.className = 'heatmap-cell';
  const intensity = val / maxVal;
  // Interpolate from dark blue to red
  const r = Math.round(59  + (239 - 59)  * intensity);
  const g = Math.round(130 + (68  - 130) * intensity);
  const b = Math.round(246 + (68  - 246) * intensity);
  cell.style.background = `rgba(${r},${g},${b},${0.2 + intensity * 0.7})`;
  cell.setAttribute('data-tip', `${String(i).padStart(2,'0')}:00 — ${val} entries`);
  heatmapGrid.appendChild(cell);
});

/* ── AI Camera Counter Simulation ── */
let camCount = 3;
setInterval(() => {
  camCount = Math.floor(Math.random() * 4) + 1;
  const el = document.getElementById('camCount');
  if (el) el.textContent = camCount;
}, 3000);

/* ── Bootstrap: load live data from API on page load ── */
loadDashboardSummary();
loadUsersTable();

// Refresh KPIs + alerts every 60 seconds
setInterval(() => {
  loadDashboardSummary();
  loadAlertFeed();
  loadGates();
  loadIncidents();
}, 60_000);

/* ============================================================
   USER MANAGEMENT TABLE  (admin only)
   ============================================================ */

let allUsers        = [];   // full list from API
let filteredUsers   = [];   // after role filter + search
let activeRoleFilter = 'all';

const roleLabelsMap = {
  admin:            'Admin',
  security_manager: 'Security Mgr',
  gate_operator:    'Gate Operator',
  analyst:          'Analyst',
  user:             'User',
};

const roleIconMap = {
  admin:            'fa-shield-halved',
  security_manager: 'fa-user-tie',
  gate_operator:    'fa-door-open',
  analyst:          'fa-chart-line',
  user:             'fa-user',
};

/* ── Fetch users from API ── */
async function loadUsersTable() {
  // Only run for admin role
  const currentUser = JSON.parse(localStorage.getItem('svss_user') || '{}');
  if (currentUser.role !== 'admin') return;

  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" class="table-loading-row"><i class="fas fa-circle-notch fa-spin"></i> Loading users…</td></tr>';

  try {
    const res  = await Auth.apiFetch('/users');
    if (!res) return;
    const json = await res.json();

    if (!json.success) {
      tbody.innerHTML = `<tr><td colspan="6" class="table-empty-row"><i class="fas fa-triangle-exclamation"></i>Failed to load users.</td></tr>`;
      return;
    }

    allUsers = json.data;
    updateRoleCounts();
    applyFilters();

  } catch (err) {
    console.warn('[Users] API unavailable:', err.message);
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty-row"><i class="fas fa-plug-circle-xmark"></i>Could not reach server.</td></tr>`;
  }
}

/* ── Update role count badges ── */
function updateRoleCounts() {
  const counts = { admin: 0, gate_operator: 0, user: 0 };
  allUsers.forEach(u => {
    if (u.role === 'admin') counts.admin++;
    else if (u.role === 'gate_operator') counts.gate_operator++;
    else counts.user++;
  });

  document.getElementById('countAdmin').textContent = counts.admin;
  document.getElementById('countGate').textContent  = counts.gate_operator;
  document.getElementById('countUser').textContent  = counts.user;

  // Summary bar
  const active    = allUsers.filter(u => u.status === 'active').length;
  const pending   = allUsers.filter(u => u.status === 'pending').length;
  const suspended = allUsers.filter(u => u.status === 'suspended').length;

  document.getElementById('totalUsersCount').textContent     = allUsers.length;
  document.getElementById('activeUsersCount').textContent    = active;
  document.getElementById('pendingUsersCount').textContent   = pending;
  document.getElementById('suspendedUsersCount').textContent = suspended;
}

/* ── Apply role filter + search ── */
function applyFilters() {
  const searchVal = (document.getElementById('userSearchInput')?.value || '').toLowerCase();

  filteredUsers = allUsers.filter(u => {
    const matchRole   = activeRoleFilter === 'all' || u.role === activeRoleFilter;
    const fullName    = `${u.firstName} ${u.lastName}`.toLowerCase();
    const matchSearch = !searchVal ||
      fullName.includes(searchVal) ||
      u.email.toLowerCase().includes(searchVal) ||
      u.role.toLowerCase().includes(searchVal);
    return matchRole && matchSearch;
  });

  renderUsersTable(filteredUsers);
}

/* ── Render table rows ── */
function renderUsersTable(users) {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty-row"><i class="fas fa-users-slash"></i>No users found.</td></tr>`;
    return;
  }

  const currentUser = JSON.parse(localStorage.getItem('svss_user') || '{}');

  tbody.innerHTML = '';
  users.forEach(u => {
    const fullName    = `${u.firstName} ${u.lastName}`;
    const initial     = (u.firstName || 'U').charAt(0).toUpperCase();
    const joinedDate  = u.createdAt
      ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '—';
    const isSelf      = u.email === currentUser.email;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="user-cell">
          <div class="user-cell-avatar">${initial}</div>
          <div>
            <span class="user-cell-name">${fullName}${isSelf ? ' <span style="color:var(--blue-light);font-size:9px">(you)</span>' : ''}</span>
            <span class="user-cell-id">#${u._id?.slice(-6).toUpperCase() || 'N/A'}</span>
          </div>
        </div>
      </td>
      <td style="color:var(--text-muted);font-size:11px">${u.email}</td>
      <td>
        <span class="role-badge ${u.role}">
          <i class="fas ${roleIconMap[u.role] || 'fa-user'}"></i>
          ${roleLabelsMap[u.role] || u.role}
        </span>
      </td>
      <td><span class="status-badge ${u.status}">${u.status.charAt(0).toUpperCase() + u.status.slice(1)}</span></td>
      <td style="font-size:11px;color:var(--text-dim)">${joinedDate}</td>
      <td>
        <div class="action-btns">
          <button class="action-btn edit" title="Edit user"
            data-id="${u._id}" data-fn="${u.firstName}" data-ln="${u.lastName}"
            data-role="${u.role}" data-status="${u.status}">
            <i class="fas fa-pen-to-square"></i>
          </button>
          <button class="action-btn delete" title="Delete user"
            data-id="${u._id}" data-name="${fullName}"
            ${isSelf ? 'disabled title="Cannot delete your own account"' : ''}>
            <i class="fas fa-trash-can"></i>
          </button>
        </div>
      </td>`;

    // Bind edit button
    tr.querySelector('.action-btn.edit').addEventListener('click', openEditModal);
    // Bind delete button
    const deleteBtn = tr.querySelector('.action-btn.delete');
    if (!isSelf) deleteBtn.addEventListener('click', openDeleteModal);

    tbody.appendChild(tr);
  });
}

/* ── Role filter tabs ── */
document.querySelectorAll('.role-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.role-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeRoleFilter = btn.dataset.role;
    applyFilters();
  });
});

/* ── Search input ── */
document.getElementById('userSearchInput')?.addEventListener('input', applyFilters);

/* ============================================================
   EDIT MODAL
   ============================================================ */
function openEditModal(e) {
  const btn = e.currentTarget;
  document.getElementById('editUserId').value    = btn.dataset.id;
  document.getElementById('editFirstName').value = btn.dataset.fn;
  document.getElementById('editLastName').value  = btn.dataset.ln;
  document.getElementById('editRole').value      = btn.dataset.role;
  document.getElementById('editStatus').value    = btn.dataset.status;
  document.getElementById('editPassword').value  = '';
  hideModalError('editModalError');
  document.getElementById('editUserModal').classList.remove('hidden');
}

function closeEditModal() {
  document.getElementById('editUserModal').classList.add('hidden');
}

document.getElementById('editModalClose')?.addEventListener('click',  closeEditModal);
document.getElementById('editModalCancel')?.addEventListener('click', closeEditModal);

// Close on backdrop click
document.getElementById('editUserModal')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeEditModal();
});

document.getElementById('editModalSave')?.addEventListener('click', async () => {
  const id        = document.getElementById('editUserId').value;
  const firstName = document.getElementById('editFirstName').value.trim();
  const lastName  = document.getElementById('editLastName').value.trim();
  const role      = document.getElementById('editRole').value;
  const status    = document.getElementById('editStatus').value;
  const password  = document.getElementById('editPassword').value;

  if (!firstName || !lastName) {
    showModalError('editModalError', 'First and last name are required.');
    return;
  }

  setModalLoading('editModalSave', true);
  hideModalError('editModalError');

  try {
    // Update name + status + optional password
    const body = { firstName, lastName, status };
    if (password) body.password = password;

    const res1  = await Auth.apiFetch(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    const data1 = await res1.json();

    if (!data1.success) {
      showModalError('editModalError', data1.message || 'Update failed.');
      setModalLoading('editModalSave', false);
      return;
    }

    // Update role separately if changed
    const originalRole = document.getElementById('editRole').getAttribute('data-original') || role;
    const res2  = await Auth.apiFetch(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    const data2 = await res2.json();

    if (!data2.success) {
      showModalError('editModalError', data2.message || 'Role update failed.');
      setModalLoading('editModalSave', false);
      return;
    }

    closeEditModal();
    await loadUsersTable();
    showDashToast('User updated successfully.', 'success');

  } catch (err) {
    showModalError('editModalError', 'Server unavailable. Please try again.');
  } finally {
    setModalLoading('editModalSave', false);
  }
});

/* ============================================================
   DELETE MODAL
   ============================================================ */
let pendingDeleteId = null;

function openDeleteModal(e) {
  const btn = e.currentTarget;
  pendingDeleteId = btn.dataset.id;
  document.getElementById('deleteUserName').textContent = btn.dataset.name;
  hideModalError('deleteModalError');
  document.getElementById('deleteUserModal').classList.remove('hidden');
}

function closeDeleteModal() {
  document.getElementById('deleteUserModal').classList.add('hidden');
  pendingDeleteId = null;
}

document.getElementById('deleteModalClose')?.addEventListener('click',  closeDeleteModal);
document.getElementById('deleteModalCancel')?.addEventListener('click', closeDeleteModal);

document.getElementById('deleteUserModal')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeDeleteModal();
});

document.getElementById('deleteModalConfirm')?.addEventListener('click', async () => {
  if (!pendingDeleteId) return;

  setModalLoading('deleteModalConfirm', true);
  hideModalError('deleteModalError');

  try {
    const res  = await Auth.apiFetch(`/users/${pendingDeleteId}`, { method: 'DELETE' });
    const data = await res.json();

    if (!data.success) {
      showModalError('deleteModalError', data.message || 'Delete failed.');
      setModalLoading('deleteModalConfirm', false);
      return;
    }

    closeDeleteModal();
    await loadUsersTable();
    showDashToast('User deleted successfully.', 'success');

  } catch (err) {
    showModalError('deleteModalError', 'Server unavailable. Please try again.');
  } finally {
    setModalLoading('deleteModalConfirm', false);
  }
});

/* ── Modal helpers ── */
function showModalError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideModalError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

function setModalLoading(btnId, loading) {
  const btn    = document.getElementById(btnId);
  if (!btn) return;
  const text   = btn.querySelector('.btn-text');
  const loader = btn.querySelector('.btn-loader');
  btn.disabled = loading;
  if (text)   text.style.display   = loading ? 'none' : '';
  if (loader) loader.style.display = loading ? 'inline' : 'none';
}

/* ── Inline toast for dashboard actions (separate from login page toast) ── */
function showDashToast(message, type = 'success') {
  const existing = document.querySelector('.dash-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast dash-toast ${type}`;
  toast.style.cssText = 'position:fixed;bottom:28px;right:28px;z-index:999;display:flex;align-items:center;gap:10px;padding:12px 18px;border-radius:10px;font-size:13px;font-weight:600;backdrop-filter:blur(12px);animation:feedSlide 0.3s ease;';
  toast.style.background = type === 'success'
    ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)';
  toast.style.border  = `1px solid ${type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`;
  toast.style.color   = type === 'success' ? 'var(--green)' : 'var(--red)';
  toast.innerHTML     = `<i class="fas fa-${type === 'success' ? 'circle-check' : 'circle-xmark'}"></i> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
