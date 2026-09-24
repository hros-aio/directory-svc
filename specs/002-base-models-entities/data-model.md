# Data Model & Entity Specifications: Directory Service

## 1. Domain Enumerations

All enumerations are defined in `src/common/enums/` and exported via barrel exports.

```typescript
export enum EmployeeStatus {
  INVITED = 'INVITED',
  ONBOARDING = 'ONBOARDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TERMINATED = 'TERMINATED',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  TEMPORARY = 'TEMPORARY',
  INTERN = 'INTERN',
}

export enum EmploymentStatus {
  PENDING = 'PENDING',
  PROBATION = 'PROBATION',
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  SUSPENDED = 'SUSPENDED',
  ENDED = 'ENDED',
}

export enum OnboardingStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  REVIEWING = 'REVIEWING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum OnboardingRequirementStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  WAIVED = 'WAIVED',
}

export enum OnboardingRequirementType {
  PERSONAL_INFORMATION = 'PERSONAL_INFORMATION',
  DOCUMENT = 'DOCUMENT',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  TAX_INFORMATION = 'TAX_INFORMATION',
  CONTRACT = 'CONTRACT',
  POLICY_ACKNOWLEDGEMENT = 'POLICY_ACKNOWLEDGEMENT',
  OTHER = 'OTHER',
}

export enum EmployeeDocumentType {
  IDENTITY = 'IDENTITY',
  PASSPORT = 'PASSPORT',
  WORK_PERMIT = 'WORK_PERMIT',
  VISA = 'VISA',
  EDUCATION = 'EDUCATION',
  CERTIFICATION = 'CERTIFICATION',
  MEDICAL = 'MEDICAL',
  OTHER = 'OTHER',
}

export enum EmployeeDocumentStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum EmploymentContractType {
  PERMANENT = 'PERMANENT',
  FIXED_TERM = 'FIXED_TERM',
  PART_TIME = 'PART_TIME',
  CONTRACTOR = 'CONTRACTOR',
  INTERNSHIP = 'INTERNSHIP',
  OTHER = 'OTHER',
}

export enum EmploymentContractStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  CANCELLED = 'CANCELLED',
}

export enum BankAccountStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum TaxProfileStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}
```

---

## 2. Common Value Objects & Interfaces

Defined in `src/common/interfaces/` / `src/common/models/`:

### 2.1 Address Interface
```typescript
export interface Address {
  readonly street?: string;
  readonly addressLine2?: string;
  readonly city?: string;
  readonly stateOrProvince?: string;
  readonly postalCode?: string;
  readonly countryCode?: string;
}
```

### 2.2 Tax Metadata Interface
```typescript
export interface TaxMetadata {
  readonly taxAuthority?: string;
  readonly withholdingPercentage?: number;
  readonly exemptions?: Record<string, unknown>;
  readonly customFields?: Record<string, unknown>;
}
```

---

## 3. Entity Definitions

### 3.1 EmployeeEntity (`employees`)
- **Table Name**: `employees`
- **Module**: `src/modules/employee/entities/employee.entity.ts`
- **Extends**: `BaseEntity` (`@new-hros/libs-sql`)
- **Fields**:
  - `id`: `string` (UUID, PK)
  - `tenantCode`: `string` (`tenant_code`, VARCHAR(64), NOT NULL)
  - `employeeCode`: `string` (`employee_code`, VARCHAR(64), NOT NULL)
  - `employmentType`: `EmploymentType` (`employment_type`, ENUM, NOT NULL)
  - `employmentStatus`: `EmploymentStatus` (`employment_status`, ENUM, NOT NULL, default: `PENDING`)
  - `joinedAt`: `Date | null` (`joined_at`, TIMESTAMPTZ, nullable)
  - `probationEndAt`: `Date | null` (`probation_end_at`, TIMESTAMPTZ, nullable)
  - `endedAt`: `Date | null` (`ended_at`, TIMESTAMPTZ, nullable)
  - `status`: `EmployeeStatus` (`status`, ENUM, NOT NULL, default: `INVITED`)
  - `createdAt`: `Date` (`created_at`, TIMESTAMPTZ, NOT NULL)
  - `updatedAt`: `Date` (`updated_at`, TIMESTAMPTZ, NOT NULL)
  - `deletedAt`: `Date | null` (`deleted_at`, TIMESTAMPTZ, nullable)
  - `version`: `number` (`version`, INT, optimistic locking)
