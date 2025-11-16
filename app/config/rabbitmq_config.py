# RabbitMQ Configuration
import pika
import os
from dotenv import load_dotenv

load_dotenv()

# MUST MATCH .env FILE
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")       # container hostname
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", 5672))
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "guest")

# FIXED: match env variable name
RABBITMQ_PASSWORD = os.getenv("RABBITMQ_PASSWORD", "guest")

EXCHANGE_NAME = os.getenv("RABBITMQ_EXCHANGE", "carbon_exchange")
QUEUE_NAME = os.getenv("RABBITMQ_QUEUE", "verification_queue")


def get_connection():
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASSWORD)
    params = pika.ConnectionParameters(
        host=RABBITMQ_HOST,
        port=RABBITMQ_PORT,
        credentials=credentials,
        heartbeat=600,
        blocked_connection_timeout=300,
    )
    return pika.BlockingConnection(params)


def setup_rabbitmq():
    """Setup exchange + queue + binding"""
    conn = get_connection()
    channel = conn.channel()

    # Declare exchange
    channel.exchange_declare(
        exchange=EXCHANGE_NAME,
        exchange_type="topic",
        durable=True
    )

    # Declare consumer queue
    channel.queue_declare(queue=QUEUE_NAME, durable=True)

    # Bind queue to incoming event (Verification flow)
    channel.queue_bind(
        exchange=EXCHANGE_NAME,
        queue=QUEUE_NAME,
        routing_key="verification.trip.verified"
    )

    print(f"RabbitMQ setup completed. Queue: {QUEUE_NAME}")
    conn.close()
