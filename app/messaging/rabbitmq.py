import pika
import json
import logging
from typing import Callable, Optional
from app.config import settings

logger = logging.getLogger(__name__)

class RabbitMQConnection:
    """
    RabbitMQ connection manager
    """
    
    def __init__(self):
        self.connection: Optional[pika.BlockingConnection] = None
        self.channel: Optional[pika.channel.Channel] = None
        self.exchange = settings.RABBITMQ_EXCHANGE
        
    def connect(self):
        """
        Establish connection to RabbitMQ
        """
        try:
            credentials = pika.PlainCredentials(
                settings.RABBITMQ_USER,
                settings.RABBITMQ_PASSWORD
            )
            
            parameters = pika.ConnectionParameters(
                host=settings.RABBITMQ_HOST,
                port=settings.RABBITMQ_PORT,
                credentials=credentials,
                heartbeat=600,
                blocked_connection_timeout=300
            )
            
            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()
            
            # Declare exchange
            self.channel.exchange_declare(
                exchange=self.exchange,
                exchange_type='topic',
                durable=True
            )
            
            logger.info(f"Connected to RabbitMQ at {settings.RABBITMQ_HOST}:{settings.RABBITMQ_PORT}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {str(e)}")
            return False
    
    def declare_queue(self, queue_name: str, routing_key: str):
        """
        Declare a queue and bind it to exchange
        """
        if not self.channel:
            raise Exception("Channel not initialized. Call connect() first.")
        
        self.channel.queue_declare(queue=queue_name, durable=True)
        self.channel.queue_bind(
            exchange=self.exchange,
            queue=queue_name,
            routing_key=routing_key
        )
        
        logger.info(f"Queue '{queue_name}' declared and bound to routing key '{routing_key}'")
    
    def publish_message(self, routing_key: str, message: dict):
        """
        Publish a message to the exchange
        """
        if not self.channel:
            raise Exception("Channel not initialized. Call connect() first.")
        
        try:
            self.channel.basic_publish(
                exchange=self.exchange,
                routing_key=routing_key,
                body=json.dumps(message),
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Make message persistent
                    content_type='application/json'
                )
            )
            
            logger.info(f"Published message to '{routing_key}': {message}")
            
        except Exception as e:
            logger.error(f"Failed to publish message: {str(e)}")
            raise
    
    def consume_messages(
        self,
        queue_name: str,
        callback: Callable,
        auto_ack: bool = False
    ):
        """
        Start consuming messages from a queue
        """
        if not self.channel:
            raise Exception("Channel not initialized. Call connect() first.")
        
        self.channel.basic_qos(prefetch_count=1)
        self.channel.basic_consume(
            queue=queue_name,
            on_message_callback=callback,
            auto_ack=auto_ack
        )
        
        logger.info(f"Started consuming from queue '{queue_name}'")
        self.channel.start_consuming()
    
    def close(self):
        """
        Close connection to RabbitMQ
        """
        if self.connection and not self.connection.is_closed:
            self.connection.close()
            logger.info("RabbitMQ connection closed")

# Singleton instance
rabbitmq_connection = RabbitMQConnection()