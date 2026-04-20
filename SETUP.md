# SmartSeason Setup Guide

Step-by-step setup for the PostgreSQL-backed SmartSeason environment.

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 14+

Verify:

```bash
node --version
npm --version
psql --version
```

## 1. Backend Setup

```bash
cd smartseason-backend
npm install
```

Create or edit `.env`:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smartseason?schema=public
JWT_SECRET=change-me
JWT_EXPIRATION=24h
FRONTEND_URL=http://localhost:4400
```

Run Prisma pipeline:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Start backend:

```bash
npm run dev
```

Backend endpoints:

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api/docs`

## 2. Frontend Setup

```bash
cd ../smartseason-frontend
npm install
npm start
```

Frontend URL:

- `http://localhost:4400`

## 3. Quick API Test

Login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smartseason.com","password":"Admin@123"}'
```

Fields list (replace token):

```bash
curl -X GET http://localhost:3000/api/fields \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Seeded Credentials

- `admin@smartseason.com` / `Admin@123`
- `agent1@smartseason.com` / `Agent@123`
- `agent2@smartseason.com` / `Agent@123`

## Troubleshooting

### PostgreSQL Auth Failure

If Prisma returns `P1000`, your `DATABASE_URL` credentials are incorrect.

1. Confirm username/password by logging into PostgreSQL.
2. Ensure database `smartseason` exists.
3. Update `.env` and rerun:

```bash
npm run prisma:migrate
npm run prisma:seed
```

### Port 3000 In Use

Change `PORT` in `.env` or stop the existing process.

### Build Artifacts

If you suspect stale output:

```bash
npm run clean
npm run build
```

## Next Steps

1. **Explore Swagger Docs**: http://localhost:3000/api/docs
2. **Create Multiple Users**: Admin, Coordinator, and Agent accounts
3. **Create Fields**: Add test fields and assign to agents
4. **Test Workflows**: Field creation, updating, status tracking
5. **Build Custom Components**: Add UI for dashboards and field management

## Production Deployment

See the main [README.md](README.md) for production deployment instructions.

---

**Having issues?** Check the backend and frontend READMEs in their respective directories for more detailed troubleshooting.
