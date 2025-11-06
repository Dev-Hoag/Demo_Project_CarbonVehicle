const { DataTypes } = require('sequelize');

/**
 * Ledger model aligned to requested schema for registry ledger entries.
 * Fields:
 * - id: UUID PK
 * - creditSerial: string
 * - type: ENUM('MINT','TRANSFER','LOCK','BURN')
 * - fromUserId: UUID
 * - toUserId: UUID
 * - txRef: string
 * - createdAt: timestamp
 */
module.exports = (sequelize) => {
  const Ledger = sequelize.define('Ledger', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    creditSerial: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('MINT', 'TRANSFER', 'LOCK', 'BURN'),
      allowNull: false
    },
    fromUserId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    toUserId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    txRef: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'ledger',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false
  });

  return Ledger;
};
