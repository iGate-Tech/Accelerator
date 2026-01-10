# Docker Setup for Accelerator

This project includes Docker Compose configurations for both development and production environments.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose V2

## Development Setup

For development with hot reloading and local Supabase:

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# Or use the shorthand
make dev
```

This will start:
- **App**: SolidJS/Vite development server on port 5173, Express API on port 3000
- **Supabase**: Local PostgreSQL database on port 5432
- **Supabase Studio**: Web UI on port 3001

## Production Setup

For production deployment:

```bash
# Build and start production environment
docker-compose -f docker-compose.prod.yml up --build -d

# Or use the shorthand
make prod
```

This will start:
- **App**: Production build served by Express on port 3000
- **Nginx**: Reverse proxy on ports 80/443

## Environment Variables

Create a `.env` file in the root directory with your configuration:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenRouter API (for LLM features)
OPENROUTER_API_KEY=your_openrouter_api_key

# Other configuration
NODE_ENV=development|production
```

## Available Commands

```bash
# Development
docker-compose -f docker-compose.dev.yml up --build    # Start dev environment
docker-compose -f docker-compose.dev.yml down          # Stop dev environment
docker-compose -f docker-compose.dev.yml logs          # View logs

# Production
docker-compose -f docker-compose.prod.yml up --build -d  # Start prod environment
docker-compose -f docker-compose.prod.yml down           # Stop prod environment
docker-compose -f docker-compose.prod.yml logs           # View logs

# Cleanup
docker system prune -a  # Remove unused containers and images
```

## Services

### App Service
- **Development**: Runs `npm run dev` with hot reloading
- **Production**: Runs `npm start` serving built static files
- **Ports**: 5173 (dev), 3000 (API)

### Supabase Service
- **Image**: supabase/postgres:15.1.0.147
- **Ports**: 5432
- **Database**: postgres
- **Password**: postgres

### Supabase Studio
- **Ports**: 3001
- **Access**: http://localhost:3001

## SSL Configuration (Production)

For HTTPS in production, place your SSL certificates in the `ssl/` directory and update the nginx configuration.

## Troubleshooting

1. **Port conflicts**: Ensure ports 3000, 5173, 5432, 3001 are available
2. **Environment variables**: Check that `.env` file exists and contains required variables
3. **Build issues**: Try `docker-compose build --no-cache`
4. **Database connection**: Use Supabase Studio at http://localhost:3001 to manage local database

## Local Development Without Docker

If you prefer not to use Docker for development:

```bash
npm install
npm run dev
```

This will start the development servers directly on your machine.