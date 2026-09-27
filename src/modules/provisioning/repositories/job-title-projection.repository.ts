import { Injectable } from '@nestjs/common';
import { BaseRepository, JobTitle, MasterDataStatus, TransactionService } from '@new-hros/libs-sql';

@Injectable()
export class JobTitleProjectionRepository extends BaseRepository<JobTitle> {
  constructor(transactionService: TransactionService) {
    super(JobTitle, transactionService);
  }

  async upsertProjection(data: JobTitle): Promise<JobTitle> {
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
  ): Promise<JobTitle | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }
    existing.status = status;
    existing.version = version;
    return this.repository.save(existing);
  }
}
