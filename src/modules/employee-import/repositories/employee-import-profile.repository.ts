import { Injectable } from '@nestjs/common';
import { BaseRepository, TransactionService } from '@new-hros/libs-sql';
import { FindOptionsWhere, IsNull } from 'typeorm';

import { EmployeeImportProfileEntity } from '../entities/employee-import-profile.entity';

@Injectable()
export class EmployeeImportProfileRepository extends BaseRepository<EmployeeImportProfileEntity> {
  constructor(transactionService: TransactionService) {
    super(EmployeeImportProfileEntity, transactionService);
  }

  async findByNameAndTenant(
    name: string,
    tenantCode: string | null,
    companyId?: string | null,
  ): Promise<EmployeeImportProfileEntity | null> {
    if (!tenantCode) {
      return this.findOne({ name, tenantCode: IsNull() }, { withTenancy: false });
    }

    const whereClause: FindOptionsWhere<EmployeeImportProfileEntity> = companyId
      ? { name, tenantCode, companyId }
      : { name, tenantCode, companyId: IsNull() };

    return this.findOne(whereClause, { withTenancy: false });
  }

  async findAccessibleProfiles(
    tenantCode: string,
    isActive?: boolean,
    companyId?: string,
  ): Promise<EmployeeImportProfileEntity[]> {
    let baseConditions: FindOptionsWhere<EmployeeImportProfileEntity>[];

    if (companyId) {
      baseConditions = [
        { tenantCode, companyId },
        { tenantCode, companyId: IsNull() },
        { tenantCode: IsNull() },
      ];
    } else {
      baseConditions = [{ tenantCode }, { tenantCode: IsNull() }];
    }

    const where =
      typeof isActive === 'boolean'
        ? baseConditions.map((cond) => ({ ...cond, isActive }))
        : baseConditions;

    return this.repository.find({
      where,
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findByIdAccessible(
    id: string,
    tenantCode: string,
  ): Promise<EmployeeImportProfileEntity | null> {
    return this.repository.findOne({
      where: [
        { id, tenantCode },
        { id, tenantCode: IsNull() },
      ],
    });
  }

  async updateWithVersion(
    id: string,
    expectedVersion: number,
    data: Partial<EmployeeImportProfileEntity>,
  ): Promise<boolean> {
    const repo = this.repository;
    const result = await repo
      .createQueryBuilder()
      .update(EmployeeImportProfileEntity)
      .set({
        ...data,
        version: () => 'version + 1',
        updatedAt: new Date(),
      })
      .where('id = :id AND version = :expectedVersion', { id, expectedVersion })
      .execute();

    return (result.affected ?? 0) > 0;
  }
}
