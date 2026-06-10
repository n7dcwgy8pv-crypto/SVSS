/* ============================================================
   Smart Venue Security System – Express Server
   ============================================================ */

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const rateLimit  = require('express-rate-limit');
const connectDB  = require('./config/db');
const User       = require('./config/User.model');
const Gate       = require('./config/Gate.model');
const Camera     = require('./config/Camera.model');
const Alert      = require('./config/Alert.model');
const Settings   = require('./config/Settings.model');

const authRoutes      = require('./routes/auth.routes');
const usersRoutes     = require('./routes/users.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const gatesRoutes     = require('./routes/gates.routes');
const alertsRoutes    = require('./routes/alerts.routes');
const camerasRoutes   = require('./routes/cameras.routes');
const settingsRoutes  = require('./routes/settings.routes');

const app  = express();
const PORT = process.env.PORT || 5000;

async function seedDefaultUsers() {
  const defaultUsers = [
    { email: 'admin@svss.io', firstName: 'System', lastName: 'Administrator', role: 'admin', status: 'active', passwordHash: 'Admin@1234' },
    { email: 'gate@svss.io',  firstName: 'Marcus', lastName: 'Johnson', role: 'gate_operator', status: 'active', passwordHash: 'Gate@1234' },
  ];
  for (const u of defaultUsers) {
    if (!await User.findOne({ email: u.email })) {
      await new User(u).save();
      console.log(`✅  Created user: ${u.email}`);
    }
  }
}

async function seedGates() {
  const count = await Gate.countDocuments();
  if (count > 0) return;
  const defaults = [
    { gateId:'G1', name:'Gate A – Main Entrance', status:'open',   zone:'main',  cameras:4, entryCount:142 },
    { gateId:'G2', name:'Gate B – North Wing',    status:'open',   zone:'north', cameras:2, entryCount:98  },
    { gateId:'G3', name:'Gate C – VIP Entrance',  status:'closed', zone:'vip',   cameras:3, entryCount:54  },
    { gateId:'G4', name:'Gate D – Staff Exit',    status:'open',   zone:'staff', cameras:2, entryCount:22  },
    { gateId:'G5', name:'Gate E – Emergency',     status:'locked', zone:'emerg', cameras:1, entryCount:0   },
  ];
  await Gate.insertMany(defaults);
  console.log('✅  Seeded gates');
}

async function seedCameras() {
  const count = await Camera.countDocuments();
  if (count > 0) return;
  const defaults = [
    { cameraId:'C1', name:'Main Entrance Cam 1', gate:'G1', status:'online',  resolution:'4K',   ai:true  },
    { cameraId:'C2', name:'Main Entrance Cam 2', gate:'G1', status:'online',  resolution:'1080p',ai:true  },
    { cameraId:'C3', name:'North Wing Cam',      gate:'G2', status:'online',  resolution:'1080p',ai:true  },
    { cameraId:'C4', name:'VIP Entrance Cam',    gate:'G3', status:'offline', resolution:'4K',   ai:false },
    { cameraId:'C5', name:'Staff Exit Cam',      gate:'G4', status:'online',  resolution:'720p', ai:false },
  ];
  await Camera.insertMany(defaults);
  console.log('✅  Seeded cameras');
}

async function seedAlerts() {
  const count = await Alert.countDocuments();
  if (count > 0) return;
  const now = new Date();
  const ago = (m) => new Date(now - m * 60000);
  const defaults = [
    { type:'unauthorized_entry', gate:'G1', severity:'high',     status:'open',     description:'Unrecognized individual at Gate A', createdAt: ago(5)  },
    { type:'tailgating',         gate:'G2', severity:'medium',   status:'open',     description:'Tailgating detected at Gate B',      createdAt: ago(20) },
    { type:'forced_entry',       gate:'G3', severity:'critical', status:'resolved', description:'Forced entry attempt at VIP Gate',   createdAt: ago(90) },
    { type:'duplicate_scan',     gate:'G1', severity:'low',      status:'open',     description:'Ticket #TK-4821 scanned twice',      createdAt: ago(14) },
    { type:'crowd_threshold',    gate:'G2', severity:'medium',   status:'open',     description:'Section B at 92% capacity',          createdAt: ago(31) },
  ];
  await Alert.insertMany(defaults);
  console.log('✅  Seeded alerts');
}

async function seedSettings() {
  const count = await Settings.countDocuments();
  if (count === 0) {
    await Settings.create({});
    console.log('✅  Seeded settings');
  }
}

async function startServer() {
  try {
    await connectDB();
    await seedDefaultUsers();
    await seedGates();
    await seedCameras();
    await seedAlerts();
    await seedSettings();
  } catch (err) {
    console.error('Failed to initialize backend:', err);
    process.exit(1);
  }

/* ── Middleware ── */
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5500',  // VS Code Live Server
    'http://localhost:5500',
    'null',                    // file:// opened directly in browser
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── Rate Limiting ── */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,                     // strict limit on auth endpoints
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes.' },
});

app.use(globalLimiter);

/* ── Serve Frontend Static Files ── */
const frontendPath = path.join(__dirname, '..');
app.use(express.static(frontendPath));

/* ── Routes ── */
app.use('/api/auth',      authLimiter, authRoutes);
app.use('/api/users',     usersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/gates',     gatesRoutes);
app.use('/api/alerts',    alertsRoutes);
app.use('/api/cameras',   camerasRoutes);
app.use('/api/settings',  settingsRoutes);

/* ── Health Check ── */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status:  'operational',
    version: '1.0.0',
    uptime:  process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/* ── Fallback: serve index.html for unknown non-API routes ── */
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

/* ── Global Error Handler ── */
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

/* ── Start ── */
  app.listen(PORT, () => {
    console.log(`\n🛡️  SVSS Backend running on http://localhost:${PORT}`);
    console.log(`📋  API Docs: http://localhost:${PORT}/api/health\n`);
    console.log('  Default credentials:');
    console.log('  Admin  →  admin@svss.io  /  Admin@1234');
    console.log('  Gate   →  gate@svss.io   /  Gate@1234\n');
  });
}

startServer();

module.exports = app;
