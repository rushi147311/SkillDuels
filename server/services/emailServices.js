const nodemailer = require("nodemailer");

const getTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    throw new Error("SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD must be configured.");
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });
};

const createLink = (path, token) => {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const link = new URL(path, baseUrl);
  link.searchParams.set("token", token);
  return link.toString();
};

const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
};

const createBrandedEmail = ({
  preheader,
  eyebrow,
  title,
  description,
  buttonLabel,
  buttonUrl,
  expiry,
  note,
}) => `
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0;padding:32px 12px;background-color:#f3f5fb;font-family:Arial,Helvetica,sans-serif;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;">
          <tr>
            <td align="center" style="padding:8px 0 24px;color:#202747;font-size:22px;font-weight:800;letter-spacing:-.5px;">
              <span style="color:#ff9e45;">&#9889;</span> SkillDuels
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 5px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:22px;background-color:#ffffff;box-shadow:0 18px 48px rgba(32,39,71,.10);">
                <tr>
                  <td style="padding:40px 42px 36px;">
                    <div style="display:inline-block;padding:8px 12px;border-radius:999px;background-color:#eef1ff;color:#465fd0;font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;">${eyebrow}</div>
                    <h1 style="margin:22px 0 12px;color:#171b32;font-size:30px;line-height:1.2;letter-spacing:-.7px;">${title}</h1>
                    <p style="margin:0;color:#687087;font-size:16px;line-height:1.7;">${description}</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 24px;">
                      <tr>
                        <td align="center" bgcolor="#4162e8" style="border-radius:12px;box-shadow:0 8px 18px rgba(65,98,232,.22);">
                          <a href="${buttonUrl}" style="display:inline-block;padding:15px 24px;border:1px solid #4162e8;border-radius:12px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">${buttonLabel} &nbsp; &#8594;</a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0 0 14px;color:#7b8191;font-size:13px;line-height:1.6;">${expiry}</p>
                    <div style="height:1px;background-color:#edf0f7;margin:22px 0;"></div>
                    <p style="margin:0;color:#9298a8;font-size:12px;line-height:1.7;">${note}</p>
                    <p style="margin:16px 0 0;color:#9298a8;font-size:12px;line-height:1.7;">If the button doesn’t work, copy and paste this link into your browser:<br><a href="${buttonUrl}" style="color:#4162e8;word-break:break-all;">${buttonUrl}</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:18px 12px;color:#a0a6b5;font-size:11px;line-height:1.6;">
              SkillDuels &middot; Challenge. Compete. Win.<br>
              This is an automated message; please don’t reply.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

const sendVerificationEmail = async (email, token) => {
  const verificationLink = createLink("/verify-email", token);
  await sendEmail({
    to: email,
    subject: "One quick step to join SkillDuels",
    text: `Confirm your SkillDuels email by opening this link: ${verificationLink}\n\nThis link expires in 24 hours.`,
    html: createBrandedEmail({
      preheader: "Verify your email and get ready to challenge your friends.",
      eyebrow: "One last step",
      title: "Let’s get you in the game.",
      description: "Thanks for joining SkillDuels! Confirm this email address to activate your account and start competing.",
      buttonLabel: "Verify my email",
      buttonUrl: verificationLink,
      expiry: "For your security, this link expires in 24 hours.",
      note: "If you didn’t create a SkillDuels account, you can safely ignore this email.",
    }),
  });
};

const sendPasswordResetEmail = async (email, token) => {
  const resetLink = createLink("/reset-password", token);
  await sendEmail({
    to: email,
    subject: "Your SkillDuels password reset link",
    text: `Reset your SkillDuels password by opening this link: ${resetLink}\n\nThis link expires in 1 hour. If you did not request this, you can ignore this email.`,
    html: createBrandedEmail({
      preheader: "Use the secure link to choose a new SkillDuels password.",
      eyebrow: "Account security",
      title: "Let’s get you back in.",
      description: "We received a request to reset your SkillDuels password. Use the button below to choose a new one.",
      buttonLabel: "Reset my password",
      buttonUrl: resetLink,
      expiry: "This secure link expires in 1 hour and can only be used once.",
      note: "If you didn’t request a password reset, ignore this email. Your password will stay the same.",
    }),
  });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };