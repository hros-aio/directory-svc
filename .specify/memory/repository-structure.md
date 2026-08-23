# Repository Structure

Enterprise HRMS Backend — Polyrepo Layout (Module per Repository)

---

## 1. Why Polyrepo

Each business domain module is its own standalone repository and its own deployable NestJS service, instead of living inside a shared monorepo. This is a deliberate trade for operational simplicity over the previous monorepo approach:

- **CI/CD**: each repo has its own pipeline, triggered only by changes to that domain. No shared build graph, no "what else might this change affect" analysis across unrelated domains, no monorepo tooling (Nx/Turborepo/pnpm workspace filters) to maintain.
- **Git branching**: each repo has its own branch protection rules, release cadence, and versioning, independent of every other domain. A hotfix to `leave` never touches `payroll`'s branch history or triggers its pipeline.
- **Team ownership**: a repo maps 1:1 to the team that owns that domain, with its own access control, PR review requirements, and deploy schedule.
- **Blast radius**: a broken build, a bad dependency bump, or a misconfigured pipeline in one repo cannot block or slow down every other domain's delivery.

The trade-off, made consciously: cross-domain changes now require coordinated PRs across multiple repos, and there is no compiler-enforced boundary between modules — that boundary is now a network/API boundary instead of a folder boundary, enforced by contract (OpenAPI/event schema), not the TypeScript compiler. `implementation-rules.md` and `coding-conventions.md` still apply identically inside every repo.

## 2. Repository Naming

Pattern: `hrms-<domain>-service`, kebab-case, one repository per bounded context — matching the same domain boundaries the monorepo previously used as top-level module folders.

| Repository | Domain |
|---|---|
| `hrms-access-service` | Authentication, token issuance, RBAC resolution |
| `hrms-setting-service` | System/tenant configuration |
| `hrms-company-service` | Company/organization structure |
| `hrms-department-service` | Departments |
| `hrms-location-service` | Locations/sites |
| `hrms-directory-service` | Employee, employment records |
| `hrms-leave-service` | Leave requests/balances |
| `hrms-attendance-service` | Attendance/check-in |
| `hrms-payroll-service` | Payroll runs |
| `hrms-recruitment-service` | Recruitment/hiring |

New domains follow the same naming pattern and repository shape below.

## 3. Standard Repository Layout

Each repository is one deployable NestJS service, but internally it is organized as a set of **NestJS modules** — the same `modules/<name>/` shape the monorepo used, just scoped to one service's bounded context instead of the whole system. `hrms-access-service`, for example, is a single repository/deployment composed of several internal modules: `auth`, `users`, `roles`, `permissions`.

```
hrms-access-service/
├── src/
│   ├── modules/
│   │   ├── auth/                       # login, token issuance/refresh
│   │   │   ├── controllers/
│   │   │   │   └── auth.controller.ts
│   │   │   ├── services/
│   │   │   │   └── auth.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   └── refresh-token.dto.ts
│   │   │   ├── interfaces/
│   │   │   │   └── jwt-payload.interface.ts
│   │   │   ├── guards/
│   │   │   │   └── local-auth.guard.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts
│   │   │   ├── auth.module.ts
│   │   │   └── index.ts                # public barrel: exported providers only
│   │   ├── users/
│   │   │   ├── controllers/
│   │   │   │   └── users.controller.ts
│   │   │   ├── services/
│   │   │   │   └── users.service.ts
│   │   │   ├── repositories/
│   │   │   │   └── users.repository.ts
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   └── update-user.dto.ts
│   │   │   ├── events/
│   │   │   │   └── user-created.event.ts
│   │   │   ├── users.module.ts
│   │   │   └── index.ts
│   │   ├── roles/
│   │   │   ├── controllers/
│   │   │   │   └── roles.controller.ts
│   │   │   ├── services/
│   │   │   │   └── roles.service.ts
│   │   │   ├── repositories/
│   │   │   │   └── roles.repository.ts
│   │   │   ├── entities/
│   │   │   │   └── role.entity.ts
│   │   │   ├── dto/
│   │   │   │   └── assign-role.dto.ts
│   │   │   ├── roles.module.ts
│   │   │   └── index.ts
│   │   └── permissions/
│   │       ├── controllers/
│   │       │   └── permissions.controller.ts
│   │       ├── services/
│   │       │   └── permissions.service.ts
│   │       ├── repositories/
│   │       │   └── permissions.repository.ts
│   │       ├── entities/
│   │       │   └── permission.entity.ts
│   │       ├── dto/
│   │       │   └── create-permission.dto.ts
│   │       ├── permissions.module.ts
│   │       └── index.ts
│   ├── kafka/
│   │   ├── user-sync.producer.ts
│   │   └── user-sync.consumer.ts
│   ├── migrations/
│   │   └── *.ts
│   ├── app.module.ts                   # imports AuthModule, UsersModule, RolesModule, PermissionsModule
│   └── main.ts
├── test/
│   ├── auth.e2e-spec.ts
│   ├── users.e2e-spec.ts
│   ├── roles.e2e-spec.ts
│   └── permissions.e2e-spec.ts
├── docker/
│   └── Dockerfile
├── k8s/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── configmap.yaml
├── .husky/
├── .github/workflows/ci.yml        # or .gitlab-ci.yml — see §6
├── nest-cli.json
├── tsconfig.json
├── commitlint.config.js
├── .eslintrc.js
├── .prettierrc
├── package.json
└── README.md
```

