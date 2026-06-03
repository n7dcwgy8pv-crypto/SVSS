/* ============================================================
   Authentication & Authorization Middleware
   ============================================================ */

const { verifyAccessToken } = require('../utils/jwt');
const { hasPermission }     = require('../config/permissions');

/**
 * authenticate
 * Validates the Bearer JWT in the Authorization header.
 * Attaches decoded payload to req.user on success.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      code: 'NO_TOKEN',
      message: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;   // { sub, email, role, name, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired. Please refresh your session.',
      });
    }
    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Invalid token.',
    });
  }
}

/**
 * authorize(...permissions)
 * Returns middleware that checks the authenticated user has
 * ALL of the listed permissions for their role.
 *
 * Usage:
 *   router.get('/users', authenticate, authorize('users:view'), handler)
 */
function authorize(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'NOT_AUTHENTICATED',
        message: 'Authentication required.',
      });
    }

    const { role } = req.user;
    const missing = permissions.filter(p => !hasPermission(role, p));

    if (missing.length > 0) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: `Access denied. Missing permission(s): ${missing.join(', ')}`,
        required: permissions,
        yourRole: role,
      });
    }

    next();
  };
}

/**
 * requireRole(...roles)
 * Simpler role-level guard (use when you don't need fine-grained permissions).
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: `This resource requires one of the following roles: ${roles.join(', ')}`,
      });
    }
    next();
  };
}

module.exports = { authenticate, authorize, requireRole };
