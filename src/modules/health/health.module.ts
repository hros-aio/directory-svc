import { Module, OnModuleInit } from '@nestjs/common';
import { HealthModule as LibsHealthModule } from '@new-hros/libs-apis';
import { HealthService } from '@new-hros/libs-core';
import { SqlHealthService, SqlModule } from '@new-hros/libs-sql';

import { RedisHealthIndicator } from './redis-health.indicator';

@Module({
  imports: [SqlModule, LibsHealthModule],
  providers: [RedisHealthIndicator],
  exports: [RedisHealthIndicator],
})
export class HealthModule implements OnModuleInit {
  constructor(
    private readonly healthService: HealthService,
    private readonly redisHealthIndicator: RedisHealthIndicator,
    private readonly sqlHealthService: SqlHealthService,
  ) {}

  onModuleInit(): void {
    this.healthService.registerIndicator(this.redisHealthIndicator);
    this.healthService.registerIndicator(this.sqlHealthService);
  }
}
