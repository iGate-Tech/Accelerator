# Multi-stage build for development and production with Bun executable
ARG BUN_VERSION=latest

# ============================================
# BASE STAGE - Common dependencies
# ============================================
FROM oven/bun:${BUN_VERSION} AS base
WORKDIR /app

# Install git (needed for some npm packages)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies
COPY package*.json ./
RUN bun install

# ============================================
# DEVELOPMENT STAGE
# ============================================
FROM base AS development

# Copy source code
COPY . .

# Expose ports for Vite dev server and Bun server
EXPOSE 5173 3000

CMD ["bun", "run", "dev"]

# ============================================
# BUILD STAGE - Build the application and create executable
# ============================================
FROM base AS build

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Create Bun executable
RUN mkdir -p bin && bun build --compile server.js --outfile bin/accelerator-server

# ============================================
# PRODUCTION STAGE
# ============================================
FROM oven/bun:latest AS production

WORKDIR /app

# Install minimal dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy built files from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/server.js ./
COPY .env* ./

# Create SSL certificate directory
RUN mkdir -p /app/ssl

# Create a non-root user
RUN groupadd -g 1001 -r nodejs && \
    useradd -r -g nodejs -u 1001 nodeapp

# Change ownership
RUN chown -R nodeapp:nodejs /app
USER nodeapp

# Expose ports (HTTP and HTTPS)
EXPOSE 3000 3443

# Run with bun (not compiled binary)
CMD ["bun", "run", "server.js"]