import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmploymentAssignmentEntity, EmploymentContractEntity } from './entities';
import { EmploymentAssignmentRepository } from './repositories/employment-assignment.repository';

@Module({
  imports: [TypeOrmModule.forFeature([EmploymentAssignmentEntity, EmploymentContractEntity])],
  controllers: [],
  providers: [EmploymentAssignmentRepository],
  exports: [EmploymentAssignmentRepository],
})
export class EmploymentModule {}
