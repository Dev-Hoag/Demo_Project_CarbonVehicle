module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ledger', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      creditSerial: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM('MINT', 'TRANSFER', 'LOCK', 'BURN'),
        allowNull: false
      },
      fromUserId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      toUserId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      txRef: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('ledger', ['creditSerial']);
    await queryInterface.addIndex('ledger', ['fromUserId']);
    await queryInterface.addIndex('ledger', ['toUserId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ledger');
    try {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ledger_type";');
    } catch (err) {
      // ignore
    }
  }
};
