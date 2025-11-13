import logger from "../config/logger";
import templateEngine from "./TemplateEngine";
import deliveryManager from "./DeliveryManager";
import { SystemEvent, Channel, Priority } from "../types/notification";

export class EventHandlers {
  // User Events
  async handleUserRegistered(event: SystemEvent): Promise<void> {
    logger.info("Handling UserRegistered event", { userId: event.userId });

    const data = {
      user_name: event.data.user_name || "User",
      email: event.data.email,
      registration_date:
        event.data.registration_date || new Date().toISOString(),
    };

    await this.sendNotification(
      event.userId!,
      "UserRegistered",
      data,
      Priority.HIGH
    );
  }

  // Trip Events
  async handleTripVerified(event: SystemEvent): Promise<void> {
    logger.info("Handling TripVerified event", { userId: event.userId });

    const data = {
      user_name: event.data.user_name || "User",
      trip_id: event.data.trip_id,
      trip_date: event.data.trip_date,
      distance: event.data.distance,
      credit_amount: event.data.credit_amount,
      co2_reduced: event.data.co2_reduced,
    };

    await this.sendNotification(
      event.userId!,
      "TripVerified",
      data,
      Priority.HIGH
    );
  }

  async handleTripRejected(event: SystemEvent): Promise<void> {
    logger.info("Handling TripRejected event", { userId: event.userId });

    const data = {
      user_name: event.data.user_name || "User",
      trip_id: event.data.trip_id,
      trip_date: event.data.trip_date,
      rejection_reason:
        event.data.rejection_reason || "Data verification failed",
    };

    await this.sendNotification(
      event.userId!,
      "TripRejected",
      data,
      Priority.HIGH
    );
  }

  // Credit Events
  async handleCreditIssued(event: SystemEvent): Promise<void> {
    logger.info("Handling CreditIssued event", { userId: event.userId });

    const data = {
      user_name: event.data.user_name || "User",
      credit_amount: event.data.credit_amount,
      trip_id: event.data.trip_id,
      total_credits: event.data.total_credits,
    };

    await this.sendNotification(
      event.userId!,
      "CreditIssued",
      data,
      Priority.MEDIUM
    );
  }

  async handleCreditTransferred(event: SystemEvent): Promise<void> {
    logger.info("Handling CreditTransferred event", { userId: event.userId });

    const data = {
      user_name: event.data.user_name || "User",
      credit_amount: event.data.credit_amount,
      from_user: event.data.from_user,
      to_user: event.data.to_user,
      transaction_id: event.data.transaction_id,
    };

    // Notify both sender and receiver
    if (event.data.from_user_id) {
      await this.sendNotification(
        event.data.from_user_id,
        "CreditTransferred",
        data,
        Priority.MEDIUM
      );
    }
    if (event.data.to_user_id) {
      await this.sendNotification(
        event.data.to_user_id,
        "CreditReceived",
        data,
        Priority.MEDIUM
      );
    }
  }

  // Listing Events
  async handleListingCreated(event: SystemEvent): Promise<void> {
    logger.info("Handling ListingCreated event", { userId: event.userId });

    const data = {
      user_name: event.data.user_name || "User",
      listing_id: event.data.listing_id,
      credit_amount: event.data.credit_amount,
      price: event.data.price,
      listing_type: event.data.listing_type,
    };

    await this.sendNotification(
      event.userId!,
      "ListingCreated",
      data,
      Priority.LOW
    );
  }

  async handleListingSold(event: SystemEvent): Promise<void> {
    logger.info("Handling ListingSold event", { userId: event.userId });

    const data = {
      user_name: event.data.user_name || "User",
      listing_id: event.data.listing_id,
      credit_amount: event.data.credit_amount,
      price: event.data.price,
      buyer_name: event.data.buyer_name,
    };

    // Notify seller
    await this.sendNotification(
      event.userId!,
      "ListingSold",
      data,
      Priority.HIGH
    );

    // Notify buyer
    if (event.data.buyer_id) {
      await this.sendNotification(
        event.data.buyer_id,
        "ListingPurchased",
        data,
        Priority.HIGH
      );
    }
  }