- **Relations**:
  - `OneToOne` -> `EmployeeProfileEntity` (mapped by `profile`, cascade: true)
  - `OneToMany` -> `EmploymentAssignmentEntity` (mapped by `assignments`)
  - `OneToMany` -> `EmploymentContractEntity` (mapped by `contracts`)
  - `OneToMany` -> `EmployeeDocumentEntity` (mapped by `documents`)
  - `OneToOne` -> `OnboardingEntity` (mapped by `onboarding`)
  - `OneToMany` -> `EmployeeBankAccountEntity` (mapped by `bankAccounts`)
  - `OneToMany` -> `EmployeeTaxProfileEntity` (mapped by `taxProfiles`)
- **Constraints / Indexes**:
  - UNIQUE `(tenant_code, employee_code)`
  - UNIQUE `(tenant_code, id)`
  - INDEX `(tenant_code, status)`
  - INDEX `(tenant_code, employment_status)`
  - CHECK `ended_at IS NULL OR joined_at IS NULL OR ended_at >= joined_at`

---

### 3.2 EmployeeProfileEntity (`employee_profiles`)
- **Table Name**: `employee_profiles`
- **Module**: `src/modules/employee/entities/employee-profile.entity.ts`
- **Fields**:
  - `employeeId`: `string` (`employee_id`, UUID, PK)
  - `tenantCode`: `string` (`tenant_code`, VARCHAR(64), NOT NULL)
  - `firstName`: `string` (`first_name`, VARCHAR(100), NOT NULL)
  - `middleName`: `string | null` (`middle_name`, VARCHAR(100), nullable)
  - `lastName`: `string` (`last_name`, VARCHAR(100), NOT NULL)
  - `preferredName`: `string | null` (`preferred_name`, VARCHAR(100), nullable)
  - `dateOfBirth`: `Date | null` (`date_of_birth`, DATE, nullable)
  - `gender`: `string | null` (`gender`, VARCHAR(32), nullable)
  - `avatarUrl`: `string | null` (`avatar_url`, TEXT, nullable)
  - `personalEmail`: `string | null` (`personal_email`, VARCHAR(320), nullable)
  - `personalPhone`: `string | null` (`personal_phone`, VARCHAR(64), nullable)
  - `address`: `Address | null` (`address`, JSONB, nullable)
  - `createdAt`: `Date` (`created_at`, TIMESTAMPTZ, NOT NULL)
  - `updatedAt`: `Date` (`updated_at`, TIMESTAMPTZ, NOT NULL)
- **Relations**:
  - `OneToOne` -> `EmployeeEntity` (via `@JoinColumn([{ name: 'tenant_code', referencedColumnName: 'tenantCode' }, { name: 'employee_id', referencedColumnName: 'id' }])`, onDelete: 'CASCADE')
- **Constraints / Indexes**:
  - INDEX `(tenant_code, last_name, first_name)`

---

### 3.3 EmploymentAssignmentEntity (`employment_assignments`)
- **Table Name**: `employment_assignments`
- **Module**: `src/modules/employment/entities/employment-assignment.entity.ts`
- **Extends**: `BaseEntity`
- **Fields**:
  - `id`: `string` (UUID, PK)
  - `tenantCode`: `string` (`tenant_code`, VARCHAR(64), NOT NULL)
  - `employeeId`: `string` (`employee_id`, UUID, NOT NULL)
  - `companyId`: `string` (`company_id`, UUID, NOT NULL)
  - `locationId`: `string | null` (`location_id`, UUID, nullable)
  - `departmentId`: `string | null` (`department_id`, UUID, nullable)
  - `jobTitleId`: `string | null` (`job_title_id`, UUID, nullable)
  - `gradeId`: `string | null` (`grade_id`, UUID, nullable)
  - `managerEmployeeId`: `string | null` (`manager_employee_id`, UUID, nullable)
  - `effectiveFrom`: `Date` (`effective_from`, DATE, NOT NULL)
  - `effectiveTo`: `Date | null` (`effective_to`, DATE, nullable)
  - `createdAt`, `updatedAt`, `deletedAt`, `version`
- **Relations**:
  - `ManyToOne` -> `EmployeeEntity` (as employee, onDelete: 'CASCADE')
  - `ManyToOne` -> `EmployeeEntity` (as manager, onDelete: 'SET NULL', nullable)
- **Constraints / Indexes**:
  - UNIQUE `(tenant_code, id)`
  - INDEX `(tenant_code, employee_id)`
  - INDEX `(tenant_code, company_id)`
  - INDEX `(tenant_code, department_id)`
  - INDEX `(tenant_code, manager_employee_id)`
  - PARTIAL INDEX `(tenant_code, employee_id) WHERE effective_to IS NULL`
  - CHECK `effective_to IS NULL OR effective_to >= effective_from`
  - CHECK `manager_employee_id IS NULL OR manager_employee_id <> employee_id`

---

