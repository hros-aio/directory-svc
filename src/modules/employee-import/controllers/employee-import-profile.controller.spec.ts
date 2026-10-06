import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard, PermissionGuard } from '@new-hros/libs-apis';

import { EmployeeImportProfileController } from './employee-import-profile.controller';
import { ImportRowErrorMode } from '../../../common/enums';
import type {
  CreateImportProfileDto,
  ImportProfileResponseDto,
  UpdateImportProfileDto,
} from '../dto';
import { EmployeeImportProfileService } from '../services/employee-import-profile.service';

describe('EmployeeImportProfileController', () => {
  let controller: EmployeeImportProfileController;
  let service: jest.Mocked<EmployeeImportProfileService>;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      list: jest.fn(),
      getById: jest.fn(),
      update: jest.fn(),
      activate: jest.fn(),
      deactivate: jest.fn(),
    } as unknown as jest.Mocked<EmployeeImportProfileService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeImportProfileController],
      providers: [{ provide: EmployeeImportProfileService, useValue: service }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<EmployeeImportProfileController>(EmployeeImportProfileController);
  });

  it('should delegate create request to EmployeeImportProfileService', async () => {
    const dto: CreateImportProfileDto = {
      name: 'Test Profile',
      config: {
        errorPolicy: { mode: ImportRowErrorMode.CONTINUE_ON_ROW_ERROR },
        retryPolicy: {
          maxAttempts: 3,
          initialDelayMs: 1000,
          maxDelayMs: 30000,
          backoffMultiplier: 2,
        },
        timeoutPolicy: {
          jobTimeoutSeconds: 1800,
          batchTimeoutSeconds: 60,
          idleTimeoutSeconds: 300,
        },
        executionPolicy: { batchSize: 500, maxConcurrentBatches: 1 },
      },
    };

    const expected = { id: 'prof-1', name: 'Test Profile' } as unknown as ImportProfileResponseDto;
    service.create.mockResolvedValue(expected);

    const result = await controller.create(dto);
    expect(result).toBe(expected);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should delegate list request with active filter', async () => {
    service.list.mockResolvedValue([]);
    await controller.list('true');
    expect(service.list).toHaveBeenCalledWith(true);

    await controller.list('false');
    expect(service.list).toHaveBeenCalledWith(false);

    await controller.list(undefined);
    expect(service.list).toHaveBeenCalledWith(undefined);
  });

  it('should delegate getById request', async () => {
    const expected = { id: 'prof-1' } as unknown as ImportProfileResponseDto;
    service.getById.mockResolvedValue(expected);

    const result = await controller.getById('00000000-0000-0000-0000-000000000001');
    expect(result).toBe(expected);
    expect(service.getById).toHaveBeenCalledWith('00000000-0000-0000-0000-000000000001');
  });

  it('should delegate update request', async () => {
    const dto: UpdateImportProfileDto = { name: 'Updated' };
    const expected = { id: 'prof-1', name: 'Updated' } as unknown as ImportProfileResponseDto;
    service.update.mockResolvedValue(expected);

    const result = await controller.update('00000000-0000-0000-0000-000000000001', dto);
    expect(result).toBe(expected);
    expect(service.update).toHaveBeenCalledWith('00000000-0000-0000-0000-000000000001', dto);
  });

  it('should delegate activate request', async () => {
    const expected = { id: 'prof-1', isActive: true } as unknown as ImportProfileResponseDto;
    service.activate.mockResolvedValue(expected);

    const result = await controller.activate('00000000-0000-0000-0000-000000000001');
    expect(result).toBe(expected);
    expect(service.activate).toHaveBeenCalledWith('00000000-0000-0000-0000-000000000001');
  });

  it('should delegate deactivate request', async () => {
    const expected = { id: 'prof-1', isActive: false } as unknown as ImportProfileResponseDto;
    service.deactivate.mockResolvedValue(expected);

    const result = await controller.deactivate('00000000-0000-0000-0000-000000000001');
    expect(result).toBe(expected);
    expect(service.deactivate).toHaveBeenCalledWith('00000000-0000-0000-0000-000000000001');
  });
});