  // Transaction Events
  async handleTransactionCompleted(event: SystemEvent): Promise<void> {
    logger.info("Handling TransactionCompleted event", {
      userId: event.userId,
    });

    const data = {
      user_name: event.data.user_name || "User",
      transaction_id: event.data.transaction_id,
      credit_amount: event.data.credit_amount,
      total_price: event.data.total_price,
      seller_name: event.data.seller_name,
      buyer_name: event.data.buyer_name,
    };

    // Notify buyer
    if (event.data.buyer_id) {
      await this.sendNotification(
        event.data.buyer_id,
        "TransactionCompleted",
        data,
        Priority.HIGH
      );
    }

    // Notify seller
    if (event.data.seller_id) {
      await this.sendNotification(
        event.data.seller_id,
        "TransactionCompleted",
        data,
        Priority.HIGH
      );
    }
  }

  async handleTransactionCancelled(event: SystemEvent): Promise<void> {
    logger.info("Handling TransactionCancelled event", {
      userId: event.userId,
    });

    const data = {
      user_name: event.data.user_name || "User",
      transaction_id: event.data.transaction_id,
      cancellation_reason:
        event.data.cancellation_reason || "Transaction cancelled",
    };

    await this.sendNotification(
      event.userId!,
      "TransactionCancelled",
      data,
      Priority.MEDIUM
    );
  }

  // Payment Events
  async handlePaymentCompleted(event: SystemEvent): Promise<void> {
    logger.info("Handling PaymentCompleted event", { userId: event.userId });

    const data = {
      user_name: event.data.user_name || "User",
      payment_id: event.data.payment_id,
      amount: event.data.amount,
      transaction_id: event.data.transaction_id,
      payment_method: event.data.payment_method,
    };

    await this.sendNotification(
      event.userId!,
      "PaymentCompleted",
      data,
      Priority.HIGH
    );
  }

  async handlePaymentFailed(event: SystemEvent): Promise<void> {
    logger.info("Handling PaymentFailed event", { userId: event.userId });

    const data = {
      user_name: event.data.user_name || "User",
      payment_id: event.data.payment_id,
      amount: event.data.amount,
      failure_reason: event.data.failure_reason || "Payment processing failed",
    };

    await this.sendNotification(
      event.userId!,
      "PaymentFailed",
      data,
      Priority.HIGH
    );
  }

  // Certificate Events
  async handleCertificateGenerated(event: SystemEvent): Promise<void> {
    logger.info("Handling CertificateGenerated event", {
      userId: event.userId,
    });

    const data = {
      user_name: event.data.user_name || "User",
      certificate_id: event.data.certificate_id,
      credit_amount: event.data.credit_amount,
      download_url: event.data.download_url,
    };

    await this.sendNotification(
      event.userId!,
      "CertificateGenerated",
      data,
      Priority.MEDIUM
    );
  }

  // Helper method to send notifications via both channels
  private async sendNotification(
    userId: number,
    eventType: string,
    data: Record<string, any>,
    priority: Priority
  ): Promise<void> {
    try {
      // Send Email notification
      const emailTemplate = await templateEngine.renderTemplate(
        eventType,
        Channel.EMAIL,
        data
      );
      await deliveryManager.send({
        userId,
        type: eventType,
        channel: Channel.EMAIL,
        subject: emailTemplate.subject,
        content: emailTemplate.content,
        priority,
        metadata: data,
      });

      // Send In-App notification
      const inAppTemplate = await templateEngine.renderTemplate(
        eventType,
        Channel.IN_APP,
        data
      );
      await deliveryManager.send({
        userId,
        type: eventType,
        channel: Channel.IN_APP,
        subject: inAppTemplate.subject,
        content: inAppTemplate.content,
        priority,
        metadata: data,
      });

      logger.info("Notifications sent successfully", { userId, eventType });
    } catch (error) {
      logger.error("Error sending notifications", { error, userId, eventType });
      throw error;
    }
  }
}

export default new EventHandlers();
