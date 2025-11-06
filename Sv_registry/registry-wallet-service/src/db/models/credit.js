const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Credit = sequelize.define('Credit', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    serial: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('MINTED', 'LOCKED', 'RETIRED'),
      allowNull: false,
      defaultValue: 'MINTED'
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    sourceTripId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    mintedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'credits',
    timestamps: true
  });

  return Credit;
};
