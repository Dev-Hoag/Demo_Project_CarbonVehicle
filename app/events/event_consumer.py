import json
from loguru import logger
from .rabbitmq_connection import get_connection, get_channel
from .handlers import handle_trip_submitted
from .event_definitions import EventType
from app.config.settings import settings
import pika


def on_message(ch, method, properties, body):
    try:
        msg = json.loads(body)
        # Support both formats: {event_type: "TripSubmitted"} and {eventType: "trip.submitted"}
        event_type = msg.get('event_type') or msg.get('eventType')
        # If no data/payload wrapper, use msg itself as data
        data = msg.get('data') or msg.get('payload') or msg
        
        logger.info(f"[Verification] Received event {event_type}")
        logger.debug(f"[Verification] Event data: {data}")

        # Match both TripSubmitted and trip.submitted
        if event_type in ('TripSubmitted', 'trip.submitted'):
            handle_trip_submitted(data)
        else:
            logger.warning(f"[Verification] Unhandled event type: {event_type}")

        ch.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        logger.exception("Error processing message")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


def start_consumer():
    conn, ch = get_channel()
    queue = 'verification_service_queue'
    ch.queue_declare(queue=queue, durable=True)
    ch.queue_bind(exchange=settings.RABBITMQ_EXCHANGE, queue=queue, routing_key=EventType.TRIP_SUBMITTED.value)
    ch.basic_qos(prefetch_count=1)
    ch.basic_consume(queue=queue, on_message_callback=on_message)
    logger.info("[Verification] Waiting for messages...")
    try:
        ch.start_consuming()
    finally:
        try:
            conn.close()
        except Exception:
            pass


if __name__ == "__main__":
    start_consumer()
