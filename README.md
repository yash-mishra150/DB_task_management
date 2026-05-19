# Team Task Manager

A full-stack web app for managing projects and tasks with role-based access.

## Stack

- **Next.js 14** — frontend + API routes
- **SQLite** (`better-sqlite3`) — database stored in `db/app.db`
- **JWT** (`jose`) — auth via httpOnly cookies
- **Tailwind CSS** — styling

## Features

- Signup / Login
- Create projects — creator becomes admin automatically
- Invite members by email (admin or member role)
- Create, assign, and track tasks with due dates
- Members can update task status; admins have full control
- Dashboard with task stats and overdue highlighting

## Getting Started

```bash
npm install
cp .env.local .env.local   # already has a default JWT_SECRET
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET/POST | `/api/projects` | List / create projects |
| GET/PUT/DELETE | `/api/projects/:id` | Get / update / delete project |
| POST/DELETE | `/api/projects/:id/members` | Add / remove member |
| GET/POST | `/api/projects/:id/tasks` | List / create tasks |
| PUT/DELETE | `/api/tasks/:id` | Update / delete task |
| GET | `/api/dashboard` | Stats for current user |

## Deployment on Railway

1. Push to GitHub
2. Create a new Railway project → Deploy from GitHub repo
3. Set environment variable: `JWT_SECRET=<your-secret>`
4. Add a Railway Volume and mount it at `/app/db` for SQLite persistence
5. Set start command: `npm start`

## Role-Based Access

| Action | Admin | Member |
|--------|-------|--------|
| Create/delete project | ✓ | — |
| Add/remove members | ✓ | — |
| Create/delete tasks | ✓ | — |
| Update task status | ✓ | ✓ |
| View project & tasks | ✓ | ✓ |