### Access Service Layout (`access-svc`)

```text
access-svc
├── identity
│   ├── users
│   ├── credentials
│   ├── sessions
│   ├── invitations
│   └── mfa
│
├── authorization
│   ├── roles
│   ├── permissions
│   ├── policies
│   ├── scopes
│   └── decision-engine
│
├── approval
│   ├── approval-chain
│   ├── approval-stage
│   ├── approver-rule
│   ├── delegation
│   └── approver-resolution
│
└── audit
    ├── access-decisions
    ├── permission-changes
    └── approval-policy-changes
```

Not every service needs this many internal modules — `hrms-department-service` may reasonably be a single `department` module. The rule is: **split into internal modules along sub-domain boundaries within the service's bounded context**, the same judgment call the monorepo used for top-level domains, just applied one level deeper.

| Folder (inside each module) | Contains | Never contains |
|---|---|---|
| `controllers/` | HTTP route handlers, request/response DTO wiring, Swagger decorators | Business logic, direct DB access |
| `services/` | Business logic, orchestration, transaction boundaries, cache decisions | Express/Fastify `Request`/`Response` objects |
| `repositories/` | TypeORM query logic, extends `BaseRepository` from `@hrms/libs-sql` | Business rule evaluation |
| `entities/` | TypeORM entity classes, extend `BaseEntity` from `@hrms/libs-sql` | DTO validation decorators |
| `dto/` | `class-validator`/`class-transformer`-decorated request/response shapes | Persistence logic |
| `interfaces/` | Pure TypeScript contracts with no runtime footprint | Implementation code |
| `events/` | Domain event classes, published internally or externally via `kafka/` | Event handlers (those live where they're consumed) |
| `enums/` | Module-scoped enums | Cross-module enums used by every module in the service (put those in a service-local `common/` folder — see below) |
| `guards/`, `strategies/` | Module-specific authorization/auth logic | Generic auth/permission guards (those live in `@hrms/libs-apis`) |
| `index.ts` | Barrel re-exporting only the module's public providers/module class | Internal entities, repositories, or anything not meant for cross-module use |

Service-level (not module-level) folders:

| Folder | Contains |
|---|---|
| `kafka/` | This service's producers/consumers for events crossing repository boundaries (§5) |
| `migrations/` | This service's own schema migrations (one database/schema per service, shared across its internal modules) |
| `main.ts` | Bootstrap: Swagger, versioning, CORS, global pipes/filters/interceptors from `@hrms/libs-apis` |
| `common/` *(optional)* | Constants/enums/interfaces genuinely shared by more than one internal module of this service only — promote to `@hrms/libs-core` if it turns out to be needed by other services too |



## 4. Module Boundaries Within a Service vs. Across Services

Two different rules apply depending on whether the boundary is inside one repository or between repositories.

### 4.1 Between internal modules of the same service (e.g. `users` ↔ `roles` ↔ `permissions` inside `hrms-access-service`)

Same rule the monorepo used for domain modules, just scoped inside one repository:

- A module never reaches into another module's internal folders (`entities/`, `repositories/`) directly — it imports the other module's exported service via its `index.ts` barrel and constructor-injects it (standard Nest DI, both modules live in the same `app.module.ts` graph).
- Example: `RolesService` needs to check a user exists → it injects `UsersService` (exported by `UsersModule`), not `UsersRepository`.
- Circular imports between internal modules are forbidden, same as before — extract a shared contract into the service-local `common/` folder if two modules need each other.
- This boundary is still compiler-enforced (TypeScript + Nest DI), so it's cheap to keep strict — there's no reason to relax it just because the modules now sit one level deeper than in the old monorepo.

### 4.2 Between services (repositories) — e.g. `hrms-leave-service` needing data from `hrms-employee-service`

This boundary is a network boundary, not a folder boundary, and the compiler cannot catch a break here. Two channels only:

- **Synchronous, request/response**: a typed HTTP client calling the other service's versioned REST API, generated/validated against its published OpenAPI spec. No service reaches into another service's database.
- **Asynchronous, event-driven**: Kafka producers/consumers (a service's `src/kafka/` folder) per `coding-conventions.md`'s Kafka naming rules, with the event schema treated as a versioned contract (see §5).

Each service owns its own database/schema exclusively — including across its own internal modules (e.g. `hrms-access-service`'s `users`, `roles`, and `permissions` modules share one database, but no other service ever queries it directly). No shared tables, no cross-service joins. This is what keeps independent CI/CD and independent deploys per repository safe.

## 5. Contracts Between Repositories

For the cross-service boundary described in §4.2, where the compiler can't catch a breaking change, contracts are explicit and versioned:

- **REST**: each service publishes its OpenAPI spec (generated from Swagger decorators per `implementation-rules.md §11`) as a build artifact; consuming services generate typed clients from it in CI rather than hand-writing HTTP calls.
- **Events**: each Kafka event's payload is a versioned schema (e.g. tracked via a schema registry or a shared, published `@hrms/events` package of event DTOs); a breaking payload change requires a new event version/topic, never an in-place field removal.
- **API versioning** (`implementation-rules.md §10`) is the primary compatibility mechanism — additive changes ship within the current version; breaking changes get a new major version with a deprecation window for existing consumers.

## 6. CI/CD per Repository

Each repository ships its own pipeline (e.g. GitHub Actions/GitLab CI), typically:

1. Install (`pnpm install`) → lint → unit test → build
2. Integration/E2E tests (Testcontainers-based, per `testing-strategy.md`)
3. Build and push a Docker image tagged with the commit SHA and semver (from Conventional Commits via Commitlint)
4. Deploy to the relevant Kubernetes namespace/environment via its own `k8s/` manifests

Because pipelines are independent, `hrms-employee-service` can deploy multiple times a day while `hrms-payroll-service` stays on a slower, more tightly reviewed release cadence — the two never block each other.

## 7. Git Branching

Each repository runs trunk-based development independently:

- `main` is always deployable; short-lived feature branches (`feat/<ticket>-<short-desc>`) merge via PR after CI passes and review is complete.
- Release tags follow semver, driven by Conventional Commits (`tech-stack.md §10`) — `feat` → minor, `fix` → patch, `!`/`BREAKING CHANGE` → major.
- Branch protection (required status checks, required review, no direct pushes to `main`) is configured identically across all `hrms-*-service` repositories via an org-level ruleset/template, so the policy stays consistent without being the same physical repo.

## 8. Shared Libraries — Consumed as npm Packages

`libs-core`, `libs-sql`, and `libs-apis` remain published, versioned npm packages — this was already true before the polyrepo split and doesn't change now. Every `hrms-*-service` repository installs them the same way:

```bash
pnpm add @hrms/libs-core @hrms/libs-sql @hrms/libs-apis
```

```json
// package.json
"dependencies": {
  "@hrms/libs-core": "^1.4.0",
  "@hrms/libs-sql": "^2.1.0",
  "@hrms/libs-apis": "^1.2.0"
}
```

They are imported like any other package (`import { CacheManager } from '@hrms/libs-core'`) — never vendored, never edited in place from a domain repository. If a fix or feature is needed in a shared library, it's implemented and released from that library's own repository, and consuming services pick it up via a normal version bump (`pnpm up @hrms/libs-core`).

### 8.1 `@hrms/libs-core`

| Export | Purpose |
|---|---|
| `CacheManager` | Redis cache abstraction — get/set/invalidate with namespacing and TTL |
| `AppLogger` | Structured JSON logger with request/session/tenant context |
| `BaseException`, `BusinessException`, `ValidationException`, `InfrastructureException` | Exception hierarchy consumed by the global exception filter |
| `date.util`, `string.util` and other pure utilities | Stateless helper functions |
| Global constants | Cross-domain constant values |
| `@CurrentUser()` and other cross-cutting decorators | |
| `LoggingInterceptor` and other cross-cutting interceptors | Not tied to HTTP response shaping |

### 8.2 `@hrms/libs-sql`

| Export | Purpose |
|---|---|
| `typeorm.config` | Shared TypeORM data source configuration |
| `BaseEntity` | id, timestamps, soft-delete column, version column — every domain entity extends this |
| `BaseRepository` | Pagination, soft-delete-aware queries, transaction helper — every domain repository extends this |
| `paginate()` | Pagination utility used by list endpoints |
| Migration runner/CLI config | Base config/runner only — each service's own migrations live in that service's `src/migrations/` |
| `AuditSubscriber` and other subscribers | Audit trail, `updatedAt` handling |

### 8.3 `@hrms/libs-apis`

| Export | Purpose |
|---|---|
| `swagger.config` | Swagger/OpenAPI bootstrap |
| `versioning.config` | API versioning setup |
| `cors.config` | CORS policy |
| `TenantContextMiddleware`, `RequestIdMiddleware` | Request-scoped middleware |
| `JwtAuthGuard`, `PermissionGuard`, `@Roles()` | Auth/RBAC enforcement, verifying the RS256 JWT issued by `hrms-access-service` |
| `PaginationQueryDto`, `ApiResponseDto` | Common DTOs shared across every domain |
| `ResponseInterceptor` | Global response-shaping interceptor |

## 9. File Naming Recap

All file naming follows the table in `coding-conventions.md §2.1`, applied identically inside every internal module of every `hrms-*-service` repository: `kebab-case-name.<type-suffix>.ts`, with the type suffix matching its folder — e.g. `hrms-access-service/src/modules/roles/entities/role.entity.ts`. Lint rule `unicorn/filename-case` plus a custom ESLint rule enforcing suffix-to-folder consistency runs in every repository's own CI pipeline.

## 10. Dependency Direction

```
Within a service (compiler-enforced):
  modules/<sub-domain>   ──depends on──>  another module's EXPORTED providers only (via index.ts), never its internals

Across services (network-enforced, not compiler-enforced):
  hrms-<domain>-service   ──depends on──>  other hrms-*-service repos, ONLY via REST/Kafka contracts (§4.2, §5)
                                            never via source/package import, never via shared database

Every service, regardless of internal module count:
  hrms-<domain>-service   ──depends on──>  @hrms/libs-apis, @hrms/libs-sql, @hrms/libs-core  (npm packages)
  @hrms/libs-apis         ──depends on──>  @hrms/libs-core
  @hrms/libs-sql          ──depends on──>  @hrms/libs-core
  @hrms/libs-core         ──depends on──>  (nothing internal)
```

A domain repository never imports another domain repository's source code or npm-installs it as a package. The only permitted coupling between two services is a REST call against a published API version or a Kafka event against a versioned schema — never a shared database, shared entity, or direct code import. Within a single service, its internal modules may depend on each other directly through Nest DI, but only through what each module explicitly exports.