import { Injectable } from '@nestjs/common';
import { BaseRepository, TransactionService } from '@new-hros/libs-sql';

import { OutboxEventEntity } from '../entities/outbox-event.entity';

@Injectable()
export class OutboxRepository extends BaseRepository<OutboxEventEntity> {
  constructor(transactionService: TransactionService) {
    super(OutboxEventEntity, transactionService);
  }

  async createAndSave(data: Partial<OutboxEventEntity>): Promise<OutboxEventEntity> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }
}
