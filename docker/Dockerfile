# Multi-stage build for development and production
ARG NODE_VERSION=20-alpine

# ============================================
# BASE STAGE - Common dependencies
# ============================================
FROM node:${NODE_VERSION} AS base
WORKDIR /app

# Install git (needed for some npm packages)
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# ============================================
# DEVELOPMENT STAGE
# ============================================
FROM base AS development

# Copy source code
COPY . .

# Expose ports for Vite dev server and Express server
EXPOSE 5173 3000

CMD ["npm", "run", "dev"]

# ============================================
# PRODUCTION STAGE
# ============================================
FROM base AS production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create SSL certificate directory
RUN mkdir -p /app/ssl

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeapp -u 1001

# Change ownership
RUN chown -R nodeapp:nodejs /app
USER nodeapp

# Expose ports (HTTP and HTTPS)
EXPOSE 3000 3443

CMD ["npm", "start"]
