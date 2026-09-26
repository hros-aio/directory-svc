import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company, Department, Grade, JobTitle, Location } from '@new-hros/libs-sql';

import {
  CompanyProvisioningHandler,
  DepartmentProvisioningHandler,
  GradeProvisioningHandler,
  JobTitleProvisioningHandler,
  LocationProvisioningHandler,
} from './handlers';
import {
  CompanyProjectionRepository,
  DepartmentProjectionRepository,
  GradeProjectionRepository,
  JobTitleProjectionRepository,
  LocationProjectionRepository,
} from './repositories';

@Module({
  imports: [TypeOrmModule.forFeature([Company, Department, Location, Grade, JobTitle])],
  controllers: [
    CompanyProvisioningHandler,
    DepartmentProvisioningHandler,
    LocationProvisioningHandler,
    GradeProvisioningHandler,
    JobTitleProvisioningHandler,
  ],
  providers: [
    CompanyProjectionRepository,
    DepartmentProjectionRepository,
    LocationProjectionRepository,
    GradeProjectionRepository,
    JobTitleProjectionRepository,
  ],
  exports: [
    CompanyProjectionRepository,
    DepartmentProjectionRepository,
    LocationProjectionRepository,
    GradeProjectionRepository,
    JobTitleProjectionRepository,
  ],
})
export class ProvisioningModule {}
