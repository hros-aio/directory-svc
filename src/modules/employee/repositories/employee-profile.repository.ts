import { Injectable } from '@nestjs/common';
import { BaseRepository, TransactionService } from '@new-hros/libs-sql';

import { EmployeeProfileEntity } from '../entities/employee-profile.entity';

@Injectable()
export class EmployeeProfileRepository extends BaseRepository<EmployeeProfileEntity> {
  constructor(transactionService: TransactionService) {
    super(EmployeeProfileEntity, transactionService);
  }
}
