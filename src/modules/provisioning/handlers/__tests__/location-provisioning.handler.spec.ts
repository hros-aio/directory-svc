import { EventEnvelope } from '@new-hros/libs-events';
import { Location, MasterDataStatus } from '@new-hros/libs-sql';

import { LocationProjectionRepository } from '../../repositories';
import { LocationProvisioningHandler } from '../location-provisioning.handler';

import { LocationPayload } from '@/common';

describe('LocationProvisioningHandler', () => {
  let handler: LocationProvisioningHandler;
  let locationRepo: jest.Mocked<LocationProjectionRepository>;

  beforeEach(() => {
    locationRepo = {
      findById: jest.fn().mockResolvedValue(null),
      upsertProjection: jest.fn().mockResolvedValue({} as unknown as Location),
      updateStatus: jest.fn().mockResolvedValue({} as unknown as Location),
    } as unknown as jest.Mocked<LocationProjectionRepository>;

    handler = new LocationProvisioningHandler(locationRepo);
  });

  it('should process location.created event', async () => {
    const envelope: EventEnvelope<LocationPayload> = {
      id: 'evt-loc-1',
      topic: 'setting.location.created',
      producer: 'setting-service',
      timestamp: new Date().toISOString(),
      version: '1',
      correlationId: 'corr-1',
      payload: {
        id: 'loc-1',
        tenantCode: 'tenant-1',
        companyId: 'comp-1',
        name: 'Headquarters',
        status: MasterDataStatus.ACTIVE,
        version: 1,
      } as unknown as LocationPayload,
    };

    await handler.handleCreated(envelope);

    expect(locationRepo.upsertProjection).toHaveBeenCalledWith(envelope.payload);
  });

  it('should process location.deactivated event', async () => {
    const envelope: EventEnvelope<LocationPayload> = {
      id: 'evt-loc-2',
      topic: 'setting.location.deactivated',
      producer: 'setting-service',
      timestamp: new Date().toISOString(),
      version: '2',
      correlationId: 'corr-2',
      payload: {
        id: 'loc-1',
        tenantCode: 'tenant-1',
        companyId: 'comp-1',
        name: 'Headquarters',
        status: MasterDataStatus.INACTIVE,
        version: 2,
      } as unknown as LocationPayload,
    };

    await handler.handleDeactivate(envelope);

    expect(locationRepo.updateStatus).toHaveBeenCalledWith('loc-1', MasterDataStatus.INACTIVE, 2);
  });
});
