const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('vivdb2', 'vivuser', 'vivai123!', {
  host: 'localhost',
  dialect: 'postgres',
  port: 5432,
  logging: false,
});

sequelize.authenticate()
  .then(() => console.log('✅ PostgreSQL Connected'))
  .catch(err => console.error('❌ PostgreSQL Connection Error:', err));

module.exports = sequelize;
