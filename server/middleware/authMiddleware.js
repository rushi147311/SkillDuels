const jwt = require("jsonwebtoken");
const User = require("../models/User");

const unauthorized = (res) =>
  res.status(401).json({ success: false, message: "Not authorized. Please log in again." });

const protect = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith("Bearer ")) return unauthorized(res);

  try {
    if (!process.env.JWT_SECRET) return unauthorized(res);
    const token = authorization.slice("Bearer ".length);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (
      !user ||
      !user.isEmailVerified ||
      (decoded.tokenVersion ?? 0) !== user.tokenVersion
    ) return unauthorized(res);

    req.user = user;
    return next();
  } catch {
    return unauthorized(res);
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Administrator access is required." });
  }
  return next();
};

module.exports = { protect, requireAdmin };
