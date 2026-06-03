/* ============================================================
   Smart Venue Security System – Express Server
   ============================================================ */

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const connectDB  = require('./config/db');
const User       = require('./config/User.model');

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
    {
      email: 'admin@svss.io',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      status: 'active',
      passwordHash: 'Admin@1234',
    },
    {
      email: 'gate@svss.io',
      firstName: 'Marcus',
      lastName: 'Johnson',
      role: 'gate_operator',
      status: 'active',
      passwordHash: 'Gate@1234',
    },
  ];

  for (const userData of defaultUsers) {
    const exists = await User.findOne({ email: userData.email });
    if (!exists) {
      const user = new User(userData);
      await user.save();
      console.log(`✅  Created default user: ${user.email}`);
    }
  }
}

async function startServer() {
  try {
    await connectDB();
    await seedDefaultUsers();
  } catch (err) {
    console.error('Failed to initialize backend:', err);
    process.exit(1);
  }

/* ── Middleware ── */
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'null'],
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

/* ── 404 Handler ── */
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
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
