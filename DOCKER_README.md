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
- **Frontend**: SolidJS/Vite development server on port 5173 with hot reloading
- **Backend**: Express API server on port 3000
- **Supabase**: Local PostgreSQL database on port 5432

The frontend automatically proxies API calls to the backend service.

**Note**: Supabase Studio is not included in the Docker setup. Use the hosted Supabase Studio at https://supabase.com/dashboard or run it locally if needed.

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

### Frontend Service
- **Development**: Runs `npm run dev:vite` with hot reloading
- **Ports**: 5173
- **Proxies API calls** to backend service

### Backend Service
- **Development**: Runs `npm run dev:server`
- **Production**: Built into single container
- **Ports**: 3000

### Supabase Service
- **Image**: supabase/postgres:15.1.0.147
- **Ports**: 5432
- **Database**: postgres
- **Password**: postgres

### Supabase Database
- **Ports**: 5432
- **Access**: Use your preferred PostgreSQL client or Supabase Studio (hosted)

## SSL Configuration (Production)

For HTTPS in production, place your SSL certificates in the `ssl/` directory and update the nginx configuration.

## Troubleshooting

1. **Port conflicts**: Ensure ports 3000, 5173, 5432, 3001 are available
2. **Environment variables**: Check that `.env` file exists and contains required variables
3. **Build issues**: Try `docker-compose build --no-cache`
4. **Database connection**: Use Supabase Studio at http://localhost:3001 to manage local database

### Dokploy Specific Issues

**Port Allocation Failed**: If you see "Bind for 0.0.0.0:3000 failed: port is already allocated":

1. **Stop existing containers**:
   ```bash
   # In Dokploy dashboard, go to your project
   # Click the "Stop" button on the running deployment
   # Or use the terminal: docker stop $(docker ps -q --filter ancestor=webapps-acceleratorstack-iojtp4-app)
   ```

2. **Change port mapping** in Dokploy:
   - Go to your project settings
   - Under "Domains" or "Ports", change the external port from 3000 to something else (e.g., 3002)
   - Or set it to automatic port assignment

3. **Wait for cleanup**: Dokploy may take a few minutes to clean up old containers

4. **Force rebuild**: In Dokploy, use "Rebuild deployment" with "Force rebuild" option

**Build Cache Issues**: If changes aren't reflected:
- Use "Rebuild deployment" with cache clearing
- Check that your latest commits are deployed
- Verify environment variables are set in Dokploy dashboard

## Local Development Without Docker

If you prefer not to use Docker for development:

```bash
npm install
npm run dev
```

This will start the development servers directly on your machine.