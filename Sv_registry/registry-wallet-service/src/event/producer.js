const config = require('../config/config');
const kafkaProducer = require('./kafkaProducer');
const amqp = require('amqplib');

let rabbitChannel = null;

async function initRabbit() {
  if (rabbitChannel) return rabbitChannel;
  const conn = await amqp.connect(config.rabbitmqUrl);
  rabbitChannel = await conn.createChannel();
  return rabbitChannel;
}

/**
 * publishEvent(topic/routingKey, payload)
 * - If KAFKA_BROKERS is configured (or config.kafkaBrokers), use Kafka
 * - Otherwise fallback to RabbitMQ (existing behavior)
 */
async function publishEvent(topicOrRoutingKey, payload, opts = {}) {
  try {
    const useKafka = !!(process.env.KAFKA_BROKERS || config.kafkaBrokers);
    if (useKafka) {
      // Kafka expects topic and messages array
      await kafkaProducer.publish(topicOrRoutingKey, [{ value: payload, key: opts.key }]);
      return;
    }

    const ch = await initRabbit();
    const exchange = 'registry_wallet_events';
    await ch.assertExchange(exchange, 'topic', { durable: true });
    const buf = Buffer.from(JSON.stringify(payload));
    ch.publish(exchange, topicOrRoutingKey, buf, { persistent: true });
  } catch (err) {
    console.error('Failed to publish event', err);
  }
}

module.exports = { publishEvent };
