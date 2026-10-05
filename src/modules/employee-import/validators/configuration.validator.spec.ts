import { ValidationException } from '@new-hros/libs-core';

import { ConfigurationValidator } from './configuration.validator';
import { ImportRowErrorMode } from '../../../common/enums';
import type { ImportJobConfig } from '../../../common/interfaces';

describe('ConfigurationValidator', () => {
  let validator: ConfigurationValidator;

  const validConfig: ImportJobConfig = {
    errorPolicy: {
      mode: ImportRowErrorMode.CONTINUE_ON_ROW_ERROR,
      maxErrorRows: 1000,
      maxErrorRate: 0.05,
    },
    retryPolicy: {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 30000,
      backoffMultiplier: 2.0,
    },
    timeoutPolicy: {
      jobTimeoutSeconds: 1800,
      batchTimeoutSeconds: 60,
      idleTimeoutSeconds: 300,
    },
    executionPolicy: {
      batchSize: 500,
      maxConcurrentBatches: 1,
    },
  };

  beforeEach(() => {
    validator = new ConfigurationValidator();
  });

  describe('validateComplete', () => {
    it('should validate and return valid config', () => {
      const result = validator.validateComplete(validConfig);
      expect(result).toBeDefined();
      expect(result.executionPolicy.batchSize).toBe(500);
      expect(result.errorPolicy.mode).toBe(ImportRowErrorMode.CONTINUE_ON_ROW_ERROR);
    });

    it('should throw ValidationException when config is not an object', () => {
      expect(() => validator.validateComplete(null)).toThrow(ValidationException);
      expect(() => validator.validateComplete('invalid')).toThrow(ValidationException);
    });

    it('should reject unknown fields (strict whitelist)', () => {
      const configWithUnknown = {
        ...validConfig,
        unknownField: 'malicious',
      };
      expect(() => validator.validateComplete(configWithUnknown)).toThrow(ValidationException);
    });

    it('should reject unknown fields nested inside policies', () => {
      const configWithNestedUnknown = {
        ...validConfig,
        executionPolicy: {
          ...validConfig.executionPolicy,
          extraKey: 123,
        },
      };
      expect(() => validator.validateComplete(configWithNestedUnknown)).toThrow(
        ValidationException,
      );
    });

    it('should reject invalid enum for errorPolicy.mode', () => {
      const invalidEnumConfig = {
        ...validConfig,
        errorPolicy: {
          ...validConfig.errorPolicy,
          mode: 'INVALID_MODE',
        },
      };
      expect(() => validator.validateComplete(invalidEnumConfig)).toThrow(ValidationException);
    });

    it('should reject negative values for positive integer fields', () => {
      const negativeBatch = {
        ...validConfig,
        executionPolicy: {
          batchSize: -10,
          maxConcurrentBatches: 1,
        },
      };
      expect(() => validator.validateComplete(negativeBatch)).toThrow(ValidationException);
    });

    it('should reject errorRate > 1.0', () => {
      const invalidRate = {
        ...validConfig,
        errorPolicy: {
          mode: ImportRowErrorMode.CONTINUE_ON_ROW_ERROR,
          maxErrorRate: 1.5,
        },
      };
      expect(() => validator.validateComplete(invalidRate)).toThrow(ValidationException);
    });

    it('should enforce STOP_ON_ERROR_THRESHOLD cross-field constraint', () => {
      const thresholdMissingBounds = {
        ...validConfig,
        errorPolicy: {
          mode: ImportRowErrorMode.STOP_ON_ERROR_THRESHOLD,
        },
      };
      expect(() => validator.validateComplete(thresholdMissingBounds)).toThrow(ValidationException);

      const thresholdWithValidBounds = {
        ...validConfig,
        errorPolicy: {
          mode: ImportRowErrorMode.STOP_ON_ERROR_THRESHOLD,
          maxErrorRows: 50,
        },
      };
      expect(() => validator.validateComplete(thresholdWithValidBounds)).not.toThrow();
    });

    it('should enforce retryPolicy.maxDelayMs >= initialDelayMs', () => {
      const invalidDelay = {
        ...validConfig,
        retryPolicy: {
          ...validConfig.retryPolicy,
          initialDelayMs: 5000,
          maxDelayMs: 1000,
        },
      };
      expect(() => validator.validateComplete(invalidDelay)).toThrow(ValidationException);
    });

    it('should enforce timeoutPolicy.jobTimeoutSeconds >= batchTimeoutSeconds', () => {
      const invalidTimeout = {
        ...validConfig,
        timeoutPolicy: {
          jobTimeoutSeconds: 30,
          batchTimeoutSeconds: 60,
          idleTimeoutSeconds: 10,
        },
      };
      expect(() => validator.validateComplete(invalidTimeout)).toThrow(ValidationException);
    });
  });

  describe('validatePartial', () => {
    it('should allow partial valid updates', () => {
      const partial = {
        executionPolicy: {
          batchSize: 200,
        },
      };
      const result = validator.validatePartial(partial);
      expect(result.executionPolicy?.batchSize).toBe(200);
    });

    it('should reject unknown fields in partial config', () => {
      const partialWithUnknown = {
        unexpectedKey: true,
      };
      expect(() => validator.validatePartial(partialWithUnknown)).toThrow(ValidationException);
    });

    it('should reject invalid retry delays in partial config', () => {
      const partialInvalidRetry = {
        retryPolicy: {
          initialDelayMs: 5000,
          maxDelayMs: 1000,
        },
      };
      expect(() => validator.validatePartial(partialInvalidRetry)).toThrow(ValidationException);
    });
  });
});
