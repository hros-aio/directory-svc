# Interface Contract: Directory Domain Models & DTOs

## 1. Scope
This contract defines the public domain models, immutable DTO contracts, and event payloads exposed by the Directory Service internal domain modules.

## 2. Public Exported Types & Contracts

### 2.1 Employee Module Public Contract (`src/modules/employee/index.ts`)
```typescript
// Enums
export * from '../../common/enums';
export * from '../../common/interfaces';

// Entities
export { EmployeeEntity } from './entities/employee.entity';
export { EmployeeProfileEntity } from './entities/employee-profile.entity';
export { EmployeeDocumentEntity } from './entities/employee-document.entity';
export { EmployeeBankAccountEntity } from './entities/employee-bank-account.entity';
export { EmployeeTaxProfileEntity } from './entities/employee-tax-profile.entity';
export { OnboardingEntity } from './entities/onboarding.entity';
export { OnboardingRequirementEntity } from './entities/onboarding-requirement.entity';

// Domain Models / Interfaces
export interface IEmployee {
  readonly id: string;
  readonly tenantCode: string;
  readonly employeeCode: string;
  readonly employmentType: EmploymentType;
  readonly employmentStatus: EmploymentStatus;
  readonly joinedAt?: Date | null;
  readonly probationEndAt?: Date | null;
  readonly endedAt?: Date | null;
  readonly status: EmployeeStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
```

### 2.2 Employment Module Public Contract (`src/modules/employment/index.ts`)
```typescript
// Entities
export { EmploymentAssignmentEntity } from './entities/employment-assignment.entity';
export { EmploymentContractEntity } from './entities/employment-contract.entity';

// Domain Models / Interfaces
export interface IEmploymentAssignment {
  readonly id: string;
  readonly tenantCode: string;
  readonly employeeId: string;
  readonly companyId: string;
  readonly locationId?: string | null;
  readonly departmentId?: string | null;
  readonly jobTitleId?: string | null;
  readonly gradeId?: string | null;
  readonly managerEmployeeId?: string | null;
  readonly effectiveFrom: Date;
  readonly effectiveTo?: Date | null;
}
```
