import { BusinessException, ValidationException } from '@new-hros/libs-core';

import {
  ConfigurationResolverService,
  SYSTEM_BASELINE_CONFIG,
} from './configuration-resolver.service';
import { ImportRowErrorMode } from '../../../common/enums';
import { ConfigurationValidator } from '../validators/configuration.validator';

describe('ConfigurationResolverService', () => {
  let resolver: ConfigurationResolverService;
  let validator: ConfigurationValidator;

  beforeEach(() => {
    validator = new ConfigurationValidator();
    resolver = new ConfigurationResolverService(validator);
  });

  it('should return system baseline configuration when no profile or overrides provided', () => {
    const result = resolver.resolve();
    expect(result).toEqual(SYSTEM_BASELINE_CONFIG);
    expect(result.executionPolicy.batchSize).toBe(500);
    expect(result.retryPolicy.maxAttempts).toBe(3);
  });

  it('should deep merge profile configuration over system baseline', () => {
    const profileConfig = {
      executionPolicy: {
        batchSize: 250,
      },
      errorPolicy: {
        mode: ImportRowErrorMode.ALL_OR_NOTHING,
      },
    };

    const result = resolver.resolve(profileConfig);

    // Overridden fields
    expect(result.executionPolicy.batchSize).toBe(250);
    expect(result.errorPolicy.mode).toBe(ImportRowErrorMode.ALL_OR_NOTHING);

    // Preserved sibling fields
    expect(result.executionPolicy.maxConcurrentBatches).toBe(
      SYSTEM_BASELINE_CONFIG.executionPolicy.maxConcurrentBatches,
    );
    expect(result.retryPolicy).toEqual(SYSTEM_BASELINE_CONFIG.retryPolicy);
    expect(result.timeoutPolicy).toEqual(SYSTEM_BASELINE_CONFIG.timeoutPolicy);
  });

  it('should deep merge job overrides over profile configuration and baseline', () => {
    const profileConfig = {
      executionPolicy: {
        batchSize: 250,
        maxConcurrentBatches: 2,
      },
    };

    const jobOverrides = {
      executionPolicy: {
        batchSize: 750,
      },
      retryPolicy: {
        maxAttempts: 5,
      },
    };

    const result = resolver.resolve(profileConfig, jobOverrides);

    expect(result.executionPolicy.batchSize).toBe(750); // Job override wins
    expect(result.executionPolicy.maxConcurrentBatches).toBe(2); // Profile config preserved
    expect(result.retryPolicy.maxAttempts).toBe(5); // Job override wins
    expect(result.retryPolicy.initialDelayMs).toBe(
      SYSTEM_BASELINE_CONFIG.retryPolicy.initialDelayMs,
    ); // Baseline preserved
  });

  it('should reject batchSize exceeding system safety quota (> 1000)', () => {
    const excessiveJobOverride = {
      executionPolicy: {
        batchSize: 2000,
      },
    };

    expect(() => resolver.resolve(null, excessiveJobOverride)).toThrow(BusinessException);
    try {
      resolver.resolve(null, excessiveJobOverride);
    } catch (e: unknown) {
      const err = e as BusinessException;
      expect(err.code).toBe('CONFIG_QUOTA_EXCEEDED');
    }
  });

  it('should reject maxAttempts exceeding system safety quota (> 10)', () => {
    const excessiveRetryOverride = {
      retryPolicy: {
        maxAttempts: 25,
      },
    };

    expect(() => resolver.resolve(null, excessiveRetryOverride)).toThrow(BusinessException);
  });

  it('should reject initialDelayMs below system minimum (< 100ms)', () => {
    const tooLowDelayOverride = {
      retryPolicy: {
        initialDelayMs: 50,
      },
    };

    expect(() => resolver.resolve(null, tooLowDelayOverride)).toThrow(BusinessException);
  });

  it('should reject jobTimeoutSeconds exceeding system safety quota (> 86400s)', () => {
    const excessiveTimeoutOverride = {
      timeoutPolicy: {
        jobTimeoutSeconds: 100000,
      },
    };

    expect(() => resolver.resolve(null, excessiveTimeoutOverride)).toThrow(BusinessException);
  });

  it('should reject batchTimeoutSeconds exceeding system safety quota (> 1800s)', () => {
    const excessiveBatchTimeoutOverride = {
      timeoutPolicy: {
        batchTimeoutSeconds: 3600,
      },
    };

    expect(() => resolver.resolve(null, excessiveBatchTimeoutOverride)).toThrow(BusinessException);
  });

  it('should reject invalid configuration schema with ValidationException', () => {
    const invalidOverride = {
      errorPolicy: {
        mode: 'NON_EXISTENT_MODE' as unknown as ImportRowErrorMode,
      },
    };

    expect(() => resolver.resolve(null, invalidOverride)).toThrow(ValidationException);
  });
});
