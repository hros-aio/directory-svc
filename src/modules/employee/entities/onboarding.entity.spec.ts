import { OnboardingRequirementEntity } from './onboarding-requirement.entity';
import { OnboardingEntity } from './onboarding.entity';
import {
  OnboardingRequirementStatus,
  OnboardingRequirementType,
  OnboardingStatus,
} from '../../../common/enums';

describe('Onboarding and Requirement Entities', () => {
  it('should instantiate OnboardingEntity and OnboardingRequirementEntity', () => {
    const onboarding = new OnboardingEntity();
    onboarding.id = 'o1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    onboarding.tenantCode = 'DEFAULT';
    onboarding.employeeId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    onboarding.status = OnboardingStatus.IN_PROGRESS;
    onboarding.startedAt = new Date('2026-01-01');

    const req = new OnboardingRequirementEntity();
    req.id = 'r1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    req.tenantCode = 'DEFAULT';
    req.onboardingId = onboarding.id;
    req.requirementType = OnboardingRequirementType.PERSONAL_INFORMATION;
    req.title = 'Complete Personal Details';
    req.required = true;
    req.status = OnboardingRequirementStatus.COMPLETED;

    expect(onboarding.status).toBe(OnboardingStatus.IN_PROGRESS);
    expect(req.requirementType).toBe(OnboardingRequirementType.PERSONAL_INFORMATION);
    expect(req.required).toBe(true);
    expect(req.status).toBe(OnboardingRequirementStatus.COMPLETED);
  });
});
