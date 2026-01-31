# Dokploy Deployment Guide

This guide helps you deploy Accelerator AI on Dokploy with Traefik.

## Prerequisites

- Dokploy installed and running
- Traefik configured as the reverse proxy
- Domain name pointed to your server

## Environment Configuration

Update `docker/.env` with your settings:

```env
# Server Configuration
PORT=3001
NODE_ENV=production
ENVIRONMENT=production
BUILD_TARGET=production
APP_PORT=3001

# AI API (Required)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# SSL Configuration (optional - for HTTPS)
# SSL_KEY_PATH=/app/ssl/key.pem
# SSL_CERT_PATH=/app/ssl/cert.pem
```

## Traefik Labels Configuration

The following labels are pre-configured in `docker-compose.yml`:

```yaml
labels:
  - 'traefik.enable=true'
  - 'traefik.docker.network=dokploy-network'
  - 'traefik.http.routers.accelerator.rule=Host(`your-domain.com`)'
  - 'traefik.http.routers.accelerator.entrypoints=https'
  - 'traefik.http.routers.accelerator.tls.certresolver=letsencrypt'
  - 'traefik.http.services.accelerator.loadbalancer.server.port=3001'
  - 'traefik.http.routers.accelerator-http.rule=Host(`your-domain.com`)'
  - 'traefik.http.routers.accelerator-http.entrypoints=http'
  - 'traefik.http.routers.accelerator-http.middlewares=redirect-to-https'
  - 'traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https'
```

## Deployment Steps

### Option 1: Docker Compose (Manual)

1. SSH into your server
2. Navigate to your project directory
3. Update `docker/.env` with your configuration
4. Update Traefik labels with your domain name
5. Run:

```bash
docker compose -f docker/docker-compose.yml --env-file docker/.env up -d
```

### Option 2: Dokploy Dashboard

1. Open Dokploy dashboard (usually at `https://dokploy.your-domain.com`)
2. Create a new application
3. Choose **Docker Compose** deployment type
4. Copy the contents of `docker/docker-compose.yml`
5. Set environment variables in Dokploy
6. Deploy

## Traefik Labels Reference

Replace `your-domain.com` with your actual domain:

| Label                                                        | Purpose                          |
| ------------------------------------------------------------ | -------------------------------- |
| `traefik.enable`                                             | Enable Traefik for this service  |
| `traefik.docker.network`                                     | Network Traefik uses for routing |
| `traefik.http.routers.accelerator.rule`                      | Route rule (domain matching)     |
| `traefik.http.routers.accelerator.entrypoints`               | HTTPS entrypoint                 |
| `traefik.http.routers.accelerator.tls.certresolver`          | Let's Encrypt resolver           |
| `traefik.http.services.accelerator.loadbalancer.server.port` | Container port (3001)            |
| `traefik.http.routers.accelerator-http`                      | HTTP to HTTPS redirect           |

## Port Configuration

- **Container Port**: 3001 (defined by PORT env var)
- **Host Port**: 3001 (defined by APP_PORT env var)
- **Vite Dev Server**: 5173 (development only)
- **Dokploy UI**: 3000 (dokploy itself)

## Health Check

The application includes a health check endpoint:

- Endpoint: `/api/health`
- Interval: 30s
- Timeout: 10s
- Retries: 3

## Troubleshooting

### Application not accessible

1. Check container logs: `docker logs accelerator-prod`
2. Verify Traefik labels include correct domain
3. Ensure dokploy-network exists: `docker network ls`

### Port conflicts

1. Ensure no other service uses port 3001
2. Update PORT and APP_PORT in `docker/.env`

### Environment variables not loading

1. Verify `docker/.env` file exists
2. Check docker-compose uses correct env file: `--env-file docker/.env`

## Useful Commands

```bash
# View logs
docker compose -f docker/docker-compose.yml logs -f

# Restart service
docker compose -f docker/docker-compose.yml restart

# Stop service
docker compose -f docker/docker-compose.yml down

# Rebuild and deploy
docker compose -f docker/docker-compose.yml up -d --build

# Check health status
curl http://localhost:3001/api/health
```

## SSL Certificates

Dokploy with Traefik automatically manages SSL via Let's Encrypt. Ensure:

- DNS A record points to your server IP
- Port 80 and 443 are accessible from internet
- Traefik certresolver is configured (`letsencrypt`)
