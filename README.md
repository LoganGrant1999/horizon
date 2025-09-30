# Health Heatmap Tracker

A HIPAA-light health tracking application for visualizing daily wellness metrics.

## Tech Stack

### Frontend
- React + TypeScript + Vite
- TailwindCSS + shadcn/ui
- Zustand (state management)
- React Router
- React Query

### Backend
- Node + TypeScript
- Fastify
- PostgreSQL via Prisma
- Passport (OAuth)
- HttpOnly cookies (SameSite=Lax)

### Infrastructure
- Docker Compose
- PostgreSQL
- MinIO (S3-compatible storage)

## Prerequisites

- Node.js >= 20
- npm >= 10
- Docker & Docker Compose

## Local Development Setup

### 1. Clone and Install

```bash
cd horizon
npm install
```

### 2. Set Up Environment Variables

```bash
# Copy example env files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
```

Edit the `.env` files if needed (defaults work for local dev).

### 3. Start Infrastructure with Docker Compose

```bash
docker compose up
```

This will start:
- **PostgreSQL** on `localhost:5432`
- **MinIO** on `localhost:9000` (Console: `localhost:9001`)
- **API** on `localhost:4000`
- **Web** on `localhost:5173`

### 4. Initialize Database (First Time Only)

```bash
npm run prisma:migrate
```

Or manually:

```bash
cd apps/api
npx prisma migrate dev
```

### 5. Access the Application

- **Web App**: http://localhost:5173
- **API**: http://localhost:4000
- **MinIO Console**: http://localhost:9001 (user: `minioadmin`, pass: `minioadmin`)

## Development Workflow

### Run All Services

```bash
docker compose up
```

### Run Individual Services (without Docker)

```bash
# Terminal 1 - Start database & MinIO
docker compose up db minio

# Terminal 2 - Run API
cd apps/api
npm run dev

# Terminal 3 - Run Web
cd apps/web
npm run dev
```

### Database Commands

```bash
# Generate Prisma client
npm run prisma:generate

# Create migration
cd apps/api
npx prisma migrate dev --name migration_name

# Open Prisma Studio
npm run prisma:studio
```

### Testing

```bash
# Run all tests
npm test

# Test specific workspace
cd apps/api && npm test
cd apps/web && npm test
```

### Linting & Formatting

```bash
# Lint all workspaces
npm run lint

# Format all files
npm run format
```

## Project Structure

```
horizon/
├── apps/
│   ├── api/              # Fastify backend
│   │   ├── prisma/       # Database schema & migrations
│   │   ├── src/
│   │   │   ├── routes/   # API routes
│   │   │   ├── lib/      # Utilities (db, auth, s3)
│   │   │   └── index.ts  # Server entry
│   │   └── Dockerfile
│   └── web/              # React frontend
│       ├── src/
│       │   ├── pages/    # Route pages
│       │   ├── store/    # Zustand stores
│       │   └── main.tsx  # App entry
│       └── Dockerfile
├── packages/
│   ├── config/           # Shared ESLint, Prettier, TS configs
│   └── ui/               # Shared UI components (shadcn)
├── docker-compose.yml
└── package.json
```

## Database Schema

### User
- Email/password authentication
- Google OAuth support
- Session management (7-day expiry)

### Entry
- Daily health metrics: mood, energy, sleep
- Optional notes and image attachments
- Unique constraint per user per date

## Authentication

- Email/password signup/login
- Google OAuth (configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`)
- HttpOnly cookies with SameSite=Lax
- 7-day session expiry

## API Endpoints

### Auth
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out
- `GET /api/auth/me` - Get current user

### Entries
- `POST /api/entries` - Create entry
- `GET /api/entries` - List entries
- `GET /api/entries/:id` - Get entry
- `PATCH /api/entries/:id` - Update entry
- `DELETE /api/entries/:id` - Delete entry

## Environment Variables

See `.env.example` and `apps/api/.env.example` for all available configuration options.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secret for session cookies
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth credentials
- `S3_*` - MinIO/S3 configuration

## Production Deployment

1. Set strong `SESSION_SECRET`
2. Configure Google OAuth credentials
3. Use managed PostgreSQL (not Docker)
4. Use managed S3 or MinIO cluster
5. Set `NODE_ENV=production`
6. Enable HTTPS and update CORS settings

## Troubleshooting

### Port conflicts
If ports are already in use, update the port mappings in `docker-compose.yml`.

### Database connection issues
Ensure PostgreSQL is healthy: `docker compose ps`

### Prisma issues
Regenerate client: `npm run prisma:generate`

### Clear everything
```bash
docker compose down -v
npm run clean
npm install
```

## License

MIT