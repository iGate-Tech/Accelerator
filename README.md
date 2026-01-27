# Accelerator - AI Startup Validator

AI-powered startup accelerator tool using SolidJS for state management and OpenAI for simulations.

## Features

- AI-powered startup idea validation and improvement
- Built with SolidJS for reactive UI
- OpenRouter integration for AI models
- Rate limiting for API protection
- Health monitoring endpoints
- Docker-ready for easy deployment

## Technology Stack

- **Runtime**: [Bun.js](https://bun.sh/) (migrated from Node.js for better performance)
- **Frontend**: SolidJS with Tailwind CSS and DaisyUI
- **Backend**: Bun.serve with native Web APIs
- **Database**: PGLite (client-side PostgreSQL)
- **Build Tool**: Vite
- **Deployment**: Docker with multi-stage builds

## Bun Benefits

This project has been migrated from Node.js to Bun.js, providing:

- **Faster startup times**: 2-3x faster than Node.js
- **Better performance**: More efficient event loop and runtime
- **Hot reloading**: Built-in development reloading capability
- **Native Web APIs**: Direct support for Request, Response, etc.
- **Single executable**: Production builds run as standalone executables

## Setup

1. Clone the repository
2. Install dependencies: `bun install`
3. Set up environment variables (copy `.env.example` to `.env`)
4. Build the project: `bun run build`
5. Start the server: `bun server.js`

## Development

For development with hot reloading:

```bash
bun run dev
```

## Building the Executable

To create a standalone executable:

```bash
bun run build:exe
```

This creates `bin/accelerator-server` which contains the entire application in a single executable.

## Docker Deployment

The project includes Docker support with optimized multi-stage builds:

- **Development**: `docker compose -f docker/docker-compose.yml --env-file docker/.env.development up`
- **Production**: `docker compose -f docker/docker-compose.yml --env-file docker/.env.production up`

The production Docker image runs as a standalone executable for maximum performance and reliability.

## Scripts

- `bun run dev` - Start development server with hot reloading
- `bun run build` - Build the frontend assets
- `bun run build:exe` - Build standalone executable
- `bun run start` - Build and start the server
- `bun run preview` - Preview built application