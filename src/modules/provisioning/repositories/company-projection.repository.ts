import { Injectable } from '@nestjs/common';
import { BaseRepository, Company, CompanyStatus, TransactionService } from '@new-hros/libs-sql';

@Injectable()
export class CompanyProjectionRepository extends BaseRepository<Company> {
  constructor(transactionService: TransactionService) {
    super(Company, transactionService);
  }

  async findByIdAndTenant(id: string, tenantCode: string): Promise<Company | null> {
    return this.repository.findOne({
      where: { id, tenantCode },
    });
  }

  async upsertProjection(data: Company): Promise<Company> {
    const existing = await this.findById(data.id);

    if (existing) {
      return this.repository.save({ ...data, id: existing.id });
    }

    const created = this.repository.create(data);
    return this.repository.save(created);
  }

  async updateStatus(id: string, status: CompanyStatus, version: number): Promise<Company | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }
    existing.status = status;
    existing.version = version;
    return this.repository.save(existing);
  }
}
