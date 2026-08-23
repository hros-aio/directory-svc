import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DirectoryEventConsumer {
  private readonly logger = new Logger(DirectoryEventConsumer.name);

  async handleEvent(topic: string, message: Record<string, unknown>): Promise<void> {
    this.logger.log(`Received event from topic ${topic}: ${JSON.stringify(message)}`);
  }
}
