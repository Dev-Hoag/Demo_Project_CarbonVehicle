import json
import pika
from datetime import datetime, timezone
from loguru import logger
from app.events.rabbitmq_connection import get_channel
from app.events.event_definitions import EventType
from app.config.settings import settings


class EventPublisher:
    @staticmethod
    def publish(event_type: EventType, data: dict):
        conn, channel = get_channel()
        try:
            event_type_name = ''.join(word.capitalize() for word in event_type.name.split('_'))

            routing_key = event_type.value

            # Build flat payloads for interoperability across services
            if event_type == EventType.VERIFICATION_APPROVED:
                payload = {
                    "eventType": event_type_name,
                    "verificationId": data.get("verification_id"),
                    "tripId": data.get("trip_id"),
                    "userId": data.get("user_id"),
                    "verifierId": data.get("verifier_id"),
                    "co2SavedKg": float(data.get("co2_saved_kg")) if data.get("co2_saved_kg") is not None else None,
                    "creditsAwarded": float(data.get("credits_amount")) if data.get("credits_amount") is not None else None,
                    "status": "APPROVED",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            elif event_type == EventType.VERIFICATION_REJECTED:
                payload = {
                    "eventType": event_type_name,
                    "verificationId": data.get("verification_id"),
                    "tripId": data.get("trip_id"),
                    "userId": data.get("user_id"),
                    "verifierId": data.get("verifier_id"),
                    "status": "REJECTED",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "reason": data.get("reason")
                }
            else:
                # Default to wrapping original data but keep a consistent eventType/timestamp
                payload = {
                    "eventType": event_type_name,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    **data
                }

            channel.basic_publish(
                exchange=settings.RABBITMQ_EXCHANGE,
                routing_key=routing_key,
                body=json.dumps(payload),
                properties=pika.BasicProperties(
                    delivery_mode=2,
                    content_type='application/json'
                )
            )
            logger.info(f"Published {event_type_name} -> {routing_key} on {settings.RABBITMQ_EXCHANGE}")
        finally:
            try:
                conn.close()
            except Exception:
                pass
