import logger from "../config/logger";
import {
  SystemEvent,
  EventHandler,
  IEventConsumer,
} from "../types/notification";

export class EventConsumer implements IEventConsumer {
  private handlers: Map<string, EventHandler[]> = new Map();
  private isRunning: boolean = false;

  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    this.handlers.get(eventType)!.push(handler);
    logger.info("Event handler subscribed", { eventType });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn("Event consumer already running");
      return;
    }

    this.isRunning = true;
    logger.info("Event consumer started", {
      subscribedEvents: Array.from(this.handlers.keys()),
    });

    // In a real implementation, this would connect to a message queue (RabbitMQ, Kafka, etc.)
    // For now, we'll just log that it's ready
    logger.info("Event consumer ready to receive events");
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn("Event consumer not running");
      return;
    }

    this.isRunning = false;
    logger.info("Event consumer stopped");
  }

  async processEvent(event: SystemEvent): Promise<void> {
    if (!this.isRunning) {
      logger.warn("Event consumer not running, ignoring event", {
        eventType: event.type,
      });
      return;
    }

    const handlers = this.handlers.get(event.type);

    if (!handlers || handlers.length === 0) {
      logger.debug("No handlers registered for event", {
        eventType: event.type,
      });
      return;
    }

    logger.info("Processing event", {
      eventType: event.type,
      source: event.source,
      userId: event.userId,
      handlerCount: handlers.length,
    });

    // Process all handlers asynchronously
    const promises = handlers.map(async (handler) => {
      try {
        await handler(event);
        logger.debug("Event handler executed successfully", {
          eventType: event.type,
        });
      } catch (error) {
        logger.error("Event handler failed", {
          error,
          eventType: event.type,
          source: event.source,
        });

        // Retry logic
        await this.retryHandler(handler, event);
      }
    });

    await Promise.allSettled(promises);
  }

  private async retryHandler(
    handler: EventHandler,
    event: SystemEvent,
    attempt: number = 1
  ): Promise<void> {
    const maxRetries = 3;

    if (attempt > maxRetries) {
      logger.error("Max retries exceeded for event handler", {
        eventType: event.type,
        attempts: attempt,
      });
      return;
    }

    const delay = 1000 * Math.pow(2, attempt - 1); // Exponential backoff
    logger.info("Retrying event handler", {
      eventType: event.type,
      attempt,
      delay,
    });

    await this.sleep(delay);

    try {
      await handler(event);
      logger.info("Event handler retry successful", {
        eventType: event.type,
        attempt,
      });
    } catch (error) {
      logger.error("Event handler retry failed", {
        error,
        eventType: event.type,
        attempt,
      });

      if (attempt < maxRetries) {
        await this.retryHandler(handler, event, attempt + 1);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getSubscribedEvents(): string[] {
    return Array.from(this.handlers.keys());
  }

  getHandlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.length || 0;
  }

  isActive(): boolean {
    return this.isRunning;
  }
}

export default new EventConsumer();
