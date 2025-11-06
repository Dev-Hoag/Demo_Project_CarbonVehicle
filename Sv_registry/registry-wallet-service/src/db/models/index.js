const { Sequelize } = require('sequelize');
const config = require('../../config/config');
const WalletModel = require('./wallet');
const LedgerModel = require('./ledger');
const CreditModel = require('./credit');

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: 'postgres',
  logging: config.logging
});

const Wallet = WalletModel(sequelize);
const Ledger = LedgerModel(sequelize);
const Credit = CreditModel(sequelize);

// associations
// Wallet is keyed by userId; Ledger references users via fromUserId/toUserId
Wallet.hasMany(Ledger, { foreignKey: 'fromUserId', as: 'outgoingLedgers' });
Wallet.hasMany(Ledger, { foreignKey: 'toUserId', as: 'incomingLedgers' });

Ledger.belongsTo(Wallet, { foreignKey: 'fromUserId', as: 'fromUser' });
Ledger.belongsTo(Wallet, { foreignKey: 'toUserId', as: 'toUser' });

// Credits belong to wallets (ownerId -> wallets.userId)
Credit.belongsTo(Wallet, { foreignKey: 'ownerId', as: 'owner' });
Wallet.hasMany(Credit, { foreignKey: 'ownerId', as: 'credits' });

module.exports = { sequelize, Wallet, Ledger, Credit };
