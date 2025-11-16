import json
import logging
from typing import Dict, Any
from sqlalchemy.orm import Session

from app.messaging.rabbitmq import rabbitmq_connection
from app.database import SessionLocal
from app.services import CertificateService
from app.schemas import CertificateCreate, TripVerifiedEvent
from app.messaging.publisher import publish_certificate_generated  # OK, không import ngược
from app.config import settings

logger = logging.getLogger(__name__)


def process_trip_verified_event(event_data: Dict[str, Any], db: Session):
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


def on_message_callback(ch, method, properties, body):
    """
    Callback function for RabbitMQ message consumption
    """
    db = SessionLocal()

    try:
        message = json.loads(body)
        logger.info(f"Received message: {message}")

        event_type = message.get("event_type") or message.get("type")

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
        routing_key = "verification.trip.verified"

        rabbitmq_connection.declare_queue(queue_name, routing_key)

        logger.info(f"Starting consumer for queue '{queue_name}'")

        rabbitmq_connection.consume_messages(
            queue_name=queue_name,
            callback=on_message_callback,
            auto_ack=False
        )

    except KeyboardInterrupt:
        logger.info("Consumer stopped by user")
        rabbitmq_connection.close()

    except Exception as e:
        logger.error(f"Consumer error: {str(e)}")
        rabbitmq_connection.close()


if __name__ == "__main__":
    start_consumer()
