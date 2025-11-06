module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add FK from credits.ownerId -> wallets.userId
    try {
      await queryInterface.addConstraint('credits', {
        fields: ['ownerId'],
        type: 'foreign key',
        name: 'fk_credits_owner_wallets_userId',
        references: {
          table: 'wallets',
          field: 'userId'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    } catch (err) {
      console.warn('Could not add FK fk_credits_owner_wallets_userId:', err.message || err);
    }

    // Add FK from ledger.fromUserId -> wallets.userId
    try {
      await queryInterface.addConstraint('ledger', {
        fields: ['fromUserId'],
        type: 'foreign key',
        name: 'fk_ledger_from_wallets_userId',
        references: {
          table: 'wallets',
          field: 'userId'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    } catch (err) {
      console.warn('Could not add FK fk_ledger_from_wallets_userId:', err.message || err);
    }

    // Add FK from ledger.toUserId -> wallets.userId
    try {
      await queryInterface.addConstraint('ledger', {
        fields: ['toUserId'],
        type: 'foreign key',
        name: 'fk_ledger_to_wallets_userId',
        references: {
          table: 'wallets',
          field: 'userId'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    } catch (err) {
      console.warn('Could not add FK fk_ledger_to_wallets_userId:', err.message || err);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeConstraint('credits', 'fk_credits_owner_wallets_userId');
    } catch (err) {
      // ignore
    }

    try {
      await queryInterface.removeConstraint('ledger', 'fk_ledger_from_wallets_userId');
    } catch (err) {
      // ignore
    }

    try {
      await queryInterface.removeConstraint('ledger', 'fk_ledger_to_wallets_userId');
    } catch (err) {
      // ignore
    }
  }
};
