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

rabbitmq_connection = RabbitMQConnection()

def close():
    """Close RabbitMQ connection"""
    if rabbitmq_connection.connection:
        rabbitmq_connection.connection.close()
        logger.info("RabbitMQ connection closed")

def publish_certificate_generated(certificate):
    """
    Publish CertificateGenerated event
    """
    try:
        if not rabbitmq_connection.channel:
            rabbitmq_connection.connect()
        
        event_data = {
            "event_type": "CertificateGenerated",
            "certificate_id": certificate.id,
            "trip_id": certificate.trip_id,
            "user_id": certificate.user_id,
            "cert_hash": certificate.cert_hash,
            "template_id": certificate.template_id
        }
        
        rabbitmq_connection.publish_message("certificate.generated", event_data)
        logger.info(f"Published CertificateGenerated event for certificate_id={certificate.id}")
        
    except Exception as e:
        logger.error(f"Error publishing CertificateGenerated event: {str(e)}")
        raise

def publish_certificate_verified(certificate_id, trip_id, user_id):
    """
    Publish CertificateVerified event
    """
    try:
        if not rabbitmq_connection.channel:
            rabbitmq_connection.connect()
        
        event_data = {
            "event_type": "CertificateVerified",
            "certificate_id": certificate_id,
            "trip_id": trip_id,
            "user_id": user_id
        }
        
        rabbitmq_connection.publish_message("certificate.verified", event_data)
        logger.info(f"Published CertificateVerified event for certificate_id={certificate_id}")
        
    except Exception as e:
        logger.error(f"Error publishing CertificateVerified event: {str(e)}")
        raise

def publish_certificate_downloaded(certificate_id, user_id, download_date):
    """
    Publish CertificateDownloaded event
    """
    try:
        if not rabbitmq_connection.channel:
            rabbitmq_connection.connect()
        
        event_data = {
            "event_type": "CertificateDownloaded",
            "certificate_id": certificate_id,
            "user_id": user_id,
            "download_date": str(download_date)
        }
        
        rabbitmq_connection.publish_message("certificate.downloaded", event_data)
        logger.info(f"Published CertificateDownloaded event for certificate_id={certificate_id}")
        
    except Exception as e:
        logger.error(f"Error publishing CertificateDownloaded event: {str(e)}")
        raise

def publish_certificate_generated(certificate):
    """
    Publish CertificateGenerated event
    """
    try:
        message = {
            "event_type": "CertificateGenerated",
            "data": {
                "certificate_id": certificate.id,
                "verification_id": certificate.verification_id,
                "trip_id": certificate.trip_id,
                "user_id": certificate.user_id,
                "credit_amount": certificate.credit_amount,
                "cert_hash": certificate.cert_hash
            }
        }
        rabbitmq_connection.publish_message("certificate.generated", message)
        logger.info(f"Published CertificateGenerated event for certificate {certificate.id}")
    except Exception as e:
        logger.error(f"Failed to publish CertificateGenerated event: {str(e)}")


def publish_certificate_verified(cert_id: int, verified_by: int, method: str):
    """
    Publish CertificateVerified event
    """
    try:
        message = {
            "event_type": "CertificateVerified",
            "data": {
                "certificate_id": cert_id,
                "verified_by": verified_by,
                "method": method
            }
        }
        rabbitmq_connection.publish_message("certificate.verified", message)
        logger.info(f"Published CertificateVerified event for certificate {cert_id}")
    except Exception as e:
        logger.error(f"Failed to publish CertificateVerified event: {str(e)}")


def publish_certificate_downloaded(cert_id: int, user_id: int):
    """
    Publish CertificateDownloaded event
    """
    try:
        message = {
            "event_type": "CertificateDownloaded",
            "data": {
                "certificate_id": cert_id,
                "user_id": user_id
            }
        }
        rabbitmq_connection.publish_message("certificate.downloaded", message)
        logger.info(f"Published CertificateDownloaded event for certificate {cert_id}")
    except Exception as e:
        logger.error(f"Failed to publish CertificateDownloaded event: {str(e)}")

