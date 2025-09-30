# Horizon Health - Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- Environment variables configured
- PostgreSQL credentials
- MinIO/S3 credentials
- OpenAI API key

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database
POSTGRES_PASSWORD=your_secure_password

# MinIO/S3
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=your_secure_password

# API Configuration
NODE_ENV=production
DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/horizon
PORT=4000
WEB_URL=http://localhost

# Session
SESSION_SECRET=your_session_secret_minimum_32_characters
SESSION_MAX_AGE=604800000

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# S3/MinIO
S3_ENDPOINT=http://minio:9000
S3_BUCKET_NAME=horizon-health
S3_ACCESS_KEY=${MINIO_ROOT_USER}
S3_SECRET_KEY=${MINIO_ROOT_PASSWORD}
S3_REGION=us-east-1

# Monitoring (optional)
SENTRY_DSN=your_sentry_dsn
VITE_SENTRY_DSN=your_sentry_dsn
VITE_POSTHOG_KEY=your_posthog_key
VITE_POSTHOG_HOST=https://app.posthog.com
```

## Production Deployment

### 1. Build and Start Services

```bash
# Build all services
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check service health
docker-compose -f docker-compose.prod.yml ps
```

### 2. Database Migrations

Migrations run automatically when the API container starts. To run manually:

```bash
docker-compose -f docker-compose.prod.yml exec api npm run db:migrate
```

### 3. Initialize MinIO Bucket

```bash
# Access MinIO console at http://localhost:9001
# Login with MINIO_ROOT_USER and MINIO_ROOT_PASSWORD
# Create bucket named "horizon-health"
# Set bucket policy to public-read for /public/* prefix
```

### 4. Verify Deployment

- **Web App**: http://localhost:80
- **API**: http://localhost:4000
- **API Health**: http://localhost:4000/health
- **MinIO Console**: http://localhost:9001
- **Database**: localhost:5432

## Service Management

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f web
```

### Restart Services

```bash
# Restart all
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart api
```

### Stop Services

```bash
docker-compose -f docker-compose.prod.yml down

# With volume cleanup (WARNING: deletes all data)
docker-compose -f docker-compose.prod.yml down -v
```

## Scaling

### Horizontal Scaling

```bash
# Scale API instances
docker-compose -f docker-compose.prod.yml up -d --scale api=3

# Note: Add load balancer (nginx/traefik) for multiple API instances
```

## Backup and Restore

### Database Backup

```bash
# Backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U postgres horizon > backup-$(date +%Y%m%d).sql

# Restore
docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres horizon < backup.sql
```

### MinIO Backup

```bash
# Export MinIO data
docker-compose -f docker-compose.prod.yml exec minio mc mirror /data /backup
```

## Monitoring

### Health Checks

All services have health checks configured:

- **API**: `GET /health` (every 30s)
- **Database**: `pg_isready` (every 10s)
- **MinIO**: `GET /minio/health/live` (every 30s)

### Check Health Status

```bash
docker-compose -f docker-compose.prod.yml ps
```

## Troubleshooting

### API Won't Start

1. Check logs: `docker-compose -f docker-compose.prod.yml logs api`
2. Verify DATABASE_URL is correct
3. Ensure database migrations completed
4. Check database connectivity: `docker-compose -f docker-compose.prod.yml exec api wget -O- http://localhost:4000/health`

### Database Connection Issues

1. Verify database is running: `docker-compose -f docker-compose.prod.yml ps db`
2. Check database logs: `docker-compose -f docker-compose.prod.yml logs db`
3. Test connection: `docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d horizon -c "SELECT 1"`

### MinIO Connection Issues

1. Check MinIO is running: `docker-compose -f docker-compose.prod.yml ps minio`
2. Verify bucket exists and has correct permissions
3. Check S3_ENDPOINT matches MinIO service name

## Security Best Practices

1. **Change Default Credentials**: Update all passwords and secrets
2. **Use HTTPS**: Configure SSL/TLS certificates (use Traefik or nginx proxy)
3. **Firewall Rules**: Restrict access to sensitive ports
4. **Rate Limiting**: Already configured (100 req/min)
5. **Regular Updates**: Keep Docker images and dependencies updated
6. **Backup Strategy**: Schedule regular database and MinIO backups
7. **Monitoring**: Set up logging aggregation (ELK, Loki) and metrics (Prometheus)

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build and push images
        run: |
          docker-compose -f docker-compose.prod.yml build
          docker-compose -f docker-compose.prod.yml push

      - name: Run migrations
        run: |
          docker-compose -f docker-compose.prod.yml run --rm api npm run db:migrate

      - name: Deploy
        run: |
          docker-compose -f docker-compose.prod.yml up -d
```

## Performance Optimization

1. **Database**:
   - Enable connection pooling
   - Add indexes for frequently queried columns
   - Regular VACUUM and ANALYZE

2. **API**:
   - Enable gzip compression
   - Configure caching headers
   - Use CDN for static assets

3. **MinIO**:
   - Enable versioning for important data
   - Configure lifecycle policies for old data

## Production Checklist

- [ ] Environment variables configured
- [ ] Database credentials secured
- [ ] MinIO bucket created and configured
- [ ] OpenAI API key added
- [ ] SSL/TLS certificates configured
- [ ] Firewall rules configured
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting set up
- [ ] Rate limiting tested
- [ ] Health checks verified
- [ ] Database migrations successful
- [ ] All services passing health checks