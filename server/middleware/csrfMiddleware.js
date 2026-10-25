const crypto = require('crypto');

/**
 * Double-submit cookie CSRF protection middleware for SPA with HttpOnly session cookies
 */
const csrfProtection = (req, res, next) => {
  // Ensure an XSRF-TOKEN cookie exists for the client
  if (!req.cookies || !req.cookies['XSRF-TOKEN']) {
    const csrfToken = crypto.randomBytes(32).toString('hex');
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('XSRF-TOKEN', csrfToken, {
      httpOnly: false, // Must be readable by Axios/browser to echo in header
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    });
    // Attach to req so current request handler knows it
    if (!req.cookies) req.cookies = {};
    req.cookies['XSRF-TOKEN'] = csrfToken;
  }

  // Safe HTTP methods do not mutate state
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Bypass CSRF checks in automated test runner if configured
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  // Public authentication endpoints establish or terminate session and are exempt
  const exemptPaths = ['/api/auth/register', '/api/auth/login', '/api/auth/logout'];
  if (exemptPaths.some((p) => req.path === p || req.originalUrl?.startsWith(p))) {
    return next();
  }

  // Origin / Referer validation against allowed domains
  const origin = req.headers.origin || req.headers.referer;
  const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];

  let isAllowedOrigin = false;
  if (origin) {
    try {
      const originUrl = new URL(origin).origin;
      isAllowedOrigin =
        allowedOrigins.some((allowed) => {
          try {
            return new URL(allowed).origin === originUrl;
          } catch {
            return false;
          }
        }) || (process.env.NODE_ENV === 'production' && originUrl.endsWith('.vercel.app'));

      if (!isAllowedOrigin) {
        return res.status(403).json({
          success: false,
          message: 'Cross-site request blocked by CSRF protection policy.',
        });
      }
    } catch {
      // In case of malformed URL, ignore and rely on token check
    }
  }

  // If request is authenticated via Bearer token (programmatic API/CLI client),
  // CSRF does not apply because ambient browser cookies are not being used
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return next();
  }

  // Double Submit Cookie check for browser cookie-authenticated requests
  const clientToken = req.headers['x-xsrf-token'] || req.headers['x-csrf-token'];
  const cookieToken = req.cookies && req.cookies['XSRF-TOKEN'];

  // If client token is provided, it must match the cookie token
  if (clientToken && cookieToken && clientToken !== cookieToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token mismatch.',
    });
  }

  // If request is not from a verified origin and lacks matching double-submit tokens, reject
  if (!isAllowedOrigin && (!clientToken || !cookieToken || clientToken !== cookieToken)) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or missing CSRF token. Please refresh the page and try again.',
    });
  }

  next();
};

module.exports = { csrfProtection };
