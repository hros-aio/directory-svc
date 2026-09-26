import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { RequestContext, RequestContextService } from '@new-hros/libs-core';
import { EventEnvelope } from '@new-hros/libs-events';
import { MasterDataStatus } from '@new-hros/libs-sql';

import { DepartmentProjectionRepository } from '../repositories';

import { DepartmentPayload, SettingEventType } from '@/common';

@Controller()
export class DepartmentProvisioningHandler {
  private readonly logger = new Logger(DepartmentProvisioningHandler.name);

  constructor(private readonly departmentRepo: DepartmentProjectionRepository) {}

  @EventPattern(SettingEventType.DepartmentCreated)
  async handleCreated(@Payload() envelope: EventEnvelope<DepartmentPayload>): Promise<void> {
    const payload = envelope.payload;
    if (!payload || !payload.tenantCode) {
      this.logger.warn(
        `Received ${SettingEventType.DepartmentCreated} event without payload or tenantCode: ${JSON.stringify(
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
      const existing = await this.departmentRepo.findById(payload.id);

      // Stale event check
      if (existing && existing.version >= payload.version) {
        this.logger.warn(
          `Ignoring stale department event ${eventId} (version ${payload.version} <= current ${existing.version})`,
        );
        return;
      }

      await this.departmentRepo.upsertProjection(payload);
    });
  }

  @EventPattern(SettingEventType.DepartmentUpdated)
  async handleUpdate(@Payload() envelope: EventEnvelope<DepartmentPayload>): Promise<void> {
    const payload = envelope.payload;
    if (!payload || !payload.tenantCode) {
      this.logger.warn(
        `Received ${SettingEventType.DepartmentUpdated} event without payload or tenantCode: ${JSON.stringify(
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
      const existing = await this.departmentRepo.findById(payload.id);

      // Stale event check
      if (existing && existing.version >= payload.version) {
        this.logger.warn(
          `Ignoring stale department event ${eventId} (version ${payload.version} <= current ${existing.version})`,
        );
        return;
      }

      await this.departmentRepo.upsertProjection(payload);
    });
  }

  @EventPattern(SettingEventType.DepartmentDeactivated)
  async handleDeactivate(@Payload() envelope: EventEnvelope<DepartmentPayload>): Promise<void> {
    const payload = envelope.payload;
    if (!payload || !payload.tenantCode) {
      this.logger.warn(
        `Received ${SettingEventType.DepartmentDeactivated} event without payload or tenantCode: ${JSON.stringify(
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
      const existing = await this.departmentRepo.findById(payload.id);

      // Stale event check
      if (existing && existing.version >= payload.version) {
        this.logger.warn(
          `Ignoring stale department event ${eventId} (version ${payload.version} <= current ${existing.version})`,
        );
        return;
      }

      const version = payload.version;
      await this.departmentRepo.updateStatus(payload.id, MasterDataStatus.INACTIVE, version);
    });
  }
}
