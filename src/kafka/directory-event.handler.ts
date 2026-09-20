import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DirectoryEventHandler {
  private readonly logger = new Logger(DirectoryEventHandler.name);

  async handleEvent(topic: string, message: Record<string, unknown>): Promise<void> {
    this.logger.log(`Received event from topic ${topic}: ${JSON.stringify(message)}`);
  }
}
