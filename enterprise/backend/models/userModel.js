const pool = require('../db/conn');

const createUser = async ({ name, email, password_hash, enterprise_id, role = 'user' }) => {
  const res = await pool.query(
    `INSERT INTO enterprise_users (name, email, password_hash, enterprise_id, role)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, email, password_hash, enterprise_id, role]
  );
  return res.rows[0];
};

const getUserByEmail = async (email) => {
  const res = await pool.query(`SELECT * FROM enterprise_users WHERE email = $1`, [email]);
  return res.rows[0];
};

module.exports = { createUser, getUserByEmail };
