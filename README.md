# Ostara — Appointment Booking App

A full-stack appointment booking system: customers create an account, pick a
service, pick a date and time slot, and book. Admins manage services and see
every booking, and can update its status.

- **Frontend:** React (Vite), React Router, Axios
- **Backend:** Node.js, Express, JWT auth, bcrypt password hashing
- **Database:** SQLite (a single file — no separate database server to install)

The backend serves the built frontend itself, so the whole thing is **one
service** — one thing to deploy, one URL for your live site.

## Project structure

```
booking-app/
  backend/     Express API + SQLite database + serves the built website
  frontend/    React app (Vite) — gets built into backend/public
```

## Put it online for free (Render.com) — no coding needed

This is the easiest path to a real, public URL.

1. Put this project in a GitHub repo (create a new repo on github.com, and
   use its "upload files" button to drag the whole `booking-app` folder in —
   no git command line needed).
2. Go to **render.com**, sign up for free, click **New +** → **Blueprint**,
   and point it at your GitHub repo. Render will read the included
   `render.yaml` file and configure everything automatically:
   - Build command: installs and builds the frontend
   - Start command: runs the server
   - Generates a secure `JWT_SECRET` for you
3. Before the first deploy, open the `ADMIN_EMAIL` environment variable in
   Render's dashboard and set it to the email you want to use as the admin
   login.
4. Click **Deploy**. In a couple of minutes Render gives you a live URL like
   `https://booking-app.onrender.com` — that's your public website.

**One thing to know:** the free Render plan doesn't include a persistent
disk, so the SQLite database resets if the service restarts or redeploys.
That's fine for trying it out or a small personal project. When you're ready
for real customer data, either add a small paid disk on Render (a couple of
clicks in the dashboard) or switch to a hosted database — ask me and I can
make that change for you.

**Alternative hosts:** Railway.app and Fly.io work the same way (connect
GitHub repo, use the same build/start commands from `render.yaml`) if you'd
rather use one of those.

## Run it on your own computer (for testing/development)

### 1. Run the backend

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and:
- Set `JWT_SECRET` to any long random string.
- Set `ADMIN_EMAIL` to the email address you want to use as the admin login.
  **The first person who registers with that exact email automatically
  becomes an admin.** Everyone else who registers becomes a regular customer.

Then start the server:

```bash
npm start
```

The API runs at `http://localhost:4000`. A `booking.db` SQLite file is
created automatically on first run, pre-loaded with three example services.

### 2. Run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). The dev server
proxies `/api` requests to the backend automatically, so both must be running
at the same time.

### 3. Try it out

1. Go to the app and click **Create one** to register.
2. Register once using the email you put in `ADMIN_EMAIL` — that account
   becomes the admin and lands on `/admin` (manage services, see all
   bookings, change booking status).
3. Register again with any other email for a normal customer account — it
   lands on `/dashboard` (pick a service, date, and time slot, and book).

## Deploying for real use

This is a working starting point, not a production deployment. Before
putting it in front of real users:

- Put the backend behind HTTPS and set a strong, unique `JWT_SECRET`.
- Consider a hosted database (Postgres/MySQL) if you expect heavy concurrent
  writes — SQLite is fine for small-to-medium traffic.
- Add rate limiting to `/api/auth/login` to slow down password-guessing.
- Build the frontend for production with `npm run build` inside `frontend/`
  and serve the generated `dist/` folder from a static host or CDN, pointing
  it at your deployed backend URL.
- Add email notifications/reminders for bookings if you want them (not
  included here).

## API overview

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create an account |
| POST | `/api/auth/login` | — | Log in, get a token |
| GET | `/api/auth/me` | user | Get the logged-in user |
| GET | `/api/services` | — | List active services |
| GET | `/api/services/all` | admin | List all services |
| POST | `/api/services` | admin | Create a service |
| PUT | `/api/services/:id` | admin | Edit a service |
| DELETE | `/api/services/:id` | admin | Delete a service |
| GET | `/api/bookings/availability` | — | Free time slots for a service/date |
| POST | `/api/bookings` | user | Book an appointment |
| GET | `/api/bookings/mine` | user | Your own bookings |
| PUT | `/api/bookings/:id/cancel` | user | Cancel your own booking |
| GET | `/api/bookings/all` | admin | Every booking |
| PUT | `/api/bookings/:id/status` | admin | Change a booking's status |
