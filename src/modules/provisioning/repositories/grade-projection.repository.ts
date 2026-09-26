import { Injectable } from '@nestjs/common';
import { BaseRepository, Grade, MasterDataStatus, TransactionService } from '@new-hros/libs-sql';

@Injectable()
export class GradeProjectionRepository extends BaseRepository<Grade> {
  constructor(transactionService: TransactionService) {
    super(Grade, transactionService);
  }

  async findByIdAndTenant(id: string, tenantCode: string): Promise<Grade | null> {
    return this.repository.findOne({
      where: { id, tenantCode },
    });
  }

  async upsertProjection(data: Grade): Promise<Grade> {
    const existing = await this.findById(data.id);

    if (existing) {
      return this.repository.save({ ...data, id: existing.id });
    }

    const created = this.repository.create(data);
    return this.repository.save(created);
  }

  async updateStatus(id: string, status: MasterDataStatus, version: number): Promise<Grade | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }
    existing.status = status;
    existing.version = version;
    return this.repository.save(existing);
  }
}
