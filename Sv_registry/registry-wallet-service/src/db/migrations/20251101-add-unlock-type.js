const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_ledger_type ADD VALUE IF NOT EXISTS 'UNLOCK' AFTER 'LOCK';
    `);
  },

  async down(queryInterface) {
    // Cannot remove enum values in PostgreSQL
    // Would need to create new type without value and migrate data
    console.log('Skipping down migration - cannot remove enum values in PostgreSQL');
  }
};