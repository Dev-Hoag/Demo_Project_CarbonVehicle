import { Router } from 'express';
import transactionController from '../controllers/TransactionController';

const router = Router();

// Transaction Management
router.post('/transactions', (req, res) => transactionController.createTransaction(req, res));
router.get('/transactions/:id', (req, res) => transactionController.getTransaction(req, res));
router.get('/transactions/:id/summary', (req, res) => transactionController.getTransactionSummary(req, res));
router.put('/transactions/:id/status', (req, res) => transactionController.updateTransactionStatus(req, res));
router.post('/transactions/:id/cancel', (req, res) => transactionController.cancelTransaction(req, res));

// Buyer Transactions
router.get('/transactions/buyer/:buyer_id', (req, res) => transactionController.getBuyerTransactions(req, res));

// Seller Transactions
router.get('/transactions/seller/:seller_id', (req, res) => transactionController.getSellerTransactions(req, res));

// Payment Callbacks
router.post('/transactions/payment/completed', (req, res) => transactionController.handlePaymentCompleted(req, res));
router.post('/transactions/payment/failed', (req, res) => transactionController.handlePaymentFailed(req, res));

export default router;

