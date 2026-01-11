# Use Node.js 20 Alpine for Vite compatibility
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S solidjs -u 1001

# Change ownership of the app directory
RUN chown -R solidjs:nodejs /app
USER solidjs

# Expose port
EXPOSE 4000

# Start the application
CMD ["npm", "start"]