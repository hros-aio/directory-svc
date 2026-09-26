import { EventEnvelope } from '@new-hros/libs-events';
import { JobTitle, MasterDataStatus } from '@new-hros/libs-sql';

import { JobTitleProjectionRepository } from '../../repositories';
import { JobTitleProvisioningHandler } from '../job-title-provisioning.handler';

import { JobTitlePayload } from '@/common';

describe('JobTitleProvisioningHandler', () => {
  let handler: JobTitleProvisioningHandler;
  let jobTitleRepo: jest.Mocked<JobTitleProjectionRepository>;

  beforeEach(() => {
    jobTitleRepo = {
      findById: jest.fn().mockResolvedValue(null),
      upsertProjection: jest.fn().mockResolvedValue({} as unknown as JobTitle),
      updateStatus: jest.fn().mockResolvedValue({} as unknown as JobTitle),
    } as unknown as jest.Mocked<JobTitleProjectionRepository>;

    handler = new JobTitleProvisioningHandler(jobTitleRepo);
  });

  it('should process job_title.created event', async () => {
    const envelope: EventEnvelope<JobTitlePayload> = {
      id: 'evt-jt-1',
      topic: 'setting.job_title.created',
      producer: 'setting-service',
      timestamp: new Date().toISOString(),
      version: '1',
      correlationId: 'corr-1',
      payload: {
        id: 'jt-1',
        tenantCode: 'tenant-1',
        name: 'Software Engineer',
        status: MasterDataStatus.ACTIVE,
        version: 1,
      } as unknown as JobTitlePayload,
    };

    await handler.handleCreated(envelope);

    expect(jobTitleRepo.upsertProjection).toHaveBeenCalledWith(envelope.payload);
  });

  it('should process job_title.deactivated event', async () => {
    const envelope: EventEnvelope<JobTitlePayload> = {
      id: 'evt-jt-2',
      topic: 'setting.job_title.deactivated',
      producer: 'setting-service',
      timestamp: new Date().toISOString(),
      version: '2',
      correlationId: 'corr-2',
      payload: {
        id: 'jt-1',
        tenantCode: 'tenant-1',
        name: 'Software Engineer',
        status: MasterDataStatus.INACTIVE,
        version: 2,
      } as unknown as JobTitlePayload,
    };

    await handler.handleDeactivate(envelope);

    expect(jobTitleRepo.updateStatus).toHaveBeenCalledWith('jt-1', MasterDataStatus.INACTIVE, 2);
  });
});
