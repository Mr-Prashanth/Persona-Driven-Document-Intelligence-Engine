const { verifyJwtToken } = require('../utils/jwt');

function authMiddleware(req, res, next) {
  const token = req.cookies?.token; // assuming cookie name is 'token'

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const decoded = verifyJwtToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  req.user = decoded; // store decoded payload in req.user
  next();
}

module.exports = authMiddleware;
// This middleware checks for a JWT token in the request cookies, verifies it, and attaches the decoded user information to the request object.
// If the token is missing or invalid, it responds with a 401 Unauthorized status.