import { BaseEntity } from '@new-hros/libs-sql';
import { Column, Entity, Index, Unique } from 'typeorm';

import { OutboxStatus, TableName } from '../../../common/enums';

@Entity(TableName.OutboxEvent)
@Unique('uq_outbox_events_tenant_id', ['tenantCode', 'id'])
@Index('idx_outbox_events_status_created', ['tenantCode', 'status', 'createdAt'])
@Index('idx_outbox_events_aggregate', ['tenantCode', 'aggregateType', 'aggregateId'])
export class OutboxEventEntity extends BaseEntity {
  @Column({ name: 'aggregate_type', type: 'varchar', length: 64, nullable: false })
  aggregateType: string;

  @Column({ name: 'aggregate_id', type: 'uuid', nullable: false })
  aggregateId: string;

  @Column({ name: 'event_type', type: 'varchar', length: 128, nullable: false })
  eventType: string;

  @Column({ name: 'event_version', type: 'int', nullable: false, default: 1 })
  eventVersion: number;

  @Column({ name: 'payload', type: 'jsonb', nullable: false })
  payload: Record<string, unknown>;

  @Column({
    name: 'status',
    type: 'enum',
    enum: OutboxStatus,
    enumName: 'outbox_status',
    default: OutboxStatus.PENDING,
    nullable: false,
  })
  status: OutboxStatus;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;
}
