const { Kafka } = require('kafkajs');
const config = require('../config/config');

let kafka = null;
let producer = null;
let connected = false;

function init() {
  if (kafka) return;
  kafka = new Kafka({
    clientId: 'registry-wallet-service',
    brokers: (process.env.KAFKA_BROKERS || config.kafkaBrokers || 'localhost:9092').split(',')
  });
  producer = kafka.producer();
}

async function connect() {
  init();
  if (connected) return;
  await producer.connect();
  connected = true;
}

async function disconnect() {
  if (!producer) return;
  try {
    await producer.disconnect();
  } catch (err) {
    // ignore
  }
  connected = false;
}

async function publish(topic, messages) {
  init();
  if (!connected) await connect();
  // messages: array of { key, value }
  await producer.send({
    topic,
    messages: messages.map(m => ({ key: m.key || null, value: typeof m.value === 'string' ? m.value : JSON.stringify(m.value) }))
  });
}

module.exports = { connect, disconnect, publish };
