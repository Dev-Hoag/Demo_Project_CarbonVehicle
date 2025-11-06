// Helper to sync DB for development only
const { sequelize } = require('../db/models');

async function sync() {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synced');
    process.exit(0);
  } catch (err) {
    console.error('DB sync failed', err);
    process.exit(1);
  }
}

if (require.main === module) sync();

module.exports = { sync };
