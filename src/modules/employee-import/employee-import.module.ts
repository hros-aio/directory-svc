import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmployeeImportProfileController } from './controllers/employee-import-profile.controller';
import { EmployeeImportJobEntity } from './entities/employee-import-job.entity';
import { EmployeeImportProfileEntity } from './entities/employee-import-profile.entity';
import { EmployeeImportJobRepository } from './repositories/employee-import-job.repository';
import { EmployeeImportProfileRepository } from './repositories/employee-import-profile.repository';
import { ConfigurationResolverService } from './services/configuration-resolver.service';
import { EmployeeImportJobService } from './services/employee-import-job.service';
import { EmployeeImportProfileService } from './services/employee-import-profile.service';
import { ConfigurationValidator } from './validators/configuration.validator';
import { ProvisioningModule } from '../provisioning/provisioning.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeImportProfileEntity, EmployeeImportJobEntity]),
    ProvisioningModule,
  ],
  controllers: [EmployeeImportProfileController],
  providers: [
    ConfigurationValidator,
    ConfigurationResolverService,
    EmployeeImportProfileRepository,
    EmployeeImportJobRepository,
    EmployeeImportProfileService,
    EmployeeImportJobService,
  ],
  exports: [
    ConfigurationValidator,
    ConfigurationResolverService,
    EmployeeImportProfileRepository,
    EmployeeImportJobRepository,
    EmployeeImportProfileService,
    EmployeeImportJobService,
  ],
})
export class EmployeeImportModule {}
