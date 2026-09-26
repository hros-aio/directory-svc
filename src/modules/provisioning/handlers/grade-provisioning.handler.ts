import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { RequestContext, RequestContextService } from '@new-hros/libs-core';
import { EventEnvelope } from '@new-hros/libs-events';
import { MasterDataStatus } from '@new-hros/libs-sql';

import { GradeProjectionRepository } from '../repositories';

import { GradePayload, SettingEventType } from '@/common';

@Controller()
export class GradeProvisioningHandler {
  private readonly logger = new Logger(GradeProvisioningHandler.name);

  constructor(private readonly gradeRepo: GradeProjectionRepository) {}

  @EventPattern(SettingEventType.GradeCreated)
  async handleCreated(@Payload() envelope: EventEnvelope<GradePayload>): Promise<void> {
    const payload = envelope.payload;
    if (!payload || !payload.tenantCode) {
      this.logger.warn(
        `Received ${SettingEventType.GradeCreated} event without payload or tenantCode: ${JSON.stringify(
          envelope,
        )}`,
      );
      return;
    }

    const eventId = envelope.id;
    const tenantCode = payload.tenantCode;

    const context: RequestContext = {
      traceId: envelope.correlationId || eventId,
      requestId: eventId,
      tenantCode,
      clientMetadata: {
        ip: '127.0.0.1',
      },
      requestTimestamp: new Date(),
    };

    return RequestContextService.run(context, async () => {
      const existing = await this.gradeRepo.findById(payload.id);

      // Stale event check
      if (existing && existing.version >= payload.version) {
        this.logger.warn(
          `Ignoring stale grade event ${eventId} (version ${payload.version} <= current ${existing.version})`,
        );
        return;
      }

      await this.gradeRepo.upsertProjection(payload);
    });
  }

  @EventPattern(SettingEventType.GradeUpdated)
  async handleUpdate(@Payload() envelope: EventEnvelope<GradePayload>): Promise<void> {
    const payload = envelope.payload;
    if (!payload || !payload.tenantCode) {
      this.logger.warn(
        `Received ${SettingEventType.GradeUpdated} event without payload or tenantCode: ${JSON.stringify(
          envelope,
        )}`,
      );
      return;
    }

    const eventId = envelope.id;
    const tenantCode = payload.tenantCode;

    const context: RequestContext = {
      traceId: envelope.correlationId || eventId,
      requestId: eventId,
      tenantCode,
      clientMetadata: {
        ip: '127.0.0.1',
      },
      requestTimestamp: new Date(),
    };

    return RequestContextService.run(context, async () => {
      const existing = await this.gradeRepo.findById(payload.id);

      // Stale event check
      if (existing && existing.version >= payload.version) {
        this.logger.warn(
          `Ignoring stale grade event ${eventId} (version ${payload.version} <= current ${existing.version})`,
        );
        return;
      }

      await this.gradeRepo.upsertProjection(payload);
    });
  }

  @EventPattern(SettingEventType.GradeDeactivated)
  async handleDeactivate(@Payload() envelope: EventEnvelope<GradePayload>): Promise<void> {
    const payload = envelope.payload;
    if (!payload || !payload.tenantCode) {
      this.logger.warn(
        `Received ${SettingEventType.GradeDeactivated} event without payload or tenantCode: ${JSON.stringify(
          envelope,
        )}`,
      );
      return;
    }

    const eventId = envelope.id;
    const tenantCode = payload.tenantCode;

    const context: RequestContext = {
      traceId: envelope.correlationId || eventId,
      requestId: eventId,
      tenantCode,
      clientMetadata: {
        ip: '127.0.0.1',
      },
      requestTimestamp: new Date(),
    };

    return RequestContextService.run(context, async () => {
      const existing = await this.gradeRepo.findById(payload.id);

      // Stale event check
      if (existing && existing.version >= payload.version) {
        this.logger.warn(
          `Ignoring stale grade event ${eventId} (version ${payload.version} <= current ${existing.version})`,
        );
        return;
      }

      const version = payload.version;
      await this.gradeRepo.updateStatus(payload.id, MasterDataStatus.INACTIVE, version);
    });
  }
}
