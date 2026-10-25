# SkillDuels server setup

## Authentication configuration

From the server directory, copy .env.example to .env. Set MONGO_URI, a long random JWT_SECRET, and APP_BASE_URL. Configure SMTP_HOST, SMTP_PORT, and SMTP_SECURE for the mail provider. Set both SMTP_USER and SMTP_PASS only if the provider requires authentication. SMTP_FROM is optional. Never commit .env.

Existing accounts without the new verification fields are treated as unverified. They can request a verification link from the login or verification screen.

## Local email verification

Start MongoDB and Mailpit with Docker:

docker run --rm -d --name skillduels-mongo -p 27017:27017 mongo:8

docker run --rm -d --name skillduels-mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit

The example SMTP settings use Mailpit's default unauthenticated listener. Open http://localhost:8025, register a user, and follow the verification link. If delivery fails, correct SMTP settings and use the registration screen's resend action.

## First administrator

Set ADMIN_EMAIL, ADMIN_USERNAME, and a unique ADMIN_PASSWORD of 12 to 128 characters in the server .env. Run npm run bootstrap:admin once. The command creates a verified admin account and refuses to overwrite or promote an existing account. Remove the three ADMIN variables from .env afterward. There is no public admin registration route.

Admin sign-in is at /admin/login. Admin APIs require a verified account whose database role is admin. Public registration never accepts a role.

## Run the application and tests

In one terminal, from the server directory:

Copy-Item .env.example .env
npm ci
npm run dev

Edit .env before starting and set the values described above.

In another terminal, from the client directory:

npm install --package-lock=false
npm run dev

The checked-in client lockfile is out of sync with package.json, so npm ci currently cannot complete. The frontend defaults to http://localhost:5000/api; override it with VITE_API_URL if needed.

Run backend authentication tests from the server directory with npm test.
