const nodemailer = require("nodemailer");

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || Boolean(SMTP_USER) !== Boolean(SMTP_PASS)) {
    throw new Error("Email delivery is not configured.");
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true",
    ...(SMTP_USER ? { auth: { user: SMTP_USER, pass: SMTP_PASS } } : {}),
  });
  return transporter;
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[character]));

const sendVerificationEmail = async ({ email, username, token }) => {
  const baseUrl = process.env.APP_BASE_URL || "http://localhost:5173";
  const verificationUrl = `${baseUrl.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(token)}`;
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "SkillDuels <no-reply@localhost>",
    to: email,
    subject: "Verify your SkillDuels email",
    text: `Hi ${username},

Verify your email to activate your SkillDuels account: ${verificationUrl}

This link expires in 24 hours and can only be used once. If you did not create this account, ignore this email.`,
    html: `<p>Hi ${escapeHtml(username)},</p><p>Verify your email to activate your SkillDuels account:</p><p><a href="${verificationUrl}">Verify email</a></p><p>This link expires in 24 hours and can only be used once. If you did not create this account, ignore this email.</p>`,
  });
};

module.exports = { sendVerificationEmail };
