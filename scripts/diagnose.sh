#!/bin/bash

# Dokploy Deployment Diagnostic Script
# Run this on your server to diagnose deployment issues

echo "========================================="
echo "Dokploy Deployment Diagnostic Tool"
echo "========================================="
echo ""

# Check if Docker is running
echo "[1/8] Checking Docker status..."
if docker ps > /dev/null 2>&1; then
    echo "✓ Docker is running"
else
    echo "✗ Docker is not running or not accessible"
    exit 1
fi

# Check if accelerator container is running
echo ""
echo "[2/8] Checking accelerator container..."
if docker ps | grep -q accelerator; then
    echo "✓ Accelerator container is running"
    CONTAINER_ID=$(docker ps -q -f name=accelerator)
    echo "  Container ID: $CONTAINER_ID"
else
    echo "✗ Accelerator container is NOT running"
    echo ""
    echo "Checking stopped containers..."
    docker ps -a | grep accelerator || echo "No accelerator container found"
    echo ""
    echo "To start the container, run:"
    echo "  docker compose -f docker/docker-compose.dokploy.yml up -d"
fi

# Check dokploy-network
echo ""
echo "[3/8] Checking dokploy-network..."
if docker network ls | grep -q dokploy-network; then
    echo "✓ dokploy-network exists"
    docker network inspect dokploy-network --format='  Subnet: {{.IPAM.Config}}' || echo "  (No subnet info available)"
else
    echo "✗ dokploy-network does NOT exist"
    echo ""
    echo "Creating dokploy-network..."
    docker network create dokploy-network && echo "✓ dokploy-network created" || echo "✗ Failed to create network"
fi

# Check container network connectivity
echo ""
echo "[4/8] Checking container network connectivity..."
if docker ps | grep -q accelerator; then
    if docker inspect accelerator-prod --format='{{range $key, $value := .NetworkSettings.Networks}}{{$key}} {{end}}' | grep -q dokploy-network; then
        echo "✓ Container is connected to dokploy-network"
    else
        echo "✗ Container is NOT connected to dokploy-network"
        echo "  Connected networks: $(docker inspect accelerator-prod --format='{{range $key, $value := .NetworkSettings.Networks}}{{$key}} {{end}}')"
    fi
else
    echo "⊘ Skipping - container not running"
fi

# Check health endpoint from inside container
echo ""
echo "[5/8] Checking health endpoint from inside container..."
if docker ps | grep -q accelerator; then
    HEALTH_RESULT=$(docker exec accelerator-prod curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>&1 || echo "failed")
    if [ "$HEALTH_RESULT" = "200" ]; then
        echo "✓ Health endpoint returns 200 OK"
    else
        echo "✗ Health endpoint returned: $HEALTH_RESULT"
        echo "  Running health check for details:"
        docker exec accelerator-prod curl -s http://localhost:3001/api/health || echo "  Connection failed"
    fi
else
    echo "⊘ Skipping - container not running"
fi

# Check container logs for errors
echo ""
echo "[6/8] Checking recent container logs..."
if docker ps | grep -q accelerator; then
    echo "Last 10 log lines:"
    docker logs --tail 10 accelerator-prod 2>&1
else
    echo "⊘ Skipping - container not running"
fi

# Check port bindings
echo ""
echo "[7/8] Checking port bindings..."
if docker ps | grep -q accelerator; then
    echo "Port mappings:"
    docker port accelerator-prod || echo "  No port mappings found"
else
    echo "⊘ Skipping - container not running"
fi

# Check environment variables
echo ""
echo "[8/8] Checking environment variables..."
if docker ps | grep -q accelerator; then
    echo "PORT=$(docker exec accelerator-prod printenv PORT || echo 'not set')"
    echo "NODE_ENV=$(docker exec accelerator-prod printenv NODE_ENV || echo 'not set')"
    echo "OPENROUTER_API_KEY=$(docker exec accelerator-prod printenv OPENROUTER_API_KEY | cut -c1-20)... (truncated)"
else
    echo "⊘ Skipping - container not running"
fi

echo ""
echo "========================================="
echo "Diagnostic Complete"
echo "========================================="
echo ""
echo "If issues found, run:"
echo "  1. View logs: docker logs -f accelerator-prod"
echo "  2. Restart container: docker compose -f docker/docker-compose.dokploy.yml restart"
echo "  3. Rebuild: docker compose -f docker/docker-compose.dokploy.yml up -d --build"
echo "  4. Full redeploy: docker compose -f docker/docker-compose.dokploy.yml down && docker compose -f docker/docker-compose.dokploy.yml up -d --build"
