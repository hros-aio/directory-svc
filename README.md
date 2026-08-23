# HRMS Directory Service (`hrms-directory-service`)

Enterprise HRMS Directory Microservice — NestJS / TypeScript

## Overview

The Directory Service manages employees, employment lifecycle records, and organizational directory lookups. It runs as an independent NestJS microservice utilizing PostgreSQL for persistence, Redis for caching, Kafka for asynchronous domain events, and shared enterprise libraries (`@new-hros/libs-core`, `@new-hros/libs-sql`, `@new-hros/libs-apis`, `@new-hros/libs-events`).

---

## Architectural Principles

- **Clean Architecture**: Controller (HTTP transport) → Service (business logic) → Repository (persistence).
- **Type Safety**: TypeScript strict mode (`strict: true`), zero `any` tolerance.
- **Polyrepo Domain Isolation**: Exclusive database ownership; inter-service communication strictly via REST OpenAPI or Kafka events.
- **Enterprise Shared Libraries**: Direct reuse of `@new-hros/libs-apis` (middleware, exception filters, swagger, CORS), `@new-hros/libs-core` (AppLogger, exceptions, CacheManager), `@new-hros/libs-sql` (TypeORM BaseEntity/BaseRepository), and `@new-hros/libs-events`.

---

## Quickstart & Commands

### Prerequisites
- Node.js >= 20.x
- pnpm >= 9.x
- PostgreSQL & Redis (local or Docker)

### Installation
```bash
pnpm install
```

### Development
```bash
# Start local development server with hot reload
pnpm start:dev

# Start in debug mode
pnpm start:debug
```

### Quality & Testing
```bash
# Run linting
pnpm lint

# Run type check
pnpm typecheck

# Run unit and integration tests
pnpm test

# Run tests with strict coverage thresholds
pnpm test:cov

# Run E2E tests
pnpm test:e2e
```

### API Documentation & Health Checks
- **Swagger Documentation**: `http://localhost:3000/docs`
- **Health Check Probe**: `http://localhost:3000/health`
