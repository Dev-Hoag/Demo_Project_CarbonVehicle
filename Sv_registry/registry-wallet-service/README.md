# Registry Wallet Service (scaffold)

This is a scaffold for a Carbon Registry & Wallet microservice using Node.js, Express and PostgreSQL (Sequelize). It includes a minimal server, models, migration example, and event skeleton for messaging (RabbitMQ via amqplib).

Quick start

1. Copy `.env.example` to `.env` and fill DB and RabbitMQ details.
2. Install dependencies:

```powershell
npm install
```

3. For development you can use DB sync (not recommended for production):

```powershell
npm run db:sync
npm run dev
```

Migrations

A Sequelize-style migration is provided at `src/db/migrations/20251031-create-credits.js` which creates the `credits` table with columns:
- `id` UUID primary key
- `serial` VARCHAR(255) unique
- `ownerId` UUID
- `status` ENUM('MINTED','LOCKED','RETIRED')
- `quantity` NUMERIC(10,2)
- `sourceTripId` UUID
- `mintedAt` TIMESTAMP
- timestamps

To run migrations (uses a simple Node runner included in the repo):

```powershell
npm run migrate
```

Notes

- The project also includes `sequelize-cli` as a devDependency if you prefer to use the official CLI. You can configure it (create a `config/config.json` for `sequelize-cli`) and run `npx sequelize-cli db:migrate`.
- For production use proper migration tooling and a migration table; the included `run-migrations.js` is a convenience helper for initial development.

Event bus (Kafka)

This scaffold supports Kafka via `kafkajs` and falls back to RabbitMQ (amqplib) if Kafka is not configured.

Environment variables:
- `KAFKA_BROKERS` — comma-separated list of brokers (e.g. `localhost:9092`)

Usage example in code:

```js
const { publishEvent } = require('./src/event/producer');

// publish a simple event
publishEvent('credits.minted', { serial: 'ABC123', ownerId: '...', quantity: 10 });
```

If you want to use Kafka locally for testing, run a Kafka broker/container (e.g., using `confluentinc/cp-kafka` or `bitnami/kafka` in Docker Compose) and set `KAFKA_BROKERS` in your `.env`.

Consumer usage

Start a consumer in your application (example in `src/server.js` or a separate worker process):

```js
const { start } = require('./src/event/consumer');
const handlers = require('./src/event/handlers');

// For Kafka: set KAFKA_BROKERS in .env and provide topics in kafkaTopics
start({ kafkaTopics: ['credits.minted', 'payments.escrow.updated'], handlers }).catch(console.error);

// For RabbitMQ: ensure RABBITMQ_URL is set and either let it bind to '#' or pass specific handlers
// start({ rabbitQueue: 'registry_wallet_queue', handlers })
```

Handlers live in `src/event/handlers` (sample `index.js` provided). Handlers receive an object with either `topic` (Kafka) or `routingKey` (RabbitMQ) and parsed `content`.

Docker (Postgres + migrator)

If you don't want to install Node locally, you can run Postgres and the migrator in Docker. This repo includes `docker-compose.yml`, `Dockerfile.migrator` and a small `wait-for-it.sh` helper.

1. Make sure Docker Desktop is running.
2. Copy `.env.example` to `.env` and set DB_USER/DB_PASS if needed.
3. Run:

```powershell
docker-compose up --build migrator
```

The `migrator` service will wait for the `db` service to accept connections, then run `npm run migrate` inside the container.

To run both services (DB and keep it up):

```powershell
docker-compose up --build
```


Notes
- For migrations in production use `sequelize-cli` or another migration tool. The scaffold uses `sequelize.sync()` helper for development convenience.
- Event layer contains simple producer/consumer skeleton using RabbitMQ (`amqplib`). You can replace or extend with Kafka client.

Files created
- `src/server.js` - Express entrypoint
- `src/api` - routes and controllers
- `src/db/models` - Sequelize models
- `src/db/migrations` - migration files (credits)
- `src/event` - event producer & consumer skeleton
- `src/utils` - helpers (DB sync)

Next steps
- Add migrations and integration tests
- Add auth and input validation
- Harden event handling and idempotency for ledger operations
