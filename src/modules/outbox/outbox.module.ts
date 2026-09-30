import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEventEntity } from '@new-hros/libs-sql';

import { OutboxRepository } from './repositories/outbox.repository';
import { OutboxService } from './services/outbox.service';

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEventEntity])],
  providers: [OutboxRepository, OutboxService],
  exports: [OutboxRepository, OutboxService],
})
export class OutboxModule {}
