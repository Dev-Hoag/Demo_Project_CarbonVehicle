import { Router } from 'express';
import disputeController from '../controllers/DisputeController';

const router = Router();

// Dispute Management
router.post('/disputes', (req, res) => disputeController.createDispute(req, res));
router.get('/disputes/:id', (req, res) => disputeController.getDispute(req, res));
router.get('/disputes/transaction/:transaction_id', (req, res) => disputeController.getDisputeByTransactionId(req, res));
router.get('/disputes/user/:user_id', (req, res) => disputeController.getUserDisputes(req, res));
router.get('/disputes/status/open', (req, res) => disputeController.getOpenDisputes(req, res));
router.get('/disputes/status/active', (req, res) => disputeController.getActiveDisputes(req, res));
router.get('/disputes', (req, res) => disputeController.getAllDisputes(req, res));

// Dispute Resolution
router.post('/disputes/:id/resolve', (req, res) => disputeController.resolveDispute(req, res));
router.post('/disputes/:id/close', (req, res) => disputeController.closeDispute(req, res));

export default router;

