# Starting the Health Heatmap Tracker

## Prerequisites
1. **Docker Desktop** - Required for PostgreSQL and MinIO
2. **Node.js 18+** - For running the applications
3. **OpenAI API Key** (optional) - For AI journal parsing

## Quick Start

### 1. Start Docker Services
```bash
cd /Users/logangrant/Desktop/strat/horizon
docker compose up -d
```

This starts:
- PostgreSQL on port 5432
- MinIO (S3-compatible storage) on port 9000

### 2. Run Database Migrations
```bash
cd apps/api
npm run prisma:migrate
```

### 3. (Optional) Seed Demo Data
```bash
cd apps/api
npm run prisma:seed
```

This creates a demo user:
- Email: demo@healthheatmap.com
- Password: demo1234

### 4. Start the API Server
```bash
cd apps/api
npm run dev
```

API will run on http://localhost:4000

### 5. Start the Web Frontend
Open a new terminal:
```bash
cd apps/web
npm run dev
```

Frontend will run on http://localhost:5173

## Access the Application

1. Open http://localhost:5173
2. Sign up for a new account OR login with demo credentials
3. Check "Load Sample Profile" during onboarding for instant demo data

## Optional: Configure OpenAI for AI Journal Parsing

Add your OpenAI API key to `apps/api/.env`:
```
OPENAI_API_KEY=sk-your-key-here
```

## Optional: Configure PostHog Analytics

Add your PostHog key to `apps/web/.env`:
```
VITE_POSTHOG_KEY=your-posthog-key
```

## Stopping Services

```bash
# Stop Docker services
docker compose down

# Stop API and Web (Ctrl+C in their terminals)
```

## Troubleshooting

### Database Connection Error
- Ensure Docker is running: `docker ps`
- Check PostgreSQL is accessible: `docker compose logs db`

### MinIO Access Issues
- MinIO console: http://localhost:9000
- Login: minioadmin / minioadmin
- Create bucket named `health-heatmap` if it doesn't exist

### API Won't Start
- Check if port 4000 is available
- Ensure .env file exists in apps/api/

### Frontend Build Errors
- Run `npm install` in apps/web/
- Clear cache: `rm -rf node_modules/.vite`

## Development URLs

- **Frontend**: http://localhost:5173
- **API**: http://localhost:4000
- **MinIO Console**: http://localhost:9000
- **PostgreSQL**: localhost:5432

## Features to Try

1. **Quick Add** - Dashboard has buttons for Symptom/Vital/Activity/Note
2. **Journal with AI** - Write natural language, AI extracts structured data
3. **Body Map** - Visual heatmap of symptoms by body region
4. **Medications** - Add prescriptions with photo upload
5. **Generate Report** - PDF export of health data for your doctor