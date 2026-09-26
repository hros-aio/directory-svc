import { EventEnvelope } from '@new-hros/libs-events';
import { Company, CompanyStatus } from '@new-hros/libs-sql';

import { CompanyProjectionRepository } from '../../repositories';
import { CompanyProvisioningHandler } from '../company-provisioning.handler';

import { CompanyPayload } from '@/common';

describe('CompanyProvisioningHandler', () => {
  let handler: CompanyProvisioningHandler;
  let companyRepo: jest.Mocked<CompanyProjectionRepository>;

  beforeEach(() => {
    companyRepo = {
      findById: jest.fn().mockResolvedValue(null),
      upsertProjection: jest.fn().mockResolvedValue({} as unknown as Company),
      updateStatus: jest.fn().mockResolvedValue({} as unknown as Company),
    } as unknown as jest.Mocked<CompanyProjectionRepository>;

    handler = new CompanyProvisioningHandler(companyRepo);
  });

  it('should process company.created event successfully', async () => {
    const envelope: EventEnvelope<CompanyPayload> = {
      id: 'evt-1',
      topic: 'setting.company.created',
      producer: 'setting-service',
      timestamp: new Date().toISOString(),
      version: '1',
      correlationId: 'corr-1',
      payload: {
        id: 'comp-1',
        tenantCode: 'tenant-1',
        code: 'ACME',
        name: 'Acme Corp',
        status: CompanyStatus.ACTIVE,
        version: 1,
      } as unknown as CompanyPayload,
    };

    await handler.handleCreated(envelope);

    expect(companyRepo.upsertProjection).toHaveBeenCalledWith(envelope.payload);
  });

  it('should process company.activated event', async () => {
    const envelope: EventEnvelope<CompanyPayload> = {
      id: 'evt-2',
      topic: 'setting.company.activated',
      producer: 'setting-service',
      timestamp: new Date().toISOString(),
      version: '2',
      correlationId: 'corr-2',
      payload: {
        id: 'comp-1',
        tenantCode: 'tenant-1',
        code: 'ACME',
        name: 'Acme Corp',
        status: CompanyStatus.ACTIVE,
        version: 2,
      } as unknown as CompanyPayload,
    };

    await handler.handleActivate(envelope);

    expect(companyRepo.updateStatus).toHaveBeenCalledWith('comp-1', CompanyStatus.ACTIVE, 2);
  });

  it('should skip stale event if local version is higher', async () => {
    companyRepo.findById.mockResolvedValueOnce({
      id: 'comp-1',
      tenantCode: 'tenant-1',
      code: 'ACME',
      name: 'Acme Corp',
      status: CompanyStatus.ACTIVE,
      version: 5,
    } as unknown as Company);

    const envelope: EventEnvelope<CompanyPayload> = {
      id: 'evt-stale',
      topic: 'setting.company.updated',
      producer: 'setting-service',
      timestamp: new Date().toISOString(),
      version: '3',
      correlationId: 'corr-3',
      payload: {
        id: 'comp-1',
        tenantCode: 'tenant-1',
        code: 'ACME-OLD',
        name: 'Old',
        status: CompanyStatus.ACTIVE,
        version: 3,
      } as unknown as CompanyPayload,
    };

    await handler.handleUpdate(envelope);

    expect(companyRepo.upsertProjection).not.toHaveBeenCalled();
  });
});
