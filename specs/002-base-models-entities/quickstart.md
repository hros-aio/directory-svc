# Quickstart & Validation Guide: Base Models and Entities

## Prerequisites
- Node.js >= 20
- pnpm >= 10
- PostgreSQL database or Testcontainers environment

## Validation Scenarios

### Scenario 1: TypeScript Compilation & Type Safety Check
Verify all enums, entities, and base models compile cleanly under strict TypeScript settings (`strict: true`, zero `any`, strict property initialization).

```bash
pnpm typecheck
```
**Expected Outcome**: 0 errors, clean exit.

### Scenario 2: ESLint & Prettier Code Standards
Validate linting rules, naming conventions, named exports, and formatting.

```bash
pnpm lint
pnpm format:check
```
**Expected Outcome**: All files pass linting and formatting without warnings or errors.

### Scenario 3: TypeORM Entity Metadata & Mapping Unit Test
Run test suites validating that each entity correctly registers in the TypeORM schema and contains all required table, column, enum, index, and relationship metadata.

```bash
pnpm test
```
**Expected Outcome**: Unit tests verify entity definitions, column mappings, and relationships for all 9 entities.
