# SmartSeason - Field Monitoring System

SmartSeason is a web application for tracking crop progress across multiple fields during a growing season.

## Stack

- Backend: NestJS 10 + Prisma + PostgreSQL
- Frontend: Angular 17
- Auth: JWT + Passport
- AI: Gemini for field insights

## Core Features

- Role-based access (admin/coordinator/agent)
- Field creation, assignment, and lifecycle tracking
- Status insights (`active`, `at_risk`, `completed`)
- Agent updates and dashboard reporting

## Quick Start

1. Install backend dependencies:

```bash
cd smartseason-backend
npm install
```

2. Configure backend environment in `.env`:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smartseason?schema=public
JWT_SECRET=change-me
JWT_EXPIRATION=24h
FRONTEND_URL=http://localhost:4400
GEMINI_API_KEY=your-gemini-api-key
```

3. Run Prisma setup:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

4. Start backend:

```bash
npm run dev
```

5. Start frontend:

```bash
cd ../smartseason-frontend
npm install
npm start
```

Backend URL: `http://localhost:3000`
Frontend URL: `http://localhost:4400`

## Demo Users

Prisma seed creates default users (upsert by email):

- `admin@smartseason.com` / `Admin@123`
- `agent1@smartseason.com` / `Agent@123`
- `agent2@smartseason.com` / `Agent@123`

You can override users with `SEED_USERS_JSON` in backend `.env`.

## Main API Endpoints

- `POST /api/auth/login`
- `GET /api/auth/profile`
- `GET /api/auth/users`
- `GET /api/fields`
- `POST /api/fields`
- `PUT /api/fields/:id`
- `GET /api/fields/stats`
- `POST /api/fields/:id/ai/insights`

## Notes

- Source code uses Prisma with PostgreSQL.
