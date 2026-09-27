import { Injectable } from '@nestjs/common';
import { BaseRepository, TransactionService } from '@new-hros/libs-sql';

import { OutboxEventEntity } from '../entities/outbox-event.entity';

@Injectable()
export class OutboxRepository extends BaseRepository<OutboxEventEntity> {
  constructor(transactionService: TransactionService) {
    super(OutboxEventEntity, transactionService);
  }
}
