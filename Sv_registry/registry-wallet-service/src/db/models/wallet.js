const { DataTypes } = require('sequelize');

/**
 * Wallet model aligned to requested schema:
 * - userId: UUID primary key (references users table externally)
 * - totalBalance: NUMERIC(10,2)
 * - balanceJson: JSONB
 */
module.exports = (sequelize) => {
  const Wallet = sequelize.define('Wallet', {
    userId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    totalBalance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    balanceJson: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'wallets',
    timestamps: true
  });

  return Wallet;
};
