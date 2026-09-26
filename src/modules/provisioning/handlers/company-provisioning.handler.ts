import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { RequestContext, RequestContextService } from '@new-hros/libs-core';
import { EventEnvelope } from '@new-hros/libs-events';
import { CompanyStatus } from '@new-hros/libs-sql';

import { CompanyProjectionRepository } from '../repositories';

import { CompanyPayload, SettingEventType } from '@/common';

@Controller()
export class CompanyProvisioningHandler {
  private readonly logger = new Logger(CompanyProvisioningHandler.name);
  constructor(private readonly companyRepo: CompanyProjectionRepository) {}

  @EventPattern(SettingEventType.CompanyCreated)
  async handleCreated(@Payload() envelope: EventEnvelope<CompanyPayload>): Promise<void> {
    const payload = envelope.payload;
    if (!payload || !payload.tenantCode) {
      this.logger.warn(
        `Received ${SettingEventType.CompanyCreated} event without payload or tenantCode: ${JSON.stringify(
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
      const existing = await this.companyRepo.findById(payload.id);

      // Stale event check
      if (existing && existing.version >= payload.version) {
        this.logger.warn(
          `Ignoring stale company event ${eventId} (version ${payload.version} <= current ${existing.version})`,
        );
        return;
      }

      await this.companyRepo.upsertProjection(payload);
    });
  }

  @EventPattern(SettingEventType.CompanyUpdated)
  async handleUpdate(@Payload() envelope: EventEnvelope<CompanyPayload>): Promise<void> {
    const payload = envelope.payload;
    if (!payload || !payload.tenantCode) {
      this.logger.warn(
        `Received ${SettingEventType.CompanyUpdated} event without payload or tenantCode: ${JSON.stringify(
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
      const existing = await this.companyRepo.findById(payload.id);

      // Stale event check
      if (existing && existing.version >= payload.version) {
        this.logger.warn(
          `Ignoring stale company event ${eventId} (version ${payload.version} <= current ${existing.version})`,
        );
        return;
      }

      await this.companyRepo.upsertProjection(payload);
    });
  }

  @EventPattern(SettingEventType.CompanyActivated)
  async handleActivate(@Payload() envelope: EventEnvelope<CompanyPayload>): Promise<void> {
    const payload = envelope.payload;
    if (!payload || !payload.tenantCode) {
      this.logger.warn(
        `Received ${SettingEventType.CompanyActivated} event without payload or tenantCode: ${JSON.stringify(
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
      const existing = await this.companyRepo.findById(payload.id);

      // Stale event check
      if (existing && existing.version >= payload.version) {
        this.logger.warn(
          `Ignoring stale company event ${eventId} (version ${payload.version} <= current ${existing.version})`,
        );
        return;
      }

      const version = payload.version;
      await this.companyRepo.updateStatus(payload.id, CompanyStatus.ACTIVE, version);
    });
  }
}
