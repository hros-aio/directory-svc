import { EventEnvelope } from '@new-hros/libs-events';
import { Grade, MasterDataStatus } from '@new-hros/libs-sql';

import { GradeProjectionRepository } from '../../repositories';
import { GradeProvisioningHandler } from '../grade-provisioning.handler';

import { GradePayload } from '@/common';

describe('GradeProvisioningHandler', () => {
  let handler: GradeProvisioningHandler;
  let gradeRepo: jest.Mocked<GradeProjectionRepository>;

  beforeEach(() => {
    gradeRepo = {
      findById: jest.fn().mockResolvedValue(null),
      upsertProjection: jest.fn().mockResolvedValue({} as unknown as Grade),
      updateStatus: jest.fn().mockResolvedValue({} as unknown as Grade),
    } as unknown as jest.Mocked<GradeProjectionRepository>;

    handler = new GradeProvisioningHandler(gradeRepo);
  });

  it('should process grade.created event', async () => {
    const envelope: EventEnvelope<GradePayload> = {
      eventId: 'evt-grd-1',
      eventType: 'setting.grade.created',
      eventVersion: 1,
      tenantCode: 'tenant-1',
      occurredAt: new Date().toISOString(),
      producer: 'setting-service',
      correlationId: 'corr-1',
      payload: {
        id: 'grd-1',
        tenantCode: 'tenant-1',
        name: 'Senior',
        status: MasterDataStatus.ACTIVE,
        version: 1,
      } as unknown as GradePayload,
    };

    await handler.handleCreated(envelope);

    expect(gradeRepo.upsertProjection).toHaveBeenCalledWith(envelope.payload);
  });

  it('should process grade.deactivated event', async () => {
    const envelope: EventEnvelope<GradePayload> = {
      eventId: 'evt-grd-2',
      eventType: 'setting.grade.deactivated',
      eventVersion: 2,
      tenantCode: 'tenant-1',
      occurredAt: new Date().toISOString(),
      producer: 'setting-service',
      correlationId: 'corr-2',
      payload: {
        id: 'grd-1',
        tenantCode: 'tenant-1',
        name: 'Senior',
        status: MasterDataStatus.INACTIVE,
        version: 2,
      } as unknown as GradePayload,
    };

    await handler.handleDeactivate(envelope);

    expect(gradeRepo.updateStatus).toHaveBeenCalledWith('grd-1', MasterDataStatus.INACTIVE, 2);
  });
});
