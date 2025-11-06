const { sequelize } = require('../db/models');

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully.');
    
    // List all models
    console.log('\nRegistered models:');
    Object.keys(sequelize.models).forEach(model => {
      console.log(`- ${model}`);
    });
    
  } catch (error) {
    console.error('✕ Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }
}

testConnection();