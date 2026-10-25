require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const bootstrap = async () => {
  const { MONGO_URI, ADMIN_EMAIL, ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET } = process.env;
  if (!MONGO_URI || !JWT_SECRET || !ADMIN_EMAIL || !ADMIN_USERNAME || !ADMIN_PASSWORD) {
    throw new Error("Set MONGO_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_USERNAME, and ADMIN_PASSWORD before bootstrapping.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ADMIN_EMAIL.trim())) {
    throw new Error("ADMIN_EMAIL must be a valid email address.");
  }
  if (ADMIN_PASSWORD.length < 12 || ADMIN_PASSWORD.length > 128) {
    throw new Error("ADMIN_PASSWORD must be between 12 and 128 characters.");
  }

  if (ADMIN_USERNAME.trim().length < 3 || ADMIN_USERNAME.trim().length > 40) {
    throw new Error("ADMIN_USERNAME must be between 3 and 40 characters.");
  }

  await mongoose.connect(MONGO_URI);
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existing = await User.findOne({ $or: [{ email }, { username: ADMIN_USERNAME.trim() }] });
  if (existing) {
    throw new Error("An account with the configured admin email or username already exists; no changes were made.");
  }

  await User.create({
    email,
    username: ADMIN_USERNAME.trim(),
    password: ADMIN_PASSWORD,
    role: "admin",
    isEmailVerified: true,
  });
  console.log("Administrator account created.");
};

bootstrap()
  .catch(() => {
    console.error("Administrator bootstrap failed. Check the configuration and database availability.");
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState) await mongoose.disconnect();
  });