### 3.4 EmploymentContractEntity (`employment_contracts`)
- **Table Name**: `employment_contracts`
- **Module**: `src/modules/employment/entities/employment-contract.entity.ts`
- **Extends**: `BaseEntity`
- **Fields**:
  - `id`: `string` (UUID, PK)
  - `tenantCode`: `string` (`tenant_code`, VARCHAR(64), NOT NULL)
  - `employeeId`: `string` (`employee_id`, UUID, NOT NULL)
  - `contractType`: `EmploymentContractType` (`contract_type`, ENUM, NOT NULL)
  - `contractNumber`: `string | null` (`contract_number`, VARCHAR(128), nullable)
  - `startDate`: `Date` (`start_date`, DATE, NOT NULL)
  - `endDate`: `Date | null` (`end_date`, DATE, nullable)
  - `status`: `EmploymentContractStatus` (`status`, ENUM, NOT NULL, default: `DRAFT`)
  - `documentId`: `string | null` (`document_id`, UUID, nullable)
  - `signedAt`: `Date | null` (`signed_at`, TIMESTAMPTZ, nullable)
  - `terminatedAt`: `Date | null` (`terminated_at`, TIMESTAMPTZ, nullable)
  - `createdAt`, `updatedAt`, `deletedAt`, `version`
- **Relations**:
  - `ManyToOne` -> `EmployeeEntity` (onDelete: 'CASCADE')
- **Constraints / Indexes**:
  - UNIQUE `(tenant_code, id)`
  - UNIQUE `(tenant_code, contract_number)`
  - INDEX `(tenant_code, employee_id)`
  - INDEX `(tenant_code, status)`
  - CHECK `end_date IS NULL OR end_date >= start_date`

---

### 3.5 EmployeeDocumentEntity (`employee_documents`)
- **Table Name**: `employee_documents`
- **Module**: `src/modules/employee/entities/employee-document.entity.ts`
- **Extends**: `BaseEntity`
- **Fields**:
  - `id`: `string` (UUID, PK)
  - `tenantCode`: `string` (`tenant_code`, VARCHAR(64), NOT NULL)
  - `employeeId`: `string` (`employee_id`, UUID, NOT NULL)
  - `documentType`: `EmployeeDocumentType` (`document_type`, ENUM, NOT NULL)
  - `documentNumber`: `string | null` (`document_number`, VARCHAR(128), nullable)
  - `fileId`: `string` (`file_id`, UUID, NOT NULL)
  - `status`: `EmployeeDocumentStatus` (`status`, ENUM, NOT NULL, default: `PENDING`)
  - `issuedAt`: `Date | null` (`issued_at`, DATE, nullable)
  - `expiredAt`: `Date | null` (`expired_at`, DATE, nullable)
  - `createdAt`, `updatedAt`, `deletedAt`, `version`
- **Relations**:
  - `ManyToOne` -> `EmployeeEntity` (onDelete: 'CASCADE')
- **Constraints / Indexes**:
  - UNIQUE `(tenant_code, id)`
  - INDEX `(tenant_code, employee_id)`
  - INDEX `(tenant_code, document_type, status)`
  - CHECK `expired_at IS NULL OR issued_at IS NULL OR expired_at >= issued_at`

---

### 3.6 OnboardingEntity (`onboardings`)
- **Table Name**: `onboardings`
- **Module**: `src/modules/employee/entities/onboarding.entity.ts`
- **Extends**: `BaseEntity`
- **Fields**:
  - `id`: `string` (UUID, PK)
  - `tenantCode`: `string` (`tenant_code`, VARCHAR(64), NOT NULL)
  - `employeeId`: `string` (`employee_id`, UUID, NOT NULL)
  - `status`: `OnboardingStatus` (`status`, ENUM, NOT NULL, default: `DRAFT`)
  - `startedAt`: `Date | null` (`started_at`, TIMESTAMPTZ, nullable)
  - `submittedAt`: `Date | null` (`submitted_at`, TIMESTAMPTZ, nullable)
  - `completedAt`: `Date | null` (`completed_at`, TIMESTAMPTZ, nullable)
  - `createdAt`, `updatedAt`, `deletedAt`, `version`
- **Relations**:
  - `OneToOne` -> `EmployeeEntity` (onDelete: 'CASCADE')
  - `OneToMany` -> `OnboardingRequirementEntity` (mapped by `requirements`, cascade: true)
- **Constraints / Indexes**:
  - UNIQUE `(tenant_code, id)`
  - UNIQUE `(tenant_code, employee_id)`
  - INDEX `(tenant_code, status)`

---

