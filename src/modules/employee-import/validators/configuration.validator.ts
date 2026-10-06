import { Injectable } from '@nestjs/common';
import { ValidationException } from '@new-hros/libs-core';
import { plainToInstance, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
  validateSync,
  ValidationError,
} from 'class-validator';
import { DeepPartial } from 'typeorm';

import { ImportRowErrorMode } from '../../../common/enums';
import type {
  ErrorPolicyConfig,
  ExecutionPolicyConfig,
  ImportJobConfig,
  RetryPolicyConfig,
  TimeoutPolicyConfig,
} from '../../../common/interfaces';

export class ErrorPolicyDto implements ErrorPolicyConfig {
  @IsEnum(ImportRowErrorMode)
  mode: ImportRowErrorMode;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxErrorRows?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  maxErrorRate?: number;
}

export class RetryPolicyDto implements RetryPolicyConfig {
  @IsInt()
  @Min(1)
  maxAttempts: number;

  @IsInt()
  @Min(0)
  initialDelayMs: number;

  @IsInt()
  @Min(0)
  maxDelayMs: number;

  @IsNumber()
  @Min(1.0)
  backoffMultiplier: number;
}

export class TimeoutPolicyDto implements TimeoutPolicyConfig {
  @IsInt()
  @Min(1)
  jobTimeoutSeconds: number;

  @IsInt()
  @Min(1)
  batchTimeoutSeconds: number;

  @IsInt()
  @Min(1)
  idleTimeoutSeconds: number;
}

export class ExecutionPolicyDto implements ExecutionPolicyConfig {
  @IsInt()
  @Min(1)
  batchSize: number;

  @IsInt()
  @Min(1)
  maxConcurrentBatches: number;
}

export class ImportJobConfigDto implements ImportJobConfig {
  @ValidateNested()
  @Type(() => ErrorPolicyDto)
  errorPolicy: ErrorPolicyDto;

  @ValidateNested()
  @Type(() => RetryPolicyDto)
  retryPolicy: RetryPolicyDto;

  @ValidateNested()
  @Type(() => TimeoutPolicyDto)
  timeoutPolicy: TimeoutPolicyDto;

  @ValidateNested()
  @Type(() => ExecutionPolicyDto)
  executionPolicy: ExecutionPolicyDto;
}

export class PartialErrorPolicyDto implements Partial<ErrorPolicyConfig> {
  @IsOptional()
  @IsEnum(ImportRowErrorMode)
  mode?: ImportRowErrorMode;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxErrorRows?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  maxErrorRate?: number;
}

export class PartialRetryPolicyDto implements Partial<RetryPolicyConfig> {
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttempts?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  initialDelayMs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxDelayMs?: number;

  @IsOptional()
  @IsNumber()
  @Min(1.0)
  backoffMultiplier?: number;
}

export class PartialTimeoutPolicyDto implements Partial<TimeoutPolicyConfig> {
  @IsOptional()
  @IsInt()
  @Min(1)
  jobTimeoutSeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  batchTimeoutSeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idleTimeoutSeconds?: number;
}

export class PartialExecutionPolicyDto implements Partial<ExecutionPolicyConfig> {
  @IsOptional()
  @IsInt()
  @Min(1)
  batchSize?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxConcurrentBatches?: number;
}

export class PartialImportJobConfigDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => PartialErrorPolicyDto)
  errorPolicy?: PartialErrorPolicyDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PartialRetryPolicyDto)
  retryPolicy?: PartialRetryPolicyDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PartialTimeoutPolicyDto)
  timeoutPolicy?: PartialTimeoutPolicyDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PartialExecutionPolicyDto)
  executionPolicy?: PartialExecutionPolicyDto;
}

@Injectable()
export class ConfigurationValidator {
  /**
   * Validates a complete ImportJobConfig.
   * Enforces strict whitelist, types, and cross-field constraints.
   */
  validateComplete(config: unknown): ImportJobConfig {
    if (!config || typeof config !== 'object') {
      throw new ValidationException('Configuration must be a non-null object', [
        'config must be an object',
      ]);
    }

    const instance = plainToInstance(ImportJobConfigDto, config);
    const errors = validateSync(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: { target: false },
    });

    if (errors.length > 0) {
      const formattedErrors = this.formatErrors(errors);
      throw new ValidationException('Invalid configuration schema', formattedErrors);
    }

