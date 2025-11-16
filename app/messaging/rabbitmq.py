import pika
import json
import logging
from typing import Callable, Optional
from app.config import settings

logger = logging.getLogger(__name__)

class RabbitMQConnection:
    def __init__(self):
        self.connection: Optional[pika.BlockingConnection] = None
        self.channel: Optional[pika.channel.Channel] = None
        self.exchange = settings.RABBITMQ_EXCHANGE

    def connect(self):
        try:
            credentials = pika.PlainCredentials(settings.RABBITMQ_USER, settings.RABBITMQ_PASS)
            params = pika.ConnectionParameters(host=settings.RABBITMQ_HOST, port=settings.RABBITMQ_PORT, credentials=credentials, heartbeat=600, blocked_connection_timeout=300)
            self.connection = pika.BlockingConnection(params)
            self.channel = self.connection.channel()
            self.channel.exchange_declare(exchange=self.exchange, exchange_type='topic', durable=True)
            logger.info("Connected to RabbitMQ")
            return True
        except Exception as e:
            logger.exception("Failed to connect to RabbitMQ")
            return False

    def declare_queue(self, queue_name: str, routing_key: str):
        if not self.channel:
            raise Exception("Channel not initialized")
        self.channel.queue_declare(queue=queue_name, durable=True)
        self.channel.queue_bind(exchange=self.exchange, queue=queue_name, routing_key=routing_key)

    def publish_message(self, routing_key: str, message: dict):
        if not self.channel:
            raise Exception("Channel not initialized")
        self.channel.basic_publish(exchange=self.exchange, routing_key=routing_key, body=json.dumps(message), properties=pika.BasicProperties(delivery_mode=2, content_type='application/json'))

    def consume_messages(self, queue_name: str, callback: Callable, auto_ack: bool = False):
        if not self.channel:
            raise Exception("Channel not initialized")
        self.channel.basic_qos(prefetch_count=1)
        self.channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=auto_ack)
        self.channel.start_consuming()

    def close(self):
        """Close RabbitMQ connection"""
        try:
            if self.channel and self.channel.is_open:
                self.channel.close()
            if self.connection and self.connection.is_open:
                self.connection.close()
            logger.info("Closed RabbitMQ connection")
        except Exception as e:
            logger.error(f"Error closing RabbitMQ connection: {str(e)}")

rabbitmq_connection = RabbitMQConnection()
