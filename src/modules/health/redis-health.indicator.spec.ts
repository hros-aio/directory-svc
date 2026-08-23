import { Test, TestingModule } from '@nestjs/testing';
import { ConfigurationService } from '@new-hros/libs-core';

import { RedisHealthIndicator } from './redis-health.indicator';

const mockPing = jest.fn();
const mockQuit = jest.fn();
const mockDisconnect = jest.fn();

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      ping: mockPing,
      quit: mockQuit,
      disconnect: mockDisconnect,
    };
  });
});

describe('RedisHealthIndicator', () => {
  let indicator: RedisHealthIndicator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisHealthIndicator,
        {
          provide: ConfigurationService,
          useValue: {
            get: jest.fn().mockReturnValue('localhost'),
          },
        },
      ],
    }).compile();

    indicator = module.get<RedisHealthIndicator>(RedisHealthIndicator);

    mockPing.mockReset();
    mockQuit.mockReset();
    mockDisconnect.mockReset();
  });

  it('should return status up when ping succeeds', async () => {
    mockPing.mockResolvedValue('PONG');
    mockQuit.mockResolvedValue('OK');

    const result = await indicator.checkHealth();

    expect(result).toEqual({ status: 'up' });
    expect(mockPing).toHaveBeenCalled();
    expect(mockQuit).toHaveBeenCalled();
  });

  it('should return status down when ping fails', async () => {
    const errorMsg = 'Connection refused';
    mockPing.mockRejectedValue(new Error(errorMsg));

    const result = await indicator.checkHealth();

    expect(result).toEqual({
      status: 'down',
      details: { error: errorMsg },
    });
    expect(mockPing).toHaveBeenCalled();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should handle quit error and disconnect on success cleanup', async () => {
    mockPing.mockResolvedValue('PONG');
    mockQuit.mockRejectedValue(new Error('Quit failed'));

    const result = await indicator.checkHealth();

    expect(result).toEqual({ status: 'up' });
    expect(mockPing).toHaveBeenCalled();
    expect(mockQuit).toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should handle disconnect error on failure cleanup', async () => {
    mockPing.mockRejectedValue(new Error('Ping failed'));
    mockDisconnect.mockImplementation(() => {
      throw new Error('Disconnect failed');
    });

    const result = await indicator.checkHealth();

    expect(result).toEqual({
      status: 'down',
      details: { error: 'Ping failed' },
    });
    expect(mockPing).toHaveBeenCalled();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should use fallback host and port when config returns undefined', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisHealthIndicator,
        {
          provide: ConfigurationService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined),
          },
        },
      ],
    }).compile();

    const ind = module.get<RedisHealthIndicator>(RedisHealthIndicator);
    mockPing.mockResolvedValue('PONG');
    mockQuit.mockResolvedValue('OK');

    const result = await ind.checkHealth();

    expect(result).toEqual({ status: 'up' });
    expect(mockPing).toHaveBeenCalled();
  });

  it('should handle non-Error throw gracefully', async () => {
    mockPing.mockRejectedValue('String error');

    const result = await indicator.checkHealth();

    expect(result).toEqual({
      status: 'down',
      details: { error: 'String error' },
    });
    expect(mockPing).toHaveBeenCalled();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
