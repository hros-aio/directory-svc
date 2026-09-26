import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmployeeController } from './controllers/employee.controller';
import {
  EmployeeBankAccountEntity,
  EmployeeDocumentEntity,
  EmployeeEntity,
  EmployeeProfileEntity,
  EmployeeTaxProfileEntity,
  OnboardingEntity,
  OnboardingRequirementEntity,
} from './entities';
import { EmployeeProfileRepository } from './repositories/employee-profile.repository';
import { EmployeeRepository } from './repositories/employee.repository';
import { EmployeeService } from './services/employee.service';
import { EmployeeReferenceValidator } from './validators/employee-reference.validator';
import { ManagerValidator } from './validators/manager.validator';
import { EmploymentModule } from '../employment/employment.module';
import { OutboxModule } from '../outbox/outbox.module';
import { ProvisioningModule } from '../provisioning/provisioning.module';

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
    EmploymentModule,
    ProvisioningModule,
    OutboxModule,
  ],
  controllers: [EmployeeController],
  providers: [
    EmployeeService,
    EmployeeRepository,
    EmployeeProfileRepository,
    EmployeeReferenceValidator,
    ManagerValidator,
  ],
  exports: [EmployeeService, EmployeeRepository, EmployeeProfileRepository],
})
export class EmployeeModule {}
