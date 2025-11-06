const { Kafka } = require('kafkajs');
const config = require('../config/config');

let kafka = null;
let consumer = null;
let running = false;

function init(groupId = 'registry-wallet-consumer') {
  if (kafka) return;
  kafka = new Kafka({
    clientId: 'registry-wallet-service-consumer',
    brokers: (process.env.KAFKA_BROKERS || config.kafkaBrokers || 'localhost:9092').split(',')
  });
  consumer = kafka.consumer({ groupId });
}

async function connectAndSubscribe(topics = [], handlers = {}) {
  init();
  if (running) return;
  await consumer.connect();
  for (const t of topics) {
    await consumer.subscribe({ topic: t, fromBeginning: false });
  }

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const value = message.value ? message.value.toString() : null;
        const parsed = value ? JSON.parse(value) : null;
        const handler = handlers[topic];
        if (handler) {
          await handler({ topic, partition, message: parsed, raw: message });
        } else if (handlers['*']) {
          await handlers['*']({ topic, partition, message: parsed, raw: message });
        } else {
          console.log(`Kafka message on ${topic}:`, parsed);
        }
      } catch (err) {
        console.error('Error handling kafka message', err);
        // Note: add retry/DLQ logic here if needed
      }
    }
  });
  running = true;
}

async function disconnect() {
  if (!consumer) return;
  try {
    await consumer.disconnect();
  } catch (err) {
    // ignore
  }
  running = false;
}

module.exports = { connectAndSubscribe, disconnect };