    // Verify all policy objects are present
    if (
      !instance.errorPolicy ||
      !instance.retryPolicy ||
      !instance.timeoutPolicy ||
      !instance.executionPolicy
    ) {
      throw new ValidationException(
        'All policy sections (errorPolicy, retryPolicy, timeoutPolicy, executionPolicy) are required',
        ['missing required policy section'],
      );
    }

    // Cross-field constraints
    this.validateCrossFieldConstraints(instance);

    return instance;
  }

  /**
   * Validates a partial ImportJobConfig (used for overrides or partial updates).
   */
  validatePartial(config: unknown): DeepPartial<ImportJobConfig> {
    if (!config || typeof config !== 'object') {
      throw new ValidationException('Configuration must be a non-null object', [
        'config must be an object',
      ]);
    }

    const instance = plainToInstance(PartialImportJobConfigDto, config);
    const errors = validateSync(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: { target: false },
    });

    if (errors.length > 0) {
      const formattedErrors = this.formatErrors(errors);
      throw new ValidationException('Invalid partial configuration schema', formattedErrors);
    }

    if (
      instance.retryPolicy &&
      instance.retryPolicy.maxDelayMs !== undefined &&
      instance.retryPolicy.initialDelayMs !== undefined
    ) {
      if (instance.retryPolicy.maxDelayMs < instance.retryPolicy.initialDelayMs) {
        throw new ValidationException(
          'maxDelayMs must be greater than or equal to initialDelayMs',
          ['retryPolicy.maxDelayMs must be >= retryPolicy.initialDelayMs'],
        );
      }
    }

    if (
      instance.timeoutPolicy &&
      instance.timeoutPolicy.jobTimeoutSeconds !== undefined &&
      instance.timeoutPolicy.batchTimeoutSeconds !== undefined
    ) {
      if (instance.timeoutPolicy.jobTimeoutSeconds < instance.timeoutPolicy.batchTimeoutSeconds) {
        throw new ValidationException(
          'jobTimeoutSeconds must be greater than or equal to batchTimeoutSeconds',
          ['timeoutPolicy.jobTimeoutSeconds must be >= timeoutPolicy.batchTimeoutSeconds'],
        );
      }
    }

    return instance;
  }

  private validateCrossFieldConstraints(config: ImportJobConfigDto): void {
    const errorMessages: string[] = [];

    // 1. Error policy cross-field rule:
    if (config.errorPolicy.mode === ImportRowErrorMode.STOP_ON_ERROR_THRESHOLD) {
      const hasRows =
        config.errorPolicy.maxErrorRows !== undefined && config.errorPolicy.maxErrorRows > 0;
      const hasRate =
        config.errorPolicy.maxErrorRate !== undefined && config.errorPolicy.maxErrorRate > 0;
      if (!hasRows && !hasRate) {
        errorMessages.push(
          'When mode is STOP_ON_ERROR_THRESHOLD, at least one of maxErrorRows or maxErrorRate must be greater than 0',
        );
      }
    }

    // 2. Retry policy cross-field rule:
    if (config.retryPolicy.maxDelayMs < config.retryPolicy.initialDelayMs) {
      errorMessages.push(
        'retryPolicy.maxDelayMs must be greater than or equal to retryPolicy.initialDelayMs',
      );
    }

    // 3. Timeout policy cross-field rule:
    if (config.timeoutPolicy.jobTimeoutSeconds < config.timeoutPolicy.batchTimeoutSeconds) {
      errorMessages.push(
        'timeoutPolicy.jobTimeoutSeconds must be greater than or equal to timeoutPolicy.batchTimeoutSeconds',
      );
    }

    if (errorMessages.length > 0) {
      throw new ValidationException('Configuration cross-field validation failed', errorMessages);
    }
  }

  private formatErrors(errors: ValidationError[]): string[] {
    const result: string[] = [];

    const traverse = (errs: ValidationError[], prefix = ''): void => {
      for (const err of errs) {
        const fieldName = prefix ? `${prefix}.${err.property}` : err.property;
        if (err.constraints) {
          result.push(...Object.values(err.constraints).map((c) => `${fieldName}: ${c}`));
        }
        if (err.children && err.children.length > 0) {
          traverse(err.children, fieldName);
        }
      }
    };

    traverse(errors);
    return result;
  }
}
