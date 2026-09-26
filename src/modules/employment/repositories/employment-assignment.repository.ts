import { Injectable } from '@nestjs/common';
import { BaseRepository, TransactionService } from '@new-hros/libs-sql';
import { IsNull } from 'typeorm';

import { EmploymentAssignmentEntity } from '../entities/employment-assignment.entity';

@Injectable()
export class EmploymentAssignmentRepository extends BaseRepository<EmploymentAssignmentEntity> {
  constructor(transactionService: TransactionService) {
    super(EmploymentAssignmentEntity, transactionService);
  }

  async findCurrentAssignment(
    employeeId: string,
    tenantCode: string,
  ): Promise<EmploymentAssignmentEntity | null> {
    return this.repository.findOne({
      where: {
        employeeId,
        tenantCode,
        effectiveTo: IsNull(),
      },
    });
  }

  async createAndSave(
    data: Partial<EmploymentAssignmentEntity>,
  ): Promise<EmploymentAssignmentEntity> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }
}
