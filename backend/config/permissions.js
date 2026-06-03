/* ============================================================
   ROLE-BASED PERMISSIONS
   ============================================================
   Roles:
     admin  – Full system access
     user   – Limited access (view own data, alerts, gates status)
   ============================================================ */

const PERMISSIONS = {
  admin: [
    // Dashboard
    'dashboard:view',

    // Users management
    'users:view',
    'users:create',
    'users:update',
    'users:delete',
    'users:change_role',

    // Gates
    'gates:view',
    'gates:create',
    'gates:update',
    'gates:delete',
    'gates:control',          // open/close gate remotely

    // Cameras / surveillance
    'cameras:view',
    'cameras:create',
    'cameras:update',
    'cameras:delete',
    'cameras:live_feed',
    'cameras:playback',

    // AI / Detection
    'ai:view_status',
    'ai:configure',
    'ai:train_model',
    'ai:view_detections',

    // Alerts
    'alerts:view',
    'alerts:resolve',
    'alerts:delete',
    'alerts:export',

    // Reports & Analytics
    'reports:view',
    'reports:generate',
    'reports:export',

    // System settings
    'settings:view',
    'settings:update',
    'settings:backup',
    'settings:restore',

    // Audit logs
    'audit:view',
    'audit:export',
  ],

  user: [
    // Dashboard (read-only summary)
    'dashboard:view',

    // Own profile only
    'profile:view',
    'profile:update_own',

    // Gates – view status only
    'gates:view',

    // Cameras – live feed only (no config)
    'cameras:view',
    'cameras:live_feed',

    // AI – view status only
    'ai:view_status',
    'ai:view_detections',

    // Alerts – view & acknowledge own zone
    'alerts:view',
    'alerts:resolve',

    // Reports – view only
    'reports:view',
  ],
};

/**
 * Check if a role has a specific permission
 * @param {string} role
 * @param {string} permission
 * @returns {boolean}
 */
function hasPermission(role, permission) {
  const perms = PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes(permission);
}

module.exports = { PERMISSIONS, hasPermission };
