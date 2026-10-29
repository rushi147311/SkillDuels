# SkillDuels

Competitive Learning & Quiz Battle Platform

## Tech Stack
- React
- Node.js
- Express.js
- MongoDB
- Socket.IO
- JWT

## Email authentication setup

The server sends email verification and password reset links through SMTP. Copy
`server/.env.example` to `server/.env`, then configure the values before starting the
server. Set `JWT_SECRET` to a long random value, and use your own Gmail address and
App Password for SMTP.

Use port `465` with `SMTP_SECURE=true` for Gmail. Verification
links expire after 24 hours and password reset links expire after 1 hour. A user must
verify their email before signing in or requesting a password reset. Existing accounts
without a verified email must use the login page's resend-verification option.

The leaderboard uses authenticated Socket.IO connections to show online players and
updates the leaderboard and public-room list when relevant changes happen. For a
non-local deployment, configure `VITE_API_URL` and optionally `VITE_SOCKET_URL` for the
client, and set `FRONTEND_URL` in the server environment to the deployed client origin.

## Team Members
- Rushi (Team Leader)
- Aditya
- Ganesh
- Kirjat
- Ajay