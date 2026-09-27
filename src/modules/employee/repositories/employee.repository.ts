import { Injectable } from '@nestjs/common';
import { BaseRepository, TransactionService } from '@new-hros/libs-sql';

import { EmployeeEntity } from '../entities/employee.entity';

@Injectable()
export class EmployeeRepository extends BaseRepository<EmployeeEntity> {
  constructor(transactionService: TransactionService) {
    super(EmployeeEntity, transactionService);
  }

  async findByCode(employeeCode: string): Promise<EmployeeEntity | null> {
    return this.findOne({ employeeCode });
  }

  async createAndSave(data: Partial<EmployeeEntity>): Promise<EmployeeEntity> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }
}
