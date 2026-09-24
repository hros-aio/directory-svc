-- HROS Employee Service
-- PostgreSQL 18
-- Tenant isolation uses tenant_code.
-- Company / Location / Department / Grade / Job Title are owned by Setting Service.
-- No cross-service foreign keys are defined.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
    CREATE TYPE employee_status AS ENUM (
        'INVITED',
        'ONBOARDING',
        'ACTIVE',
        'INACTIVE',
        'TERMINATED'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE employment_type AS ENUM (
        'FULL_TIME',
        'PART_TIME',
        'CONTRACT',
        'TEMPORARY',
        'INTERN'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE employment_status AS ENUM (
        'PENDING',
        'PROBATION',
        'ACTIVE',
        'ON_LEAVE',
        'SUSPENDED',
        'ENDED'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE onboarding_status AS ENUM (
        'DRAFT',
        'IN_PROGRESS',
        'SUBMITTED',
        'REVIEWING',
        'COMPLETED',
        'CANCELLED'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE onboarding_requirement_status AS ENUM (
        'PENDING',
        'IN_PROGRESS',
        'COMPLETED',
        'WAIVED'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE onboarding_requirement_type AS ENUM (
        'PERSONAL_INFORMATION',
        'DOCUMENT',
        'BANK_ACCOUNT',
        'TAX_INFORMATION',
        'CONTRACT',
        'POLICY_ACKNOWLEDGEMENT',
        'OTHER'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE employee_document_type AS ENUM (
        'IDENTITY',
        'PASSPORT',
        'WORK_PERMIT',
        'VISA',
        'EDUCATION',
        'CERTIFICATION',
        'MEDICAL',
        'OTHER'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE employee_document_status AS ENUM (
        'PENDING',
        'VERIFIED',
        'REJECTED',
        'EXPIRED'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE employment_contract_type AS ENUM (
        'PERMANENT',
        'FIXED_TERM',
        'PART_TIME',
        'CONTRACTOR',
        'INTERNSHIP',
        'OTHER'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE employment_contract_status AS ENUM (
        'DRAFT',
        'ACTIVE',
        'EXPIRED',
        'TERMINATED',
        'CANCELLED'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE bank_account_status AS ENUM (
        'PENDING',
        'ACTIVE',
        'INACTIVE'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE tax_profile_status AS ENUM (
        'PENDING',
        'ACTIVE',
        'INACTIVE'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- EMPLOYEE
-- Employee is the HR master record.
-- Employment information is kept here because Employee and
-- Employment share the same lifecycle in the current domain.
-- Organizational placement/history remains in assignments.
-- ============================================================

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_code VARCHAR(64) NOT NULL,
    employee_code VARCHAR(64) NOT NULL,

    -- Employment information
    employment_type employment_type NOT NULL,
    employment_status employment_status NOT NULL DEFAULT 'PENDING',
    joined_at TIMESTAMPTZ,
    probation_end_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,

    -- Employee lifecycle
    status employee_status NOT NULL DEFAULT 'INVITED',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_employees_tenant_employee_code
        UNIQUE (tenant_code, employee_code),

    CONSTRAINT uq_employees_tenant_id
        UNIQUE (tenant_code, id),

    CONSTRAINT chk_employees_dates
        CHECK (
            ended_at IS NULL
            OR joined_at IS NULL
            OR ended_at >= joined_at
        )
);

CREATE INDEX idx_employees_tenant_status
    ON employees (tenant_code, status);

CREATE INDEX idx_employees_tenant_employment_status
    ON employees (tenant_code, employment_status);

-- ============================================================
-- EMPLOYEE PROFILE
-- General / personal information.
-- ============================================================

CREATE TABLE employee_profiles (
    employee_id UUID PRIMARY KEY,
    tenant_code VARCHAR(64) NOT NULL,

    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    preferred_name VARCHAR(100),

    date_of_birth DATE,
    gender VARCHAR(32),

    avatar_url TEXT,

    personal_email VARCHAR(320),
    personal_phone VARCHAR(64),

    address JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_employee_profiles_employee
        FOREIGN KEY (tenant_code, employee_id)
        REFERENCES employees (tenant_code, id)
        ON DELETE CASCADE
);

CREATE INDEX idx_employee_profiles_tenant_name
    ON employee_profiles (tenant_code, last_name, first_name);

-- ============================================================
-- EMPLOYMENT ASSIGNMENT
-- Effective-dated organizational placement.
-- Company / Location / Department / Grade / Job Title IDs are
-- references to Setting Service and intentionally have no FK.
-- ============================================================

CREATE TABLE employment_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_code VARCHAR(64) NOT NULL,
    employee_id UUID NOT NULL,

    company_id UUID NOT NULL,
    location_id UUID,
    department_id UUID,
    job_title_id UUID,
    grade_id UUID,

    manager_employee_id UUID,

    effective_from DATE NOT NULL,
    effective_to DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_employment_assignments_tenant_id
        UNIQUE (tenant_code, id),

    CONSTRAINT fk_employment_assignments_employee
        FOREIGN KEY (tenant_code, employee_id)
        REFERENCES employees (tenant_code, id)
        ON DELETE CASCADE,

    CONSTRAINT fk_employment_assignments_manager
        FOREIGN KEY (tenant_code, manager_employee_id)
        REFERENCES employees (tenant_code, id)
        ON DELETE SET NULL,

    CONSTRAINT chk_employment_assignments_dates
        CHECK (
            effective_to IS NULL
            OR effective_to >= effective_from
        ),

    CONSTRAINT chk_employment_assignments_not_self_manager
        CHECK (
            manager_employee_id IS NULL
            OR manager_employee_id <> employee_id
        )
);

CREATE INDEX idx_employment_assignments_employee
    ON employment_assignments (tenant_code, employee_id);

CREATE INDEX idx_employment_assignments_company
    ON employment_assignments (tenant_code, company_id);

CREATE INDEX idx_employment_assignments_department
    ON employment_assignments (tenant_code, department_id);

CREATE INDEX idx_employment_assignments_manager
    ON employment_assignments (tenant_code, manager_employee_id);

CREATE INDEX idx_employment_assignments_current
    ON employment_assignments (tenant_code, employee_id)
    WHERE effective_to IS NULL;

-- ============================================================
-- EMPLOYMENT CONTRACT
-- Legal employment contract.
-- ============================================================

CREATE TABLE employment_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_code VARCHAR(64) NOT NULL,
    employee_id UUID NOT NULL,

    contract_type employment_contract_type NOT NULL,
    contract_number VARCHAR(128),

    start_date DATE NOT NULL,
    end_date DATE,

    status employment_contract_status NOT NULL DEFAULT 'DRAFT',

    document_id UUID,

    signed_at TIMESTAMPTZ,
    terminated_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_employment_contracts_tenant_id
        UNIQUE (tenant_code, id),

    CONSTRAINT uq_employment_contracts_tenant_number
        UNIQUE (tenant_code, contract_number),

    CONSTRAINT fk_employment_contracts_employee
        FOREIGN KEY (tenant_code, employee_id)
        REFERENCES employees (tenant_code, id)
        ON DELETE CASCADE,

    CONSTRAINT chk_employment_contracts_dates
        CHECK (
            end_date IS NULL
            OR end_date >= start_date
        )
);

CREATE INDEX idx_employment_contracts_employee
    ON employment_contracts (tenant_code, employee_id);

CREATE INDEX idx_employment_contracts_status
    ON employment_contracts (tenant_code, status);

-- ============================================================
-- EMPLOYEE DOCUMENT
-- Generic employee documents.
-- ============================================================

CREATE TABLE employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_code VARCHAR(64) NOT NULL,
    employee_id UUID NOT NULL,

    document_type employee_document_type NOT NULL,
    document_number VARCHAR(128),

    file_id UUID NOT NULL,

    status employee_document_status NOT NULL DEFAULT 'PENDING',

    issued_at DATE,
    expired_at DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_employee_documents_tenant_id
        UNIQUE (tenant_code, id),

    CONSTRAINT fk_employee_documents_employee
        FOREIGN KEY (tenant_code, employee_id)
        REFERENCES employees (tenant_code, id)
        ON DELETE CASCADE,

    CONSTRAINT chk_employee_documents_dates
        CHECK (
            expired_at IS NULL
            OR issued_at IS NULL
            OR expired_at >= issued_at
        )
);

CREATE INDEX idx_employee_documents_employee
    ON employee_documents (tenant_code, employee_id);

CREATE INDEX idx_employee_documents_type_status
    ON employee_documents (tenant_code, document_type, status);

-- ============================================================
-- ONBOARDING
-- Employee onboarding workflow.
-- ============================================================

CREATE TABLE onboardings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_code VARCHAR(64) NOT NULL,
    employee_id UUID NOT NULL,

    status onboarding_status NOT NULL DEFAULT 'DRAFT',

    started_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_onboardings_tenant_id
        UNIQUE (tenant_code, id),

    CONSTRAINT uq_onboardings_employee
        UNIQUE (tenant_code, employee_id),

    CONSTRAINT fk_onboardings_employee
        FOREIGN KEY (tenant_code, employee_id)
        REFERENCES employees (tenant_code, id)
        ON DELETE CASCADE
);

CREATE INDEX idx_onboardings_status
    ON onboardings (tenant_code, status);

-- ============================================================
-- ONBOARDING REQUIREMENTS
-- Dynamic onboarding checklist.
-- ============================================================

CREATE TABLE onboarding_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_code VARCHAR(64) NOT NULL,
    onboarding_id UUID NOT NULL,

    requirement_type onboarding_requirement_type NOT NULL,

    title VARCHAR(255) NOT NULL,
    required BOOLEAN NOT NULL DEFAULT TRUE,

    status onboarding_requirement_status NOT NULL DEFAULT 'PENDING',

    document_id UUID,

    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_onboarding_requirements_tenant_id
        UNIQUE (tenant_code, id),

    CONSTRAINT fk_onboarding_requirements_onboarding
        FOREIGN KEY (tenant_code, onboarding_id)
        REFERENCES onboardings (tenant_code, id)
        ON DELETE CASCADE
);

CREATE INDEX idx_onboarding_requirements_onboarding
    ON onboarding_requirements (tenant_code, onboarding_id);

CREATE INDEX idx_onboarding_requirements_status
    ON onboarding_requirements (tenant_code, status);

-- ============================================================
-- EMPLOYEE BANK ACCOUNT
-- Sensitive financial information.
-- ============================================================

CREATE TABLE employee_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_code VARCHAR(64) NOT NULL,
    employee_id UUID NOT NULL,

    bank_name VARCHAR(255) NOT NULL,
    bank_code VARCHAR(64),
    account_number VARCHAR(128) NOT NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,

    status bank_account_status NOT NULL DEFAULT 'PENDING',
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    effective_from DATE,
    effective_to DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_employee_bank_accounts_tenant_id
        UNIQUE (tenant_code, id),

    CONSTRAINT fk_employee_bank_accounts_employee
        FOREIGN KEY (tenant_code, employee_id)
        REFERENCES employees (tenant_code, id)
        ON DELETE CASCADE,

    CONSTRAINT chk_employee_bank_accounts_dates
        CHECK (
            effective_to IS NULL
            OR effective_from IS NULL
            OR effective_to >= effective_from
        )
);

CREATE INDEX idx_employee_bank_accounts_employee
    ON employee_bank_accounts (tenant_code, employee_id);

CREATE UNIQUE INDEX uq_employee_bank_accounts_primary
    ON employee_bank_accounts (tenant_code, employee_id)
    WHERE is_primary = TRUE;

-- ============================================================
-- EMPLOYEE TAX PROFILE
-- Country-specific and effective-dated tax information.
-- ============================================================

CREATE TABLE employee_tax_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_code VARCHAR(64) NOT NULL,
    employee_id UUID NOT NULL,

    country_code VARCHAR(2) NOT NULL,
    tax_number VARCHAR(128),

    status tax_profile_status NOT NULL DEFAULT 'PENDING',

    effective_from DATE,
    effective_to DATE,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_employee_tax_profiles_tenant_id
        UNIQUE (tenant_code, id),

    CONSTRAINT fk_employee_tax_profiles_employee
        FOREIGN KEY (tenant_code, employee_id)
        REFERENCES employees (tenant_code, id)
        ON DELETE CASCADE,

    CONSTRAINT chk_employee_tax_profiles_dates
        CHECK (
            effective_to IS NULL
            OR effective_from IS NULL
            OR effective_to >= effective_from
        )
);

CREATE INDEX idx_employee_tax_profiles_employee
    ON employee_tax_profiles (tenant_code, employee_id);

CREATE INDEX idx_employee_tax_profiles_country
    ON employee_tax_profiles (tenant_code, country_code);

CREATE UNIQUE INDEX uq_employee_tax_profiles_active_country
    ON employee_tax_profiles (tenant_code, employee_id, country_code)
    WHERE status = 'ACTIVE';

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE employees IS
    'Employee HR master record. Personal information is stored in employee_profiles; organizational history is stored in employment_assignments.';

COMMENT ON TABLE employee_profiles IS
    'General and personal information of an employee.';

COMMENT ON TABLE employment_assignments IS
    'Effective-dated organizational assignment including company, location, department, job title, grade and manager.';

COMMENT ON TABLE employment_contracts IS
    'Legal employment contracts associated with an employee.';

COMMENT ON TABLE employee_documents IS
    'Generic employee documents and their verification lifecycle.';

COMMENT ON TABLE onboardings IS
    'Employee onboarding workflow state.';

COMMENT ON TABLE onboarding_requirements IS
    'Dynamic onboarding checklist requirements.';

COMMENT ON TABLE employee_bank_accounts IS
    'Employee bank account information used for financial processes.';

COMMENT ON TABLE employee_tax_profiles IS
    'Country-specific employee tax information.';
