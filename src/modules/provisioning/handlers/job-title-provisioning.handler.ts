import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { RequestContext, RequestContextService } from '@new-hros/libs-core';
import { EventEnvelope } from '@new-hros/libs-events';
import { MasterDataStatus } from '@new-hros/libs-sql';

import { JobTitleProjectionRepository } from '../repositories';

import { JobTitlePayload, SettingEventType } from '@/common';

@Controller()
export class JobTitleProvisioningHandler {
  private readonly logger = new Logger(JobTitleProvisioningHandler.name);

  constructor(private readonly jobTitleRepo: JobTitleProjectionRepository) {}

  @EventPattern(SettingEventType.JobTitleCreated)
  async handleCreated(@Payload() envelope: EventEnvelope<JobTitlePayload>): Promise<void> {
    const payload = envelope.payload;
    if (!payload || !payload.tenantCode) {
      this.logger.warn(
        `Received ${SettingEventType.JobTitleCreated} event without payload or tenantCode: ${JSON.stringify(
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
      const existing = await this.jobTitleRepo.findById(payload.id);

      // Stale event check
      if (existing && existing.version >= payload.version) {
        this.logger.warn(
          `Ignoring stale job title event ${eventId} (version ${payload.version} <= current ${existing.version})`,
        );
        return;
      }

      await this.jobTitleRepo.upsertProjection(payload);
    });
  }

  @EventPattern(SettingEventType.JobTitleUpdated)
  async handleUpdate(@Payload() envelope: EventEnvelope<JobTitlePayload>): Promise<void> {
    const payload = envelope.payload;
    if (!payload || !payload.tenantCode) {
      this.logger.warn(
        `Received ${SettingEventType.JobTitleUpdated} event without payload or tenantCode: ${JSON.stringify(
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
      const existing = await this.jobTitleRepo.findById(payload.id);

      // Stale event check
      if (existing && existing.version >= payload.version) {
        this.logger.warn(
          `Ignoring stale job title event ${eventId} (version ${payload.version} <= current ${existing.version})`,
        );
        return;
      }

      await this.jobTitleRepo.upsertProjection(payload);
    });
  }

  @EventPattern(SettingEventType.JobTitleDeactivated)
  async handleDeactivate(@Payload() envelope: EventEnvelope<JobTitlePayload>): Promise<void> {
    const payload = envelope.payload;
    if (!payload || !payload.tenantCode) {
      this.logger.warn(
        `Received ${SettingEventType.JobTitleDeactivated} event without payload or tenantCode: ${JSON.stringify(
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
      const existing = await this.jobTitleRepo.findById(payload.id);

      // Stale event check
      if (existing && existing.version >= payload.version) {
        this.logger.warn(
          `Ignoring stale job title event ${eventId} (version ${payload.version} <= current ${existing.version})`,
        );
        return;
      }

      const version = payload.version;
      await this.jobTitleRepo.updateStatus(payload.id, MasterDataStatus.INACTIVE, version);
    });
  }
}
