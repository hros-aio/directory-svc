import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  EmployeeBankAccountEntity,
  EmployeeDocumentEntity,
  EmployeeEntity,
  EmployeeProfileEntity,
  EmployeeTaxProfileEntity,
  OnboardingEntity,
  OnboardingRequirementEntity,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmployeeEntity,
      EmployeeProfileEntity,
      EmployeeDocumentEntity,
      EmployeeBankAccountEntity,
      EmployeeTaxProfileEntity,
      OnboardingEntity,
      OnboardingRequirementEntity,
    ]),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class EmployeeModule {}
