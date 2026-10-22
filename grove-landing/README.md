# FloraGrove landing page

Static page (`index.html`) plus one serverless function (`api/waitlist.js`) that saves
waitlist emails to Atlas (`grove_db.waitlist`).

## Deploy (Vercel)
1. Import the repo in Vercel and set **Root Directory** to `grove-landing`.
2. Add environment variables: `MONGO_URL` (Atlas connection string), optional `DB_NAME` (default `grove_db`).
3. In Atlas > Network Access, allow connections from Vercel (Vercel functions have no fixed IP, so this is usually `0.0.0.0/0`; use a dedicated database user with access to `grove_db` only).

## Local check
`npm install && npx vercel dev` (needs a `.env` with `MONGO_URL`).
