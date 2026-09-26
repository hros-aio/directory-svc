export enum TableName {
  EmployeeBankAccount = 'employee_bank_accounts',
  EmployeeDocument = 'employee_documents',
  EmployeeProfile = 'employee_profiles',
  EmployeeTaxProfile = 'employee_tax_profiles',
  Employee = 'employees',
  OnboardingRequirement = 'onboarding_requirements',
  Onboarding = 'onboardings',
  EmploymentAssignment = 'employment_assignments',
  EmploymentContract = 'employment_contracts',

  // Provisioning & Master Projections
  ProcessedEvent = 'processed_events',
  CompanyProjection = 'company_projections',
  DepartmentProjection = 'department_projections',
  LocationProjection = 'location_projections',
  GradeProjection = 'grade_projections',
  JobTitleProjection = 'job_title_projections',

  // Outbox
  OutboxEvent = 'outbox_events',
}
