# HotelIQ Kenya

AI-powered lodge revenue platform for the Kenyan hospitality market. Helps hotel and lodge owners manage properties, rooms, bookings, and optimize revenue with AI-driven dynamic pricing.

## Tech Stack

- Frontend: Angular 17, Tailwind CSS, Chart.js, jsPDF
- Backend: NestJS 10, Prisma ORM
- Database: PostgreSQL
- Authentication: JWT (role-based access), Google OAuth 2.0
- AI Pricing: Google Gemini API (gemini-2.0-flash)

## Core Features

- Property and lodge management with county-level Kenyan geography
- Room management with configurable types, pricing, capacity, and amenities
- Full booking lifecycle (confirmed, checked-in, checked-out, cancelled, no-show)
- AI-powered dynamic pricing based on occupancy, day-of-week, seasonality, and nearby events
- Kenyan events database with geographic demand impact for pricing
- Dashboard analytics (occupancy rates, revenue metrics, booking trends)
- Booking calendar with daily overview
- Public booking portal for direct guest reservations
- Event ticketing for local Kenyan events
- Role-based access control (super_admin, admin, agent, tenant)
- PDF report export

## Architecture Overview

- `hotel-IQ kenya-frontend`: Angular client application
- `hotel-IQ kenya-backend`: NestJS REST API and business logic
- `hotel-IQ kenya-backend/prisma`: schema, migrations, and seed data

The frontend consumes backend endpoints under `/api`, while the backend handles authentication, authorization, property management, booking workflows, and AI pricing.

## Design Decisions

- Monorepo structure for shared project management and deployment consistency
- Prisma + PostgreSQL for predictable relational modeling and migrations
- JWT authentication with role checks to protect admin-only actions
- Google Gemini for natural-language pricing reasoning alongside deterministic rules
- Geo-aware event discovery using Haversine distance for localized demand signals
- Seeded demo users and properties to simplify evaluation and testing

## Assumptions

- One property/lodge per owner in MVP
- Render free-tier deployment is sufficient for functional evaluation
- Kenyan event data influences room demand and pricing

## Local Run Instructions

1. Start backend

```bash
cd hotel-IQ kenya-backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

2. Start frontend

```bash
cd hotel-IQ kenya-frontend
npm install
npm start
```

3. Local URLs

- Frontend: http://localhost:4400
- Backend: http://localhost:3000/api
- Swagger Docs: http://localhost:3000/docs

## Key API Endpoints

- `POST /api/auth/login`
- `GET /api/auth/profile`
- `GET /api/properties`
- `POST /api/properties`
- `PUT /api/properties/:id`
- `GET /api/rooms`
- `POST /api/rooms`
- `PUT /api/rooms/:id`
- `GET /api/bookings`
- `POST /api/bookings`
- `PUT /api/bookings/:id`
- `GET /api/dashboard/occupancy`
- `GET /api/dashboard/revenue`
- `GET /api/pricing-ai/suggestions`
- `POST /api/pricing-ai/suggestions`
- `GET /api/events`
- `GET /api/public/properties`
- `POST /api/public/bookings`
