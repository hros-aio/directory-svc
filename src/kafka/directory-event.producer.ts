import { Injectable, Logger } from '@nestjs/common';
import { ConfigurationService } from '@new-hros/libs-core';

@Injectable()
export class DirectoryEventProducer {
  private readonly logger = new Logger(DirectoryEventProducer.name);

  constructor(private readonly configService: ConfigurationService) {}

  async publishEvent(topic: string, event: Record<string, unknown>): Promise<void> {
    this.logger.log(`Publishing event to topic ${topic}: ${JSON.stringify(event)}`);
  }
}
