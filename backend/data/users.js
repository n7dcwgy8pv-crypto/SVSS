/* ============================================================
   In-memory user store (replace with a real DB in production)
   Passwords are bcrypt hashed.
   Default credentials:
     admin@svss.io  / Admin@1234
     gate@svss.io   / Gate@1234
   ============================================================ */

const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const users = [
  {
    id: '1',
    firstName: 'System',
    lastName: 'Administrator',
    email: 'admin@svss.io',
    // plain: Admin@1234
    passwordHash: bcrypt.hashSync('Admin@1234', SALT_ROUNDS),
    role: 'admin',
    status: 'active',
    permissions: ['dashboard', 'monitoring', 'tickets', 'alerts', 'analytics',
                  'incidents', 'gates', 'users', 'settings', 'cameras'],
    createdAt: new Date('2026-01-01').toISOString(),
  },
  {
    id: '2',
    firstName: 'Marcus',
    lastName: 'Johnson',
    email: 'gate@svss.io',
    // plain: Gate@1234
    passwordHash: bcrypt.hashSync('Gate@1234', SALT_ROUNDS),
    role: 'gate_operator',
    status: 'active',
    permissions: ['tickets', 'gate_access'],
    gate:     'Gate A',
    shift:    '18:00 – 02:00',
    position: 'Main Entrance Operator',
    createdAt: new Date('2026-01-15').toISOString(),
  },
];

let nextId = 3;

function findByEmail(email) {
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

function findById(id) {
  return users.find(u => u.id === String(id)) || null;
}

function createUser({ firstName, lastName, email, passwordHash, role = 'user' }) {
  const user = {
    id: String(nextId++),
    firstName,
    lastName,
    email,
    passwordHash,
    role,
    status: 'pending',   // admin must approve new registrations
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return user;
}

function updateUser(id, updates) {
  const idx = users.findIndex(u => u.id === String(id));
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updates };
  return users[idx];
}

function deleteUser(id) {
  const idx = users.findIndex(u => u.id === String(id));
  if (idx === -1) return false;
  users.splice(idx, 1);
  return true;
}

function getAllUsers() {
  return users.map(({ passwordHash, ...safe }) => safe);
}

module.exports = { findByEmail, findById, createUser, updateUser, deleteUser, getAllUsers };
