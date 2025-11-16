import json
import pika
from datetime import datetime
from loguru import logger
from app.events.rabbitmq_connection import get_channel
from app.events.event_definitions import EventType


class EventPublisher:
    @staticmethod
    def publish(event_type: EventType, data: dict):
        conn, channel = get_channel()
        try:
            # Convert enum name (TRIP_SUBMITTED) to PascalCase (TripSubmitted)
            event_type_name = ''.join(word.capitalize() for word in event_type.name.split('_'))
            message = {
                "event_type": event_type_name,
                "timestamp": datetime.utcnow().isoformat(),
                "data": data
            }
            routing_key = event_type.value
            channel.basic_publish(
                exchange="carbon_exchange",
                routing_key=routing_key,
                body=json.dumps(message),
                properties=pika.BasicProperties(
                    delivery_mode=2,
                    content_type='application/json'
                )
            )
            logger.info(f"Published {event_type_name} -> {routing_key}")
        finally:
            try:
                conn.close()
            except Exception:
                pass
