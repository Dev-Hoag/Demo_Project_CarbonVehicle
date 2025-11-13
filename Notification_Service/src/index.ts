import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import "express-async-errors";

import logger from "./config/logger";
import pool from "./config/database";
import emailSender from "./services/EmailSender";
import notificationRoutes from "./routes/notificationRoutes";
import internalRoutes from "./routes/internalRoutes";
import eventConsumer from "./services/EventConsumer";
import eventHandlers from "./services/EventHandlers";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3010;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.body,
  });
  next();
});

// Health check endpoints
app.get("/health", async (_req: Request, res: Response) => {
  try {
    // Check database
    const dbConnection = await pool.getConnection();
    await dbConnection.ping();
    dbConnection.release();

    // Check SMTP
    const smtpOk = await emailSender.verify();

    const status = smtpOk ? "OK" : "DEGRADED";

    res.status(200).json({
      status,
      service: "notification-service",
      timestamp: new Date().toISOString(),
      dependencies: {
        database: "OK",
        smtp: smtpOk ? "OK" : "DEGRADED",
      },
    });
  } catch (error) {
    logger.error("Health check failed", { error });
    res.status(503).json({
      status: "UNHEALTHY",
      service: "notification-service",
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
    });
  }
});

app.get("/health/live", (_req: Request, res: Response) => {
  res.status(200).json({ status: "alive" });
});

app.get("/health/ready", async (_req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    res.status(200).json({ status: "ready" });
  } catch (error) {
    logger.error("Readiness check failed", { error });
    res
      .status(503)
      .json({ status: "not ready", error: (error as Error).message });
  }
});

// API Routes
app.use("/api", notificationRoutes);
app.use("/", internalRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error("Unhandled error", { error: err });
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Initialize event consumer and register handlers
async function initializeEventConsumer() {
  try {
    // Register event handlers
    eventConsumer.subscribe(
      "UserRegistered",
      eventHandlers.handleUserRegistered.bind(eventHandlers)
    );
    eventConsumer.subscribe(
      "TripVerified",
      eventHandlers.handleTripVerified.bind(eventHandlers)
    );
    eventConsumer.subscribe(
      "TripRejected",
      eventHandlers.handleTripRejected.bind(eventHandlers)
    );
    eventConsumer.subscribe(
      "CreditIssued",
      eventHandlers.handleCreditIssued.bind(eventHandlers)
    );
    eventConsumer.subscribe(
      "CreditTransferred",
      eventHandlers.handleCreditTransferred.bind(eventHandlers)
    );
    eventConsumer.subscribe(
      "ListingCreated",
      eventHandlers.handleListingCreated.bind(eventHandlers)
    );
    eventConsumer.subscribe(
      "ListingSold",
      eventHandlers.handleListingSold.bind(eventHandlers)
    );
    eventConsumer.subscribe(
      "TransactionCompleted",
      eventHandlers.handleTransactionCompleted.bind(eventHandlers)
    );
    eventConsumer.subscribe(
      "TransactionCancelled",
      eventHandlers.handleTransactionCancelled.bind(eventHandlers)
    );
    eventConsumer.subscribe(
      "PaymentCompleted",
      eventHandlers.handlePaymentCompleted.bind(eventHandlers)
    );
    eventConsumer.subscribe(
      "PaymentFailed",
      eventHandlers.handlePaymentFailed.bind(eventHandlers)
    );
    eventConsumer.subscribe(
      "CertificateGenerated",
      eventHandlers.handleCertificateGenerated.bind(eventHandlers)
    );

    // Start event consumer
    await eventConsumer.start();

    logger.info("Event consumer initialized", {
      subscribedEvents: eventConsumer.getSubscribedEvents(),
    });
  } catch (error) {
    logger.error("Failed to initialize event consumer", { error });
  }
}

// Start server
const server = app.listen(PORT, async () => {
  logger.info(`Notification Service running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);

  // Initialize event consumer
  await initializeEventConsumer();
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(async () => {
    await eventConsumer.stop();
    await pool.end();
    logger.info("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");
  server.close(async () => {
    await eventConsumer.stop();
    await pool.end();
    logger.info("Server closed");
    process.exit(0);
  });
});

export default app;
