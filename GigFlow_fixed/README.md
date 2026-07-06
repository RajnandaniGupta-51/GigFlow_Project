# GigFlow

GigFlow is a full-stack freelance marketplace where clients post gigs, freelancers bid on them, and both sides manage the project lifecycle — from bidding and hiring through milestones, work submission, and approval — with real-time notifications and in-app messaging.

**Live demo:** [https://gig-flow-project-dusky.vercel.app](https://gig-flow-project-dusky.vercel.app)

## Features

- **Authentication** — JWT-based auth stored in an httpOnly cookie, with client/freelancer roles
- **Gig posting & browsing** — clients create gigs with title, description, and budget
- **Bidding system** — freelancers bid on open gigs; duplicate bids from the same freelancer on the same gig are blocked at the database level
- **Negotiation flow** — clients can counter a bid, freelancers can accept the counter, or a client can hire a bid directly
- **Project lifecycle management** — once hired, gigs move through stages (`not_started → in_progress → submitted → changes_requested → completed`), with milestone tracking and submission notes
- **Real-time notifications** — Socket.IO pushes live updates for new bids, counter offers, hires, stage changes, and messages
- **In-app messaging** — per-gig chat thread between client and hired freelancer
- **Live search** — debounced gig search

## Tech Stack

**Frontend:** React 19, Vite, Tailwind CSS 4, Redux Toolkit, React Router 7, Framer Motion, Axios, Socket.IO client

**Backend:** Node.js, Express 5, MongoDB with Mongoose, Socket.IO, JWT, bcryptjs

**Deployment:** Vercel (frontend), Render (backend), MongoDB Atlas (database)

## Project Structure

```
GigFlow_fixed/
├── backend/
│   ├── config/          # MongoDB connection
│   ├── controllers/      # Route logic (auth, gigs, bids, messages, notifications)
│   ├── middleware/        # JWT auth middleware
│   ├── models/            # Mongoose schemas (User, Gig, Bid, Message, Notification)
│   ├── routes/            # Express route definitions
│   ├── socket/             # Socket.IO server setup
│   ├── app.js               # Express app config (CORS, middleware, routes)
│   └── server.js             # Entry point — starts HTTP + Socket.IO server
└── frontend/
    ├── src/
    │   ├── api/            # Axios instance
    │   ├── components/      # Reusable UI components
    │   ├── context/          # React context providers
    │   ├── pages/              # Route-level pages (Login, Register, Dashboards, GigDetails, etc.)
    │   └── socket.js            # Socket.IO client instance
    └── vercel.json               # SPA rewrite rules for client-side routing
```

## Getting Started Locally

### Prerequisites
- Node.js (v18+)
- A MongoDB connection string (local MongoDB or MongoDB Atlas)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/GigFlow.git
cd GigFlow_fixed
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create a `.env` file in `backend/` (see `.env.example`):
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/GigFlow
JWT_SECRET=your_long_random_secret
CLIENT_URL=http://localhost:5173
```

Run the server:
```bash
node server.js
```

### 3. Frontend setup
```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:
```
VITE_API_URL=http://localhost:5000
```

Run the dev server:
```bash
npm run dev
```

Visit `http://localhost:5173`.

## API Overview

| Route | Description |
|---|---|
| `POST /api/auth/register` | Create a new account (client or freelancer) |
| `POST /api/auth/login` | Log in, sets JWT cookie |
| `GET /api/auth/me` | Get current logged-in user |
| `POST /api/auth/logout` | Clear auth cookie |
| `GET /api/gigs` | List open gigs |
| `GET /api/gigs/freelancer` | Get gigs assigned to the logged-in freelancer |
| `POST /api/gigs` | Create a new gig (client only) |
| `DELETE /api/gigs/:id` | Delete a gig |
| `PATCH /api/gigs/:id/start` | Move gig to in-progress |
| `POST /api/gigs/:id/milestones` | Add a milestone |
| `PATCH /api/gigs/:id/milestones/:milestoneId` | Toggle milestone done state |
| `POST /api/gigs/:id/submit` | Submit completed work |
| `PATCH /api/gigs/:id/approve` | Approve submitted work |
| `PATCH /api/gigs/:id/request-changes` | Request changes on submitted work |
| `POST /api/bids` | Place a bid on a gig |
| `GET /api/bids/:gigId` | Get all bids for a gig |
| `GET /api/bids/me` | Get bids placed by the logged-in freelancer |
| `PATCH /api/bids/:bidId/hire` | Hire a freelancer directly from their bid |
| `PATCH /api/bids/:bidId/counter` | Counter a bid with a different price |
| `PATCH /api/bids/:bidId/accept` | Freelancer accepts a countered bid |
| `GET /api/messages/:gigId` | Get chat messages for a gig |
| `POST /api/messages` | Send a chat message |
| `GET /api/notifications/me` | Get notifications for the logged-in user |
| `PATCH /api/notifications/:id/read` | Mark one notification as read |
| `PATCH /api/notifications/read-all` | Mark all notifications as read |

## Deployment Notes

- **Backend (Render):** root directory `backend`, start command `node server.js`. Requires `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (set to the deployed frontend URL, no trailing slash), and `NODE_ENV=production` (needed for cross-domain auth cookies to work correctly between Vercel and Render).
- **Frontend (Vercel):** root directory `frontend`, requires `VITE_API_URL` set to the deployed backend URL. Includes a `vercel.json` rewrite rule so client-side routes don't 404 on refresh.

## License

ISC