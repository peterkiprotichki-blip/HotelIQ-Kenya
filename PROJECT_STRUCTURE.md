# SmartSeason Project - Current Structure

This project is split into backend and frontend apps, with PostgreSQL handled through Prisma.

## Root

```
SmartSeason/
├── README.md
├── SETUP.md
├── PROJECT_STRUCTURE.md
├── smartseason-backend/
└── smartseason-frontend/
```

## Backend (`smartseason-backend`)

```
smartseason-backend/
├── prisma/
│   ├── schema.prisma
│   └── seed.js
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   ├── prisma.service.ts
│   │   └── prisma-mappers.ts
│   └── modules/
│       ├── auth/
│       ├── fields/
│       ├── tenants/
│       └── database/
├── package.json
├── tsconfig.json
└── .env
```

### Backend Notes

- Data layer: Prisma Client against PostgreSQL
- Auth: JWT + role guards
- Seed: `prisma/seed.js` via `npm run prisma:seed`
- Build output: `dist/`

## Frontend (`smartseason-frontend`)

```
smartseason-frontend/
├── src/
│   ├── main.ts
│   ├── index.html
│   ├── styles.scss
│   ├── app/
│   │   ├── app.module.ts
│   │   ├── app-routing.module.ts
│   │   ├── layout/
│   │   ├── modules/
│   │   └── shared/
│   └── environments/
├── angular.json
├── package.json
└── tsconfig.json
```

### Frontend Notes

- Angular 17 app with module-based feature organization
- API calls target backend `/api` routes

## Runtime/Build Artifacts

- `node_modules/` is dependency output
- `dist/` is TypeScript build output
- `dist/tsconfig.tsbuildinfo` may contain non-runtime metadata tokens from TypeScript's incremental cache
