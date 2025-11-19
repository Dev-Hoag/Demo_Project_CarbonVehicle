import json
import logging
import hashlib
from typing import Dict, Any, TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

from app.messaging.rabbitmq import rabbitmq_connection
from app.services import CertificateService
from app.schemas import CertificateCreate, TripVerifiedEvent, CreditPurchasedEvent
from app.messaging.publisher import publish_certificate_generated
from app.config import settings

logger = logging.getLogger(__name__)


def uuid_to_int(uuid_str: str) -> int:
    """Convert UUID string to consistent integer using SHA256 hash"""
    hash_obj = hashlib.sha256(uuid_str.encode('utf-8'))
    hash_int = int(hash_obj.hexdigest(), 16)
    return hash_int % 100000000  # 8-digit positive int


def process_trip_verified_event(event_data: Dict[str, Any], db: 'Session'):
    """
    Process TripVerified event and generate certificate
    """
    try:
        event = TripVerifiedEvent(**event_data)

        logger.info(
            f"Processing TripVerified event for trip_id={event.trip_id}, user_id={event.user_id}"
        )

        cert_service = CertificateService(db)
        cert_data = CertificateCreate(
            verification_id=event.verification_id,
            trip_id=event.trip_id,
            user_id=event.user_id,
            credit_amount=event.credit_amount,
            template_id=1
        )

        certificate = cert_service.create_certificate(cert_data)

        logger.info(
            f"Certificate created: id={certificate.id}, hash={certificate.cert_hash}"
        )

        publish_certificate_generated(certificate)

        return True

    except Exception as e:
        logger.error(f"Error processing TripVerified event: {str(e)}")
        raise


def process_credit_purchased_event(event_data: Dict[str, Any], db: 'Session'):
    """
    Process CreditPurchased event and generate certificate for buyer
    """
    try:
        event = CreditPurchasedEvent(**event_data)

        logger.info(
            f"Processing CreditPurchased event for transaction={event.transactionId}, buyer={event.buyerId}, amount={event.creditAmount} kg"
        )

        cert_service = CertificateService(db)
        
        # Convert buyer UUID to consistent integer using SHA256
        buyer_id = uuid_to_int(event.buyerId)
        
        cert_data = CertificateCreate(
            verification_id=0,  # No verification for marketplace purchases
            trip_id=uuid_to_int(event.tripId) if event.tripId else 0,
            user_id=buyer_id,
            credit_amount=event.creditAmount,
            template_id=2  # Different template for purchased credits
        )

        certificate = cert_service.create_certificate(cert_data)

        logger.info(
            f"✅ Certificate created for buyer: id={certificate.id}, hash={certificate.cert_hash}, amount={event.creditAmount} kg"
        )

        publish_certificate_generated(certificate)

        return True

    except Exception as e:
        logger.error(f"❌ Error processing CreditPurchased event: {str(e)}")
        raise


def on_message_callback(ch, method, properties, body):
    """
    Callback function for RabbitMQ message consumption
    """
    # Import SessionLocal dynamically to avoid None issue
    from app.database import SessionLocal
    
    if SessionLocal is None:
        logger.error("SessionLocal is None - database not initialized!")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
        return
    
    db = SessionLocal()

    try:
        message = json.loads(body)
        logger.info(f"Received message: {message}")

        event_type = message.get("event_type") or message.get("eventType") or message.get("type")

        if event_type == "TripVerified":
            success = process_trip_verified_event(
                message.get("data", message), db
            )

            if success:
                ch.basic_ack(delivery_tag=method.delivery_tag)
                logger.info("Message processed successfully")
            else:
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
                logger.warning("Message processing failed, requeued")

        elif event_type == "credit.purchased":
            success = process_credit_purchased_event(message, db)
            
            if success:
                ch.basic_ack(delivery_tag=method.delivery_tag)
                logger.info("✅ CreditPurchased message processed successfully")
            else:
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
                logger.warning("⚠️ CreditPurchased processing failed, requeued")

        else:
            logger.warning(f"Unknown event type: {event_type}")
            ch.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        logger.error(f"Error in message callback: {str(e)}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

    finally:
        db.close()


def start_consumer():
    """
    Start consuming messages from RabbitMQ
    """
    try:
        if not rabbitmq_connection.connect():
            logger.error("Failed to connect to RabbitMQ")
            return

        queue_name = settings.RABBITMQ_QUEUE
        
        # Bind to multiple routing keys
        routing_keys = ["verification.trip.verified", "credit.purchased"]

        for routing_key in routing_keys:
            rabbitmq_connection.declare_queue(queue_name, routing_key)
            logger.info(f"Queue '{queue_name}' bound to routing key '{routing_key}'")

        logger.info(f"Starting consumer for queue '{queue_name}'")
        
        # Debug: Check callback before passing
        logger.info(f"DEBUG: on_message_callback={on_message_callback}, callable={callable(on_message_callback)}")
        
        if not callable(on_message_callback):
            raise RuntimeError("on_message_callback is not callable")

        # Pass callback directly
        logger.info(f"DEBUG: About to call consume_messages with callback={on_message_callback}")
        rabbitmq_connection.consume_messages(
            queue_name=queue_name,
            callback=on_message_callback,
            auto_ack=False
        )

    except KeyboardInterrupt:
        logger.info("Consumer stopped by user")
        rabbitmq_connection.close()

    except Exception as e:
        logger.exception(f"Consumer error: {str(e)}")
        rabbitmq_connection.close()


if __name__ == "__main__":
    start_consumer()
