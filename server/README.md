# SkillDuels server setup

Copy `.env.example` to `.env` and configure `MONGO_URI`, `JWT_SECRET`, and the SMTP settings. `FRONTEND_URL` is used to build verification and password reset links. Keep `.env` private.

To provision the first administrator, set `ADMIN_EMAIL`, `ADMIN_USERNAME`, and a unique `ADMIN_PASSWORD` of at least 12 characters, then run `npm run bootstrap:admin` once. The script refuses to promote or overwrite an existing account. Remove those three variables after provisioning. Admin sign-in is available at `/admin/login`; admin API routes require an authenticated administrator account.

For local email testing, point the SMTP settings at a local mail server such as Mailpit, register an account, and open the verification link from the captured email.
