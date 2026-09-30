import { Injectable } from '@nestjs/common';
import { BaseRepository, OutboxEventEntity, TransactionService } from '@new-hros/libs-sql';

@Injectable()
export class OutboxRepository extends BaseRepository<OutboxEventEntity> {
  constructor(transactionService: TransactionService) {
    super(OutboxEventEntity, transactionService);
  }
}
