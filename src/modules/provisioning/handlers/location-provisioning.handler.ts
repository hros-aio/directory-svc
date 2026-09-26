import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { RequestContext, RequestContextService } from '@new-hros/libs-core';
import { EventEnvelope } from '@new-hros/libs-events';
import { MasterDataStatus } from '@new-hros/libs-sql';

import { LocationProjectionRepository } from '../repositories';

import { LocationPayload, SettingEventType } from '@/common';

@Controller()
export class LocationProvisioningHandler {
  private readonly logger = new Logger(LocationProvisioningHandler.name);

  constructor(private readonly locationRepo: LocationProjectionRepository) {}

  @EventPattern(SettingEventType.LocationCreated)
  async handleCreated(@Payload() envelope: EventEnvelope<LocationPayload>): Promise<void> {
    const payload = envelope.payload;
    if (!payload || !payload.tenantCode) {
      this.logger.warn(
        `Received ${SettingEventType.LocationCreated} event without payload or tenantCode: ${JSON.stringify(
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
      const existing = await this.locationRepo.findById(payload.id);

      // Stale event check
      if (existing && existing.version >= payload.version) {
        this.logger.warn(
          `Ignoring stale location event ${eventId} (version ${payload.version} <= current ${existing.version})`,
        );
        return;
      }

      await this.locationRepo.upsertProjection(payload);
    });
  }

  @EventPattern(SettingEventType.LocationUpdated)
  async handleUpdate(@Payload() envelope: EventEnvelope<LocationPayload>): Promise<void> {
    const payload = envelope.payload;
    if (!payload || !payload.tenantCode) {
      this.logger.warn(
        `Received ${SettingEventType.LocationUpdated} event without payload or tenantCode: ${JSON.stringify(
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
      const existing = await this.locationRepo.findById(payload.id);

      // Stale event check
      if (existing && existing.version >= payload.version) {
        this.logger.warn(
          `Ignoring stale location event ${eventId} (version ${payload.version} <= current ${existing.version})`,
        );
        return;
      }

      await this.locationRepo.upsertProjection(payload);
    });
  }

  @EventPattern(SettingEventType.LocationDeactivated)
  async handleDeactivate(@Payload() envelope: EventEnvelope<LocationPayload>): Promise<void> {
    const payload = envelope.payload;
    if (!payload || !payload.tenantCode) {
      this.logger.warn(
        `Received ${SettingEventType.LocationDeactivated} event without payload or tenantCode: ${JSON.stringify(
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
      const existing = await this.locationRepo.findById(payload.id);

      // Stale event check
      if (existing && existing.version >= payload.version) {
        this.logger.warn(
          `Ignoring stale location event ${eventId} (version ${payload.version} <= current ${existing.version})`,
        );
        return;
      }

      const version = payload.version;
      await this.locationRepo.updateStatus(payload.id, MasterDataStatus.INACTIVE, version);
    });
  }
}
