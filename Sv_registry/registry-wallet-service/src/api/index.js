const express = require('express');
const router = express.Router();

const walletController = require('./controllers/walletController');
const ledgerController = require('./controllers/ledgerController');
const registryController = require('./controllers/registryController');
const requireInternalAuth = require('./middleware/auth');

// Wallet routes
router.post('/wallets', walletController.createWallet);
router.get('/wallets/:id', walletController.getWallet);
router.post('/wallets/:id/credit', walletController.creditWallet);
router.post('/wallets/:id/debit', walletController.debitWallet);
router.get('/wallets/:userId/balance', walletController.getBalance);
router.post('/wallets/transfer', walletController.transfer);

// Ledger routes
router.get('/wallets/:id/ledger', ledgerController.getLedgerForWallet);

// Internal registry routes (protected)
router.post('/registry/mintInternal', requireInternalAuth, registryController.mintInternal);

module.exports = router;
