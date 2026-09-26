import { Injectable } from '@nestjs/common';
import { BaseRepository, Location, MasterDataStatus, TransactionService } from '@new-hros/libs-sql';

@Injectable()
export class LocationProjectionRepository extends BaseRepository<Location> {
  constructor(transactionService: TransactionService) {
    super(Location, transactionService);
  }

  async upsertProjection(data: Location): Promise<Location> {
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
  ): Promise<Location | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }
    existing.status = status;
    existing.version = version;
    return this.repository.save(existing);
  }
}
