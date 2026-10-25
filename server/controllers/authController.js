const crypto = require("crypto");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendVerificationEmail } = require("../services/emailServices");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const MIN_USERNAME_LENGTH = 3;
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const resendAttempts = new Map();

const normalizeEmail = (value) => value.trim().toLowerCase();
const hashVerificationToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const createAndSendVerification = async (user) => {
  const token = crypto.randomBytes(32).toString("hex");
  user.emailVerificationTokenHash = hashVerificationToken(token);
  user.emailVerificationExpiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
  await user.save();
  await sendVerificationEmail({ email: user.email, username: user.username, token });
};

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body || {};

    if (typeof username !== "string" || typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ success: false, message: "Username, email, and password are required." });
    }
    if (username.trim().length < MIN_USERNAME_LENGTH || username.trim().length > 40) {
      return res.status(400).json({ success: false, message: `Username must be at least ${MIN_USERNAME_LENGTH} characters.` });
    }
    if (email.trim().length > 254 || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address." });
    }
    if (password.length < MIN_PASSWORD_LENGTH || password.length > 128) {
      return res.status(400).json({ success: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = normalizeEmail(email);
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(202).json({
        success: true,
        message: "If this address can be registered, a verification email has been sent.",
      });
    }

    const existingUsername = await User.findOne({ username: normalizedUsername });
    if (existingUsername) {
      return res.status(409).json({ success: false, message: "Username already taken." });
    }

    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password,
    });

    try {
      await createAndSendVerification(user);
    } catch {
      return res.status(503).json({
        success: false,
        code: "EMAIL_DELIVERY_FAILED",
        message: "Your account was created, but we could not send the verification email. Retry verification using this email address.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Account created. Check your email to verify it before logging in.",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(202).json({
        success: true,
        message: "If this address can be registered, a verification email has been sent.",
      });
    }
    return res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
};

const verifyEmail = async (req, res) => {
  const token = req.body?.token;
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    return res.status(400).json({ success: false, message: "This verification link is invalid or has expired." });
  }

  try {
    const user = await User.findOneAndUpdate(
      {
        emailVerificationTokenHash: hashVerificationToken(token),
        emailVerificationExpiresAt: { $gt: new Date() },
        isEmailVerified: false,
      },
      {
        $set: { isEmailVerified: true },
        $unset: { emailVerificationTokenHash: 1, emailVerificationExpiresAt: 1 },
      },
      { new: true }
    ).select("_id");

    if (!user) {
      return res.status(400).json({ success: false, message: "This verification link is invalid or has expired." });
    }
    return res.status(200).json({ success: true, message: "Email verified. You can now log in." });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to verify email right now. Please try again." });
  }
};

const resendVerification = async (req, res) => {
  const email = req.body?.email;
  if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ success: false, message: "Please provide a valid email address." });
  }

  const normalizedEmail = normalizeEmail(email);
  const now = Date.now();
  const lastSentAt = resendAttempts.get(normalizedEmail);
  if (lastSentAt && now - lastSentAt < RESEND_COOLDOWN_MS) {
    return res.status(429).json({
      success: false,
      message: "Please wait before requesting another verification email.",
      retryAfterSeconds: Math.ceil((RESEND_COOLDOWN_MS - (now - lastSentAt)) / 1000),
    });
  }
  if (resendAttempts.size >= 10000 && !resendAttempts.has(normalizedEmail)) {
    const oldestEmail = resendAttempts.keys().next().value;
    resendAttempts.delete(oldestEmail);
  }
  resendAttempts.set(normalizedEmail, now);

  try {
    const user = await User.findOne({ email: normalizedEmail, isEmailVerified: false });
    if (user) {
      try {
        await createAndSendVerification(user);
      } catch {
        return res.status(503).json({
          success: false,
          code: "EMAIL_DELIVERY_FAILED",
          message: "We could not send the verification email. Check your email settings and retry.",
        });
      }
    }
    return res.status(200).json({
      success: true,
      message: "If this address has an account awaiting verification, a verification email has been sent.",
    });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to process the request right now." });
  }
};

const issueSession = (user) => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured.");
  const token = jwt.sign(
    { id: user._id, tokenVersion: user.tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
  const safeUser = user.toObject();
  delete safeUser.password;
  delete safeUser.emailVerificationTokenHash;
  delete safeUser.emailVerificationExpiresAt;
  return { token, data: safeUser };
};

const authenticate = async (req, res, requireAdmin = false) => {
  try {
    const { identifier, password } = req.body || {};
    if (typeof identifier !== "string" || !identifier.trim() || typeof password !== "string" || !password) {
      return res.status(400).json({ success: false, message: "Identifier and password are required." });
    }

    const normalizedIdentifier = identifier.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ username: identifier.trim() }, { email: normalizedIdentifier }],
    });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }
    if (requireAdmin && user.role !== "admin") {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Verify your email before logging in.",
      });
    }

    const session = issueSession(user);
    return res.status(200).json({ success: true, message: "Login successful.", ...session });
  } catch {
    return res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
};

const login = (req, res) => authenticate(req, res, false);
const adminLogin = (req, res) => authenticate(req, res, true);

const logout = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
    return res.status(200).json({ success: true, message: "Logout successful. Token revoked." });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to revoke token. Please try again." });
  }
};

module.exports = { register, verifyEmail, resendVerification, login, adminLogin, logout };
