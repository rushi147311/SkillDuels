
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../services/emailServices");

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const MIN_PASSWORD_LENGTH = 6;
const MIN_USERNAME_LENGTH = 3;
const VERIFICATION_TOKEN_TTL = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TOKEN_TTL = 60 * 60 * 1000;

const createToken = () => crypto.randomBytes(32).toString("hex");

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const getSafeUser = (user) => {
  const safeUser = user.toObject ? user.toObject() : { ...user };

  [
    "password",
    "emailVerificationToken",
    "emailVerificationExpires",
    "passwordResetToken",
    "passwordResetExpires",
  ].forEach((field) => delete safeUser[field]);

  return safeUser;
};

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required.",
      });
    }

    if (
      typeof username !== "string" ||
      username.trim().length < MIN_USERNAME_LENGTH
    ) {
      return res.status(400).json({
        success: false,
        message: `Username must be at least ${MIN_USERNAME_LENGTH} characters.`,
      });
    }

    if (
      typeof email !== "string" ||
      !EMAIL_REGEX.test(email.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (
      typeof password !== "string" ||
      password.length < MIN_PASSWORD_LENGTH
    ) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      });
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      $or: [
        { username: normalizedUsername },
        { email: normalizedEmail },
      ],
    });

    if (existingUser) {
      const message =
        existingUser.username === normalizedUsername
          ? "Username already taken."
          : "Email already registered.";

      return res.status(409).json({
        success: false,
        message,
      });
    }

    const verificationToken = createToken();

    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password,
      emailVerificationToken: hashToken(verificationToken),
      emailVerificationExpires: new Date(
        Date.now() + VERIFICATION_TOKEN_TTL
      ),
    });

    req.app.get("io")?.emit("leaderboard_updated");

    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch (error) {
      console.error("Failed to send email verification:", error);

      return res.status(503).json({
        success: false,
        message:
          "Your account was created, but the verification email could not be sent. Please request another verification email.",
      });
    }

    return res.status(201).json({
      success: true,
      message:
        "Account created. Check your email for a verification link before signing in.",
      data: getSafeUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0];
      const message =
        field === "username"
          ? "Username already taken."
          : "Email already registered.";

      return res.status(409).json({
        success: false,
        message,
      });
    }

    console.error("Registration failed:", error);

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (typeof token !== "string" || !token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required.",
      });
    }

    const user = await User.findOne({
      emailVerificationToken: hashToken(token),
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "This verification link is invalid or has expired. Request a new verification email.",
      });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    req.app.get("io")?.emit("leaderboard_updated");

    return res.status(200).json({
      success: true,
      message: "Email verified. You can now sign in.",
    });
  } catch (error) {
    console.error("Failed to verify email:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify email. Please try again.",
    });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const { identifier } = req.body;

    if (
      typeof identifier !== "string" ||
      !identifier.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Email or username is required.",
      });
    }

    const trimmedIdentifier = identifier.trim();

    const user = await User.findOne({
      $or: [
        { email: trimmedIdentifier.toLowerCase() },
        { username: trimmedIdentifier },
      ],
    });

    if (!user || user.emailVerified) {
      return res.status(200).json({
        success: true,
        message:
          "If this address has an unverified account, a verification email has been sent.",
      });
    }

    const verificationToken = createToken();

    user.emailVerificationToken = hashToken(verificationToken);
    user.emailVerificationExpires = new Date(
      Date.now() + VERIFICATION_TOKEN_TTL
    );

    await user.save();
    await sendVerificationEmail(user.email, verificationToken);

    return res.status(200).json({
      success: true,
      message:
        "If this address has an unverified account, a verification email has been sent.",
    });
  } catch (error) {
    console.error("Failed to resend email verification:", error);

    return res.status(503).json({
      success: false,
      message:
        "Unable to send the verification email. Please try again later.",
    });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (
      typeof email !== "string" ||
      !EMAIL_REGEX.test(email.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      emailVerified: true,
    });

    if (user) {
      const resetToken = createToken();

      user.passwordResetToken = hashToken(resetToken);
      user.passwordResetExpires = new Date(
        Date.now() + PASSWORD_RESET_TOKEN_TTL
      );

      await user.save();
      await sendPasswordResetEmail(user.email, resetToken);
    }

    return res.status(200).json({
      success: true,
      message:
        "If a verified account exists for that email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Failed to request password reset:", error);

    return res.status(503).json({
      success: false,
      message:
        "Unable to send the password reset email. Please try again later.",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (typeof token !== "string" || !token) {
      return res.status(400).json({
        success: false,
        message: "Password reset token is required.",
      });
    }

    if (
      typeof password !== "string" ||
      password.length < MIN_PASSWORD_LENGTH
    ) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      });
    }

    const user = await User.findOne({
      passwordResetToken: hashToken(token),
      passwordResetExpires: { $gt: new Date() },
      emailVerified: true,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "This password reset link is invalid or has expired. Request a new one.",
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.tokenVersion += 1;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Password updated. You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("Failed to reset password:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password. Please try again.",
    });
  }
};

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (
      typeof identifier !== "string" ||
      !identifier.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Identifier and password are required.",
      });
    }

    const trimmedIdentifier = identifier.trim();
    const normalizedIdentifier = trimmedIdentifier.toLowerCase();

    const user = await User.findOne({
      $or: [
        { username: trimmedIdentifier },
        { email: normalizedIdentifier },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email address before signing in.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        tokenVersion: user.tokenVersion,
      },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "30d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: getSafeUser(user),
      token,
    });
  } catch (error) {
    console.error("Login failed:", error);

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

const getCurrentUser = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authorized.",
    });
  }

  return res.status(200).json({
    success: true,
    data: getSafeUser(req.user),
  });
};

const logout = async (req, res) => {
  try {
    await User.updateOne(
      { _id: req.user._id },
      { $inc: { tokenVersion: 1 } }
    );

    return res.status(200).json({
      success: true,
      message: "Logout successful. Token revoked.",
    });
  } catch (error) {
    console.error("Failed to revoke authentication token:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to revoke token. Please try again.",
    });
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword,
  login,
  logout,
  getCurrentUser,
};
