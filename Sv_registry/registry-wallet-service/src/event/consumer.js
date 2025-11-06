// Consumer that supports Kafka (preferred) and RabbitMQ fallback.
const config = require('../config/config');
const kafkaConsumer = require('./kafkaConsumer');
const amqp = require('amqplib');

let rabbitConn = null;
let rabbitChannel = null;

async function startRabbitConsumer(queueName = 'registry_wallet_queue', handlers = {}) {
  rabbitConn = await amqp.connect(config.rabbitmqUrl);
  rabbitChannel = await rabbitConn.createChannel();
  const exchange = 'registry_wallet_events';
  await rabbitChannel.assertExchange(exchange, 'topic', { durable: true });
  await rabbitChannel.assertQueue(queueName, { durable: true });
  // Bind to all events by default - caller can bind specific routing keys
  await rabbitChannel.bindQueue(queueName, exchange, '#');

  rabbitChannel.consume(queueName, async (msg) => {
    if (!msg) return;
    try {
      const routingKey = msg.fields.routingKey;
      const content = msg.content && msg.content.length ? JSON.parse(msg.content.toString()) : null;
      const handler = handlers[routingKey] || handlers['*'];
      if (handler) {
        await handler({ routingKey, content, raw: msg });
      } else {
        console.log('Received event', routingKey, content);
      }
      rabbitChannel.ack(msg);
    } catch (err) {
      console.error('Failed to process message', err);
      rabbitChannel.nack(msg, false, false); // discard or move to DLQ in real setup
    }
  });
}

async function start(ops = {}) {
  // ops: { kafkaTopics: [], rabbitQueue, handlers }
  const handlers = ops.handlers || {};
  const useKafka = !!(process.env.KAFKA_BROKERS || config.kafkaBrokers);
  if (useKafka) {
    const topics = ops.kafkaTopics && ops.kafkaTopics.length ? ops.kafkaTopics : Object.keys(handlers).filter(k => k !== '*');
    if (!topics || topics.length === 0) {
      // subscribe to all known topics via wildcard not supported in Kafka; require '*' handler
      if (!handlers['*']) {
        throw new Error('Kafka configured but no topics specified and no wildcard handler provided');
      }
    }
    await kafkaConsumer.connectAndSubscribe(topics, handlers);
    console.log('Kafka consumer started for topics:', topics);
    return;
  }

  // fallback to RabbitMQ
  const queueName = ops.rabbitQueue || 'registry_wallet_queue';
  await startRabbitConsumer(queueName, handlers);
  console.log('RabbitMQ consumer started on queue:', queueName);
}

async function stop() {
  try {
    if (rabbitChannel) {
      await rabbitChannel.close();
    }
    if (rabbitConn) {
      await rabbitConn.close();
    }
  } catch (err) {
    // ignore
  }
  try {
    await kafkaConsumer.disconnect();
  } catch (err) {
    // ignore
  }
}

if (require.main === module) {
  // simple run with a wildcard handler that just logs
  start({ handlers: { '*': async ({ topic, routingKey, content }) => { console.log('Event:', topic || routingKey, content); } } }).catch(err => {
    console.error('Consumer error', err);
    process.exit(1);
  });
}

module.exports = { start, stop };
