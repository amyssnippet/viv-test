const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('vivdb', 'viv', 'viv', {
    host: '51.20.106.156',
    dialect: 'postgres',
    logging: false
});

sequelize.authenticate()
    .then(() => console.log('PostgreSQL Connected'))
    .catch(err => console.error('PostgreSQL Connection Error:', err));

module.exports = sequelize;
