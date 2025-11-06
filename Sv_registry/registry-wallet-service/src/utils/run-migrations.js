const path = require('path');
const fs = require('fs');
const { sequelize } = require('../db/models');
const Sequelize = require('sequelize');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.error('Migrations folder not found:', migrationsDir);
    process.exit(1);
  }

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.js')).sort();
  for (const file of files) {
    const migrationPath = path.join(migrationsDir, file);
    console.log('Running migration:', file);
    const migration = require(migrationPath);
    if (typeof migration.up === 'function') {
      try {
        await migration.up(sequelize.getQueryInterface(), Sequelize);
        console.log('Applied', file);
      } catch (err) {
        console.error('Failed to apply migration', file, err);
        process.exit(1);
      }
    } else {
      console.warn('Migration has no up function:', file);
    }
  }

  console.log('All migrations applied');
  process.exit(0);
}

if (require.main === module) runMigrations();

module.exports = { runMigrations };
