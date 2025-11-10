import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import 'express-async-errors';

import logger from './config/logger';
import pool from './config/database';
import transactionRoutes from './routes/transactionRoutes';
import disputeRoutes from './routes/disputeRoutes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.body
  });
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    service: 'transaction-service',
    timestamp: new Date().toISOString()
  });
});

app.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

app.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({ status: 'not ready', error: (error as Error).message });
  }
});

// API Routes
app.use('/api', transactionRoutes);
app.use('/api', disputeRoutes);

// Internal APIs
app.post('/internal/transactions/settle', async (req: Request, res: Response) => {
  try {
    const { transaction_id } = req.body;
    logger.info('Internal: Settling transaction', { transaction_id });
    res.status(200).json({ success: true, message: 'Transaction settled' });
  } catch (error) {
    logger.error('Error settling transaction', { error });
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

app.post('/internal/transactions/refund', async (req: Request, res: Response) => {
  try {
    const { transaction_id } = req.body;
    logger.info('Internal: Refunding transaction', { transaction_id });
    res.status(200).json({ success: true, message: 'Transaction refunded' });
  } catch (error) {
    logger.error('Error refunding transaction', { error });
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

app.get('/internal/transactions/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info('Internal: Checking transaction status', { id });
    res.status(200).json({ success: true, status: 'PENDING' });
  } catch (error) {
    logger.error('Error checking transaction status', { error });
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err: any, _req: Request, res: Response) => {
  logger.error('Unhandled error', { error: err });
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Transaction Service running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await pool.end();
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(async () => {
    await pool.end();
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;

