.PHONY: dev dev-frontend dev-backend build test seed clean help

## Development
dev: ## Start both frontend and backend in dev mode
	@echo "Starting ApplyPilot dev servers..."
	@make -j2 dev-frontend dev-backend

dev-frontend: ## Start Next.js dev server
	cd frontend && npm run dev

dev-backend: ## Start FastAPI dev server
	cd backend && uvicorn main:app --reload --port 8000

## Build
build: ## Build frontend for production
	cd frontend && npm run build

build-check: ## Type-check frontend
	cd frontend && npx tsc --noEmit

## Database
seed: ## Seed the database with test data
	cd backend && python seed.py

## Testing
test: ## Run all tests
	@make -j2 test-frontend test-backend

test-frontend: ## Run frontend unit tests
	cd frontend && npm test

test-e2e: ## Run frontend E2E tests with Playwright
	cd frontend && npm run test:e2e

test-backend: ## Run backend tests
	cd backend && pytest -v

## Setup
install: ## Install all dependencies
	cd frontend && npm install
	cd backend && pip install -r requirements.txt

setup: ## Initial project setup (copy env files)
	@[ -f frontend/.env.local ] || cp frontend/.env.example frontend/.env.local && echo "Created frontend/.env.local"
	@[ -f backend/.env ] || cp backend/.env.example backend/.env && echo "Created backend/.env"
	@echo "Fill in the env files before running 'make dev'"

## Utilities
clean: ## Clean build artifacts
	rm -rf frontend/.next frontend/out
	find backend -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true

lint: ## Lint frontend code
	cd frontend && npx eslint . --ext .ts,.tsx

format: ## Format code
	cd frontend && npx prettier --write .

## Help
help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
