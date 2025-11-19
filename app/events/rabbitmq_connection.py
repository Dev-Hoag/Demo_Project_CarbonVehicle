import pika
import json
from app.config.settings import settings
from loguru import logger


def get_connection():
    credentials = pika.PlainCredentials(settings.RABBITMQ_USER, settings.RABBITMQ_PASSWORD)
    params = pika.ConnectionParameters(
        host=settings.RABBITMQ_HOST,
        port=settings.RABBITMQ_PORT,
        virtual_host='ccm_vhost',  # Use CCM RabbitMQ vhost
        credentials=credentials,
        heartbeat=600,
        blocked_connection_timeout=300
    )
    return pika.BlockingConnection(params)




def get_channel():
    conn = get_connection()
    ch = conn.channel()
    ch.exchange_declare(exchange=settings.RABBITMQ_EXCHANGE, exchange_type='topic', durable=True)
    return conn, ch
