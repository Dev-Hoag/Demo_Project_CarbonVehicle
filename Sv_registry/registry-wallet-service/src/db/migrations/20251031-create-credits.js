module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('credits', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      serial: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      ownerId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('MINTED', 'LOCKED', 'RETIRED'),
        allowNull: false,
        defaultValue: 'MINTED'
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      sourceTripId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      mintedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('credits');
    // Drop enum type created by Sequelize for Postgres
    try {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_credits_status";');
    } catch (err) {
      // ignore
    }
  }
};
