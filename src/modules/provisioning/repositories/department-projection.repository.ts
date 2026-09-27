import { Injectable } from '@nestjs/common';
import {
  BaseRepository,
  Department,
  MasterDataStatus,
  TransactionService,
} from '@new-hros/libs-sql';

@Injectable()
export class DepartmentProjectionRepository extends BaseRepository<Department> {
  constructor(transactionService: TransactionService) {
    super(Department, transactionService);
  }

  async upsertProjection(data: Department): Promise<Department> {
    const existing = await this.findById(data.id);

    if (existing) {
      return this.repository.save({ ...data, id: existing.id });
    }

    const created = this.repository.create(data);
    return this.repository.save(created);
  }

  async updateStatus(
    id: string,
    status: MasterDataStatus,
    version: number,
  ): Promise<Department | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }
    existing.status = status;
    existing.version = version;
    return this.repository.save(existing);
  }
}