### 3.7 OnboardingRequirementEntity (`onboarding_requirements`)
- **Table Name**: `onboarding_requirements`
- **Module**: `src/modules/employee/entities/onboarding-requirement.entity.ts`
- **Extends**: `BaseEntity`
- **Fields**:
  - `id`: `string` (UUID, PK)
  - `tenantCode`: `string` (`tenant_code`, VARCHAR(64), NOT NULL)
  - `onboardingId`: `string` (`onboarding_id`, UUID, NOT NULL)
  - `requirementType`: `OnboardingRequirementType` (`requirement_type`, ENUM, NOT NULL)
  - `title`: `string` (`title`, VARCHAR(255), NOT NULL)
  - `required`: `boolean` (`required`, BOOLEAN, default: true)
  - `status`: `OnboardingRequirementStatus` (`status`, ENUM, default: `PENDING`)
  - `documentId`: `string | null` (`document_id`, UUID, nullable)
  - `completedAt`: `Date | null` (`completed_at`, TIMESTAMPTZ, nullable)
  - `createdAt`, `updatedAt`, `deletedAt`, `version`
- **Relations**:
  - `ManyToOne` -> `OnboardingEntity` (onDelete: 'CASCADE')
- **Constraints / Indexes**:
  - UNIQUE `(tenant_code, id)`
  - INDEX `(tenant_code, onboarding_id)`
  - INDEX `(tenant_code, status)`

---

### 3.8 EmployeeBankAccountEntity (`employee_bank_accounts`)
- **Table Name**: `employee_bank_accounts`
- **Module**: `src/modules/employee/entities/employee-bank-account.entity.ts`
- **Extends**: `BaseEntity`
- **Fields**:
  - `id`: `string` (UUID, PK)
  - `tenantCode`: `string` (`tenant_code`, VARCHAR(64), NOT NULL)
  - `employeeId`: `string` (`employee_id`, UUID, NOT NULL)
  - `bankName`: `string` (`bank_name`, VARCHAR(255), NOT NULL)
  - `bankCode`: `string | null` (`bank_code`, VARCHAR(64), nullable)
  - `accountNumber`: `string` (`account_number`, VARCHAR(128), NOT NULL)
  - `accountHolderName`: `string` (`account_holder_name`, VARCHAR(255), NOT NULL)
  - `currencyCode`: `string` (`currency_code`, VARCHAR(3), NOT NULL)
  - `status`: `BankAccountStatus` (`status`, ENUM, default: `PENDING`)
  - `isPrimary`: `boolean` (`is_primary`, BOOLEAN, default: false)
  - `effectiveFrom`: `Date | null` (`effective_from`, DATE, nullable)
  - `effectiveTo`: `Date | null` (`effective_to`, DATE, nullable)
  - `createdAt`, `updatedAt`, `deletedAt`, `version`
- **Relations**:
  - `ManyToOne` -> `EmployeeEntity` (onDelete: 'CASCADE')
- **Constraints / Indexes**:
  - UNIQUE `(tenant_code, id)`
  - INDEX `(tenant_code, employee_id)`
  - UNIQUE PARTIAL INDEX `(tenant_code, employee_id) WHERE is_primary = TRUE`
  - CHECK `effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from`

---

### 3.9 EmployeeTaxProfileEntity (`employee_tax_profiles`)
- **Table Name**: `employee_tax_profiles`
- **Module**: `src/modules/employee/entities/employee-tax-profile.entity.ts`
- **Extends**: `BaseEntity`
- **Fields**:
  - `id`: `string` (UUID, PK)
  - `tenantCode`: `string` (`tenant_code`, VARCHAR(64), NOT NULL)
  - `employeeId`: `string` (`employee_id`, UUID, NOT NULL)
  - `countryCode`: `string` (`country_code`, VARCHAR(2), NOT NULL)
  - `taxNumber`: `string | null` (`tax_number`, VARCHAR(128), nullable)
  - `status`: `TaxProfileStatus` (`status`, ENUM, default: `PENDING`)
  - `effectiveFrom`: `Date | null` (`effective_from`, DATE, nullable)
  - `effectiveTo`: `Date | null` (`effective_to`, DATE, nullable)
  - `metadata`: `TaxMetadata | null` (`metadata`, JSONB, nullable)
  - `createdAt`, `updatedAt`, `deletedAt`, `version`
- **Relations**:
  - `ManyToOne` -> `EmployeeEntity` (onDelete: 'CASCADE')
- **Constraints / Indexes**:
  - UNIQUE `(tenant_code, id)`
  - INDEX `(tenant_code, employee_id)`
  - INDEX `(tenant_code, country_code)`
  - UNIQUE PARTIAL INDEX `(tenant_code, employee_id, country_code) WHERE status = 'ACTIVE'`
  - CHECK `effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from`
