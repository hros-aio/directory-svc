import { ImportRowErrorMode } from '../enums';

export interface ErrorPolicyConfig {
  readonly mode: ImportRowErrorMode;
  readonly maxErrorRows?: number;
  readonly maxErrorRate?: number;
}

export interface RetryPolicyConfig {
  readonly maxAttempts: number;
  readonly initialDelayMs: number;
  readonly maxDelayMs: number;
  readonly backoffMultiplier: number;
}

export interface TimeoutPolicyConfig {
  readonly jobTimeoutSeconds: number;
  readonly batchTimeoutSeconds: number;
  readonly idleTimeoutSeconds: number;
}

export interface ExecutionPolicyConfig {
  readonly batchSize: number;
  readonly maxConcurrentBatches: number;
}

export interface ImportJobConfig {
  readonly errorPolicy: ErrorPolicyConfig;
  readonly retryPolicy: RetryPolicyConfig;
  readonly timeoutPolicy: TimeoutPolicyConfig;
  readonly executionPolicy: ExecutionPolicyConfig;
}
