require('dotenv').config();

module.exports = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  database: process.env.DB_NAME || 'registry_wallet_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost'
};

// optional Kafka brokers list env var
module.exports.kafkaBrokers = process.env.KAFKA_BROKERS || process.env.KAFKA_BROKER || null;
