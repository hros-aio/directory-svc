import { Environment, validate } from './env.validation';

describe('Environment Validation', () => {
  it('should validate valid environment configuration', () => {
    const validConfig = {
      NODE_ENV: 'development',
      APP_PORT: 3000,
      APP_NAME: 'hrms-directory-service',
      DATABASE_HOST: 'localhost',
      DATABASE_PORT: 5432,
      DATABASE_USERNAME: 'hrms_user',
      DATABASE_PASSWORD: 'hrms_password',
      DATABASE_NAME: 'hrms_directory_db',
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
      JWT_PUBLIC_KEY: 'test-key',
    };

    const result = validate(validConfig);
    expect(result.NODE_ENV).toBe(Environment.Development);
    expect(result.APP_PORT).toBe(3000);
    expect(result.APP_NAME).toBe('hrms-directory-service');
  });

  it('should use default values for omitted optional fields', () => {
    const minimalConfig = {};

    const result = validate(minimalConfig);
    expect(result.NODE_ENV).toBe(Environment.Development);
    expect(result.APP_PORT).toBe(3000);
    expect(result.DATABASE_HOST).toBe('localhost');
  });

  it('should throw error on invalid enum value', () => {
    const invalidConfig = {
      NODE_ENV: 'invalid-env',
    };

    expect(() => validate(invalidConfig)).toThrow();
  });
});
