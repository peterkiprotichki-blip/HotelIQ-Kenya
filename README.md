# SmartSeason Field Monitoring System

SmartSeason is a crop field monitoring platform that helps teams track field progress, assign agents, capture updates, and review risk-focused insights across a growing season.

## Live Deployment

- Frontend: https://smartseason-frontend.onrender.com
- Backend API: https://smartseason-backend-46ch.onrender.com/api

## Demo Credentials

- Admin: admin@smartseason.com / Admin@123
- Agent 1: agent1@smartseason.com / Agent@123
- Agent 2: agent2@smartseason.com / Agent@123

## Tech Stack

- Frontend: Angular 17, Tailwind CSS
- Backend: NestJS 10, Prisma ORM
- Database: PostgreSQL
- Authentication: JWT (role-based access)
- AI Support: Gemini-powered field insights

## Core Features

- Role-based workflows (admin and agent)
- Field creation, assignment, and stage lifecycle tracking
- Field status monitoring (`active`, `at_risk`, `completed`)
- Notes and updates from assigned agents
- Dashboard-level reporting and AI-assisted insights

## Architecture Overview

- `smartseason-frontend`: Angular client application
- `smartseason-backend`: NestJS REST API and business logic
- `smartseason-backend/prisma`: schema, migrations, and seed data

The frontend consumes backend endpoints under `/api`, while the backend handles authentication, authorization, field management, and reporting.

## Design Decisions

- Monorepo structure for shared project management and deployment consistency
- Prisma + PostgreSQL for predictable relational modeling and migrations
- JWT authentication with role checks to protect admin-only actions
- Seeded demo users to simplify evaluation and testing
- AI insights isolated behind API endpoints to keep UI logic clean

## Assumptions

- At least one admin user exists to manage fields and users
- Agents primarily work on assigned fields
- Demo credentials are acceptable for assessment review
- Render free-tier deployment is sufficient for functional evaluation

## Local Run Instructions

1. Start backend

```bash
cd smartseason-backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

2. Start frontend

```bash
cd smartseason-frontend
npm install
npm start
```

3. Local URLs

- Frontend: http://localhost:4400
- Backend: http://localhost:3000/api

## Key API Endpoints

- `POST /api/auth/login`
- `GET /api/auth/profile`
- `GET /api/fields`
- `POST /api/fields`
- `PUT /api/fields/:id`
- `GET /api/fields/stats`
- `POST /api/fields/:id/ai/insights`
