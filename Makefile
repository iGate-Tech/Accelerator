# Makefile for Accelerator Docker operations

.PHONY: dev prod build-dev build-prod up-dev up-prod down-dev down-prod logs-dev logs-prod clean help

# Default target
help:
	@echo "Available commands:"
	@echo "  dev         - Start development environment"
	@echo "  prod        - Start production environment"
	@echo "  build-dev   - Build development images"
	@echo "  build-prod  - Build production images"
	@echo "  up-dev      - Start development containers"
	@echo "  up-prod     - Start production containers"
	@echo "  down-dev    - Stop development environment"
	@echo "  down-prod   - Stop production environment"
	@echo "  logs-dev    - Show development logs"
	@echo "  logs-prod   - Show production logs"
	@echo "  clean       - Remove all containers and volumes"

# Development commands
dev: up-dev

build-dev:
	docker-compose -f docker-compose.dev.yml build

up-dev:
	docker-compose -f docker-compose.dev.yml up --build

down-dev:
	docker-compose -f docker-compose.dev.yml down

logs-dev:
	docker-compose -f docker-compose.dev.yml logs -f

# Production commands
prod: up-prod

build-prod:
	docker-compose -f docker-compose.prod.yml build

up-prod:
	docker-compose -f docker-compose.prod.yml up --build -d

down-prod:
	docker-compose -f docker-compose.prod.yml down

logs-prod:
	docker-compose -f docker-compose.prod.yml logs -f

# Cleanup
clean:
	docker-compose -f docker-compose.dev.yml down -v --remove-orphans
	docker-compose -f docker-compose.prod.yml down -v --remove-orphans
	docker system prune -f