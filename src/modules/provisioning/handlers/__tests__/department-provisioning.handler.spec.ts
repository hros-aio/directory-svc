import { EventEnvelope } from '@new-hros/libs-events';
import { Department, MasterDataStatus } from '@new-hros/libs-sql';

import { DepartmentProjectionRepository } from '../../repositories';
import { DepartmentProvisioningHandler } from '../department-provisioning.handler';

import { DepartmentPayload } from '@/common';

describe('DepartmentProvisioningHandler', () => {
  let handler: DepartmentProvisioningHandler;
  let departmentRepo: jest.Mocked<DepartmentProjectionRepository>;

  beforeEach(() => {
    departmentRepo = {
      findById: jest.fn().mockResolvedValue(null),
      upsertProjection: jest.fn().mockResolvedValue({} as unknown as Department),
      updateStatus: jest.fn().mockResolvedValue({} as unknown as Department),
    } as unknown as jest.Mocked<DepartmentProjectionRepository>;

    handler = new DepartmentProvisioningHandler(departmentRepo);
  });

  it('should process department.created event', async () => {
    const envelope: EventEnvelope<DepartmentPayload> = {
      eventId: 'evt-dept-1',
      eventType: 'setting.department.created',
      eventVersion: 1,
      tenantCode: 'tenant-1',
      occurredAt: new Date().toISOString(),
      producer: 'setting-service',
      correlationId: 'corr-1',
      payload: {
        id: 'dept-1',
        tenantCode: 'tenant-1',
        companyId: 'comp-1',
        name: 'Engineering',
        status: MasterDataStatus.ACTIVE,
        version: 1,
      } as unknown as DepartmentPayload,
    };

    await handler.handleCreated(envelope);

    expect(departmentRepo.upsertProjection).toHaveBeenCalledWith(envelope.payload);
  });

  it('should process department.deactivated event', async () => {
    const envelope: EventEnvelope<DepartmentPayload> = {
      eventId: 'evt-dept-2',
      eventType: 'setting.department.deactivated',
      eventVersion: 2,
      tenantCode: 'tenant-1',
      occurredAt: new Date().toISOString(),
      producer: 'setting-service',
      correlationId: 'corr-2',
      payload: {
        id: 'dept-1',
        tenantCode: 'tenant-1',
        companyId: 'comp-1',
        name: 'Engineering',
        status: MasterDataStatus.INACTIVE,
        version: 2,
      } as unknown as DepartmentPayload,
    };

    await handler.handleDeactivate(envelope);

    expect(departmentRepo.updateStatus).toHaveBeenCalledWith(
      'dept-1',
      MasterDataStatus.INACTIVE,
      2,
    );
  });
});
