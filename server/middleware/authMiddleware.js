const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    const user = await User.findById(decoded.id).select('-password');

    if (!user || (decoded.tokenVersion ?? 0) !== user.tokenVersion) {
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }

    req.user = user;
    return next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

const optionalProtect = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return next();
  }

  try {
    const decoded = jwt.verify(authorization.split(' ')[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user || (decoded.tokenVersion ?? 0) !== user.tokenVersion) {
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }

    req.user = user;
    return next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

module.exports = { protect, optionalProtect };