const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const MIN_PASSWORD_LENGTH = 6;
const MIN_USERNAME_LENGTH = 3;

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required.",
      });
    }

    if (typeof username !== "string" || username.trim().length < MIN_USERNAME_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Username must be at least ${MIN_USERNAME_LENGTH} characters.`,
      });
    }

    if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      });
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
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

    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password,
    });

    const safeUser = user.toObject();
    delete safeUser.password;

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: safeUser,
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0];
      const message =
        field === "username" ? "Username already taken." : "Email already registered.";

      return res.status(409).json({
        success: false,
        message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Identifier and password are required.",
      });
    }

    const normalizedIdentifier = identifier.trim().toLowerCase();

    const user = await User.findOne({
      $or: [{ username: identifier.trim() }, { email: normalizedIdentifier }],
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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "default_secret", {
      expiresIn: "30d",
    });

    const safeUser = user.toObject();
    delete safeUser.password;

    res.status(200).json({
      success: true,
      message: "Login successful.",
      data: safeUser,
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

module.exports = { register, login };