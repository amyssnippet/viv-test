const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('postgres', 'vivdb', 'vivai123!', {
  host: 'database-1-instance-1.c9mgew2mcv2d.ap-south-2.rds.amazonaws.com',
  dialect: 'postgres',
  port: 5432,
  logging: false,
});

sequelize.authenticate()
  .then(() => console.log('✅ PostgreSQL Connected'))
  .catch(err => console.error('❌ PostgreSQL Connection Error:', err));

module.exports = sequelize;
