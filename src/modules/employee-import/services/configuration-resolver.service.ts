import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException } from '@new-hros/libs-core';
import { DeepPartial } from 'typeorm';

import { ImportRowErrorMode } from '../../../common/enums';
import type { ImportJobConfig } from '../../../common/interfaces';
import { ConfigurationValidator } from '../validators/configuration.validator';

export const SYSTEM_BASELINE_CONFIG: ImportJobConfig = Object.freeze({
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
});

export const SYSTEM_SAFETY_LIMITS = Object.freeze({
  batchSize: { min: 1, max: 1000 },
  maxConcurrentBatches: { min: 1, max: 10 },
  maxAttempts: { min: 1, max: 10 },
  initialDelayMs: { min: 100, max: 60000 },
  maxDelayMs: { min: 500, max: 300000 },
  jobTimeoutSeconds: { min: 10, max: 86400 },
  batchTimeoutSeconds: { min: 5, max: 1800 },
});

@Injectable()
export class ConfigurationResolverService {
  constructor(private readonly validator: ConfigurationValidator) {}

  /**
   * Resolves effective configuration using 3-tier precedence:
   * 1. System baseline defaults
   * 2. Tenant profile configuration
   * 3. Job-level explicit overrides
   *
   * Validates schema and strictly enforces non-overridable system safety quotas.
   */
  resolve(
    profileConfig?: DeepPartial<ImportJobConfig> | null,
    jobOverrides?: DeepPartial<ImportJobConfig> | null,
  ): ImportJobConfig {
    // 1. Start from system baseline
    let effective: ImportJobConfig = this.cloneConfig(SYSTEM_BASELINE_CONFIG);

    // 2. Deep merge profile config if present
    if (profileConfig && Object.keys(profileConfig).length > 0) {
      const validatedProfileConfig = this.validator.validatePartial(profileConfig);
      effective = this.deepMerge(effective, validatedProfileConfig);
    }

    // 3. Deep merge job overrides if present
    if (jobOverrides && Object.keys(jobOverrides).length > 0) {
      const validatedJobOverrides = this.validator.validatePartial(jobOverrides);
      effective = this.deepMerge(effective, validatedJobOverrides);
    }

    // 4. Validate complete schema
    this.validator.validateComplete(effective);

    // 5. Enforce system safety quotas
    this.enforceSystemSafetyLimits(effective);

    return effective;
  }

  private deepMerge(
    base: ImportJobConfig,
    override: DeepPartial<ImportJobConfig>,
  ): ImportJobConfig {
    return {
      errorPolicy: {
        ...base.errorPolicy,
        ...(override.errorPolicy || {}),
      },
      retryPolicy: {
        ...base.retryPolicy,
        ...(override.retryPolicy || {}),
      },
      timeoutPolicy: {
        ...base.timeoutPolicy,
        ...(override.timeoutPolicy || {}),
      },
      executionPolicy: {
        ...base.executionPolicy,
        ...(override.executionPolicy || {}),
      },
    };
  }

  private enforceSystemSafetyLimits(config: ImportJobConfig): void {
    const limits = SYSTEM_SAFETY_LIMITS;

    if (config.executionPolicy.batchSize > limits.batchSize.max) {
      throw new BusinessException(
        `executionPolicy.batchSize (${config.executionPolicy.batchSize}) exceeds system safety limit of ${limits.batchSize.max}`,
        'CONFIG_QUOTA_EXCEEDED',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (config.executionPolicy.maxConcurrentBatches > limits.maxConcurrentBatches.max) {
      throw new BusinessException(
        `executionPolicy.maxConcurrentBatches (${config.executionPolicy.maxConcurrentBatches}) exceeds system safety limit of ${limits.maxConcurrentBatches.max}`,
        'CONFIG_QUOTA_EXCEEDED',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (config.retryPolicy.maxAttempts > limits.maxAttempts.max) {
      throw new BusinessException(
        `retryPolicy.maxAttempts (${config.retryPolicy.maxAttempts}) exceeds system safety limit of ${limits.maxAttempts.max}`,
        'CONFIG_QUOTA_EXCEEDED',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (config.retryPolicy.initialDelayMs < limits.initialDelayMs.min) {
      throw new BusinessException(
        `retryPolicy.initialDelayMs (${config.retryPolicy.initialDelayMs}ms) is below system minimum of ${limits.initialDelayMs.min}ms`,
        'CONFIG_QUOTA_EXCEEDED',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (config.timeoutPolicy.jobTimeoutSeconds > limits.jobTimeoutSeconds.max) {
      throw new BusinessException(
        `timeoutPolicy.jobTimeoutSeconds (${config.timeoutPolicy.jobTimeoutSeconds}s) exceeds system safety limit of ${limits.jobTimeoutSeconds.max}s`,
        'CONFIG_QUOTA_EXCEEDED',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (config.timeoutPolicy.batchTimeoutSeconds > limits.batchTimeoutSeconds.max) {
      throw new BusinessException(
        `timeoutPolicy.batchTimeoutSeconds (${config.timeoutPolicy.batchTimeoutSeconds}s) exceeds system safety limit of ${limits.batchTimeoutSeconds.max}s`,
        'CONFIG_QUOTA_EXCEEDED',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private cloneConfig(config: ImportJobConfig): ImportJobConfig {
    return {
      errorPolicy: { ...config.errorPolicy },
      retryPolicy: { ...config.retryPolicy },
      timeoutPolicy: { ...config.timeoutPolicy },
      executionPolicy: { ...config.executionPolicy },
    };
  }
}
