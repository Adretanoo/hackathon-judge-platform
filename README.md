# Hackathon Judge Platform

> **Automated hackathon evaluation & judging REST API**  
> Built with Node.js 20 · Fastify · TypeScript · Prisma · PostgreSQL · Redis

---

## 🚀 Quick Start

### 1. Clone & install dependencies
```bash
cd hackathon-judge-platform
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET at a minimum
```

### 3. Set up the database
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Start the dev server
```bash
npm run dev
```

The server starts at **http://localhost:3000**.

| Endpoint | Description |
|---|---|
| `GET /health` | Liveness probe |
| `GET /health/ready` | Readiness probe (DB + Redis) |
| `GET /documentation` | Swagger / OpenAPI UI |
| `POST /api/v1/auth/register` | Register account |
| `POST /api/v1/auth/login` | Login |
| `POST /api/v1/auth/refresh` | Refresh tokens |
| `GET /api/v1/auth/me` | Current user profile |

---

## 🗂️ Project Structure

```
src/
├── config/          # Env validation (Zod), centralised config
├── plugins/         # Fastify plugins (CORS, JWT, Prisma, Swagger, …)
├── routes/          # Route definitions with OpenAPI schemas
├── controllers/     # Thin request/response handlers
├── services/        # Business logic
├── schemas/         # Zod validation schemas
├── utils/           # logger, errors, response helpers
├── middleware/       # requireRole RBAC factory
├── types/           # Shared TypeScript types & enums
└── server.ts        # Entry point

prisma/
└── schema.prisma    # Full database schema

tests/
└── health.test.ts   # Integration tests
```

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Fastify 4 |
| Language | TypeScript 5 (strict mode) |
| ORM | Prisma 5 |
| Database | PostgreSQL 15 |
| Cache | Redis 7 (ioredis) |
| Auth | JWT (@fastify/jwt) |
| Validation | Zod |
| Docs | @fastify/swagger + @fastify/swagger-ui |
| Logging | Pino |
| Testing | Jest + ts-jest |

---

## 📋 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot-reload |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Start compiled production server |
| `npm test` | Run test suite |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run typecheck` | Type-check without emitting |
| `npm run lint` | Lint source files |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio |

---

## 🔐 Authentication

The API uses **JWT Bearer tokens**.

1. Register → `POST /api/v1/auth/register`
2. Login → `POST /api/v1/auth/login` → receive `{ accessToken, refreshToken }`
3. Add header: `Authorization: Bearer <accessToken>`
4. Refresh → `POST /api/v1/auth/refresh`

Token lifetimes are controlled by `JWT_EXPIRES_IN` and `JWT_REFRESH_EXPIRES_IN` in `.env`.

---

## 🗄️ Database Schema

```
User ─┬─< JudgeAssignment >─ Hackathon ─┬─< Project ─< Score
      │                                  └─< Criteria ─<┘
      └──────────────────────────────────────────────────┘
```

---

## 🔄 Planned Modules (Phase 2)

- **Hackathons** — CRUD, status transitions, participant registration
- **Projects** — submissions, team management, file uploads
- **Criteria** — per-hackathon scoring rubrics & weights
- **Scores** — judge submissions, aggregation, weighted totals
- **Leaderboard** — real-time ranked results with caching
- **Users** — admin user management, role assignment
- **AI Scoring** — GPT-assisted automatic evaluation (optional)

---

## 📄 License

MIT
