import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmploymentAssignmentEntity, EmploymentContractEntity } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([EmploymentAssignmentEntity, EmploymentContractEntity])],
  controllers: [],
  providers: [],
  exports: [],
})
export class EmploymentModule {}
