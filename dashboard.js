/* ============================================================
   SMART VENUE SECURITY — Dashboard Logic
   ============================================================ */

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
  localStorage.removeItem('svss_access_token');
  localStorage.removeItem('svss_refresh_token');
  localStorage.removeItem('svss_user');
  window.location.href = 'index.html';
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

document.querySelectorAll('.kpi-value[data-target]').forEach(el => {
  const target = parseInt(el.dataset.target);
  animateCounter(el, target);
});

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
const feedItems = [
  { type:'danger',  icon:'fa-user-slash',          title:'Unauthorized Entry',        desc:'Gate C — 2 people / 1 ticket',    time:'just now' },
  { type:'warning', icon:'fa-qrcode',               title:'Duplicate QR Scan',         desc:'Ticket #TK-4821 at Gate A',       time:'2m ago' },
  { type:'warning', icon:'fa-users',                title:'Crowd Threshold Warning',   desc:'Section B at 92% capacity',       time:'8m ago' },
  { type:'info',    icon:'fa-video',                title:'Camera 07 Reconnected',     desc:'Gate B — feed restored',          time:'15m ago' },
  { type:'danger',  icon:'fa-triangle-exclamation', title:'Tailgating Detected',       desc:'Gate D — AI flagged 3 persons',   time:'22m ago' },
  { type:'success', icon:'fa-circle-check',         title:'Incident #INC-091 Resolved',desc:'Security team confirmed clear',   time:'35m ago' },
  { type:'info',    icon:'fa-robot',                title:'AI Model Updated',          desc:'Detection engine v2.4.1 loaded',  time:'1h ago' },
];

const feedEl = document.getElementById('alertFeed');

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

renderFeed(feedItems);

// Simulate live feed — add new alert every 8s
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
const gates = [
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

const gateGrid = document.getElementById('gateGrid');
gates.forEach(g => {
  const div = document.createElement('div');
  div.className = `gate-item ${g.status}`;
  const iconMap = { online:'fa-door-open', offline:'fa-door-closed', standby:'fa-pause-circle', alert:'fa-triangle-exclamation' };
  div.innerHTML = `
    <i class="fas ${iconMap[g.status]}"></i>
    <span class="gate-name">${g.name}</span>
    <span class="gate-status-text">${g.status === 'online' ? g.count + ' in' : g.status}</span>`;
  gateGrid.appendChild(div);
});

/* ── Incidents Table ── */
const incidents = [
  { id:'INC-094', gate:'Gate C', type:'Unauthorized Entry', time:'19:42', status:'danger',  statusLabel:'Active'   },
  { id:'INC-093', gate:'Gate A', type:'Duplicate QR',       time:'19:28', status:'warning', statusLabel:'Reviewing'},
  { id:'INC-092', gate:'Gate B', type:'Tailgating',         time:'18:55', status:'warning', statusLabel:'Reviewing'},
  { id:'INC-091', gate:'Gate D', type:'Invalid Ticket',     time:'18:12', status:'success', statusLabel:'Resolved' },
  { id:'INC-090', gate:'VIP-1',  type:'Unauthorized Entry', time:'17:44', status:'success', statusLabel:'Resolved' },
  { id:'INC-089', gate:'Gate E', type:'Crowd Threshold',    time:'17:10', status:'info',    statusLabel:'Logged'   },
];

const tbody = document.getElementById('incidentsTbody');
incidents.forEach(inc => {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${inc.id}</td>
    <td>${inc.gate}</td>
    <td><span class="badge ${inc.status}">${inc.type}</span></td>
    <td>${inc.time}</td>
    <td><span class="badge ${inc.status}">${inc.statusLabel}</span></td>`;
  tbody.appendChild(tr);
});

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
