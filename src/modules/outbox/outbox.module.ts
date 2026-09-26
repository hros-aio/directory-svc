import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OutboxEventEntity } from './entities/outbox-event.entity';
import { OutboxRepository } from './repositories/outbox.repository';

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEventEntity])],
  providers: [OutboxRepository],
  exports: [OutboxRepository],
})
export class OutboxModule {}
