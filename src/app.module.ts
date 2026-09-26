import { Module } from '@nestjs/common';
import { ApisModule } from '@new-hros/libs-apis';
import {
  CacheModule,
  ConfigurationModule,
  ConfigurationService,
  CoreModule,
} from '@new-hros/libs-core';
import { SqlModule } from '@new-hros/libs-sql';

import { EmployeeModule } from './modules/employee/employee.module';
import { EmploymentModule } from './modules/employment/employment.module';
import { HealthModule } from './modules/health/health.module';
import { OutboxModule } from './modules/outbox/outbox.module';
import { ProvisioningModule } from './modules/provisioning/provisioning.module';

@Module({
  imports: [
    ConfigurationModule.register({ configDir: 'config', envPath: '.env' }),
    CoreModule.forRoot(),
    CacheModule.registerAsync({
      inject: [ConfigurationService],
      useFactory: (config: ConfigurationService) => ({
        redis: {
          host: config.get<string>('redis.host') ?? 'localhost',
          port: config.get<number>('redis.port') ?? 6379,
        },
      }),
    }),
    ApisModule.forRootAsync({
      inject: [ConfigurationService],
      useFactory: (config: ConfigurationService) => ({
        auth: {
          publicKey: config.get<string>('jwt.publicKey'),
          privateKey: config.get<string>('jwt.privateKey'),
        },
      }),
    }),
    HealthModule,
    EmployeeModule,
    EmploymentModule,
    OutboxModule,
    SqlModule.forRootAsync({
      inject: [ConfigurationService],
      useFactory: (config: ConfigurationService) => ({
        type: 'postgres' as const,
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
        synchronize: false,
        autoLoadEntities: true,
        retryAttempts: process.env.NODE_ENV === 'test' ? 0 : 10,
        retryDelay: 1000,
      }),
    }),
    ProvisioningModule,
  ],
})
export class AppModule {}
